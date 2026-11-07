# Retained local dump composition manual

Grant-binding negative assertions use a live valid debug session and first establish original authorization. Each changed source/build/collector/collection/session/leaf/scope/expiry value is isolated; both opened sessions are closed. This avoids denials caused only by an unrelated absent session. Execution remains NOT_RUN.

Status: AUTHORED / NOT_RUN. Source: `test/03_system/app/spipe/feature/lifecycle_operations_local_spec.spl`. Seven authored scenarios; zero executed. REQ-004/006/008.

Actions: deny dump discovery before owner lookup; read bounded authorized dump slice; reject unauthenticated offline result. Scenarios cover denied scope before private clock/grant/debug/root, closed sessions before nonexistent roots, exact manifest/build binding, cross-scope and malformed leaf rejection, expiry, real retained benign fixture read, stale real bytes/hash rejection, quotas and summary-only offline metadata. Unsupported stack queries must not open a root or fabricate frames.

Launch tests from repository root. Trusted fixture composition uses existing `std.nogc_sync_mut.io_runtime.cwd()` plus `/test/fixture/lifecycle`; Linux execution requires that actual root to satisfy retained-directory owner policy. Unsupported capability, missing fixture/root or private host close symbol are TEST_BLOCKED failures, never successful skipped cases. Expected digest: `89e2cbbacd3e31b817a630597f7950091088a8edcc77ff17b6886481048874ba`. Fixture bytes are public synthetic SDN and contain no memory dump. Scope/grant/debug authorization is repeated after closing read handles before bytes are released; mid-read revocation testing remains NOT_RUN.

Host `RetainedFile.close` must become public before admitted compilation. Qualified runner, compilation, execution, handle-leak validation, generated manual, historical incident pilot and measured latency remain unavailable. Per canonical slice or metadata-summary operation, at most two fresh whole reads of at most one MiB each are structurally permitted. No performance PASS is claimed.
