# SPipe easy-project workspace completion audit

Date: 2026-09-10 (Asia/Seoul). Repository: `ormastes/Spipe`.
Audited remote `main`: `02444cf0a4c1da2ba23c8b7df873d5b2887a9470`.
`git ls-remote origin refs/heads/main` matched the worktree's starting HEAD.

## Conclusion and scope

The merged plugin supplies common discovery, navigation indexes, scope-aware
research instructions, and limited Windows compatibility fixtures. It does
**not** complete the supplied v3 workspace installation, distribution, registry,
or research-context implementation. Earlier broad claims that the entire reform
was complete exceed the evidence on this remote revision.

This audit compares implementation against the user's supplied v3 package and
subsequent preference for canonical `~/spipe`, explicit `SPIPE_HOME`, and retained
project-submodule compatibility. The later preference supersedes the earlier
default placing every new common checkout under a private workspace submodule.
Referenced downloaded scripts/TAP results were not supplied as local executable
artifacts here; their reported 25 tests do not establish upstream behavior.

## Requirement, evidence, and gap matrix

| Requirement | Current evidence at audited revision | Status and remaining work |
|---|---|---|
| Common under `~/spipe`, explicit environment selection, project/legacy fallbacks | `scripts/find-spipe.mjs` validates package identity; searches `SPIPE_HOME`, ancestor `.spipe/common`, home `spipe`, home `.spipe/common`, current direct package, legacy `.spipe`/nested mounts, and legacy home package. Invalid explicit selection exits 2. | **Partial.** Locator is executable; direct use from a nested directory inside common is not explicitly recognized as a direct-package ancestor. Add isolated candidate-order fixtures, including paths with spaces and unavailable candidates. |
| Preserve project-required common revision | Bootstrap/research guides require incompatible-pin diagnostics. Locator only checks package name and `plugin` existence; it does not read a project requirement or Git revision. | **Gap.** Implement dependency identity/pin validation before allowing global common to satisfy a recorded project requirement. `wiki/index.md` currently claims the locator validates this requirement, beyond its actual behavior. |
| Interactive first-user setup adopts the new workspace | `scripts/setup-local-knowledge.sh` prompts for mode/destination; PowerShell prompts for mode. User mode still initializes an outer Git repository and adds `.spipe` as a submodule, with `organization/`, `projects/`, `local/`. | **Gap.** Replace the legacy new-install default with `~/spipe` plus private workspace; collect explicit company/organization/user/host selections and show a reviewable plan. Preserve compatibility for existing installs. |
| Setup after cloning a project | Existing setup scripts support an already present `.spipe/common` route or recorded `.spipe`/`.spipe/spipe` gitlinks. Project registration uses the external legacy `scopes.sdn` registry. | **Partial.** Project mode cannot acquire/configure common for an ordinary project lacking those routes. Implement the shared project setup workflow without writing private config inside common. |
| Dependency-free Node bootstrap; one implementation with shell/PowerShell wrappers | `package.json` uses Node ES modules. Setup business logic remains separate shell and PowerShell programs. `setup-spipe-workspace.mjs` is absent. | **Gap.** Implement shared bootstrap and thin adapters, plan/apply semantics, idempotence, conflict handling, pin checks, locking, and failure receipts. |
| Internet/mirror/auto installer, safe fast-forward global updater | `docs/INTRANET_MIRROR_AND_DISCOVERY.md` explicitly states `install-spipe.mjs` is not shipped. | **Gap.** Implement selected-source acquisition, approved fallback, config parsing, clean-checkout/branch checks, fast-forward updates, and workspace common-link creation. |
| Dedicated intranet mirror publisher | Same guide describes but does not ship `sync-spipe-mirror.mjs`. | **Gap.** Add dry-run/ref plan and explicit apply for dedicated filesystem/remote mirrors; validate source/destination and credential boundaries. No mirror publication is authorized by discovery alone. |
| Companies, departments, users, hosts, user-host mounts; schema-2 registry | Knowledge guide describes intended hierarchy. Setup still writes pipe-delimited `local/scopes.sdn` or platform-config `spipe/scopes.sdn`. | **Gap.** No shared workspace/schema/registry implementation in `src/`; add ownership-aware scaffolds, portable manifests, private paths, conflict diagnostics, and external project registrations. Selection must remain distinct from authorization. |
| `raw/wiki/doc/skills` surfaces and stable indexes | `raw/index.md`, `wiki/index.md`, `skills/index.md` exist. `doc/00_llm_process/knowledge/` remains process/system documentation. Top-level skills index routes to plugin and compatibility skills. | **Partial.** No common root `index.md` or `doc/index.md` at this revision. New private-scope scaffold surfaces are absent; no systematic per-node index lint or content-classification migration is implemented. Empty unused directories need not be created. |
| Canonical documentation organization and selective migration | `local_migration.md` documents classification and retention. Existing research is retained under the knowledge-system documentation subtree. | **Partial.** Guidance is present; no executable inventory/migration transaction, UID/dependency migration, or completed content-by-content cutover is evidenced. Preserve authored lifecycle documents and select new destinations by content meaning. |
| Claude/Codex/Gemini/plugin agents load common skills/guides/wiki | `docs/PLUGIN_AGENT_BOOTSTRAP.md`, `skills/index.md`, and `plugin/skills/spipe-research/SKILL.md` provide shared policy and routes. Locator `--agent-guide` prints the research skill, two guides, and wiki index. | **Partial.** Legacy `.claude/agents/spipe/research.md` still begins from `.spipe/<feature>/state.md` and lacks common/scope bootstrap. Audit every harness adapter and generate consistent entrypoints; prose alone does not force all agents to resolve common. |
| One common/workspace/context implementation behind CLI, MCP, plugin | CLI roots still derive from their own module files; `linkPlan`, `doc-root`, and doctor retain two-parent host defaults. MCP initializes from its module root. Guides call shared context APIs proposed. | **Gap.** Extract reusable locator and implement `resolve_workspace`, `resolve_active_scopes`, `compile_research_context`, `explain_resolution`; route all entrypoints through them and remove host ancestor assumptions. |
| Authorized bounded wiki traversal, provenance, owner-correct writeback | Scope-resolution documentation and research skill specify authorization before probes, bounded index traversal, evidence validation, and proposed writer updates. | **Design only.** No common controller/resolver or executable denied-scope, provenance, deterministic-context, or owner-writeback acceptance evidence is present. |
| Runtime is noncanonical; cache/state/run/tmp retention and validated reuse | Research skill and ownership/migration guides distinguish all four runtime retention classes. | **Design only.** New runtime scaffold/storage, source-identity validation, dependency invalidation, and stale-cache rejection remain implementation work. |
| Windows project use and full cross-platform installation | `.github/workflows/build.yml` declares Ubuntu/Windows jobs and PowerShell link-containment/external-common tests. The external-common test uses a junction and verifies legacy project registration. | **Partial.** Checked-in fixtures cover two existing flows, not the v3 installer/mirror/schema migration. Native Windows results were not verified in this audit; PowerShell is unavailable locally. Add Windows/macOS coverage for new Node paths, IDs, spaces, junctions, failure propagation, and setup repeatability. |

## Checks performed and limits

- Confirmed the remote main revision with Git and inspected tracked source/docs.
- Executed `SPIPE_HOME=/tmp/spipe-easy-project-workspace-v4 node scripts/find-spipe.mjs --agent-guide`; it returned the expected common and four existing skill/guide/wiki paths.
- Inspected Windows workflow/test definitions; did not run Windows or macOS, install dependencies, alter scopes, clone common, or publish a mirror.
- No production test pass or full rollout completion is inferred from file presence.

## Recommended completion order

Freeze shared identities and manifest contracts first. Implement the reusable
locator/workspace/bootstrap core and test first-user and ordinary-project setup.
Add installer and dedicated mirror flows with explicit plan/apply boundaries.
Integrate every harness and CLI/MCP consumer, then classify/migrate knowledge
through one reviewed writer. Complete native OS and authorized-context parity
checks before replacing the partial-status language with completion claims.

## Implementation follow-up on this branch

After the remote-main audit above, this branch added the missing portable
locator-facing distribution layer: dependency-free Node workspace bootstrap,
interactive first-user/project setup, Internet/mirror/auto installer, dedicated
mirror synchronization, project-route pin preservation, common/doc indexes, and
Claude/Codex/Gemini bootstrap projections. Focused local fixtures cover plan-only
operation, explicit apply, idempotence, conflicts, exact pins, dirty/divergent
refusal, project non-mutation, runtime scaffolds, interactive routing, and
fail-closed discovery.

This follow-up closes the easy-user bootstrap/distribution gaps in the matrix;
it does not claim enterprise authorization, canonical document migration,
runtime KV reuse, or native Windows/macOS deployment. Those remain separate
architecture work rather than hidden behavior in an installation script.
