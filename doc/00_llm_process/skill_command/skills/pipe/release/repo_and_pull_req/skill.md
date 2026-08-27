<!-- generated-from: doc/00_llm_process/skill_command/command/release.md -->
# Protected Software Release

Use the canonical semantic source at `doc/00_llm_process/skill_command/command/release.md`.

Start one isolated release branch/worktree, read `release/version.sdn`, and require verified evidence. Beta maintenance accepts only explicit reviewed bug-fix backports with exact provenance and renewed post-application evidence. Create an immutable candidate, build once, and promote exact admitted artifacts through one signed annotated exact tag after approval.

Never update protected refs directly, rebuild during promotion, select fixes automatically, push all tags, delete/move/reuse a published tag, or use fallback artifacts. Rollback redeploys a prior admitted release; corrections get a new version.

## Normalized contract clauses

- One isolated release session owns one work branch and one non-main worktree.
- `release/version.sdn` is the sole version authority and all other version locations are checked projections.
- Beta maintenance admits only caller-selected reviewed bug-fix commits with exact provenance and renewed result-revision evidence.
- Bootstrap periodically performs read-only main-to-release convergence discovery and never selects or cherry-picks fixes automatically.
- An approved release-first emergency fix requires an exact reviewed forward-port receipt to main.
- Main remains the independent development trunk and never tracks or becomes a release branch.
- Protected refs change only through exact-revision compare-and-swap integration authority.
- Each changed source policy support or toolchain identity creates a new immutable candidate attempt.
- Build and qualify the exact candidate once and reject required failures or fallback artifacts.
- Promotion reuses admitted artifacts without rebuilding and pushes exactly one signed annotated tag.
- Release admission requires focused failures to reach zero followed by one clean whole-suite confirmation.
- Withdrawal preserves published tags assets and history and corrections use a new version.

<!-- spipe-self-review-guidance:begin -->
## SPipe self-review admission

GitHub forbids a pull-request author from submitting an `APPROVED` review on
their own pull request. Do not retry or claim a provider approval. SPipe uses a
different merge gate: the pinned broker emits the short-lived required check
`SPipe Self Review Admission` for one exact head, base, diff, and ruleset.

If an agent asks to **self approve**, **approve PR**, or says the **author
cannot approve**, run the one discovery command `spipe self-review-guide` (or
`node cli/spipe.js self-review-guide` from this checkout). Then follow this
exact workflow:

1. Resolve the live PR head and perform a `high`, `xhigh`, `max`, or `ultra`
   review of that exact head. Record the session, model, effort, verdict, and
   finding counts; continue only for `PASS` with `P0=0` and `P1=0`.
2. Dispatch the protected host workflow once with the PR number, session ID,
   reviewer model, reviewer effort, and `self_attestation=PASS:0:0`. In Simple:
   `gh workflow run review-admission.yml --ref main -f pull_request_number="$PR_NUMBER" -f session_id="$SESSION_ID" -f reviewer_model="$REVIEWER_MODEL" -f reviewer_effort="$REVIEWER_EFFORT" -f self_attestation='PASS:0:0'`.
3. Poll the check runs on the resolved head until `SPipe Self Review Admission`
   succeeds or fails. Never treat a check on another SHA as evidence.
4. If the provider rejects author `APPROVE`, or the actor and author are the
   same, print these steps instead of retrying. A rejection, policy denial,
   stale head, failed check, or missing protected workflow is a blocker.

Eligibility is not automatic authorization. The closed request must carry a
current user-authorization actor, timestamp, and receipt digest, and the broker
must authenticate and repeat that evidence. Ordinary reviewed code/text is
default-eligible only after that proof; operator `deny`/`constrain` records and
fixed secret/ruleset/signing/review-authority restrictions always win.

Constrain scopes are `code`, `text`, exact `file`, immediate
`directory_files`, and recursive `directory_recursive`. Admission binds its
expiry and requires the broker to register fail-closed check invalidation on
bound-input change or expiry. A new push, base or merge-base movement, diff
change, retarget, ruleset/policy/review/user-authorization receipt change, or
expiry requires a fresh exact-head review, authorization, and evaluation.

Call `spipe_self_review_privilege_evaluate` first. On deny, report its exact
`reason_code`, matched policy/restriction IDs, affected paths, and
`remediation`; never bypass or weaken the gate. On allow, call the
compatibility-named `spipe_self_review_approve`, which emits only the SPipe
status check and never a GitHub pull-request approval.
<!-- spipe-self-review-guidance:end -->
