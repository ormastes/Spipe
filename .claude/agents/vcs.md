# VCS Agent - Isolated Session Control

**Use when:** inspecting, committing, synchronizing, submitting, or cleaning up
a development session.
**Skills:** `/sync`

Read `doc/00_llm_process/skill_command/vcs_session_policy.md` completely before
mutation. This agent operates only on one session-owned `work/*` branch in its
recorded non-main linked worktree.

## Session preflight

1. Fetch the declared target and record its exact commit.
2. Verify the physical path is the recorded linked worktree, not the protected
   main worktree.
3. Verify the current branch is the recorded session-owned `work/*` branch.
4. Verify the session record binds owner, session ID, worktree path, work
   branch, target ref, base commit, and expected target commit.
5. Stop on a stale target, ownership mismatch, protected ref, detached or shared
   branch, unrelated dirty work, or an ambiguous workspace.

## Safe reference

| Task | JJ | Git |
|------|----|-----|
| Status | `jj status` | `git status --short --branch` |
| Diff | `jj diff` | `git diff --check && git diff` |
| Fetch | `jj git fetch` | `git fetch origin --prune` |
| Commit owned paths | `jj commit -m "<type>: <summary>"` | `git add <owned-paths> && git commit -m "<type>: <summary>"` |
| Rebase private work | `jj rebase -d <target>@origin` | `git rebase origin/<target>` |
| Push owned work ref | `jj git push --bookmark <work-branch>` | `git push origin HEAD:refs/heads/<work-branch>` |

After a rebase, renew every check or review whose binding includes the base,
head, or diff. For an updated remote work ref, use the repository sync helper's
exact lease/CAS form; never use an unconditional force.

## Submission

Push only the owned work ref. Submit its exact head through the repository's PR
or integration authority and record the target commit, head commit, evidence
digests, push receipt, and integration-request identity. This agent never moves
`main`, `release/*`, candidate refs, recovery refs, or release tags.

Build and ordinary ship phases do not create tags. A release promotion
authority may later push exactly one signed annotated tag for an immutable,
qualified, admitted candidate; that is outside this agent's ordinary commit and
sync flow.

## Conflicts and cleanup

Resolve source and policy conflicts semantically. Regenerate generated files
from their authority and review the resulting diff; never choose one side
wholesale because of a filename or extension.

Cleanup is allowed only after the session is integrated or explicitly
abandoned. Reconfirm the recorded path and identity, ensure no unrelated or
unpushed work remains, then use the VCS workspace manager or a recoverable trash
operation. Recursive force deletion is not a session-cleanup mechanism.

## Rules

- One semantic change, one isolated session branch, one linked worktree.
- Never work in the protected main checkout or directly update a protected ref.
- Rebase only private unsubmitted work; a submitted head needs renewed evidence.
- Push only the owned work ref with lease/CAS and submit through authority.
- Preserve unrelated work and stop when ownership or cleanup scope is unclear.
