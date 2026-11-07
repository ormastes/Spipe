# Offline debugging manual

Review addition: revocation during actual query or result verification is reflected by the next authorization; later callbacks fail fast if reached, and results cannot escape. Five authored scenarios total; execution NOT_RUN.

Status: AUTHORED / NOT_RUN. This manual has not been generated from an admitted runtime. Source: `test/03_system/app/spipe/feature/lifecycle_operations_offline_spec.spl`.

REQ-004/006/008. Reject unauthenticated offline result. Scenarios deny before debugger/cache lookup, require exact source and dump identities, authenticate results, reject arbitrary commands and mixed scopes, and enforce output limits. The synthetic owner port is contract evidence only after execution; it is never a real debugger invocation.

Expected assertions are authored and unexecuted. Actual local read-only host debugger composition and a qualified runner remain required.
