# Knowledge owner curation

Status: AUTHORED / NOT_RUN. Manual counterpart of `test/03_system/app/spipe/feature/lifecycle_learning_claims_spec.spl`; not generated runtime evidence.

REQ-005 / REQ-008. Authorize the knowledge scope before reading claims or verifying reviews. A denied fixture owner asserts if any discovery or protected callback is invoked. Review and archive a duplicate claim by delegating a content-bound review and unchanged origin to the CAS owner. Stale content, rejected CAS and unauthenticated reviews must fail.

Retrieve active claims: retain only active, same-scope, non-alias records; exclude archived, superseded and needs-review records. Alias targets must be uniquely present, active, same-scope and have no canonical target. Reject self aliases, chained aliases and cross-scope targets. Domain does not create another wiki authority; trusted composition owns atomic persistence, provenance preservation and revocation.

Alias commit passes the complete checked target into the atomic source-and-target CAS. The concurrent-target-change fixture rejects a simulated target archive/alias between lookup and commit; the positive fixture asserts complete target delivery. A real writer must compare both records and revalidate target state in one transaction.

No private discovery or writes to an actual knowledge store were executed. Production owner integration, generated-manual review and admitted runner evidence remain required.
