# Lifecycle completion: three Astra lanes with three Sol implementers

Requested by the user on 2026-11-07. Base: `026772fd0c53377cb2aaa1d28d1f268787c0f980`. Shared isolated worktree: `C:/dev/spipe-lifecycle-complete-20261107`; branch: `work/spipe-lifecycle-complete-20261107`. Root owns integration, real verification, exact-head review, PR merges and the Simple release/1.0.0 gitlink handoff.

The full proposal in Simple's `doc/04_architecture/spipe_complete_lifecycle.md`, its REQ-001–010, and M0–M6 remain the destination. No lane may redefine completion around authored code or synthetic green checks.

## Shared contracts before Sol work

Reuse `src/lifecycle/contracts.spl` values and trust ports. Root alone edits existing `contracts.spl`, `gate.spl`, `state.spl`, `schema.spl`, `doctor.spl` or shared schema descriptors. New lane-specific types go in the lane's modules. Before its Sol implementer starts, each Astra writes exact public names, signatures, ownership, error semantics, dependency identity and manual fixture helper names in its lane design. Send required cross-lane additions to root rather than editing shared contracts concurrently.

Canonical identities across lanes are stable UID, run ID, exact source revision, source/content SHA-256, policy SHA-256, authority scope and schema version. Checked authority ports, not request booleans, establish evidence. Reuse the existing strict SDN parser and canonical encoder. Use SDN on disk; preserve required JSON/MCP interoperability. All feature domain code and specs are Simple. Thin adapters must delegate to the same domain implementation; no duplicate Node validation.

Shared existing fixture helpers: `fixture_run`, `fixture_requirement`, `fixture_evidence`, `fixture_waiver`. Visible manual actions use `std.spec.step("...")`. Every cross-file helper/constant/class is explicitly public. Unimplemented shared interfaces fail explicitly; no no-op or pass-only bodies.

## Ownership

| Astra lane | Sol implementation ownership | Required delivery |
| --- | --- | --- |
| A: workflow/trace | `src/lifecycle/workflow/`, matching `lifecycle_workflow_*` specs/fixtures, lane A design/report | Durable run/receipt owner ports and actual store integration, trace queries and checked links, invalidation, status/next/explain, stale/CAS/replay negatives, measured workflow pilot |
| B: incident operations | `src/lifecycle/operations/`, matching `lifecycle_operations_*` specs/fixtures, lane B design/report | Restricted dump manifests/read access before discovery, timeline/triage/contain/reproduce/fix/prevent/recovery state and evidence, offline adapter integration, historical incident pilot |
| C: knowledge/learning | `src/lifecycle/learning/`, matching `lifecycle_learning_*` specs/fixtures, lane C design/report | Claim curation/archive/alias semantics, root-cause-family/time/repo split and hidden-answer isolation, repeated model-ladder metrics and promotion authority, canonical skill/role mapping proposals, real replay/pilot boundaries |

Root owns native/CLI/MCP/caret/CI adapters, safe filesystem composition, package/build/generator wiring, existing shared files, host runtime/producer qualification, overall manuals/guide consistency, performance baselines and release-blocking verification. Lanes may request root changes by message. Root must repair or explicitly retain real missing capability blockers; it must not label unexecuted native/SSpec/manual checks PASS.

## Agent structure and review

Exactly three Astra supervisors each spawn exactly one `gpt-6.1-sol` implementer with no history fork and explicit lane context, for three Sol implementers total. No additional agent delegation without root agreement. Astra performs design and substantive review of its Sol's actual diff, including negative fixtures and manuals; root independently reviews the combined result. Agents share the filesystem but never stage, commit, push, reset, clean or merge. Root commits only owned work after review.

## Verification discipline

One meaningful check per criterion/revision; do not rerun green checks without changes. At most six fix/verify cycles per cause; each retry changes code or adds evidence. Record actual processes, producer paths/hashes/admission, case counts, selector, flags, cache scope and platform. No seed fallback for feature/SPipe verification. Missing binaries, zero cases, timeouts and missing authority are not passes. Generated `.spl` remains under `test`; manual `.md` remains under `doc/06_spec`.
