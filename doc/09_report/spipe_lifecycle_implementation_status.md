# Lifecycle implementation status — 2026-11-07

STATUS: TEST_BLOCKED. Source implementation exists; compilation, red/green tests, coverage and generated manuals are NOT_RUN. No production adapter or command is enabled by this work. The complete proposal remains the objective.

## Implemented source

- `src/lifecycle/contracts.spl`: versioned core values and explicitly composed authority ports.
- `gate.spl`: exact source/policy/executable/input/selector/generation binding, authenticated receipts and waivers, expiry, genuine positive/negative red counts, distinct pass/fail/waived/N/A results.
- `state.spl`: legal transitions, expected-generation admission, complete policy requirement authorization and revalidation at commit time. Storage CAS and immutable receipt persistence remain to integrate.
- `schema.spl`: closed bounded SDN reader reusing the host strict parser. Eleven descriptor files cover the proposal's eight schemas and run/evidence/waiver records. Shape checks are distinct from domain/authority checks.
- `doctor.spl`: authorization-first, read-only snapshot analysis with content rehashing, file/byte/link/finding caps, route collisions, exact-file projection checks, normalized checked links and host-path/terminology warnings. No portable filesystem traversal is claimed. Managed blocks still require existing generator integration.
- Four SSpec files contain real gate, state, schema and doctor scenarios. They have not been executed. Their count is not evidence of behavior or branch coverage.

## Blocking evidence

The host guide `doc/07_guide/compiler/minimal_bootstrap_configuration_composition.md` explicitly marks general pure-Simple SSpec/docgen execution TEST_BLOCKED pending a qualified runtime. The inspected `C:/dev/simple/build/bootstrap/stage3/x86_64-pc-windows-msvc/stage2-sanity.env` records `status=fail` and failed frontend smoke for candidate SHA-256 `1f1ce638f54fb5c87daf5861eacb5e8f0458c84ab683b488b188dc823d1854f5`. The nearby executable is rejected, not admitted. No seed fallback has been used. A qualified runtime path and admission receipt have been requested.

Filesystem review found retained bounded file owners, but the trusted retained-directory opener is Linux-only. Leaf no-follow checks alone do not prove intermediate-directory containment. The doctor therefore requires an authorized owner-supplied snapshot and does not silently replace unsupported discovery with an empty successful list.

## Review and verification

The user subsequently requested landing the fixes and implementation after review. The authorized landing is an experimental, unwired foundation; it does not waive runtime qualification for activating lifecycle commands or claim completion of M0–M6. The existing Linux/Windows CI checks passed, but the inspected Linux job explicitly reports `spipe_simple_build=skip (no Simple runtime; set SPIPE_SIMPLE)`. Its green build is not lifecycle compilation or SSpec evidence.

The final separate exact-head review also found private fixture declarations imported by sibling specs. Those shared test classes, constants and helper functions are now explicitly public. Compilation and runtime evidence remain NOT_RUN after this source fix.

A separate agent performed bounded source review. Findings addressed include impossible test-count partitions, generation replay, failed executions labeled N/A, incomplete policy fixture matching, exact waiver input bindings, self/chained canonical projections and projection route mismatches. Source review is not compiler/runtime verification.

`git diff --cached --check` passed for the initial staged sources. No executable specs are tracked under `doc/06_spec`. No syntax, test, security, performance, coverage or release PASS is claimed from these housekeeping checks.

## Remaining full-scope work

| Milestone | Remaining |
| --- | --- |
| M0 | Qualified actual doctor CLI, safe filesystem/index ports, existing managed-generator checks, current inventory/pilot receipts |
| M1 | Compile/execute core scenarios; complete schema golden matrix; typed record adapters; trace graph; durable immutable receipts/CAS; dependency invalidation; status/explain |
| M2 | General canonical capability generator and checked provider projections, imports/permissions/token-size evidence |
| M3 | Same core through CLI/MCP/caret/CI, negotiated role/task/session dispatch and authority integration |
| M4 | Restricted offline dump readers/debugger adapters, incident/reproduction/prevention/recovery workflow and historical pilot |
| M5 | Curation/alias/archive enforcement, blinded frozen benchmark replay, repeated model ladder and measured metrics |
| M6 | Per-subsystem feature/incident pilots, shadow-gate false-positive/performance baselines, reviewed graduated enforcement |

These gaps prevent completion and merging as finished work. No release tag, publication, production mutation, dump export or model promotion is performed.
