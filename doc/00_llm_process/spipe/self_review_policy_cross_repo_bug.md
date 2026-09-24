# Cross-Repository Self-Review Policy Contract Bug

Status: claimed by `work/review/local-20260827-003-self-review-policy-schema`

Pinned audit inputs:

- Spipe main: `d5eafa5d9015eb665aaa89135c08f41a7ff80934`
- Simple main: `f5a3471c56db09a49e1a0d25336b241578f7e21f`

The two current `spipe-self-review-policy-db/1` formats are unrelated closed
schemas despite sharing a name. Spipe requires `record_type` and omits header
TTL/authority (`src/review/self_review.js:45-46,94-117`). Simple rejects that
header because it instead requires `max_ttl_seconds` and `authority`
(`src/app/release/self_review_policy.spl:400-413` on the pinned Simple main).
The record formats also disagree on flat versus nested identity, canonical UTC
text versus Unix seconds, first-record hash-chain sentinel, and exact
higher-model receipt versus caller-authorized `self_attested` evidence.

Exact pre-fix reproduction: feeding Simple's documented empty header to
Spipe's parser returns `self-review policy DB header contains unknown fields:
authority, max_ttl_seconds`. Conversely, Simple's closed-header test cannot
accept Spipe's required `record_type` field.

Owner: Spipe owns the canonical wire schema; Simple owns its pure-Simple
consumer. This is a policy-boundary defect, not a compiler, Rust, or runtime
defect. The fix must version the canonical schema, reject both ambiguous v1
shapes, and require authenticated higher-model evidence. No live policy bytes
or authority facts may be inferred during migration.
