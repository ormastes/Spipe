# CLI

`spipe.js` is a dependency-free Node CLI for inspecting and validating the
SPipe module.

Examples:

```sh
node cli/spipe.js info
node cli/spipe.js experts
node cli/spipe.js doc-root ../..
node cli/spipe.js link-plan ../..
node cli/spipe.js doctor ../..
node cli/spipe.js skill
node cli/spipe.js release-guide
node cli/spipe.js release-capabilities
node cli/spipe.js release-version-check
node cli/spipe.js review-request-create '<json>'
node cli/spipe.js review-admission-validate '<json>'
node cli/spipe.js self-review-guide
```

Release planners are read-only. Token-gated `release-session-start` and
`release-session-sync` are the narrow local-mutation exception: they fetch,
create, or rebase only an exact-state owned worktree/branch, while
`release-session-status` proves its live Git state. `release-guide` prints the
canonical protected-release process, `release-capabilities` prints the policy
schema and supported boundaries, and `release-version-check` verifies the sole
version authority and every declared package/plugin projection. Protected-ref
or provider mutation still requires separate authority and explicit approval.

The guarded operational commands each accept exactly one JSON object:
`release-session-plan`, `release-session-start`, `release-session-status`,
`release-session-sync`, `release-main-fix-discovery-plan`,
`release-beta-backport-plan`, `release-forward-port-plan`,
`release-candidate-plan`, `release-promotion-plan`, and
`release-withdrawal-plan`. Planners validate and hash evidence; session
operations never cherry-pick, build, tag, push a protected ref, delete,
overwrite, or publish.

Beta-backport commands accept only an exact patch-equivalent cherry-pick:
`adaptation_reason` must be `none`, and the verified command requires an empty
adaptation receipt. Adapted backports return unsupported until an authenticated
adaptation-review broker is configured and exposed by the shipped surface.

Review requests cover repo/PR/session/feature scopes and reject caller-supplied
head SHAs. CLI admission validation is explicitly non-authoritative: it checks
the closed receipt shape and lifetime but always returns `admitted: false` and
ignores caller-controlled broker environment values. Authoritative validation
belongs only to an operator-owned MCP server whose dedicated broker re-resolves
the live head and exact check set before PASS is accepted.
`self-review-request-plan` validates only a headless scoped request. CLI output
is never an admission decision and cannot emit `SPipe Self Review Admission`.
`self-review-guide` explains that GitHub authors cannot `APPROVE` their own PRs,
that ordinary code/text is only default-eligible after current explicit
authorization evidence, and how operator scopes, broker-registered status
invalidation, exact rejection reasons, and remediation work.
It is the canonical discovery command for `self approve`, `approve PR`, and
`author cannot approve`, and prints the exact-head review, protected dispatch,
and exact-head check polling steps.

Fine-tune process examples:

```sh
node cli/spipe.js fine-tune-guide
node cli/spipe.js fine-tune-init
node cli/spipe.js fine-tune-new-attempt demo "LLM-backed app" app
node cli/spipe.js fine-tune-record-data demo dataset source license "download command" .spipe/cache/dataset checksum
node cli/spipe.js fine-tune-record-model-research demo model license 8192 fit constraints selected
node cli/spipe.js fine-tune-select-model-method demo model revision local provider-fine-tune user retry-base-model
node cli/spipe.js fine-tune-scaffold-training demo provider-fine-tune .spipe/llm-finetune-process/scripts/train_demo.shs
node cli/spipe.js fine-tune-record-verify-loop demo "eval command" "metric=1" "metric>=1" pass accepted none
node cli/spipe.js fine-tune-report demo
```

Requirement selection is explicit:

```sh
node cli/spipe.js fine-tune-options
node cli/spipe.js fine-tune-select-requirements <attempt_id> <feature_option> <nfr_option> <selected_by>
```
