# Workflow and checked trace scenarios

Manual source; NOT_RUN and not generated execution evidence. Executable source:
`test/03_system/app/spipe/feature/lifecycle_workflow_store_spec.spl` and
`lifecycle_workflow_trace_spec.spl`. Test fixture storage is memory only.

| Action | Required observation |
| --- | --- |
| authorize workflow access | Denied scope returns unauthorized before unavailable/malformed private data is inspected. |
| commit checked transition | Exact authenticated positive/negative red evidence advances generation and publishes receipt with state. Conflict or persist failure leaves both unchanged. |
| reject stale or replayed receipt | Old generation, wrong source, reused identity and commit-time expiry return precise failure. |
| query checked trace in both directions | Same stable edge ID/endpoints returned forward and reverse; unverified context or links fail. |
| invalidate changed dependencies | Complete host closure includes changed UID and transitive owners; duplicates and bounds reject; incomplete classifier requires full rebuild. |
| explain blocked next phase | Missing receipts yield not_run decision; exceptional states require explicit recovery policy. |

REQ-001/003/006/008/010 map to trace scenarios; REQ-002/003/006/008 map to
transaction scenarios. Run against root's admitted runtime only. Record actual
producer hash, selector, case count and platform before claiming evidence.

Additional executable sources: `lifecycle_workflow_bundle_spec.spl` and
`lifecycle_workflow_release_spec.spl`, with exact-value release fixtures in
`lifecycle_workflow_release_fixtures.spl`. Bundle assertions retain full receipt
and waiver fields, reject unknown fields/noncanonical input/generation regression
and malformed predecessor identity, and isolate hashed local ref identities.
Companion assertions cover the entire requirement→criterion→acceptance test→
symbol→observation→evidence chain, authenticated build/release identity,
both query directions, denied scope, wrong revision/forged release, unrelated
evidence, missing edge and quota rejection. All are NOT_RUN.

Real Git integration remains NOT_RUN and cannot use the in-memory fixture as
durability evidence. Root's admitted fixture must authorize pinned Git and an
isolated metadata cwd with qualified fsync/storage/exact environment; initialize
create-only; round-trip full bundles; reject stale concurrent CAS; retain history
through GC; preserve old state after prepublication failures; reconcile CAS/ack
uncertainty by exact identities; and retain/recover pending process cleanup.
Crash/restart/expiry and unsupported-provider negatives require real host
execution. Missing admitted fixture/runtime is TEST_BLOCKED, never a zero-case
or artificial PASS.
