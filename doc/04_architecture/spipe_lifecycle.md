# Lifecycle implementation architecture

The complete proposal remains the destination. Integrate into SPipe, not a second Simple-host scheduler. The initial core adds `src/lifecycle` with no implicit filesystem, environment, network, process or wall-clock reads. CLI, MCP and CI supply checked port results to the same core. Runtime caches cannot provide authority.

## Ownership and modules

- `contracts.spl`: closed schema identities, state/phase ordering and core value types.
- `gate.spl`: checked evidence validation, scoped waiver and gate evaluation. Every use validates bindings and current expiry; a previous PASS is not a timeless approval.
- `state.spl`: legal transitions, monotonic generation and parent-authoritative admission. An expected generation protects against concurrent/stale commits. No adapter mutates run state on rejection.
- Later trace, doctor, incident and evaluation modules depend on these contracts; they do not fork gate semantics. Adapter integration is gated by executable evidence and schema compatibility.

Start with scalar/array value semantics. Evaluation returns a decision; the authoritative store later commits with compare-and-swap. Filesystem/cryptographic/authorization verification belongs behind explicit owner ports. A `verified` claim supplied in a user request must never be promoted into a checked evidence value by an adapter.

## Gate bindings and semantics

Every candidate receipt names its gate, source revision, policy digest, executable digest, test selector and evidence digest. Reject missing identity, malformed digests, stale revision/policy/executable, future timestamps, expired deadlines and nonzero failures. Exit-zero with zero executed tests is not a test PASS. Red-first acceptance requires observed failures before implementation; `test_ready` additionally requires negative acceptance evidence for hardening.

Waivers bind run/gate/source/policy, authority, reviewer, reason, compensating control, evidence and validity interval. Denied/expired/cross-run waivers fail. Non-applicability requires a policy-owned reason; callers cannot turn a failed result into N/A. Exceptions never silently satisfy a gate.

## Verification and availability

Specs use `step("...")` and real gate/transition results; helper names are `fixture_run`, `fixture_evidence`, `fixture_waiver`. Shared fixtures default to valid explicit identities, and negative cases change one fact. No helper silently passes.

Current host guide explicitly lacks an admitted general pure-Simple SSpec/docgen runner. `bin/simple.exe` is not evidence of one; the inspected stage2 directory contains a rejected artifact. Create executable specs but record TEST_BLOCKED until a qualified producer can execute them. Native compilation evidence, if available, has its own identity and cannot replace SSpec/manual evidence.

## Required later integrations

Read-only doctor confines access before discovery and needs no-follow bounded filesystem ports. Reuse the host Markdown/SDN parsers and link/UID index rather than introducing a second parser. Extend existing loop state/receipts. Generate managed provider adapters from canonical skills and enforce byte/checksum parity. Keep old BDD commands distinct from `lifecycle` dispatch. Obtain resource baselines on actual native tools before imposing performance gates.
