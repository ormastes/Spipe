<!-- generated-from: isolated VCS session policy -->
# Isolated Session Sync

Read `doc/00_llm_process/skill_command/vcs_session_policy.md` completely. Sync
only the current session-owned `work/*` branch in its recorded non-main linked
worktree.

1. Verify the physical worktree, owner, session ID, work branch, target ref,
   base commit, and expected target commit against the session record.
2. Fetch the declared target and record its exact commit. Stop if it is stale or
   the current workspace is the protected main checkout.
3. Rebase only a private unsubmitted work branch when policy permits. Renew all
   affected review and verification evidence after any base, head, or diff
   change.
4. Resolve policy/configuration conflicts semantically and regenerate managed
   projections from their authority; never choose one side wholesale by file
   type.
5. Run the affected gates, update the session receipt, and push only the owned
   work ref with an exact lease or compare-and-swap.
6. Submit the exact head through the repository's PR/integration authority.

This skill never moves `main`, `release/*`, a candidate ref, recovery ref, or
release tag. It never creates a release tag. Cleanup uses the identity-checked
VCS workspace manager or recoverable trash only after integration or explicit
abandonment; recursive force deletion is outside sync.

Reject protected-branch or physical-main mutation, stale target commits,
branch/worktree ownership mismatch, unrelated dirty work, unconditional force,
broad ref pushes, wholesale conflict-side selection, and ambiguous cleanup.
