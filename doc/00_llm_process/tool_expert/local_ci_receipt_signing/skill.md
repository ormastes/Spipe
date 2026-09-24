# Local CI Receipt Signing Tool Expert

## Role

Own the generic pattern behind "local CI receipt" signing: a developer signs a
statement, locally, that they already ran a project's mandatory-check gates
over an exact tree, and CI imports that signed statement to skip re-running
work it has independent evidence for. Recorded 2026-09-24. Items marked
**unverified** are not proven current behaviour; re-check against the source
project before repeating them.

The reference implementation is in the Simple repository
([ormastes/simple](https://github.com/ormastes/simple)):
`scripts/check/sign-local-ci-receipt.shs` (signer),
`scripts/check/verify-local-ci-receipt.shs` (verifier),
`config/check/ci_receipt_allowed_signers` (trust root),
`.github/workflows/code-idiom-receipt.yml` +
`.github/workflows/code-idiom-gates.yml` (the base-decision / gates split),
and the operator guide
`doc/07_guide/infra/local_ci_receipt/operator_guide.md`. Read that guide for
the full verdict-string troubleshooting table; this entry is the pattern, not
a copy of it.

## The pattern

1. **A signer script runs (or accepts externally-produced results for) a named
   subset ("tier") of a project's mandatory-check manifest**, over one exact
   source tree, and produces a canonical, byte-reproducible payload: schema
   name, tier, tree sha, manifest content hash, signer identity, session id,
   timestamp, a sorted set of rebase-stable commit identities, and a sorted set
   of `<row-id> <status>` verdicts.
2. **The payload is signed with a dedicated key**, using an existing
   general-purpose primitive rather than inventing one — the Simple reference
   uses `ssh-keygen -Y sign` (sshsig) with a namespace constraint
   (`namespaces="simple-ci-receipt"`) so a signature made for anything else
   (git commit signing, another project's receipts) cannot be replayed here.
3. **Delivery is out-of-band from the tracked tree.** The receipt cannot live
   as a tracked file, because it binds the tree's content — committing it
   would change the tree it attests, which is circular. The Simple reference
   uses a `git notes` ref keyed by the commit sha the receipt covers
   (`refs/notes/<project>-receipts`), attached and pushed only after a
   successful local verdict (`--note` / `--push-note`, both opt-in, never
   automatic).
4. **A verifier, run identically locally and in CI, decides admissibility.**
   It re-derives everything it can from data it does not trust the receipt
   for: the tree hash, the commit identity set, the manifest hash, the
   signature. A verifier that cannot decide (missing input, wrong tool
   version, ambiguous identity) always fails closed — the fallback is "run the
   real gates," never "assume pass."
5. **The trust root — the allowed-signers file, the verifier script itself,
   and the manifest — must be read from a ref the requester cannot control.**
   For a GitHub PR this means the BASE branch, not the PR head; see the trust
   boundary section below for why a `pull_request_target` job with a
   checkout step is *not* sufficient on its own.

## The trust boundary: why two workflows, not one

The most consequential mistake in the Simple reference's history (recorded in
`doc/07_guide/infra/local_ci_receipt/ADDENDUM_2026-09-06.md`, resolved 2026-09-24
in PR #1467) was shipping the admission decision as a plain `pull_request` job
whose only mitigation was refusing PRs that touch policy paths — a mitigation
evaluated by the PR's own (head-controlled) YAML, so it protected nothing
against a PR editing that YAML.

The fix generalizes: **split the decision from the execution.**

- **Decision job**: `pull_request_target` (executes the BASE branch's copy of
  its own YAML), **with no checkout and no head script whatsoever**. Read
  everything needed to decide (verifier, allowed-signers file, manifest) with
  a data-only read of the base ref (`git show <base-sha>:<path>` into a
  private, throwaway repo — not even a checkout of the base). Fetch the head
  only as blobless git *objects*, never as files on disk, and never execute
  anything from it. Publish the decision as a build artifact scoped to that
  run.
- **Execution job**: the ordinary `pull_request` job that runs the real gates
  against head content, in the PR's own cache/permission scope. It **imports**
  the decision — never re-decides it — accepting an artifact only from a run
  the API independently reports as the right event, the right workflow path,
  completed successfully, with fields matching this job's own payload
  (PR number, head sha, base sha, base ref) and a tree hash equal to what this
  job itself checked out.

Why not run the gates directly inside the `pull_request_target` decision job
(skipping the second job)? Because a `pull_request_target` job runs in the
base branch's execution context — including any org/repo-level Actions cache
scope a release or main-branch workflow restores from. Head code executing
there, even briefly, can poison that cache for a later trusted run (the
"Cacheract" technique: elevated runner access reaches the cache/runtime token
regardless of declared `permissions:`). Keeping the decision job free of any
head execution removes that path entirely; the execution job's head code stays
confined to the PR's own cache scope, which is the ordinary, already-accepted
risk of every `pull_request` workflow.

**Honest limit, not closed by this pattern**: the execution job's own YAML is
still the PR head's, exactly like every `pull_request` workflow. A PR that
edits that file can still drop its own gates. What the split buys is narrower
and is exactly the defect it fixes: the *authority* to grant a skip — which
gates, for which tree — can no longer be produced or widened by PR-head
content. It moves the trust root off the request; it does not make the
execution job's YAML itself immune to editing.

## Tiers are not interchangeable

If a project (like the Simple reference) accumulates more than one receipt
lane — e.g. a slow, comprehensive tier consumed by CI, a faster local-only
tier with no server-side consumer yet, and a narrow fast-path tier for a
different, cheaper check — **do not let an operator sign one tier's receipt
expecting it to satisfy another's verifier call.** Bind the tier name into the
signed payload and have the verifier fail the whole verification on a tier
mismatch, not degrade partially. A receipt that "mostly" satisfies the wrong
consumer is worse than no receipt, because it looks like evidence.

## Rebase-stable identity, not commit sha

A CI receipt in a repository under constant rebase (a strict up-to-date
branch-protection ruleset forces frequent rebases) cannot bind a raw commit
sha — that changes on every rebase even when the diff does not. The Simple
reference resolves, per covered commit, in this fixed order: (1) a VCS-level
change identity that survives rebase/amend by construction (jj's `change-id`,
written into the git commit object header and readable with plain git), else
(2) a stable patch-id (`git patch-id --stable`, defined only for non-merge
commits — a merge is therefore unbindable and always fails closed), else (3)
unbindable, with no third fallback. The *kind* is part of the signed bytes, so
a patch-id-bound receipt never satisfies a change-id-bound check and vice
versa — treating the two as interchangeable would be a forgery surface. This
distinction exists because, measured on that project, essentially none of the
commits reaching its PRs carried the better identity, so a design that only
supported the stronger form would never have engaged on a real PR.

## Signing needs the key on the signing host — plan enrollment per host

A signature requires the private key file. Any host that is expected to
produce receipts needs its own signing identity: generate a key used for
**nothing else** (so a signature made for one purpose cannot be replayed as a
receipt) and unique **per host** (`ci-receipt-<who>-<host>`), then land its
public half in the base-ref allowed-signers file through a normal reviewed PR
— which, by the trust-boundary rule above, must itself run under `full`/no-skip,
since a PR can never be the thing that admits its own key. A distinct identity
per host is what lets one compromised or retired host be revoked without
touching any other host's trust. **Adding a signer to the allowed-signers file
is a trust decision**, not a mechanical step — the reviewer is deciding that
this host's local runs may stand in for the server's.

## Signing does not buy queue time

If the consuming CI job still runs as an ordinary job in a shared runner
queue — e.g. a `pull_request_target` decision job — then when that queue is
saturated, the decision job does not start, the execution job waits out its
own budget, and everything falls back to running every gate anyway. A signed
receipt reduces the **work** a job does once a runner is actually available;
it does nothing about how long the job waits for a runner. State this
explicitly to operators, and give them a kill switch (a repository variable
that forces every decision to the safe fallback) for the case where the
*wait* itself, not the gate work, is the operational problem — that switch
does not reduce queue time either, but it does stop consuming budget on a
per-PR decision poll while the queue is bad.

## Verification checklist for a new project adopting this pattern

- [ ] Signer and verifier both fail closed on: missing input, symlinked input,
      wrong tool version, unparseable identity, tamper (note some signature
      primitives exit with a distinct non-1 code on tamper — pin that in a
      fixture, don't assume `exit 1`).
- [ ] The trust root (allowed-signers file, verifier script, manifest) is read
      from a ref the requester cannot edit in the same change that would be
      admitted by it.
- [ ] The decision-producing job executes zero requester-controlled code.
- [ ] The consuming job re-validates the decision's binding (tree/commit
      identity) against what it actually checked out, not what the decision
      merely claims.
- [ ] Tiers (if more than one) are bound into the signed payload and a
      mismatch is a hard failure, not a partial pass.
- [ ] A kill switch exists and is documented, separate from "receipt did not
      verify" — for disabling the skip mechanism entirely under operational
      stress (e.g. a saturated runner queue), not for weakening trust.
- [ ] The operator guide states plainly what the receipt does and does not
      make required/passing, and that signing does not shorten runner queue
      wait.
