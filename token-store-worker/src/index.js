export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --- CORS (simple, permissive) ---
    const origin = request.headers.get('Origin') || '*';
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
      'Vary': 'Origin',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const jsonResponse = (obj, status = 200, extraHeaders = {}) => {
      return new Response(JSON.stringify(obj), {
        status,
        headers: {
          ...corsHeaders,
          ...extraHeaders,
          'Content-Type': 'application/json; charset=utf-8'
        }
      });
    };

    const textResponse = (text, status = 200, extraHeaders = {}) => {
      return new Response(text, {
        status,
        headers: {
          ...corsHeaders,
          ...extraHeaders,
          'Content-Type': 'text/plain; charset=utf-8'
        }
      });
    };

    const bad = (msg, status = 400) => jsonResponse({ ok: false, error: msg }, status);

    const nowIso = () => new Date().toISOString();

    const base64Url = (bytes) => {
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
    };

    const randomToken = (nBytes) => {
      const b = new Uint8Array(nBytes);
      crypto.getRandomValues(b);
      return base64Url(b);
    };

    const sha256Hex = async (text) => {
      const enc = new TextEncoder();
      const data = enc.encode(String(text));
      const digest = await crypto.subtle.digest('SHA-256', data);
      const bytes = new Uint8Array(digest);
      return Array.from(bytes).map((x) => x.toString(16).padStart(2, '0')).join('');
    };

    const readAuthBearer = (req) => {
      const h = req.headers.get('Authorization') || '';
      const m = /^\s*Bearer\s+(.+?)\s*$/i.exec(h);
      return m ? m[1] : '';
    };

    const configKey = (id) => `cfg:${id}`;
    const assetKey = (assetId) => `asset:${assetId}`;
    const assetIndexKey = (configId) => `assetIndex:${configId}`;

    const parseConfigIdFromPath = () => {
      const parts = url.pathname.split('/').filter(Boolean);
      // /v1/configs/:id
      if (parts.length === 3 && parts[0] === 'v1' && parts[1] === 'configs') {
        return parts[2];
      }
      return '';
    };

    const parseAssetIdFromPath = () => {
      const parts = url.pathname.split('/').filter(Boolean);
      // /v1/assets/:assetId
      if (parts.length === 3 && parts[0] === 'v1' && parts[1] === 'assets') {
        return parts[2];
      }
      return '';
    };

    const safeInt = (raw, fallback) => {
      const n = Number.parseInt(String(raw ?? ''), 10);
      return Number.isFinite(n) && n > 0 ? n : fallback;
    };

    const maxFileBytes = safeInt(env && env.MAX_ASSET_BYTES_PER_FILE, 10 * 1024 * 1024); // 10MB
    const maxTotalBytes = safeInt(env && env.MAX_ASSET_BYTES_PER_CONFIG, 100 * 1024 * 1024); // 100MB

    const sanitizeFileName = (s) => {
      const v = String(s || '')
        .replace(/[^A-Za-z0-9._-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 180);
      return v || 'asset';
    };

    // --- Routes ---
    if (url.pathname === '/health') {
      return jsonResponse({ ok: true, ts: nowIso() });
    }

    if (url.pathname === '/v1/configs' && request.method === 'POST') {
      if (!env || !env.COGFLOW_CONFIGS) {
        return bad('Missing KV binding COGFLOW_CONFIGS', 500);
      }

      const configId = randomToken(12); // 96 bits, URL-safe
      const writeToken = randomToken(24);
      const readToken = randomToken(24);

      const rec = {
        v: 1,
        created_at: nowIso(),
        updated_at: null,
        write_hash: await sha256Hex(writeToken),
        read_hash: await sha256Hex(readToken),
        payload: null
      };

      await env.COGFLOW_CONFIGS.put(configKey(configId), JSON.stringify(rec));
      return jsonResponse({ ok: true, config_id: configId, write_token: writeToken, read_token: readToken }, 201);
    }

    // Upload an asset blob to R2 and return an unguessable URL served by this Worker.
    // POST /v1/configs/:config_id/assets  (Authorization: Bearer <write_token>)
    if (url.pathname.startsWith('/v1/configs/') && url.pathname.endsWith('/assets') && request.method === 'POST') {
      if (!env || !env.COGFLOW_CONFIGS) return bad('Missing KV binding COGFLOW_CONFIGS', 500);
      if (!env || !env.COGFLOW_ASSETS) return bad('Missing R2 binding COGFLOW_ASSETS', 500);

      const parts = url.pathname.split('/').filter(Boolean);
      // v1 / configs / :id / assets
      const configId = parts.length === 4 ? parts[2] : '';
      if (!configId || !/^[A-Za-z0-9_-]+$/.test(configId)) return bad('Invalid config_id', 400);

      const rawCfg = await env.COGFLOW_CONFIGS.get(configKey(configId));
      if (!rawCfg) return bad('Not found', 404);
      let rec;
      try { rec = JSON.parse(rawCfg); } catch { return bad('Corrupt record', 500); }

      const token = readAuthBearer(request);
      if (!token) return bad('Missing Authorization Bearer token', 401);
      const tokenHash = await sha256Hex(token);
      const isWrite = !!(rec && rec.write_hash && tokenHash === rec.write_hash);
      if (!isWrite) return bad('Write token required', 403);

      let form;
      try {
        form = await request.formData();
      } catch {
        return bad('Expected multipart/form-data', 400);
      }

      const file = form.get('file');
      if (!file || typeof file.arrayBuffer !== 'function') {
        return bad('Missing file field (multipart form field name must be "file")', 400);
      }

      const size = typeof file.size === 'number' ? file.size : null;
      if (!size || size <= 0) return bad('Empty file', 400);
      if (size > maxFileBytes) return bad(`File too large (max ${maxFileBytes} bytes)`, 413);

      // Enforce per-config total bytes.
      let index = { total_bytes: 0, assets: [] };
      try {
        const rawIdx = await env.COGFLOW_CONFIGS.get(assetIndexKey(configId));
        if (rawIdx) {
          const parsed = JSON.parse(rawIdx);
          if (parsed && typeof parsed === 'object') index = parsed;
        }
      } catch {
        index = { total_bytes: 0, assets: [] };
      }

      const currentTotal = Number(index.total_bytes) || 0;
      if (currentTotal + size > maxTotalBytes) {
        return bad(`Config asset quota exceeded (max ${maxTotalBytes} bytes total)`, 413);
      }

      const inName = (typeof file.name === 'string' && file.name.trim()) ? file.name.trim() : 'asset.bin';
      const safeName = sanitizeFileName(inName);
      const assetId = randomToken(18); // 144 bits
      const objectKey = `cfg/${configId}/${assetId}/${safeName}`;

      const contentType = (file.type && String(file.type).trim()) ? String(file.type).trim() : 'application/octet-stream';
      const ab = await file.arrayBuffer();
      await env.COGFLOW_ASSETS.put(objectKey, ab, {
        httpMetadata: {
          contentType,
          contentDisposition: `inline; filename="${safeName}"`
        }
      });

      const assetRec = {
        v: 1,
        asset_id: assetId,
        config_id: configId,
        key: objectKey,
        filename: safeName,
        content_type: contentType,
        bytes: size,
        created_at: nowIso()
      };

      // Store mapping in KV (so we can serve /v1/assets/:id)
      await env.COGFLOW_CONFIGS.put(assetKey(assetId), JSON.stringify(assetRec));

      // Update per-config index
      const assetsArr = Array.isArray(index.assets) ? index.assets : [];
      assetsArr.push({ asset_id: assetId, bytes: size, key: objectKey, filename: safeName, created_at: assetRec.created_at });
      index.assets = assetsArr;
      index.total_bytes = currentTotal + size;
      await env.COGFLOW_CONFIGS.put(assetIndexKey(configId), JSON.stringify(index));

      const outUrl = `${url.origin}/v1/assets/${assetId}`;
      return jsonResponse({ ok: true, asset_id: assetId, url: outUrl, bytes: size, content_type: contentType }, 201);
    }

    // Public (unguessable) asset URL
    // GET /v1/assets/:asset_id
    if (url.pathname.startsWith('/v1/assets/') && request.method === 'GET') {
      if (!env || !env.COGFLOW_CONFIGS) return bad('Missing KV binding COGFLOW_CONFIGS', 500);
      if (!env || !env.COGFLOW_ASSETS) return bad('Missing R2 binding COGFLOW_ASSETS', 500);

      const assetId = parseAssetIdFromPath();
      if (!assetId || !/^[A-Za-z0-9_-]+$/.test(assetId)) return bad('Invalid asset_id', 400);

      const rawAsset = await env.COGFLOW_CONFIGS.get(assetKey(assetId));
      if (!rawAsset) return bad('Not found', 404);

      let assetRec;
      try { assetRec = JSON.parse(rawAsset); } catch { return bad('Corrupt asset record', 500); }
      const key = assetRec && assetRec.key ? String(assetRec.key) : '';
      if (!key) return bad('Corrupt asset record', 500);

      const obj = await env.COGFLOW_ASSETS.get(key);
      if (!obj) return bad('Not found', 404);

      const headers = new Headers(corsHeaders);
      try {
        obj.writeHttpMetadata(headers);
      } catch {
        // ignore
      }

      headers.set('Cache-Control', 'public, max-age=31536000, immutable');

      return new Response(obj.body, { status: 200, headers });
    }

    // Optional cleanup: delete a config and all tracked assets.
    // DELETE /v1/configs/:config_id (Authorization: Bearer <write_token>)
    if (url.pathname.startsWith('/v1/configs/') && request.method === 'DELETE') {
      if (!env || !env.COGFLOW_CONFIGS) return bad('Missing KV binding COGFLOW_CONFIGS', 500);
      if (!env || !env.COGFLOW_ASSETS) return bad('Missing R2 binding COGFLOW_ASSETS', 500);

      const configId = parseConfigIdFromPath();
      if (!configId || !/^[A-Za-z0-9_-]+$/.test(configId)) return bad('Invalid config_id', 400);

      const rawCfg = await env.COGFLOW_CONFIGS.get(configKey(configId));
      if (!rawCfg) return bad('Not found', 404);

      let rec;
      try { rec = JSON.parse(rawCfg); } catch { return bad('Corrupt record', 500); }

      const token = readAuthBearer(request);
      if (!token) return bad('Missing Authorization Bearer token', 401);
      const tokenHash = await sha256Hex(token);
      const isWrite = !!(rec && rec.write_hash && tokenHash === rec.write_hash);
      if (!isWrite) return bad('Write token required', 403);

      let idx = null;
      try {
        const rawIdx = await env.COGFLOW_CONFIGS.get(assetIndexKey(configId));
        if (rawIdx) idx = JSON.parse(rawIdx);
      } catch {
        idx = null;
      }

      const assets = idx && Array.isArray(idx.assets) ? idx.assets : [];
      let deleted = 0;
      for (const a of assets) {
        const assetId = a && a.asset_id ? String(a.asset_id) : '';
        const key = a && a.key ? String(a.key) : '';
        if (key) {
          try { await env.COGFLOW_ASSETS.delete(key); } catch { /* ignore */ }
        }
        if (assetId) {
          try { await env.COGFLOW_CONFIGS.delete(assetKey(assetId)); } catch { /* ignore */ }
        }
        deleted++;
      }

      await env.COGFLOW_CONFIGS.delete(assetIndexKey(configId));
      await env.COGFLOW_CONFIGS.delete(configKey(configId));

      return jsonResponse({ ok: true, config_id: configId, deleted_assets: deleted });
    }

    if (url.pathname.startsWith('/v1/configs/') && (request.method === 'GET' || request.method === 'PUT')) {
      if (!env || !env.COGFLOW_CONFIGS) {
        return bad('Missing KV binding COGFLOW_CONFIGS', 500);
      }

      const configId = parseConfigIdFromPath();
      if (!configId || !/^[A-Za-z0-9_-]+$/.test(configId)) {
        return bad('Invalid config_id', 400);
      }

      const raw = await env.COGFLOW_CONFIGS.get(configKey(configId));
      if (!raw) return bad('Not found', 404);

      let rec;
      try {
        rec = JSON.parse(raw);
      } catch {
        return bad('Corrupt record', 500);
      }

      const token = readAuthBearer(request);
      if (!token) return bad('Missing Authorization Bearer token', 401);

      const tokenHash = await sha256Hex(token);
      const isWrite = !!(rec && rec.write_hash && tokenHash === rec.write_hash);
      const isRead = !!(rec && rec.read_hash && tokenHash === rec.read_hash);
      if (!isWrite && !isRead) return bad('Unauthorized', 403);

      if (request.method === 'GET') {
        if (!rec.payload || !rec.payload.config) return bad('No config stored yet', 404);
        // Return just the config JSON.
        return new Response(JSON.stringify(rec.payload.config), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store'
          }
        });
      }

      // PUT (write required)
      if (!isWrite) return bad('Write token required', 403);

      let body;
      try {
        body = await request.json();
      } catch {
        return bad('Invalid JSON body', 400);
      }

      const cfg = body && typeof body === 'object' ? body.config : null;
      if (!cfg || typeof cfg !== 'object') {
        return bad('Body must be { config: { ... }, meta?: { ... } }', 400);
      }

      const meta = (body && typeof body === 'object' && body.meta && typeof body.meta === 'object') ? body.meta : null;

      rec.payload = { config: cfg, meta };
      rec.updated_at = nowIso();

      await env.COGFLOW_CONFIGS.put(configKey(configId), JSON.stringify(rec));
      return jsonResponse({ ok: true, config_id: configId, updated_at: rec.updated_at });
    }

    if (url.pathname === '/' && request.method === 'GET') {
      return textResponse('CogFlow Token Store Worker. See /health.', 200);
    }

    return bad('Not found', 404);
  }
};
