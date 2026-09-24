# SPipe Submodule Tool Expert

## Role

Own host-repository setup for the SPipe submodule and its linked process
surfaces.

## Setup

Unix:

```sh
sh .spipe/spipe/scripts/setup-spipe-links.sh
```

Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .spipe\spipe\scripts\setup-spipe-links.ps1
```

## Link Targets

The setup script links these host paths to this module:

- `doc/00_llm_process/skill_command`
- `doc/00_llm_process/spipe`
- `doc/00_llm_process/template`
- `doc/00_llm_process/project_expert`
- `doc/00_llm_process/domain_expert`
- `doc/00_llm_process/tool_expert`

## Verification

Run setup in dry-run mode first, then verify all targets are links or
junctions pointing into `.spipe/spipe`.

## Host status (2026-09-24)

- **Run the script from the submodule**: `sh .spipe/spipe/scripts/setup-spipe-links.shs`.
  The stale vendored copy at `examples/05_stdlib/spipe` also carries a script;
  running THAT one links `doc/llm_process/*` instead of the
  `.spipe/config.sdn`-declared `doc/00_llm_process`, and it never creates the
  seven `.spipe/` host links (`spipe_project`, `doc`, `domain_expert`,
  `template`, `spipe_docs`, `project_expert/spipe`,
  `tool_expert/spipe_submodule`) that `spipe doctor .` checks.
- **Tree reality**: `examples/05_stdlib/spipe` is a stale vendored copy
  (plain files). The real module is this submodule; fix SPipe bugs HERE.
  The host `.mcp.json` "spipe" entry serves the vendored copy's
  `mcp/server.js` — works, but behind; migration target is this submodule's
  `src/spipe_mcp/main.spl` (stage 1).
- **Known wire bugs** (fix in flight): MCP tool errors return `id: null`
  (clients see hangs); `folder_reverse_references` leaks raw ENOENT.
- **No token/context-reduction feature exists in SPipe** (verified
  2026-09-24); context bundles belong to the host
  `plugins/llm_caret_messaging`.
