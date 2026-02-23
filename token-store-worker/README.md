# CogFlow Token Store Worker

A small Cloudflare Worker + KV backend for storing CogFlow Builder configs behind unguessable read/write tokens.

## API

- `GET /health`
- `POST /v1/configs` → creates a new config container, returns `{ config_id, write_token, read_token }`
- `PUT /v1/configs/:config_id` (Authorization: `Bearer <write_token>`) → stores `{ config, meta }`
- `GET /v1/configs/:config_id` (Authorization: `Bearer <read_token>` or write token) → returns the stored config JSON

### Assets (R2)

- `POST /v1/configs/:config_id/assets` (Authorization: `Bearer <write_token>`, `multipart/form-data` with `file`) → uploads a binary asset (image/audio/etc.) to R2 and returns `{ url }`
- `GET /v1/assets/:asset_id` → public, unguessable asset URL served by the Worker
- `DELETE /v1/configs/:config_id` (Authorization: `Bearer <write_token>`) → deletes the config record and any tracked assets

## Local dev

1. Install Wrangler: `npm i -g wrangler`
2. Create KV namespaces (see `wrangler.toml` comments)
3. Run: `wrangler dev`

## Deploy with ZERO local installs (Cloudflare Dashboard only)

If you can’t install Node.js/Wrangler on your machine, you can still deploy this Worker entirely from the Cloudflare web UI.

1. Create a KV namespace
	- Cloudflare Dashboard → **Storage & Databases** → **KV** → **Create a namespace**
	- Name it: `COGFLOW_CONFIGS`

2. Create the Worker
	- Cloudflare Dashboard → **Workers & Pages** → **Create application** → **Worker** → **Create Worker**

3. Paste the Worker code
	- Open the Worker → **Edit code**
	- Replace the editor contents with: `src/index.js` from this folder

4. Bind the KV namespace to the Worker
	- Worker → **Settings** → **Bindings** → **Add binding**
	- Binding type: **KV Namespace**
	- Variable name: `COGFLOW_CONFIGS`
	- KV namespace: select the `COGFLOW_CONFIGS` namespace you created

5. Deploy
	- Click **Deploy** (or **Save and deploy**, depending on the UI)

6. Verify
	- Visit: `https://<your-worker-subdomain>.workers.dev/health`
	- Should return JSON like `{ "ok": true, "ts": "..." }`

That’s it — you now have a Worker base URL you can paste into the Builder when it prompts for “Token Store API base URL”.

### Add R2 asset hosting (Dashboard-only)

1. Create an R2 bucket
	- Cloudflare Dashboard → **R2** → **Create bucket**
	- Name: `cogflow-assets` (or any name, but then update the binding to match)

2. Bind the R2 bucket to the Worker
	- Worker → **Settings** → **Bindings** → **Add binding**
	- Binding type: **R2 Bucket**
	- Variable name: `COGFLOW_ASSETS`
	- Bucket: select your bucket (e.g., `cogflow-assets`)

3. (Optional) Set conservative quotas
	- Worker → **Settings** → **Variables**
	- Add these as **text** variables:
	  - `MAX_ASSET_BYTES_PER_FILE` (default 10MB = `10485760`)
	  - `MAX_ASSET_BYTES_PER_CONFIG` (default 100MB = `104857600`)

Once R2 is bound, the Builder’s Token Store export will upload any cached `asset://...` files and rewrite the config to use the returned `https://<worker>/v1/assets/<asset_id>` URLs.

## Deploy via GitHub Actions (no local installs)

If you can push to GitHub but can’t install tooling locally, you can deploy from CI.

- Workflow file: `json-builder-app/.github/workflows/deploy-token-store-worker.yml`
- You must add GitHub repo secrets:
  - `CLOUDFLARE_API_TOKEN` (Workers edit + KV read/write permissions)
  - `CLOUDFLARE_ACCOUNT_ID`

Note: you still need a KV namespace and binding. The simplest approach is to create/bind KV once in the Cloudflare Dashboard, then let CI deploy code updates.

## Notes

- “Unguessable URL” is not the same as “cannot be saved”. Any asset that can be rendered by the participant’s browser can be downloaded via devtools/screen capture. Unguessable URLs mainly prevent casual/accidental discovery.

## R2 pricing (high-level)

Cloudflare R2 (Standard) currently advertises:

- Free tier: **10 GB-month** storage/month, **1M Class A** ops/month (writes), **10M Class B** ops/month (reads), and **free egress**.
- Paid tier (beyond free): **$0.015 / GB-month** storage, **$4.50 / million** Class A ops, **$0.36 / million** Class B ops.

For typical psych study assets (a handful of small images/audio files per study), you will usually stay inside the free tier unless participant volume or asset size is very high.

## Conservative limits + retention suggestions

If you want a “safe default” that avoids surprise bills:

- Per-study (per `config_id`) asset quota: **100MB** (already the Worker default)
- Per-file max: **10MB** (already the Worker default)
- Retention: **30–90 days after study end**

Retention implementation options:

- Manual cleanup: call `DELETE /v1/configs/:config_id` with the **write token** after the study.
- Bucket lifecycle (recommended if available in your Cloudflare plan/UI): configure an R2 lifecycle rule to delete objects after $N$ days.
