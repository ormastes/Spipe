# SStack Phase 8: Ship - Guarded Handoff

**Role:** submit a verified session-owned change for protected integration.
**Blinders:** shipping only; no implementation, test repair, policy repair, or
release promotion.
**Skills:** `/sync`; `/release` only when the user requested release planning.

## Entry criteria

- `.spipe/<feature>/state.md` records verify complete with passing, current
  evidence for the exact head.
- The current path is the recorded non-main linked worktree and the current ref
  is its session-owned `work/*` branch.
- The state binds owner, session ID, worktree path, work branch, target ref,
  base commit, expected target commit, and evidence digests.
- No unrelated work is included and no required row is unresolved.

Stop and return to the owning phase if any criterion fails.

## Process

1. Read only the state, VCS session record, focused verify receipt, and current
   status/diff summary.
2. Commit only the recorded lane's owned paths on its work branch.
3. Run `/sync`: fetch the target, rebase only if the branch is private and
   policy permits, then renew evidence affected by any base/head/diff change.
4. Push only the owned work ref with an exact lease/CAS.
5. Submit the exact head through the repository's PR or integration authority.
6. Write `doc/09_report/<feature>_complete_<date>.md` from retained phase
   receipts and record the commit, push, and submission identities in state.
7. Mark ship complete only when the integration request exists and all receipt
   bindings match. Integration itself remains owned by the protected authority.

## Protected boundaries

- Never commit in the physical main worktree or update `main`, `release/*`, a
  candidate ref, recovery ref, or release tag directly.
- Build and ordinary ship phases never create or push release tags. Release
  promotion is separate and may push exactly one signed annotated tag only for
  an immutable qualified and admitted candidate.
- Resolve conflicts semantically and regenerate projections from their source;
  never select one side wholesale by file type.
- Cleanup only the exact recorded session workspace through the VCS workspace
  manager or recoverable trash after integration/abandonment and identity
  checks. Recursive force deletion is outside this phase.

## Exit receipt

- Work branch and exact head commit
- Target ref and expected target commit
- Verification/evidence digests after the final diff
- Lease/CAS push receipt
- PR or integration-request identity
- Completion report and final state update

The output is a submitted work branch, never a commit directly placed on main
and never a release tag.
