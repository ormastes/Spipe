---
name: worktree
description: Create and manage identity-checked isolated VCS session worktrees.
---

# Isolated Session Worktree

Read `doc/00_llm_process/skill_command/vcs_session_policy.md` completely. One
semantic change owns one `work/*` branch and one linked worktree physically
separate from the protected main worktree.

## Create

1. Fetch the declared protected target and record its exact commit.
2. Choose a unique session ID, `work/<session>` branch, and non-main worktree
   path.
3. Confirm the target path does not exist and the branch is not owned by another
   session.
4. Create the linked worktree with the repository's Git or JJ workspace manager
   from the recorded target commit.
5. Write a session record binding owner, session ID, worktree path, work branch,
   target ref, base commit, and expected target commit.
6. Re-open the session from the linked worktree and fail if its physical path,
   branch, or owner differs from the record.

## Work and submit

- Modify and commit only the session's owned paths.
- Preserve unrelated dirty files and other sessions' branches/worktrees.
- Rebase only a private unsubmitted work branch. Any base, head, or diff change
  invalidates affected review and verification evidence until renewed.
- Push only the owned work ref with exact lease/CAS and submit its exact head
  through the repository's PR or integration authority.
- Never move `main`, `release/*`, candidate refs, recovery refs, or release tags
  from a development workspace.

## Conflicts

Resolve source, policy, manifest, configuration, and generated-file conflicts
semantically. Regenerate projections from their source of truth and inspect the
resulting diff. Never choose one side wholesale based on an extension such as
`.sdn`.

## Cleanup

Cleanup is a separate, identity-checked step after integration or explicit
abandonment:

1. Resolve the exact path and workspace identity from the session record.
2. Verify it is not the main worktree, the current worktree, a parent/root path,
   or a workspace with unrelated/unpushed changes.
3. Ask the VCS workspace manager to remove/forget that exact workspace; use a
   recoverable trash operation for any remaining directory.
4. Delete the private work ref only after confirming integration or explicit
   abandonment and remote/local identity.
5. Record what was cleaned and whether it is recoverable.

Recursive force deletion, unresolved variables, broad globs, and inferred
workspace paths are outside this workflow. Stop when any identity or ownership
check is ambiguous.
