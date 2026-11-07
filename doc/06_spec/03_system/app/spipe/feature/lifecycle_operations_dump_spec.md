# Restricted dump manual

Review addition: callback-controlled revocation during catalog, manifest authentication, slice read or slice authentication must stop later protected callbacks and prevent result release with `unauthorized_dump_scope`. Six authored scenarios total; execution NOT_RUN.

Status: AUTHORED / NOT_RUN. This manual has not been generated from an admitted runtime. Source: `test/03_system/app/spipe/feature/lifecycle_operations_dump_spec.spl`.

REQ-004/006/008. Deny dump discovery before owner lookup; read bounded authorized dump slice. Scenarios use fail-fast denied catalog/read/cache providers, check exact returned bytes, reject scope/schema/authentication mismatches, rehash slices, authenticate partial-slice membership, reject unexpected bytes and enforce bounds before provider access. No memory is exported and no real debugger or confidential dump is opened by these fixtures.

Expected assertions are authored and unexecuted. Restricted immutable host dump composition remains required.
