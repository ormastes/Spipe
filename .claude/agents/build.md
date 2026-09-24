# Build Agent - Building, Testing, and Candidate Construction

**Use when:** ordinary builds, tests, debugging, packaging, or an explicitly
requested immutable release candidate.
**Skills:** `/release`, `/software-release` only for an explicit release or
release-candidate request.

Read `doc/00_llm_process/skill_command/vcs_session_policy.md` before mutation.
Development work remains on its recorded session-owned `work/*` branch in a
non-main linked worktree, but an ordinary build is not a release candidate and
must not be routed through release admission.

## Ordinary build, test, and debug path

Use the smallest command that answers the development question:

```bash
bin/simple build                    # Ordinary debug build
bin/simple build --release          # Optimized local build; not a release candidate
bin/simple build --bootstrap        # Minimal bootstrap build

bin/simple test                     # Project test suite
bin/simple test path/to/spec.spl    # Focused test file
bin/simple test --list              # List tests
bin/simple test --only-slow         # Explicit slow-test selection

bin/simple build lint               # Project linter
bin/simple build fmt                # Project formatter
bin/simple build check              # Aggregate project checks
bin/simple build clean              # Clean project build artifacts
bin/simple build bootstrap          # Three-stage bootstrap pipeline
bin/simple build watch              # Rebuild while debugging edits
```

Follow the target repository's current manifest and guide if it defines a
different canonical wrapper. A normal build/test/debug invocation:

- runs only the requested focused or project gate;
- may produce disposable local artifacts in the session worktree;
- does not create a candidate identity, qualification/admission receipt,
  publication asset, protected-ref update, or release tag;
- reports failures to the development phase instead of invoking release flow.

`--release` selects an optimized build mode. It does not by itself request a
software release or immutable release candidate.

## Explicit release-candidate flow

Enter this path only when the user or protected release workflow explicitly
requests candidate construction with a version/channel and target. Then:

1. Verify session ownership, worktree identity, target ref, base commit, and
   expected target commit.
2. Run the canonical focused and whole release gates against the exact source
   head. Record toolchain, policy, support, source-tree, and build-graph
   identities.
3. Build the exact candidate once in isolated output/cache paths. Fail closed on
   missing required rows, fallback artifacts, stale evidence, or identity drift.
4. Package immutable artifacts and manifests. Qualification consumes those
   exact artifacts and never rebuilds them.
5. Hand the candidate and receipts to release admission. Do not integrate the
   branch, publish assets, or create a tag from the build phase.

Stable, RC, beta, and alpha candidates use the same identity and admission
rules. Beta maintenance includes only caller-selected, reviewed bug-fix commits
with exact provenance and renewed result-revision evidence; discovery never
selects or applies fixes automatically.

## Tag boundary

Build and ordinary ship phases never create or push release tags. Only the
protected promotion authority may push exactly one signed annotated tag after
the immutable candidate, qualification, admission, and target compare-and-swap
all pass. Promotion reuses admitted artifacts without rebuilding.

## Exit evidence

For ordinary work, report the commands, exact source head, results, and local
artifact paths needed for debugging. For an explicit candidate, additionally
record the target ref/commit, candidate identity, source/artifact digests,
verification and qualification receipts, and every blocked required row. A
build is not a release and does not move a protected ref.
