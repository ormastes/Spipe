# Isolated VCS Session Policy

This policy governs development, synchronization, build, ship, and release
handoff guidance shipped by SPipe.

## Normalized contract

- One semantic change uses one session-owned `work/*` branch in one linked
  worktree that is physically separate from the protected main worktree.
- The session record binds the owner, session ID, worktree path, work branch,
  target ref, base commit, and expected target commit before mutation.
- `main`, `release/*`, candidate refs, recovery refs, and release tags move only
  through their protected integration or promotion authority; an agent never
  updates them directly.
- Fetch before work or synchronization. Rebase only a private, unsubmitted work
  branch and renew affected review and verification evidence whenever its base,
  head, or diff changes.
- Push only the session-owned work ref with an exact lease or compare-and-swap,
  then submit that exact head through the repository's review and integration
  authority.
- Build and ordinary ship phases never create or push release tags. Promotion
  may push exactly one signed annotated tag only after the immutable candidate,
  qualification, admission, and promotion authority are all proven.
- Resolve policy, manifest, configuration, and generated-file conflicts
  semantically. Regenerate projections from their authority; never accept one
  side wholesale by file type.
- Cleanup targets only the recorded, identity-checked session worktree through
  the VCS workspace manager or a recoverable trash operation. Recursive force
  deletion is outside the workflow.
- Stop on a physical-main worktree, protected branch, stale target commit,
  ownership mismatch, uncommitted unrelated work, or ambiguous cleanup target.

## Handoff receipt

A successful handoff records the work branch and head commit, target ref and
expected target commit, renewed evidence digests, push lease/CAS result, and PR
or integration-request identity. A release handoff additionally records the
immutable candidate and admission receipts; tag creation remains a later
promotion-authority action.
