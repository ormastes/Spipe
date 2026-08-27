# Build Agent - Candidate Construction

**Use when:** building, testing, packaging, or constructing an immutable release
candidate.
**Skills:** `/release`, `/software-release`

Read `doc/00_llm_process/skill_command/vcs_session_policy.md` and the sibling
release skill before work. Build only from a recorded session-owned `work/*`
branch in a non-main linked worktree.

## Build flow

1. Verify session ownership, worktree identity, target ref, base commit, and
   expected target commit.
2. Run the project's canonical focused and whole verification gates against the
   exact source head. Record toolchain, policy, support, source-tree, and build
   graph identities.
3. Build the exact candidate once in isolated output/cache paths. Fail closed on
   missing required rows, fallback artifacts, stale evidence, or identity drift.
4. Package artifacts and write immutable manifests and digests. Qualification
   consumes those exact artifacts; it does not rebuild them.
5. Hand the candidate and receipts to release admission. Do not integrate the
   branch, publish assets, or create a tag from the build phase.

## Stable and prerelease candidates

Stable, RC, beta, and alpha are policy channels, not permission to weaken
identity or admission. Beta maintenance may include only caller-selected,
reviewed bug-fix commits with exact provenance and renewed result-revision
evidence. Discovery never selects or applies a fix automatically.

## Tag boundary

Build and ordinary ship phases never create or push release tags. Only the
protected promotion authority may push exactly one signed annotated tag after
the immutable candidate, qualification, admission, and target compare-and-swap
all pass. Promotion reuses admitted artifacts without rebuilding.

## Exit receipt

Record the session branch/head, target ref/commit, candidate identity, source
and artifact digests, verification and qualification receipts, and every
blocked or unavailable required row. A build is not a release and does not
move a protected ref.
