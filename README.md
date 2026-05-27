# SPipe

SPipe is the portable LLM process module for Simple projects. It packages the
pipeline commands, SPipe testing skill, templates, expert directories, setup
scripts, and integration docs that can be mounted into a host repository.

## Layout

- `doc/00_llm_process/spipe/` - SPipe testing and loop docs.
- `doc/00_llm_process/skill_command/` - command and skill command payloads.
- `doc/00_llm_process/template/` - reusable expert/skill templates.
- `doc/00_llm_process/project_expert/` - project and subproject experts.
- `doc/00_llm_process/tool_expert/` - tool integration experts.
- `doc/00_llm_process/domain_expert/` - domain experts.
- `.claude/`, `.codex/`, `.gemini/` - agent command payloads.
- `plugin/`, `mcp/`, `cli/` - reserved package roots for SPipe plugin,
  MCP, and CLI code.
- `scripts/` - host-repo setup and link scripts.

## CLI and MCP

The package exposes two dependency-free Node entrypoints:

```sh
node cli/spipe.js info
node cli/spipe.js experts
node cli/spipe.js doctor ../..
node mcp/server.js
```

When installed as an npm-style package, the binaries are `spipe` and
`spipe-mcp`.

## Build Check

Run the package layout check before publishing or updating a host submodule
pointer:

```sh
sh scripts/build.sh
```

## Host Setup

From a host repository with this project mounted at `.spipe/spipe`:

```sh
sh .spipe/spipe/scripts/setup-spipe-links.sh
```

On Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .spipe\spipe\scripts\setup-spipe-links.ps1
```

Use `--force` or `-Force` only when replacing existing host directories with
links to this module.
