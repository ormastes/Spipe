# Historical incident pilot preparation

Status: TEST_BLOCKED; execution NOT_RUN. This is source/evidence discovery, not a passing pilot or current measurement of the historical failure.

Selected real report: Simple `doc/09_report/bootstrap_crash_report_2026_04_01.md`, read at repository HEAD `27e65c2437195700bdbf6f9429ba1b52b0972f2b`. File SHA-256 measured with PowerShell Get-FileHash: `f9557f86474cf9de5dc3c76c510a2a41fbdd3a7d9341e4648fbef3bea5873d76`. The report describes Stage 2 exit 137, 124397660 KiB peak RSS, missing entry-closure propagation, stale runtime archive, and leaked LLVM contexts. These are historical claims; none was reproduced by this lane. Severity was not assigned in the source and is not invented here.

The report's verification prose does not supply an authenticated current receipt, exact original executable/source digest, raw dump manifest, or recovery observation window. Its historical seed-based commands are not admitted feature tooling. Consequently we did not replay the OOM, export memory, attach to a process or synthesize recovery evidence. The machine-readable preparation is `test/fixture/lifecycle/lifecycle_operations_historical_pilot.sdn`; it intentionally cannot serve as successful incident evidence.

## Host owner integration findings

- `src/lib/common/debug/service_v1.spl`: central debug authority already exposes Inspect/Passive authorization and outcome receipts. A host composition must reuse this owner and additionally authorize lifecycle scope before lookup.
- `src/app/debug/browser/offline_provenance_v1.spl`: validates browser metadata provenance through that authority; it does not read raw dumps and cannot be advertised as a dump adapter.
- `src/lib/nogc_sync_mut/mem/dump.spl`: generates live TSV heap/owner/RSS snapshots and can install signal handlers. It is an acquisition/writer owner, not an authenticated restricted file reader; no live acquisition was invoked.
- `src/app/debug/replay/replay_backend.spl`: delegates process replay and reverse execution to ProcessReplayer. Replaying is a separate execution capability and is not implicitly authorized by offline read access.

Root owns retained-file and debug-service composition. The lane's read/query ports preserve this boundary rather than duplicating permission logic or invoking arbitrary debugger commands. Missing restricted reader composition and runtime admission remain explicit blockers to M4/M6. Next valid pilot step is an admitted bounded read of authorized historical logs/snapshots followed by executed reproduction/prevention/recovery contracts with actual receipts.
