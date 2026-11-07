# Git workflow owner and checked release companion

Candidate implementation, not execution or durability evidence. Extends lane A
without changing host core schema. Root explicitly requested actual composition.

## Concrete Git owner

`workflow/git_owner.spl` implements `GitWorkflowStoreV1 with WorkflowStoreV1`.
Trusted host construction supplies retained `OwnedExecutablePin` and
`OwnedCwdPinV4`, exact admitted environment/request template, scope/run binding,
and authenticated lifecycle authority. Request callers cannot supply executable,
cwd, Git args, refs, environment or durability booleans. Existing host
`process_inspection_start_pinned_v1` accepts bytes stdin and pinned cwd+executable;
its lease has `terminal_capture`, `input_receipt`, `acknowledge_current`, `cancel`.
Compose it instead of a shell or duplicate native process implementation.

Public factory `git_workflow_store(admission: GitWorkflowAdmissionV1,
authority: GitWorkflowHostAuthorityV1) -> Result<GitWorkflowStoreV1,text>` first
asks trusted authority to admit all pins/configuration; admission struct is
data, never self-authentication. Authority checks digest/scope, supported platform,
exact sanitized environment, retained repository identity and fsync capability.
Git configuration/external helpers/environment must not escape the fixed owner.
Trusted clock is host `current_time_ms`, never request-supplied commit time.

Public codec `encode_workflow_bundle(commit: WorkflowCommitV1,
previous_oid: text) -> Result<text,text>` and
`decode_workflow_bundle(source: text) -> Result<WorkflowGitBundleV1,text>` use
host strict SDN reader/canonical encoder and retain every run/evidence/waiver
field. Bundle includes schema, scope, predecessor object ID, previous/next run,
full receipt/waiver arrays and context. Decoder rejects extra/missing fields,
invalid versions/counts/types and noncanonical representation. No homemade parser.

Ref is exactly `refs/spipe/lifecycle/` plus SHA-256 of canonical scope/run tuple.
Read exact pointer and `cat-file blob` bounded output. Commit re-reads old blob,
compares complete previous run, revalidates receipt expiry with trusted clock,
encodes full bundle, invokes `hash-object -w --stdin`, checks returned object ID,
then `update-ref --no-deref <ref> <new> <expected-old>` (separate argv). Reject
symbolic refs. No protected ref, network or worktree source write. Initial state
requires separate authorized `initialize_git_workflow_run` create-if-absent path.
Policy requirements must accompany commit or remain immutable trusted owner
configuration so complete transition authentication is repeated before CAS.

Crash semantics: unreachable blob after conflict is harmless. A blob referencing
old blob by SDN text does NOT retain old objects against Git GC: preserve history
through Git commit/tree reachability or dedicated immutable receipt refs before
claiming retention. Prefer commit/tree containing bundle and parent commit chain;
if only blob candidate implemented, do not qualify immutable history retention.
Git update-ref CAS alone is not power-loss durability. Owner admission must verify
supported fsync object/reference configuration/platform and reject unsupported
durability before mutation. Do not report commit success if acknowledgement is
uncertain; preserve exact candidate/old identity for reconciliation. On failure
after possible CAS, explicit uncertain result is required; do not blindly retry.

## Checked build/release companion

`workflow/release_trace.spl` uses host graph without extending its closed kinds.
`WorkflowReleaseLinkV1`: schema, UID, run_id, authority_scope, source_revision,
policy_sha256, graph_snapshot_id, symbol_uid, test_uid, observation_uid,
evidence_uid, build_sha256, verification_sha256, release_sha256,
release_revision, executable_sha256 and input_sha256. All digest fields are
SHA-256 and revisions exact; versioned complete link is authenticated by trusted
`WorkflowReleaseTraceAuthorityV1.authorize(scope,run_id)` and
`authenticate(link,graph)`. Authorization precedes validation/query.

`check_workflow_release_link(graph: TraceGraphV1, link: WorkflowReleaseLinkV1,
authority: WorkflowReleaseTraceAuthorityV1) -> Result<bool,text>` validates graph,
requires precise node kinds and checked test-target, test-observation and
observation-evidence edges, exact pinned context and authenticated complete link.
Never infer a release from generic evidence_artifact or caller booleans. A query
projects checked link by symbol/test/build/release UID/digest in both directions;
all links are checked and bounded, with no successful truncation. Include wrong
revision, forged release, unrelated evidence, missing graph link, unauthorized
scope and quota negatives. This is a checked companion, not release promotion.

Companion additionally binds `requirement_uid` and `criterion_uid`, requiring
`decomposes_to` and `accepted_by` edges into the acceptance test, and rejects a
release revision different from the exact tested source revision.

## Shared artifact owner API

Lane C imports `workflow/git_artifact.spl`; it must not implement a competing
backend or construct an owner from request data. `GitArtifactWriteV1` fields:
artifact_kind, artifact_key, canonical_sdn, source_revision, policy_sha256,
authority_scope, expected_commit_oid (all text). Allowed kinds are lifecycle_run
and evaluation_proposal. Empty expected OID means create-only. Concrete
`GitArtifactOwnerV1.me commit_artifact(write)` returns `Result<GitArtifactReceiptV1,
text>`; `fn read_artifact(artifact_kind,artifact_key)` returns
`Result<GitArtifactSnapshotV1,text>`. Receipt fields: commit_oid, blob_oid,
payload_sha256, previous_commit_oid, ref_name. Snapshot contains receipt and
canonical_sdn. Full metadata and payload remain immutable and checked on read.
Ref namespace stays refs/spipe/lifecycle/ with kind included in hashed tuple.
Factory trust is a real outstanding root integration requirement, never a default
true admission or successful fake. Pure proposal preparation can be tested apart
from persistence; a memory stand-in does not qualify the concrete Git owner.

Git configuration research: explicit object/reference fsync and fsync method are
necessary because defaults may omit loose-object hardening. See official
[Git configuration](https://git-scm.com/docs/git-config/2.44.3) and
[Git fsync methods](https://www.kernel.org/pub/software/scm/git/docs/git-config.html).
Storage/platform support still needs admission; configuration alone is not proof.

All additional scenario/fixture/manual filenames retain lifecycle_workflow_ prefix.
If provider APIs cannot implement safe pinned execution/cleanup or durability,
record exact missing capability and retain fail-closed candidate status; continue
implementable codecs/companion and real integration path without fake backend.

## Implemented candidate refinement (2026-11-07)

The generic concrete owner is `workflow/git_artifact.spl`, shared with learning.
Its factory is `git_artifact_owner(GitArtifactAdmissionV1,
GitArtifactHostAuthorityV1)`. Writes accept exactly the agreed
`GitArtifactWriteV1` fields; receipts contain commit/blob/payload/predecessor/ref
identity. Artifact kind is `lifecycle_run` or `evaluation_proposal`. Local refs
remain `refs/spipe/lifecycle/` plus SHA-256 of the canonical kind/scope/key tuple.
The complete immutable SDN envelope retains kind/key/scope/source/policy and
payload SHA-256. The exact canonical payload is returned in snapshots.

The implementation uses `hash-object`, `mktree` and `commit-tree` with a single
`bundle.sdn` tree entry and an actual parent commit before CAS `update-ref`.
Reads verify the exact one-file tree, metadata, payload digest and actual parent.
No textual predecessor substitutes for Git reachability. Public
`me read_artifact_history(kind,key,max_depth)` traverses only the authorized tip's
checked parent chain, maximum 128 commits. Arbitrary object-ID reads are private.
The lifecycle wrapper authenticates each transition back to authorized genesis
and compares every predecessor next run with successor previous run.

`WorkflowStoreV1.load`, `workflow_status`'s store parameter and generic artifact
reads are mutable owner operations so pending process leases survive errors.
`GitArtifactOwnerV1.pending` retains cleanup authority. New commands reject while
pending; `recover_cleanup` performs bounded cancellation/acknowledgement and
retains the lease when incomplete. No uncertain result discards that owner.

Actual provider capability receipts are checked before commands, including at
factory construction. Every command uses retained executable and Git metadata
cwd pins, fixed `--git-dir=.`, `--no-replace-objects`, `core.fsync=all`,
`core.fsyncMethod=fsync`, disabled hooks and commit signing, authenticated exact
environment and stdin digest. Exit, EOF, truncation, stdin completeness and child
retirement come from the host inspection lease. Nonempty stderr rejects success.
CAS/ack uncertainty preserves candidate/old/ref identities for reconciliation.

`git_workflow_store` additionally authenticates complete immutable policy and
trusted lifecycle authority. Publication re-evaluates gates with host clock,
requires expiry beyond the bounded CAS command sequence and checks time again
after CAS. No success is reported after expiry/clock uncertainty.

The companion additionally includes requirement_uid and criterion_uid, requires
typed decomposes_to/accepted_by/targets/observed_in/produced edges and exact
release_revision == source_revision. Complete links and graph provenance must
authenticate. Existing graph codec kinds are unchanged.

All above is authored candidate source, NOT_RUN. Root must provide admitted
Linux Git/storage/configuration/pins/environment factory, native integration,
crash/cleanup/concurrency evidence and performance measurements. Windows process
inspection provider is unavailable; no fallback process implementation is used.
