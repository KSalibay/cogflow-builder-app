/*
  Generate Markdown reference docs for Builder plugin schemas.

  Usage (from repo root):
    node tools/generate_plugin_refdocs.js

  Output:
    docs/reference/plugins/<plugin-type>.md
    docs/reference/plugins/index.md
*/

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function readUtf8(p) {
  return fs.readFileSync(p, { encoding: 'utf8' });
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeUtf8(p, content) {
  fs.writeFileSync(p, content, { encoding: 'utf8' });
}

function mdEscapeCell(value) {
  const s = (value ?? '').toString();
  return s.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br/>');
}

function fmtDefault(v) {
  if (v === undefined) return '';
  if (v === null) return 'null';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function fmtNotes(param) {
  const notes = [];
  if (!param || typeof param !== 'object') return '';
  if (Array.isArray(param.options) && param.options.length > 0) notes.push(`options: ${param.options.map(String).join(', ')}`);
  if (param.min !== undefined) notes.push(`min: ${param.min}`);
  if (param.max !== undefined) notes.push(`max: ${param.max}`);
  if (param.blockTarget) notes.push(`blockTarget: ${param.blockTarget}`);
  if (param.required === true) notes.push('required');
  return notes.join(' | ');
}

function run() {
  const repoRoot = path.resolve(__dirname, '..');
  const rdmSchemaPath = path.join(repoRoot, 'src', 'schemas', 'RDMTaskSchema.js');
  const jsSchemasPath = path.join(repoRoot, 'src', 'schemas', 'JSPsychSchemas.js');

  const ctx = {
    console,
    window: {},
    document: {},
    setTimeout,
    clearTimeout,
  };
  vm.createContext(ctx);

  // Load schema classes into VM global scope.
  vm.runInContext(readUtf8(rdmSchemaPath), ctx, { filename: 'RDMTaskSchema.js' });
  vm.runInContext(readUtf8(jsSchemasPath), ctx, { filename: 'JSPsychSchemas.js' });

  if (typeof ctx.JSPsychSchemas !== 'function') {
    throw new Error('JSPsychSchemas class not found after evaluation');
  }

  const schemas = vm.runInContext('new JSPsychSchemas()', ctx);
  const pluginSchemas = schemas && schemas.pluginSchemas ? schemas.pluginSchemas : {};

  const outDir = path.join(repoRoot, 'docs', 'reference', 'plugins');
  ensureDir(outDir);

  const keys = Object.keys(pluginSchemas || {}).sort((a, b) => a.localeCompare(b));
  const indexLines = [];
  indexLines.push('# Plugin Schema Reference');
  indexLines.push('');
  indexLines.push('Generated from `src/schemas/JSPsychSchemas.js` via `node tools/generate_plugin_refdocs.js`.');
  indexLines.push('');
  indexLines.push(`Generated at: ${new Date().toISOString()}`);
  indexLines.push('');
  indexLines.push('## Plugins');
  indexLines.push('');

  for (const type of keys) {
    const schema = pluginSchemas[type] || {};
    const name = schema.name ? String(schema.name) : type;
    const description = schema.description ? String(schema.description) : '';
    const params = schema.parameters && typeof schema.parameters === 'object' ? schema.parameters : {};

    const lines = [];
    lines.push(`# ${name}`);
    lines.push('');
    lines.push(`**Type:** \`${type}\``);
    if (description) {
      lines.push('');
      lines.push(description);
    }

    const paramKeys = Object.keys(params).sort((a, b) => a.localeCompare(b));
    lines.push('');
    lines.push('## Parameters');
    lines.push('');

    if (paramKeys.length === 0) {
      lines.push('_No parameters defined._');
    } else {
      lines.push('| Name | Type | Default | Description | Notes |');
      lines.push('|---|---|---|---|---|');
      for (const p of paramKeys) {
        const spec = params[p] || {};
        const row = [
          mdEscapeCell(p),
          mdEscapeCell(spec.type ?? ''),
          mdEscapeCell(fmtDefault(spec.default)),
          mdEscapeCell(spec.description ?? ''),
          mdEscapeCell(fmtNotes(spec)),
        ];
        lines.push(`| ${row.join(' | ')} |`);
      }
    }

    const filename = `${type}.md`.replace(/[^A-Za-z0-9._-]/g, '_');
    writeUtf8(path.join(outDir, filename), lines.join('\n') + '\n');

    indexLines.push(`- [${type}](${encodeURIComponent(filename)})`);
  }

  writeUtf8(path.join(outDir, 'index.md'), indexLines.join('\n') + '\n');
  // eslint-disable-next-line no-console
  console.log(`Wrote ${keys.length} plugin doc(s) to ${outDir}`);
}

run();
