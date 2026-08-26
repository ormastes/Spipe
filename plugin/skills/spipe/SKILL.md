---
name: spipe
description: Write executable SPipe BDD specifications with real assertions and traceable evidence.
---

# SPipe

Write executable `*_spec.spl` scenarios under the host test tree and keep
generated/manual Markdown outside executable test paths. Use `describe`,
`context`, `it`, setup/teardown hooks, and built-in matchers. Every scenario
must exercise real behavior; reject placeholder passes, empty bodies, and
unimplemented steps. Trace requirement IDs to scenarios and regenerate the
human-readable manual from the admitted executable specification.

For repo, pull-request, session, or feature review requests, use the packaged
`spipe_review_request_create` planning tool. Never supply or trust a caller head
SHA. A PASS claim requires `spipe_review_admission_validate` with a configured
dedicated broker that re-resolves the live head/check set and matches its pinned
integration identity.
