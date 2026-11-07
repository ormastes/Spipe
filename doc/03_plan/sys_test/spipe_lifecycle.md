# Lifecycle system test plan

Executable specs: `test/03_system/app/spipe/feature/lifecycle_gate_spec.spl` and `lifecycle_state_spec.spl`.

Initial fixtures exercise REQ-002/003/006/009: missing and stale receipt identities, zero test cases, not-run result, valid pass, hardening without negative red, cross-gate and expired waivers, illegal/skipped/repeated transitions and stale generation. Rejection must preserve the run value and report the actual gate reason.

Remaining proposal criteria retain their full evidence requirements in Simple's landed lifecycle evidence map. No scope-wide coverage claim follows from the initial gate/state specs.

Runtime status: NOT_RUN. Qualified general pure-Simple SSpec/docgen availability must be established before red/green or generated-manual claims. Do not run with the Rust seed. No generated manual is claimed until actual generation/review succeeds.
