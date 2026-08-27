# SPipe Review Admission

SPipe exposes a non-mutating request and a fail-closed admission validator for
repository, pull-request, isolated-session, and feature reviews.

`review-request-create` accepts a closed `spipe-review-request/1` object. It
contains the repository, exactly one optional PR/session/feature selector, the
canonical required-check identities, review mode, and request identity. It
must not contain `head_sha`: the dedicated verifier broker resolves the live
head from provider-owned state.

`review-admission-validate` accepts a closed `spipe-review-admission/1`
receipt. Independent receipts record the high-capability verifier identity,
provider, model, service tier, effort, verdict, findings, exact head and checks,
audit and review digests, and issue/expiry times. Owner fallback is a distinct
mode, requires the pinned owner plus an independently issued unavailability
receipt, carries no review findings, and can never masquerade as an independent
review. Independent admission requires a PASS verdict and no P0/P1 findings.
The broker response and admitted output repeat the mode-specific verifier or
fallback evidence so the two modes remain mechanically distinguishable.

Admission requires both `SPIPE_REVIEW_BROKER_COMMAND` and
`SPIPE_REVIEW_BROKER_INTEGRATION_ID`. SPipe invokes that executable without a
shell. The broker must authenticate the receipt, re-resolve the repository/PR/
session/feature head, return the canonical required checks, and match the
pinned integration ID. Missing broker configuration, a changed head/check set,
an invalid audit receipt, an expired receipt, or an open P0/P1 finding on a
PASS verdict rejects. Only the broker may emit the `SPipe Review Admission`
status context. A repository owner or administrator cannot self-post PASS.
These variables are authoritative only in an operator-owned MCP server process;
they must not be caller-writable. The CLI deliberately ignores them and performs
shape/time planning only, returning `admitted: false` and `authoritative: false`.

Both commands return `mutation: none`. They do not create reviews, statuses,
checks, branches, commits, tags, releases, or package publications. Existing
release and npm environment approvals remain separate and mandatory.

## Scoped self-review admission

Self-review is a separate, explicit path. GitHub states that pull-request
authors cannot approve their own pull requests; an author-side `APPROVED`
review is therefore not an available action. See
[GitHub's required-review documentation](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews).
Do not retry `gh pr review --approve`, report a fabricated approval, or treat a
comment as an approval.

SPipe never masquerades as an independent review and never submits a provider
pull-request approval. Instead, an operator-owned MCP server asks its pinned
broker to emit the distinct required `SPipe Self Review Admission` check on one
exact pull-request head. This is a short-lived scoped status gate, not a GitHub
review event; successful output says `mutation: provider_status_check` and has
no provider review ID.

### Authorization and default policy

Default allow means *eligible after review*, not *authorized to run
automatically*. The closed request must contain `user_authorization_actor`,
`user_authorization_receipt_digest`, and canonical `user_authorized_at`. The
authorization must be current and no more than 24 hours old. The broker must
authenticate and repeat all three fields; prose in a prompt, absence of an
operator deny record, or a caller-set boolean is not authorization evidence.

After authorization, ordinary reviewed code/text is default-eligible only when
the authenticated exact-head higher-model review is PASS with zero P0/P1.
Operator policy can deny the subject outright or constrain eligible paths;
fixed secret and self-review-authority restrictions always win. An operator
grant cannot weaken the higher-model review or fixed restrictions, and a user
request cannot override operator policy.

The caller submits `spipe-self-review-request/2` with repository/PR/session,
the exact reviewer provider and model, an authenticated higher-model review
receipt digest, and the explicit user-authorization evidence above. It has no
head or diff fields. The broker resolves the live
repository identity, head, blob/mode-aware changed-path manifest, and receipt.
The result expires within 24 hours and SPipe recomputes its canonical manifest
digest. Resolution and admission repeat the session and request IDs, base
repository ID/ref/SHA, merge-base SHA, and diff digest; any replay, retarget,
base movement, or merge-base/diff mismatch denies the check.

Schema v2 makes user-authorization evidence and broker-registered status
invalidation mandatory. V1 requests/admissions do not carry those guarantees
and are rejected rather than silently upgraded.

Policy is an operator-owned UTF-8 JSONL database selected only by the MCP
process's `SPIPE_SELF_REVIEW_POLICY_DB`. Its first record is:

```json
{"schema":"spipe-self-review-policy-db/1","record_type":"header","default_allow":true}
```

Signed, hash-chained subject records have effect `deny` or `constrain`. Empty
repository/session/reviewer selectors are wildcards. A matching deny always
wins. A constrain narrows default allow. Multiple file scopes form an exact
file set. Rename evaluates old and new paths, copy the new path, and delete the
old path. Absolute, traversal, non-canonical Unicode, symbolic-link, submodule,
and malformed entries fail closed.

| Scope | Matches |
|---|---|
| `code` | A path whose extension is not a recognized text-document extension. |
| `text` | `.adoc`, `.md`, `.markdown`, `.rst`, `.text`, and `.txt`. |
| `file` | One exact repository-relative file. |
| `directory_files` | Files immediately inside one directory, not descendants. |
| `directory_recursive` | Descendants below one directory. |

Default allow cannot override fixed secret-material or self-review-policy-DB
restrictions. Broker semantic classification fails closed for
`credentials_or_secrets`, `live_ruleset_or_environment_policy`,
`signing_or_publish_authority`, `review_approval_policy_or_workflow`, and
`self_review_authority`, so ordinary filenames or renames cannot evade the
gate. Review policy/workflow source remains reviewable only when the broker does
not classify its content as live approval authority; editing source supplies no
authority because the governing policy and broker identity are external.

### Tool results and remediation

`spipe_self_review_privilege_evaluate` is non-mutating. On allow,
`spipe_self_review_approve` makes the broker re-resolve the exact head/manifest
and emit `SPipe Self Review Admission`; despite the compatibility name, it does
not submit a PR approval. The admission command and result repeat the user
authorization evidence and exact decision expiry. The broker result must set
`invalidation_registered: true`, `invalidation_at` equal to `expires_at`, and
`invalidation_mode` to
`broker_rechecks_bound_inputs_and_fails_check_on_change_or_expiry`. Missing
broker identity, authorization/policy authentication, receipt binding, digest
parity, unchanged-head proof, or invalidation registration denies admission.
The audit digest binds all inputs, expiry, matched policies, fixed restrictions,
the decision, and its reason code.

Every policy decision returns `reason_code`, human-readable `reason`, and
`remediation`, plus matched policy/restriction IDs and per-path results. An LLM
must report those exact fields rather than collapsing them to "approval
failed":

| `reason_code` | Exact meaning | Required remediation |
|---|---|---|
| `default_allow_exact_review` | Ordinary reviewed code/text passed and no policy or fixed restriction matched. | If user authorization remains active, request the SPipe admission check. |
| `fixed_restriction` | A path matched a fixed secret or self-review-authority restriction. | Use an independent reviewer or isolate the restricted change in a separately reviewed PR; never weaken the restriction. |
| `subject_denied` | Active operator policy denies this repository/session/reviewer. | Use an independent reviewer, or obtain a new explicit operator policy before a fresh evaluation. |
| `path_denied` | An operator deny scope matched a changed path. | Use an independent reviewer, split the denied paths, or obtain a new explicit scope. |
| `constraint_not_satisfied` | A changed path is outside an active allow constraint. | Use an independent reviewer, narrow the PR, or obtain a new explicit scope, then evaluate again. |

Precondition failures such as an unconfigured broker/policy DB, failed or
expired higher-model receipt, invalid manifest, unprotected target, or missing
strict-status policy are fail-closed errors rather than policy decisions. The
caller must report the tool's exact error and repair that named precondition;
it must not reinterpret the error as an allow.

### Ruleset binding and invalidation

The protected-branch ruleset for this mode requires the exact
`SPipe Self Review Admission` check, sets provider approving-review count to
zero, does not require a provider approval after the last push, and enables
strict up-to-date required-status enforcement. The broker must attest
`protected_target: true`, `strict_up_to_date: true`, and the exact target
repository ID, ref, and provider ruleset ID during evaluation, then re-resolve
and repeat them when emitting the check. A generic provider that cannot prove
all of those facts is denied.

For GitHub `main`, movement of the protected base blocks integration even when
the PR head SHA is unchanged. The branch must update against the new base and
obtain a new exact-head review, decision, and admission check. Retargeting the
PR away from the governed repository/ref loses the applicable ruleset and is
denied. The workflow is request-only and cannot accept caller-supplied SHA,
diff, target/ruleset attestation, broker command, integration identity, or
policy DB path.

Any new head commit, base or merge-base movement, changed diff, PR retarget,
ruleset replacement, policy-DB digest change, higher-model or user-authorization
receipt change, or expiry invalidates the old decision/check. The broker
resolution may live for at most 24 hours and may choose a shorter lifetime.
The registered broker invalidator must recheck bound inputs and update its check
to failure when they change or when `invalidation_at` is reached; a successful
provider check is not treated as fresh merely because it remains visible. After
invalidation, obtain fresh authorization and exact-head review, evaluate policy
again, and emit a new check; never reuse the previous receipt or check run.
