import assert from "node:assert/strict";
import { execFile, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  planInternalAuthenticatedBetaBackport, planVerifiedCandidate, releaseSessionStart,
  releaseSessionStatus, releaseSessionSync
} from "../../src/release/session.js";

const token = "test-session-owner-token-0123456789abcdef";
const hash = "b".repeat(64);

function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function gitSucceeds(cwd, ...args) { try { git(cwd, ...args); return true; } catch { return false; } }
function concurrentStart(input, readyPath, gatePath) {
  const moduleUrl = new URL("../../src/release/session.js", import.meta.url).href;
  const source = `
    import { existsSync, writeFileSync } from "node:fs";
    const { releaseSessionStart } = await import(process.argv[1]);
    const input = JSON.parse(process.argv[2]);
    writeFileSync(process.argv[4], "ready\\n");
    const waitArray = new Int32Array(new SharedArrayBuffer(4));
    while (!existsSync(process.argv[5])) Atomics.wait(waitArray, 0, 0, 5);
    try { releaseSessionStart(input, { ownerToken: process.argv[3] }); process.stdout.write("started"); }
    catch (error) { process.stdout.write(\`rejected:\${error.message}\`); process.exitCode = 2; }
  `;
  return new Promise((resolve) => {
    execFile(process.execPath, ["--input-type=module", "-e", source, moduleUrl, JSON.stringify(input), token, readyPath, gatePath],
      { encoding: "utf8" }, (error, stdout, stderr) => resolve({ code: error?.code || 0, stdout, stderr }));
  });
}
async function waitForFiles(paths) {
  for (let attempts = 0; attempts < 200; attempts += 1) {
    if (paths.every(existsSync)) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error("concurrent session claimants did not reach the start gate");
}
function setupRepository() {
  const root = mkdtempSync(join(tmpdir(), "spipe-release-session-"));
  const remote = join(root, "remote.git"); const main = join(root, "main"); const workspace = join(root, "release-worktree");
  git(root, "init", "--bare", remote); git(root, "init", "-b", "main", main);
  git(main, "config", "user.email", "spipe-test@example.invalid"); git(main, "config", "user.name", "SPipe Test");
  writeFileSync(join(main, "base.txt"), "base\n"); git(main, "add", "base.txt"); git(main, "commit", "-m", "base");
  git(main, "remote", "add", "origin", remote); git(main, "push", "-u", "origin", "main");
  const releaseBase = git(main, "rev-parse", "HEAD"); git(main, "branch", "release/1.2", releaseBase); git(main, "push", "origin", "release/1.2");
  writeFileSync(join(main, "fix.txt"), "reviewed fix\n"); git(main, "add", "fix.txt"); git(main, "commit", "-m", "fix: reviewed parser repair"); git(main, "push", "origin", "main");
  return { root, remote, main, workspace, releaseBase, sourceCommit: git(main, "rev-parse", "HEAD") };
}
function startInput(repo) {
  return {
    repository_path: repo.main, workspace_path: repo.workspace, main_workspace_path: repo.main,
    session_id: "release-1", owner_id: "codex:test", work_branch: "work/release/v1.2.0-beta.1-release-1",
    target_ref: "release/1.2", remote_name: "origin", base_sha: repo.releaseBase,
    expected_target_sha: repo.releaseBase, policy_sha256: hash
  };
}
function access(repo, overrides = {}) { return { workspace_path: repo.workspace, session_id: "release-1", owner_id: "codex:test", ...overrides }; }
function backportInput(repo, resultCommit, overrides = {}) {
  return {
    direction: "main_to_beta", source_ref: "main", source_commit_sha: repo.sourceCommit,
    change_id: "change-1", work_id: "gh-1", change_kind: "fix", review_receipt_sha256: hash,
    reviewed_source_commit_sha: repo.sourceCommit, reviewed_change_id: "change-1", target_line: "release/1.2",
    expected_target_sha: repo.releaseBase, adaptation_reason: "none", adaptation_review_receipt_sha256: "",
    evidence_sha256: hash, evidence_result_commit_sha: resultCommit, evidence_target_sha: repo.releaseBase,
    result_commit_sha: resultCommit, forward_port_target_ref: "", forward_port_receipt_sha256: "",
    ...access(repo), ...overrides
  };
}
function candidateInput(repo, commitSha) {
  return {
    version: "1.2.0-beta.1", attempt: 1, candidate_ref: "candidate/v1.2.0-beta.1/a001",
    commit_sha: commitSha, source_tree_sha256: hash, policy_sha256: hash,
    version_manifest_sha256: hash, toolchain_manifest_sha256: hash, support_manifest_sha256: hash,
    build_graph_sha256: hash, creator_identity: "test:release-session", evidence_manifest_sha256: hash,
    existing_identity: "", ...access(repo)
  };
}
function brokerOptions(receiptOverrides = {}) {
  return {
    ownerToken: token,
    now: new Date("2026-08-27T12:00:00.000Z"),
    backportReviewBroker: {
      integrationId: "spipe-review-broker:test",
      verifyAdaptationReceipt(request) {
        const { claimed_receipt_sha256: receiptSha256, ...facts } = request;
        return {
          schema: "spipe-beta-backport-adaptation-review/1", valid: true,
          issuer_integration_id: "spipe-review-broker:test", reviewer_identity: "codex:independent-reviewer",
          review_identity_authenticated: true, signature_verified: true, signature_algorithm: "ed25519",
          signer_key_id: "broker:key-1", ...facts, issued_at: "2026-08-27T11:00:00.000Z",
          expires_at: "2026-08-27T13:00:00.000Z", receipt_sha256: receiptSha256, ...receiptOverrides
        };
      }
    }
  };
}

test("guarded session operations prove actual Git ownership, uniqueness, HEAD/base, and sync", () => {
  const repo = setupRepository();
  try {
    const started = releaseSessionStart(startInput(repo), { ownerToken: token });
    assert.equal(started.mutation, "local_git_worktree_and_branch");
    assert.equal(started.protected_ref_mutation, false);
    assert.equal(started.status.valid, true);
    assert.equal(started.status.checks.unique_worktree_branch, true);
    assert.equal(started.status.actual.head_sha, repo.releaseBase);
    assert.throws(() => releaseSessionStatus(access(repo), { ownerToken: `${token}-wrong` }), /ownership token mismatch/);
    assert.throws(() => releaseSessionStart({ ...startInput(repo), session_id: "release-2", workspace_path: join(repo.root, "other") }, { ownerToken: token }), /work_branch already exists|already owned/);

    git(repo.workspace, "config", "user.email", "spipe-test@example.invalid"); git(repo.workspace, "config", "user.name", "SPipe Test");
    git(repo.workspace, "cherry-pick", repo.sourceCommit); const backportHead = git(repo.workspace, "rev-parse", "HEAD");
    const status = releaseSessionStatus(access(repo), { ownerToken: token });
    assert.equal(status.valid, true); assert.equal(status.checks.clean, true); assert.equal(status.checks.head_matches_checkpoint, false); assert.equal(status.actual.head_sha, backportHead);

    const backport = planInternalAuthenticatedBetaBackport(backportInput(repo, backportHead), { ownerToken: token });
    assert.equal(backport.schema, "spipe-release-verified-plan/1"); assert.equal(backport.git.head_sha, backportHead); assert.deepEqual(backport.git.changed_paths, ["fix.txt"]);
    assert.equal(backport.git.relationship.mode, "stable_patch_id"); assert.equal(backport.git.relationship.source_patch_id, backport.git.relationship.result_range_patch_id);

    const candidate = planVerifiedCandidate(candidateInput(repo, backportHead), { ownerToken: token });
    assert.equal(candidate.git.candidate_ref_absent, true); assert.equal(candidate.git.head_sha, backportHead);

    git(repo.main, "checkout", "release/1.2"); writeFileSync(join(repo.main, "release-line.txt"), "line update\n"); git(repo.main, "add", "release-line.txt"); git(repo.main, "commit", "-m", "chore: release line update");
    const nextTarget = git(repo.main, "rev-parse", "HEAD"); git(repo.main, "push", "origin", "release/1.2"); git(repo.main, "checkout", "main");
    const drifted = releaseSessionStatus(access(repo), { ownerToken: token });
    assert.equal(drifted.valid, false); assert.equal(drifted.checks.target_ref_resolves, true); assert.equal(drifted.checks.target_matches_recorded_base, false);
    const synced = releaseSessionSync({ ...access(repo), expected_head_sha: backportHead, expected_target_sha: nextTarget }, { ownerToken: token });
    assert.equal(synced.mutation, "fetch_and_rebase_owned_session_branch"); assert.equal(synced.base_sha, nextTarget); assert.equal(synced.status.valid, true); assert.equal(synced.status.checks.target_matches_recorded_base, true);
    assert.equal(git(repo.workspace, "merge-base", synced.head_sha, nextTarget), nextTarget);
  } finally {
    try { git(repo.main, "worktree", "remove", "--force", repo.workspace); } catch { /* test cleanup */ }
    rmSync(repo.root, { recursive: true, force: true });
  }
});

test("planning fails closed when the recorded target ref is missing or has drifted", () => {
  const repo = setupRepository();
  try {
    releaseSessionStart(startInput(repo), { ownerToken: token });
    git(repo.workspace, "update-ref", "-d", "refs/remotes/origin/release/1.2");
    const missing = releaseSessionStatus(access(repo), { ownerToken: token });
    assert.equal(missing.valid, false); assert.equal(missing.checks.target_ref_resolves, false); assert.equal(missing.checks.target_matches_recorded_base, false);
    assert.throws(() => planVerifiedCandidate(candidateInput(repo, repo.releaseBase), { ownerToken: token }), /valid clean owned session/);

    git(repo.workspace, "update-ref", "refs/remotes/origin/release/1.2", repo.sourceCommit);
    const drifted = releaseSessionStatus(access(repo), { ownerToken: token });
    assert.equal(drifted.valid, false); assert.equal(drifted.checks.target_ref_resolves, true); assert.equal(drifted.checks.target_matches_recorded_base, false);
    assert.throws(() => planVerifiedCandidate(candidateInput(repo, repo.releaseBase), { ownerToken: token }), /valid clean owned session/);

    git(repo.workspace, "update-ref", "refs/remotes/origin/release/1.2", repo.releaseBase);
    assert.equal(releaseSessionStatus(access(repo), { ownerToken: token }).valid, true);
  } finally {
    try { git(repo.main, "worktree", "remove", "--force", repo.workspace); } catch { /* test cleanup */ }
    rmSync(repo.root, { recursive: true, force: true });
  }
});

test("verified backport rejects an unrelated clean result commit even when adaptation is claimed", () => {
  const repo = setupRepository();
  try {
    releaseSessionStart(startInput(repo), { ownerToken: token });
    git(repo.workspace, "config", "user.email", "spipe-test@example.invalid"); git(repo.workspace, "config", "user.name", "SPipe Test");
    writeFileSync(join(repo.workspace, "unrelated.txt"), "unrelated clean commit\n"); git(repo.workspace, "add", "unrelated.txt"); git(repo.workspace, "commit", "-m", "chore: unrelated clean change");
    const unrelatedHead = git(repo.workspace, "rev-parse", "HEAD");
    assert.throws(() => planInternalAuthenticatedBetaBackport(backportInput(repo, unrelatedHead), { ownerToken: token }), /stable patch-id mismatch without adaptation/);
    assert.throws(() => planInternalAuthenticatedBetaBackport(backportInput(repo, unrelatedHead, { adaptation_reason: "target-specific rewrite", adaptation_review_receipt_sha256: hash }), { ownerToken: token }), /configured authenticated review broker/);
  } finally {
    try { git(repo.main, "worktree", "remove", "--force", repo.workspace); } catch { /* test cleanup */ }
    rmSync(repo.root, { recursive: true, force: true });
  }
});

test("verified backport binds an explicit reviewed adaptation to source/result trees and diffs", () => {
  const repo = setupRepository();
  try {
    releaseSessionStart(startInput(repo), { ownerToken: token });
    git(repo.workspace, "config", "user.email", "spipe-test@example.invalid"); git(repo.workspace, "config", "user.name", "SPipe Test");
    writeFileSync(join(repo.workspace, "fix.txt"), "reviewed fix\nrelease-only adjustment\n"); git(repo.workspace, "add", "fix.txt"); git(repo.workspace, "commit", "-m", "fix: adapt reviewed parser repair");
    const adaptedHead = git(repo.workspace, "rev-parse", "HEAD");
    const plan = planInternalAuthenticatedBetaBackport(backportInput(repo, adaptedHead, { adaptation_reason: "release line requires an extra compatibility adjustment", adaptation_review_receipt_sha256: hash }), brokerOptions());
    assert.equal(plan.git.relationship.mode, "broker_reviewed_adaptation"); assert.notEqual(plan.git.relationship.source_patch_id, plan.git.relationship.result_range_patch_id);
    assert.equal(plan.git.relationship.adaptation_review.signature_verified, true); assert.equal(plan.git.relationship.adaptation_review.review_identity_authenticated, true);
    assert.match(plan.git.relationship.relationship_sha256, /^[0-9a-f]{64}$/); assert.deepEqual(plan.git.relationship.source_changed_paths, ["fix.txt"]); assert.deepEqual(plan.git.relationship.result_range_changed_paths, ["fix.txt"]);
  } finally {
    try { git(repo.main, "worktree", "remove", "--force", repo.workspace); } catch { /* test cleanup */ }
    rmSync(repo.root, { recursive: true, force: true });
  }
});

test("verified backport rejects multi-commit contamination after the reviewed fix", () => {
  const repo = setupRepository();
  try {
    releaseSessionStart(startInput(repo), { ownerToken: token });
    git(repo.workspace, "config", "user.email", "spipe-test@example.invalid"); git(repo.workspace, "config", "user.name", "SPipe Test");
    git(repo.workspace, "cherry-pick", repo.sourceCommit);
    writeFileSync(join(repo.workspace, "contamination.txt"), "unreviewed second commit\n"); git(repo.workspace, "add", "contamination.txt"); git(repo.workspace, "commit", "-m", "chore: contaminate backport range");
    const contaminatedHead = git(repo.workspace, "rev-parse", "HEAD");
    assert.throws(() => planInternalAuthenticatedBetaBackport(backportInput(repo, contaminatedHead), { ownerToken: token }), /result parent must be exactly expected_target_sha|multi-commit result ranges are unsupported/);
  } finally {
    try { git(repo.main, "worktree", "remove", "--force", repo.workspace); } catch { /* test cleanup */ }
    rmSync(repo.root, { recursive: true, force: true });
  }
});

test("semantic inversion cannot use token heuristics or a receipt for different Git evidence", () => {
  const repo = setupRepository();
  try {
    releaseSessionStart(startInput(repo), { ownerToken: token });
    git(repo.workspace, "config", "user.email", "spipe-test@example.invalid"); git(repo.workspace, "config", "user.name", "SPipe Test");
    writeFileSync(join(repo.workspace, "fix.txt"), "reviewed bug\n"); git(repo.workspace, "add", "fix.txt"); git(repo.workspace, "commit", "-m", "fix: invert reviewed repair");
    const invertedHead = git(repo.workspace, "rev-parse", "HEAD");
    const input = backportInput(repo, invertedHead, { adaptation_reason: "claim inverted behavior is an adaptation", adaptation_review_receipt_sha256: hash });
    assert.throws(() => planInternalAuthenticatedBetaBackport(input, { ownerToken: token }), /configured authenticated review broker/);
    assert.throws(() => planInternalAuthenticatedBetaBackport(input, brokerOptions({ signature_algorithm: "self_attested" })), /signature_algorithm has invalid format/);
    assert.throws(() => planInternalAuthenticatedBetaBackport(input, brokerOptions({ result_range_diff_sha256: "f".repeat(64) })), /result_range_diff_sha256 does not match actual Git evidence/);
  } finally {
    try { git(repo.main, "worktree", "remove", "--force", repo.workspace); } catch { /* test cleanup */ }
    rmSync(repo.root, { recursive: true, force: true });
  }
});

test("concurrent session starts use an atomic claim and create-once proof for the same session ID", async () => {
  const repo = setupRepository();
  try {
    const stateDirectory = join(repo.main, ".git", "spipe-release-sessions"); const lock = join(stateDirectory, "release-1.lock");
    mkdirSync(stateDirectory, { recursive: true }); writeFileSync(lock, "active concurrent claimant\n");
    assert.throws(() => releaseSessionStart(startInput(repo), { ownerToken: token }), /concurrently claimed|unresolved lock/);
    assert.equal(existsSync(repo.workspace), false); assert.equal(gitSucceeds(repo.main, "show-ref", "--verify", "--quiet", "refs/heads/work/release/v1.2.0-beta.1-release-1"), false);
    rmSync(lock);

    const otherWorkspace = join(repo.root, "other-worktree"); const gate = join(repo.root, "start-gate");
    const readyOne = join(repo.root, "ready-one"); const readyTwo = join(repo.root, "ready-two");
    const firstInput = startInput(repo); const secondInput = { ...firstInput, workspace_path: otherWorkspace, work_branch: "work/release/v1.2.0-beta.1-release-1-other" };
    const first = concurrentStart(firstInput, readyOne, gate); const second = concurrentStart(secondInput, readyTwo, gate);
    await waitForFiles([readyOne, readyTwo]); writeFileSync(gate, "go\n");
    const results = await Promise.all([first, second]);
    assert.equal(results.filter((result) => result.code === 0 && result.stdout === "started").length, 1);
    assert.equal(results.filter((result) => result.code === 2 && /concurrently claimed|already owned/.test(result.stdout)).length, 1);

    const proofPath = join(stateDirectory, "release-1.json"); const originalProof = readFileSync(proofPath, "utf8");
    assert.throws(() => releaseSessionStart({ ...startInput(repo), workspace_path: join(repo.root, "third-worktree"), work_branch: "work/release/v1.2.0-beta.1-release-1-third" }, { ownerToken: token }), /session_id is already owned/);
    assert.equal(readFileSync(proofPath, "utf8"), originalProof);
  } finally {
    try { git(repo.main, "worktree", "remove", "--force", repo.workspace); } catch { /* test cleanup */ }
    try { git(repo.main, "worktree", "remove", "--force", join(repo.root, "other-worktree")); } catch { /* test cleanup */ }
    rmSync(repo.root, { recursive: true, force: true });
  }
});

test("guarded session start rejects caller target drift before creating a worktree", () => {
  const repo = setupRepository();
  try {
    assert.throws(() => releaseSessionStart(startInput(repo), { env: {} }), /SPIPE_RELEASE_SESSION_TOKEN/);
    assert.equal(existsSync(repo.workspace), false);
    assert.throws(() => releaseSessionStart({ ...startInput(repo), expected_target_sha: repo.sourceCommit, base_sha: repo.sourceCommit }, { ownerToken: token }), /does not match the fetched target ref/);
    assert.equal(existsSync(repo.workspace), false);
  } finally { rmSync(repo.root, { recursive: true, force: true }); }
});
