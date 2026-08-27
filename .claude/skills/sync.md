# Isolated Session Sync

Read `doc/00_llm_process/skill_command/vcs_session_policy.md` and
`doc/00_llm_process/skill_command/skills/codex/sync/skill.md` completely. Sync
only the current session-owned `work/*` branch in its recorded non-main linked
worktree.

Verify the owner, session ID, worktree path, work branch, target ref, base
commit, and expected target commit; fetch the target; rebase only a private
unsubmitted work branch; renew evidence
after any base/head/diff change; resolve conflicts semantically and regenerate
managed projections; push only the owned work ref with exact lease/CAS; then
submit the exact head through the PR/integration authority.

Never move a protected ref or release tag, create a release tag, use wholesale
conflict-side selection, or clean an unverified path. Cleanup is post-integration
or explicit-abandonment only through the VCS workspace manager or recoverable
trash; recursive force deletion is outside sync.
