"""Generate a single Markdown reference doc for Builder plugin schemas.

Usage (from repo root):
  python tools/generate_plugin_refdocs_quickjs.py

Output:
  docs/reference/plugins/plugin_schema_reference.md
"""

from __future__ import annotations

import datetime
import json
import pathlib

from quickjs import Context


def esc_cell(value: object) -> str:
    return str(value if value is not None else "").replace("|", "\\|").replace("\n", "<br/>").replace("\r", "")


def fmt_default(value: object) -> str:
    if value is None:
        return "null"
    if isinstance(value, (str, int, float, bool)):
        return str(value)
    return json.dumps(value, ensure_ascii=False)


def fmt_notes(spec: object) -> str:
    if not isinstance(spec, dict):
        return ""
    notes: list[str] = []
    opts = spec.get("options")
    if isinstance(opts, list) and opts:
        notes.append("options: " + ", ".join(map(str, opts)))
    if spec.get("min") is not None:
        notes.append("min: " + str(spec.get("min")))
    if spec.get("max") is not None:
        notes.append("max: " + str(spec.get("max")))
    if spec.get("blockTarget"):
        notes.append("blockTarget: " + str(spec.get("blockTarget")))
    if spec.get("required") is True:
        notes.append("required")
    return " | ".join(notes)


def main() -> None:
    repo_root = pathlib.Path(__file__).resolve().parents[1]
    rdm_schema_path = repo_root / "src" / "schemas" / "RDMTaskSchema.js"
    js_schemas_path = repo_root / "src" / "schemas" / "JSPsychSchemas.js"
    out_path = repo_root / "docs" / "reference" / "plugins" / "plugin_schema_reference.md"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    ctx = Context()
    ctx.eval("var window = {}; var document = {};")
    ctx.eval("var console = { log: function(){}, warn: function(){}, error: function(){} };")

    ctx.eval(rdm_schema_path.read_text(encoding="utf-8"))
    ctx.eval(js_schemas_path.read_text(encoding="utf-8"))

    # Avoid using '&&' in this JS snippet because our PowerShell terminal tooling
    # rewrites that token even inside quoted strings.
    payload_json = ctx.eval(
        "(function(){\n"
        "  var s = new JSPsychSchemas();\n"
        "  var ps = {};\n"
        "  if (s) {\n"
        "    if (s.pluginSchemas) { ps = s.pluginSchemas; }\n"
        "  }\n"
        "  return JSON.stringify(ps);\n"
        "})()"
    )
    plugin_schemas = json.loads(payload_json)

    types = sorted(plugin_schemas.keys(), key=lambda x: str(x))

    now = datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    lines: list[str] = []
    lines.append("# Plugin Schema Reference")
    lines.append("")
    lines.append("Generated from `src/schemas/JSPsychSchemas.js`.")
    lines.append("")
    lines.append("Generated at: " + now)
    lines.append("")

    for plugin_type in types:
        schema = plugin_schemas.get(plugin_type) or {}
        name = schema.get("name") or plugin_type
        desc = schema.get("description") or ""
        params = schema.get("parameters") if isinstance(schema.get("parameters"), dict) else {}
        param_keys = sorted(params.keys(), key=lambda x: str(x))

        lines.append("---")
        lines.append("")
        lines.append("## " + str(name))
        lines.append("")
        lines.append("**Type:** `" + str(plugin_type) + "`")
        if desc:
            lines.append("")
            lines.append(str(desc))
        lines.append("")
        lines.append("### Parameters")
        lines.append("")

        if not param_keys:
            lines.append("_No parameters defined._")
            lines.append("")
            continue

        lines.append("| Name | Type | Default | Description | Notes |")
        lines.append("|---|---|---|---|---|")
        for p in param_keys:
            spec = params.get(p) or {}
            default_str = fmt_default(spec.get("default")) if "default" in spec else ""
            row = [
                esc_cell(p),
                esc_cell(spec.get("type", "")),
                esc_cell(default_str),
                esc_cell(spec.get("description", "")),
                esc_cell(fmt_notes(spec)),
            ]
            lines.append("| " + " | ".join(row) + " |")
        lines.append("")

    out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
