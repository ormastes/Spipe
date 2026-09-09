# Agent and plugin SPipe bootstrap guide

Status: integration contract. The plugin ships research guidance; the shared
locator/context exports and standalone discovery/distribution scripts described
here still require implementation.

## Common discovery

One locator serves CLI, MCP, plugin, Claude, Codex, Gemini, and research workers:

```text
SPIPE_HOME
→ project .spipe/common (route to ~/spipe)
→ ~/spipe
→ ~/.spipe/common
→ identified direct SPipe checkout
→ legacy project .spipe/spipe
→ legacy project .spipe/spipe_project
→ legacy ~/.spipe package checkout
```

`~/spipe` is the canonical common checkout. Simple's project-owned
`.spipe/common` routes to it; `~/.spipe/common` is the private workspace link. The
descriptor identifies a common route; its machine-specific absolute target
belongs in private local configuration. Legacy nested project checkouts are
migration fallbacks, not the preferred new installation.

Validate package identity and required revision. An explicit invalid selection
is an error. A required project pin cannot be silently upgraded: diagnose an
incompatible global checkout and keep the approved legacy route until a reviewed
dependency migration. Preserve recorded legacy gitlink locations through the
host descriptor/compatibility adapter. Do not guess arbitrary repositories.

When common is unavailable, report the three acquisition choices in the
[distribution guide](INTRANET_MIRROR_AND_DISCOVERY.md) and stop research that
depends on SPipe. Installing a plugin does not install common or grant authority.

## Shared research contract

Call the planned shared APIs `locate_common()`, `resolve_workspace()`,
`resolve_active_scopes()`, `compile_research_context()`, and
`explain_resolution()` when implemented. Until then use only an identified
compatible adapter and disclose its limitations. Prompt files describe policy;
they must not become separate implementations of resolution.

Resolve the workspace independently from common. Obtain active authorized scopes
before reading indexes: common, company, organization(s), project(s), user, host.
Company is its own scope. A department gets applicable company policy and its
authorized knowledge; selection does not expose siblings. A path, registry ID,
or unconfigured scaffold is not trusted authority. Do not probe denied indexes.
Missing optional scopes are skipped; missing required policy blocks the operation.

Load task skills, enter scope `index.md` and `wiki/index.md`, and retrieve bounded
relevant leaves. Check matching runtime research state, follow normative `doc/`
references and exact `raw/` evidence, research permitted external gaps, validate
claims, and propose edits to the correct owner. An authorized writer publishes
reviewed changes and invalidates their affected dependencies. Public search
queries and provider exports respect the scope's export policy.

## Surfaces and compatibility

| Surface | Role |
|---|---|
| `raw/` | Preserved evidence and provenance |
| `wiki/` | Synthesized knowledge and stable navigation |
| `doc/` | Canonical lifecycle artifacts and approved decisions |
| `skills/` | Agent procedures |
| `runtime/<user>/<host>/` | Execution state, outside canonical knowledge |

Within runtime, `cache/` is reconstructible, `state/` retains research runs,
history and receipts, `run/` holds active coordination, and `tmp/` has bounded
lifetime. Validate authorization, source revisions, task, schema/provider profile
and expiry before reuse. Never delete retained state as ordinary cache eviction.

Minimum common entrypoints are `README.md`, `index.md`, `wiki/index.md`, and
task-relevant `skills/` when present. Preserve compatibility with
`doc/00_llm_process/knowledge/index.md` as documentation of the knowledge system
and `doc/00_llm_process/skill_command/skills/` as the older skill surface.
Missing optional wiki surfaces do not authorize a recursive raw-tree scan.

## Acceptance before cutover

Verify identical authorized source snapshots resolve equivalent evidence sets in
direct SPipe, global-common, intranet-installed, Simple common-route, and retained
legacy project-pinned modes. Test
absent optional scopes, denied scopes without filesystem probes, retained state,
stale cache rejection, raw/doc provenance, owner-correct proposed writes, and
deterministic context. Compatibility readers remain until existing installations
and clean clones pass these gates.
