# Local knowledge workspace migration

**Status:** reviewed design procedure, 2026-09-09. Production migration apply,
registry conversion, journal recovery and rollback remain implementation work.
The supplied reference package's filename inventory is not an executable,
hash-bound migration plan; its reported tests are separate package evidence.

## Classify before moving

Do not rename `local/` wholesale. Select explicit owner identities and preserve
existing common gitlinks and pins while reviewing mixed legacy content.

| Legacy content | Reviewed destination or handling |
| --- | --- |
| Personal authored knowledge/procedures | `users/<user>/wiki` or `skills`, according to content. |
| Personal cross-host preferences | `users/<user>/hosts/defaults.json`. |
| Account paths and scope registrations | Private `users/<user>/hosts/<host>/`; parse and convert registry data. |
| Shared desired machine setup | `hosts/machines/<host>/`; separate requirements from observed capability. |
| Reusable desired machine setup | `hosts/profiles/<profile>/`, with account-specific data removed. |
| Reconstructible retrieval/summary/KV cache | Rebuild under `runtime/<user>/<host>/cache/`; validate compatibility before reuse. |
| Research history, receipts and resumable runs | Retained `runtime/<user>/<host>/state/`, preserving access and retention. |
| Active locks, sockets and process files | Stop the owning process, then recreate coordination under `run/`. |
| Credentials | Approved credential store; never authored knowledge. |
| Unknown or mixed content | Preserve original location pending owner review. |

Resolve ambiguous `organization/<id>` mappings explicitly: company-wide content
maps to `companies/<company>`, while department content maps to
`companies/<company>/organizations/<organization>`. Do not invent a department
named after the company. Logical scope registration can retain an external
physical checkout; copying is unnecessary. Real restricted repositories and
ACLs enforce department boundaries.

Classify legacy knowledge by role: captures/logs/measurements → owning `raw/`;
synthesized explanations → `wiki/`; approved requirements/design/policy → `doc/`;
procedures → `skills/`; generated research intermediates → runtime. Preserve UIDs,
source revisions, provenance and links. Keep `doc/00_llm_process/knowledge/` as
documentation about the system, with selective per-artifact migration only.

## Inventory and pin preservation

Inventory workspace `local/scopes.sdn` and the explicitly configured project-mode
registry, commonly `${XDG_CONFIG_HOME:-$HOME/.config}/spipe/scopes.sdn`. Include
gitlinks, `.gitmodules`, current common HEAD, dirty state, tracked private data,
active processes, permissions, symlinks/junctions, external mounts, doc roots and
all consumers of legacy configuration. Keep the inventory private; filenames can
reveal sensitive information.

A production plan additionally binds content hashes, scope identity, reviewed
owner decisions and authorization to the source snapshot. Filename-based suggested
classification alone cannot authorize moves. Ignore rules do not untrack or erase
previously committed private data; escalate that exposure for explicit remediation.

Initialize only the approved recorded common submodule path with ordinary
checkout-style Git update. Preserve `.spipe`, `.spipe/spipe`, and clone-as-common
layouts; omit `--remote` and avoid implicit upgrade or relocation. Existing source
repositories are registered from a separate workspace unless direct workspace use
was explicitly configured. A helper must not infer permission to populate private
company/user trees beside arbitrary project source.

The preferred destination for global common is `~/spipe`; Simple resolves it through
the project route `.spipe/common`. Introduce that route only after validating the
project's common requirement and ownership of its parent paths. Existing
`.spipe/spipe` and `.spipe/spipe_project` remain later compatibility candidates.
Do not replace or move an existing submodule merely to match the new spelling.

## Reader and writer cutover

1. Record owner mappings and a private recovery snapshot. Complete active writers
   before moving retained state; keep readers on a pinned snapshot where possible.
2. Add the reviewed scaffolds without changing the common pin. Maintain one
   selected authoritative common checkout and report conflicting registrations.
3. Add the shared resolver with explicit v2 or legacy read adapters. Parse legacy
   pipe-delimited registries; changing a filename to `.json` is not conversion.
   Verify scope identities and reject silent path rebinding.
4. Move CLI, MCP, plugin, harness and host bootstrap readers to the same resolver.
   Resolve host and common independently. When `.spipe` itself is common, keep new
   project configuration outside it, such as the proposed `spipe.project.json`.
5. Establish v2 as the single registry writer after reader parity. Do not dual-write
   independently resolved old and new formats.
6. Apply owner-reviewed, snapshot-bound content moves through the canonical
   RefactorService, with journal, resume/rollback and UID/reference checks. Reject
   changed source hashes; preserve newly authored data during recovery.
7. Refresh affected indexes and derived summaries, retain old read aliases for the
   compatibility window, and retire them only after consumer parity is proven.

Physical common relocation is optional and independently reviewed. A gitlink move
coordinates `.gitmodules`, index entries, Git metadata and dependent links; validate
clean-clone and existing-worktree behavior. Link payloads must be relative to the
target's parent (`relative(dirname(target), source)`), not assumed relative to the
host root. Keep relocation, common upgrade, and semantic prose edits distinguishable
in review. No blanket `local -> users/<id>` symlink can represent mixed ownership.

## Cutover and recovery gates

Verify original common pin preservation, unchanged external project contents,
unique registry identities, one writer per UID, correct raw/wiki/doc/skills
classification, no sibling-scope disclosure, and preserved retained runtime state.
Test source edits during migration and interruption after partial moves against
the journal before enabling production apply. Windows/macOS behavior and actual
ACL deployment require their own evidence.

Research parity must resolve common/company/selected organizations/selected
projects/user/host indexes deterministically, skip absent optional surfaces, deny
unauthorized probes, retrieve bounded relevant leaves, validate runtime identity,
follow doc/raw provenance, select the correct write owner and invalidate affected
dependencies. Runtime remains execution state throughout cutover.

Before writer cutover, retain legacy writers and inactive new scaffolds for rollback.
After cutover, stop writers, reconcile new state and execute the journal's reverse
operations without overwriting later authored material. Remove old `local/` only
after all content is classified and retention/recovery policy allows removal.

See [available setup](local_ownership_setup.md) and
[research context contract](llm_wiki_scope_resolution.md).
