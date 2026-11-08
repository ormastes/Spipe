# Incident operations manual

Schema boundary: tested `IncidentV1` uses internal `spipe-incident-state/1`; it is not the canonical `spipe-incident/1` aggregate/wire manifest. The canonical aggregate adapter remains unavailable: authenticated owner/confidentiality/affected versions, categorized evidence and dump-manifest digests, canonical timeline event blob encoding/hash/storage and explicit aggregate state policy are missing. Internal analyzed/fixed/prevented/recovered do not directly match canonical acquired/analyzing/fixing/recovering. The lane design contains the exact field mapping table; no canonical aggregate coverage is claimed by these state-machine scenarios.

Status: AUTHORED / NOT_RUN. This manual has not been generated from an admitted runtime. Source: `test/03_system/app/spipe/feature/lifecycle_operations_incident_spec.spl`.

REQ-004/006/008. Authorize incident scope; advance checked incident evidence; reject stale incident generation. The executable scenarios cover the complete triage/contain/analyze/reproduce/fix/prevent/recover/close sequence, exact source-revision rebind, original timeline preservation, severity/schema rejection, authorization ordering, caller-selected policy rejection, unauthenticated receipts, event digest mismatch, duplicate events, emergency containment and forged recovery. Fixtures authenticate synthetic contract values only. Production recovery observation and durable CAS require host composition.

Expected assertions are authored and unexecuted. No red/green, coverage or historical pilot success is claimed.
