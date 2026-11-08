# Incident operations lane contract

Owner: Astra B and one Sol implementer; integration/release owner: root. Applies to REQ-004/006/008 and NFR-001–006. Status: designed; runtime verification NOT_RUN. No production mutation or remote dump export is authorized. Reuse host debugger/dump/release owners; never add a competing process launcher or authority engine.

## Exact public surface

### Internal incident state versus canonical aggregate

`IncidentV1.schema` is `spipe-incident-state/1`: an internal transition candidate, not the canonical `spipe-incident/1` aggregate/wire manifest in `schemas/lifecycle/incident.sdn`. No canonical serialization adapter is implemented because required aggregate data is absent. Never pass this candidate to the canonical incident reader or relabel its discriminator.

| Canonical field | Candidate mapping or missing requirement |
| --- | --- |
| schema | Requires separately constructed `spipe-incident/1` aggregate; no direct candidate cast |
| incident_uid | `incident_id`, subject to trusted stable UID policy |
| authority_scope | `scope_id` |
| source_revision | `run.source_revision`; historical revisions retained by parent |
| severity | Same P0/P1/P2/P3 vocabulary |
| state | Explicit aggregate policy required: canonical acquired/analyzing/fixing/recovering differ from internal analyzed/fixed/prevented/recovered; no invented equivalence |
| owner | Missing authenticated aggregate owner |
| confidentiality | Missing aggregate classification; scope and dump access class do not imply it |
| affected_versions | Missing verified affected-version list |
| timeline | Requires canonical immutable event blob encoding, actual hashes and durable blob storage; event arrays/digests cannot be directly substituted |
| dump_manifests | Missing categorized authenticated canonical dump-manifest blob digests |
| hypothesis_evidence | Missing categorized authenticated hypothesis evidence digests |
| reproduction_evidence | Missing categorized authenticated reproduction evidence digests |
| prevention_evidence | Missing categorized authenticated prevention evidence digests |
| recovery_evidence | Missing categorized authenticated recovery evidence digests |
| lesson_uid | Optional aggregate lesson reference, not present in candidate |

The root aggregate adapter must obtain missing owner/classification/versions/evidence categories from authorized owners, apply explicit aggregate state policy and encode/hash retained timeline blobs through canonical owners. Candidate gate receipts alone do not supply this full data. Required descriptor fields remain unchanged; this gap is an integration blocker rather than an empty/default-filled aggregate success.

Modules under `src/lifecycle/operations/`: `contracts.spl`, `incident.spl`, `dump.spl`, `offline.spl`. Every cross-file value/type/function is public. Existing `lifecycle.contracts` and `lifecycle.gate.evaluate_lifecycle_gate` remain canonical for evidence authentication. Sol must inspect the exact existing gate function name before importing.

`IncidentV1`: schema, incident_id, scope_id, run (`LifecycleRunV1`), severity, state, generation, timeline (`[IncidentEventV1]`). Event: event_id, kind, occurred_at_ms, evidence_sha256, summary. Severity is P0/P1/P2/P3; state is detected/triaged/contained/analyzed/reproduced/fixed/prevented/recovered/closed. Timeline append is bounded, unique, monotonic, and immutable. Emergency containment from detected is permitted only with checked containment evidence; subsequent triage is still required before analysis.

`IncidentActionV1`: event, target_state, expected_generation, requirements (`[GateRequirementV1]`), evidence (`[GateEvidenceV1]`). All evidence binds exact run, source revision, policy, executable, selector, input and run generation through existing gate evaluation. Phase requirements must be authorized as a complete set, not selected by the caller. No waiver-based incident success.

`IncidentAuthorityV1` methods: `authorize_incident(self, scope_id: text, incident_id: text, action: text) -> bool`; `authorize_action(self, incident: IncidentV1, action: IncidentActionV1) -> bool`. Trusted composition combines this with `LifecycleAuthorityV1`; request booleans are not authority. Authorize before inspecting event content or invoking evidence providers. Parent owns durable CAS; lane functions return candidates only and cannot claim persistence.

Public functions: `create_incident(scope_id: text, incident_id: text, severity: text, run: LifecycleRunV1, authority: IncidentAuthorityV1) -> Result<IncidentV1, text>`; `advance_incident(incident: IncidentV1, action: IncidentActionV1, now_ms: i64, authority: IncidentAuthorityV1, gate_authority: LifecycleAuthorityV1) -> Result<IncidentV1, text>`.

`DumpManifestV1`: schema, dump_id, incident_id, scope_id, source_revision, content_sha256, byte_length, access_class, format, collected_at_ms, collection_loss, redaction_state. No private path or raw memory in public manifest. access_class restricted/sanitized; redaction does not grant authority. `DumpSliceV1`: dump_id, offset, bytes (`[u8]`), content_sha256. `DumpOwnerPortV1`: `authorize_dump(self, scope_id: text, incident_id: text, dump_id: text, operation: text) -> bool`; `catalog(self, scope_id: text, incident_id: text, maximum_items: i64) -> Result<[DumpManifestV1], text>`; `read_slice(self, manifest: DumpManifestV1, offset: i64, maximum_bytes: i64) -> Result<DumpSliceV1, text>`; `verify_manifest(self, manifest: DumpManifestV1) -> bool`. `catalog_dumps(scope_id: text, incident_id: text, maximum_items: i64, port: DumpOwnerPortV1) -> Result<[DumpManifestV1], text>` and `load_dump_slice(manifest: DumpManifestV1, offset: i64, maximum_bytes: i64, port: DumpOwnerPortV1) -> Result<DumpSliceV1, text>` authorize catalog/read before provider/cache access, validate all identities and sizes, and rehash returned bytes. Catalog authorization uses empty dump_id plus operation catalog; read uses exact dump_id and operation read. No export operation exists.

`OfflineDebugRequestV1`: incident_id, scope_id, manifest, query, maximum_bytes. `OfflineDebugResultV1`: source_revision, dump_sha256, adapter_id, evidence_sha256, summary. `OfflineDebugPortV1`: `authorize_query(self, request: OfflineDebugRequestV1) -> bool`; `query(self, request: OfflineDebugRequestV1) -> Result<OfflineDebugResultV1, text>`; `verify_result(self, request: OfflineDebugRequestV1, result: OfflineDebugResultV1) -> bool`. `query_offline_dump(request: OfflineDebugRequestV1, port: OfflineDebugPortV1) -> Result<OfflineDebugResultV1, text>` enforces read-only local operation and authenticates result. This interface is an integration boundary, not an executable host adapter. If a compatible host offline capability exists, implement a thin composition adapter without duplicating its logic; otherwise record its exact missing composition.

## Error and evidence semantics

## Local retained composition continuation

Canonical dump/catalog/offline boundaries reauthorize around protected owner callbacks and after verification before releasing results. Revocation discovered after callbacks returns `unauthorized_dump_scope` and must prevent subsequent provider/cache operations even when a callback returned a previously valid value. Test-only mutable shared revocation state models authority changes across value-semantic adapter copies; no such global authority mechanism is used in production.

`local_owner.spl` adds `LocalDumpGrantV1`, `LocalDumpGrantAuthorityV1`, `LocalDumpOwnerV1`, `LocalOfflineSummaryOwnerV1`, and `load_local_dump_slice`. The trusted grant binds schema, private retained root, one ASCII leaf, exact manifest, debug session, collector ID/digest, collection digest and issue/expiry. Manifest now additionally carries executable SHA-256 and collection SHA-256. Grant authority supplies a fresh trusted clock per operation and authenticates the entire grant, including session-to-executable binding and source/collection provenance. It is supplied only by trusted host composition, never deserialized from a request. Existing incident scope authority runs before grant/clock/debug discovery; existing central debug Inspect/Passive authorization runs before any retained file owner. Every public port method reauthorizes. No session accessor is assumed.

Retained-directory opener and retained-file bounded read/close are reused directly. Directory/file handles are closed after successful or failed reads; failed open closes the directory. Fresh whole-object rehash establishes immutable membership. `verify_slice` performs another fresh whole-object read rather than trusting a returned range digest. Canonical slice load therefore reads at most two MiB with no cache, path fallback, live acquisition or remote export. Linux-only retained-directory capability failures propagate verbatim (`SCVDB_DIR_HOST_UNSUPPORTED` elsewhere); no OS branches are added here. Host `RetainedFile.close` is currently private and root must export it before compilation can qualify this composition.

Offline local adapter supports metadata `summary` only: verified source/build/collection/size/hash, no payload or invented frames. Threads/backtrace/modules return `unsupported_offline_adapter`. It reuses the same read owner and performs two bounded whole reads for query/result authentication, at most two MiB; this is a structural cap, not measured latency evidence. Actual stack-decoder capability remains absent.

Benign synthetic SDN fixture is 148 bytes, SHA-256 `89e2cbbacd3e31b817a630597f7950091088a8edcc77ff17b6886481048874ba`, measured on authored bytes. It is distinct from historical incident artifacts. Trusted test composition uses existing `std.nogc_sync_mut.io_runtime.cwd()` plus `/test/fixture/lifecycle`; launch tests from repository root on a host whose retained-directory owner admits that root. No environment read, shell or source edit is needed. An unsupported host produces TEST_BLOCKED, never a passing empty result. No admitted runtime/host fixture execution is claimed. After closing retained handles, scope/grant/session are reauthorized before returning bytes or recording success, so mid-read expiry/revocation fails closed. Directory close failures also fail closed when file opening fails.

Review correction: `rebind_incident_run(incident: IncidentV1, next_run: LifecycleRunV1, expected_generation: i64, authority: IncidentAuthorityV1) -> Result<IncidentV1, text>` permits a fixed source revision after reproduction. `IncidentAuthorityV1.authorize_run_rebind(self, incident: IncidentV1, next_run: LifecycleRunV1) -> bool` authenticates both snapshots after scope authorization. Rebind requires state reproduced, valid old/new runs, same run ID and policy, increasing run generation, changed source revision and matching incident generation; it preserves timeline and increments incident generation. Root durable history must retain both snapshots. This is a candidate, not a persistence receipt.

Phase enforcement: reproduced requires executed red positive/adversarial failures; fixed/prevented/recovered/closed require passing positive/adversarial cases. No N/A or waivers are accepted. `authorize_action` checks the complete phase policy and original snapshot/timeline, including observation-window and persistent-state recovery policy. Requirements retain core lifecycle target-state vocabulary; phase authorization binds their exact complete set rather than sending incident states to the core gate.

Slice authentication correction: `DumpOwnerPortV1.verify_slice(self, manifest: DumpManifestV1, slice: DumpSliceV1) -> bool` must authenticate membership in the exact immutable manifest object. Rehashing a slice against its own returned digest detects corruption but cannot prove membership in a larger dump. The owner must verify the source object or an authenticated range proof. Catalog cap 64 and slice cap 1 MiB are structural safety ceilings, not measured performance thresholds. Offline query vocabulary is closed to summary/threads/backtrace/modules; owner authorization must authenticate the manifest and restrict execution to local read-only analysis.

Return stable `Err(text)` codes: unauthorized_incident_scope, unauthorized_incident_action, stale_incident_generation, invalid_incident_transition, invalid_incident_event, invalid_incident_severity, missing_incident_requirements, incident_gate_failed:<reason>, unauthorized_dump_scope, invalid_dump_manifest, dump_scope_mismatch, dump_quota_exceeded, dump_digest_mismatch, unsupported_offline_adapter, offline_result_mismatch. Invalid schemas, timestamps, quotas, duplicate events, unauthenticated manifests/results and unexpected bytes fail closed. Never return empty success to represent absent tools. No guessed SHA or author-provided signature is trusted.

## Test/manual contract

Files: `test/03_system/app/spipe/feature/lifecycle_operations_{fixtures,incident_spec,dump_spec,offline_spec}.spl`; manual counterparts under `doc/06_spec/03_system/app/spipe/feature/`. Helpers: `fixture_operations_incident`, `fixture_operations_event`, `fixture_operations_action`, `fixture_operations_manifest`, `fixture_operations_dump_port`, `fixture_operations_incident_authority`, `fixture_operations_debug_port`. Reuse root fixture_run/fixture_requirement/fixture_evidence. Manual actions are `step("Authorize incident scope")`, `step("Advance checked incident evidence")`, `step("Reject stale incident generation")`, `step("Deny dump discovery before owner lookup")`, `step("Read bounded authorized dump slice")`, `step("Reject unauthenticated offline result")`. Authorization-order negatives use fail-fast provider methods so any forbidden lookup fails the test. Positive and negative assertions verify real outputs, not counters disconnected from execution.

Recovery requires authenticated executed positive and adversarial evidence and an observation-window/persistent-state policy selected by the trusted host. Domain code must not claim actual production recovery from invented receipts. Historical pilot must use real existing incident artifacts, qualified tools and exact source/tool hashes. Record TEST_BLOCKED when unavailable; mocks prove contract behavior only after execution, never a historical pilot. Lane report: `doc/09_report/spipe_lifecycle_operations.md`.
