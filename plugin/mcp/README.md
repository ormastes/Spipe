# MCP

`server.js` is a dependency-free stdio JSON-RPC MCP server for SPipe docs and
experts.

Tools:

- `spipe_info`
- `spipe_experts`
- `spipe_read_doc`
- `spipe_fine_tune_guide`
- `spipe_fine_tune_model_guide`
- `spipe_fine_tune_template`
- `spipe_release_guide`
- `spipe_release_capabilities`
- `spipe_release_version_check`
- `spipe_release_session_plan`
- `spipe_release_main_fix_discovery_plan`
- `spipe_release_beta_backport_plan`
- `spipe_release_forward_port_plan`
- `spipe_release_candidate_plan`
- `spipe_release_promotion_plan`
- `spipe_release_withdrawal_plan`
- `spipe_review_request_create`
- `spipe_review_admission_validate`
- `spipe_review_capabilities`
- `spipe_self_review_privilege_evaluate`
- `spipe_self_review_approve`
- `spipe_self_review_guide`

The beta-backport tools support only exact patch-equivalent cherry-picks.
Adapted backports fail closed as unsupported until an authenticated
adaptation-review broker is configured and exposed by the shipped MCP server.

Release planners are read-only inspection surfaces. Token-gated session
start/sync are the narrow exception: they fetch, create, or rebase only a
verified owned local worktree/branch. No tool grants authority to update a
protected ref, sign a tag, or publish a release.
Main-fix discovery consumes an immutable caller-supplied snapshot, reports
reviewed bug-fix candidates, and still requires the caller to select an exact
commit. Forward-port validation produces an isolated-main integration plan for
approved release-first fixes; it never pushes `main`.
Withdrawal planning preserves published tags, assets, artifacts, and history;
corrections always use a distinct replacement version.

Review request creation is also non-mutating and never accepts caller head
authority. Review admission requires a configured dedicated broker, pinned
integration identity, live provider head/check resolution, and an unexpired
audit receipt. Without that authority the admission tool fails closed.
The MCP process and its broker environment must be launched and owned by the
operator; exposing broker command or integration-ID environment configuration
to request callers invalidates this trust boundary. The CLI never consumes
those environment values as admission authority.

Use `spipe_self_review_guide` for agent searches such as `self approve`,
`approve PR`, or `author cannot approve`. Its output names the required
high/xhigh exact-head review, zero P0/P1 record, protected workflow inputs, and
exact-head status poll.

GitHub forbids a pull-request author from submitting an `APPROVED` review on
their own PR. Scoped self-review instead emits a distinct required status check
and also requires an operator-owned JSONL DB configured by the
MCP process as `SPIPE_SELF_REVIEW_POLICY_DB`. Callers cannot supply a head or
diff. The separately mounted `SPIPE_SELF_REVIEW_POLICY_TRUST` must pin the exact
authority, Ed25519 public key, and whole-database SHA-256; database-embedded
trust is never accepted. The approval-named tool emits the exact-head `SPipe Self Review Admission`
check through the pinned broker; it never submits a provider PR approval. The
broker must bind the session/request and base repository/ref/SHA, merge base,
and diff digest on both resolution and admission re-resolution. It must also
prove the exact target repository/ref is protected by the same provider
ruleset with strict up-to-date required-status enforcement. The request carries
current user-authorization actor/timestamp/receipt evidence and the broker must
authenticate it. Ordinary code/text is default-eligible while operator
deny/constrain and fixed authority restrictions win. Admission repeats the
expiry and requires registered fail-closed check invalidation on bound-input
change or expiry. Missing proof, changed head/base/diff/ruleset/policy/receipt,
retargeting, or expiry fails closed. Policy denials return exact `reason_code`,
affected paths, and `remediation`.

Resource:

- `spipe://skill`
