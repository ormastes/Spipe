import { execFileSync } from "node:child_process";
import { randomUUID, timingSafeEqual } from "node:crypto";
import {
  closeSync, existsSync, linkSync, mkdirSync, openSync, readFileSync, readdirSync,
  realpathSync, renameSync, rmSync, statSync, writeFileSync
} from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";

import { digest, releaseOperations } from "./contract.js";
import { createReleasePlan } from "./planner.js";

export const sessionProofSchema = "spipe-session-proof/1";
export const verifiedReleasePlanSchema = "spipe-release-verified-plan/1";
export const adaptationReviewReceiptSchema = "spipe-beta-backport-adaptation-review/1";
export const publicAdaptedBackportUnsupported = "adapted beta backports are unsupported by the shipped CLI/MCP; use an exact patch-equivalent cherry-pick until an authenticated adaptation review broker is configured";
export const sessionStartFields = Object.freeze([
  "repository_path", "workspace_path", "main_workspace_path", "session_id", "owner_id",
  "work_branch", "target_ref", "remote_name", "base_sha", "expected_target_sha", "policy_sha256"
]);
export const sessionAccessFields = Object.freeze(["workspace_path", "session_id", "owner_id"]);
export const sessionSyncFields = Object.freeze([...sessionAccessFields, "expected_head_sha", "expected_target_sha"]);
export const verifiedBetaBackportFields = Object.freeze([...releaseOperations["beta-backport"], "adaptation_review_receipt_sha256", ...sessionAccessFields]);
export const verifiedCandidateFields = Object.freeze([...releaseOperations.candidate, ...sessionAccessFields]);

export function assertPublicExactBetaBackport(input) {
  if (!input || input.adaptation_reason !== "none" || (Object.hasOwn(input, "adaptation_review_receipt_sha256") && input.adaptation_review_receipt_sha256 !== "")) {
    throw new Error(publicAdaptedBackportUnsupported);
  }
}

const COMMIT = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;
const SHA256 = /^[0-9a-f]{64}$/;
const SIGNATURE_ALGORITHM = /^(?:ed25519|ecdsa-p256-sha256|rsa-pss-sha256)$/;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/;
const SAFE_SESSION_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const SAFE_REMOTE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const RELEASE_LINE = /^release\/(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const WORK_REF = /^work\/[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9./-]*$/;
const sessionStateFields = Object.freeze([
  "schema", "integrity", "repository_common_dir", "main_workspace_path", "workspace_path",
  "session_id", "owner_id", "owner_token_sha256", "work_branch", "target_ref", "remote_name",
  "base_sha", "expected_target_sha", "checkpoint_head_sha", "policy_sha256", "created_at", "updated_at",
  "proof_sha256"
]);

function exactFields(input, fields, label) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error(`${label} must be a JSON object`);
  const unknown = Object.keys(input).filter((key) => !fields.includes(key)).sort();
  const missing = fields.filter((key) => !Object.hasOwn(input, key));
  if (unknown.length) throw new Error(`${label} contains unknown fields: ${unknown.join(", ")}`);
  if (missing.length) throw new Error(`${label} is missing fields: ${missing.join(", ")}`);
}
function text(input, key) {
  const value = input[key];
  if (typeof value !== "string" || value.trim() === "" || value !== value.trim() || /[\0\r\n]/.test(value)) throw new Error(`${key} is required and must be canonical single-line text`);
  return value;
}
function match(input, key, pattern) { const value = text(input, key); if (!pattern.test(value)) throw new Error(`${key} has invalid format`); return value; }
function canonicalTimestamp(value, key) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) throw new Error(`${key} must be a canonical UTC ISO timestamp`);
  return parsed;
}
function canonicalExistingDirectory(path, label) {
  if (!isAbsolute(path)) throw new Error(`${label} must be absolute`);
  try { if (!statSync(path).isDirectory()) throw new Error("not directory"); return realpathSync.native(resolve(path)); }
  catch { throw new Error(`${label} must identify an existing physical directory`); }
}
function canonicalNewDirectory(path, label) {
  if (!isAbsolute(path) || basename(path) === "." || basename(path) === "..") throw new Error(`${label} must be an absolute new directory path`);
  if (existsSync(path)) throw new Error(`${label} must not already exist`);
  const parent = canonicalExistingDirectory(dirname(path), `${label} parent`);
  return join(parent, basename(path));
}
function safeTarget(value) { if (value !== "main" && !RELEASE_LINE.test(value)) throw new Error("target_ref must be main or release/X.Y"); return value; }
function safeWorkBranch(value) {
  if (!WORK_REF.test(value) || value.includes("..") || value.includes("//") || value.endsWith("/")) throw new Error("work_branch must be one safe owned work/* ref");
  return value;
}
function ownerToken(options) {
  const token = options.ownerToken || (options.env || process.env).SPIPE_RELEASE_SESSION_TOKEN;
  if (typeof token !== "string" || token.length < 32 || /[\0\r\n]/.test(token)) throw new Error("SPIPE_RELEASE_SESSION_TOKEN must be configured with at least 32 canonical characters");
  return token;
}
function ownerTokenSha256(token) { return digest({ domain: "spipe-release-session-owner-token/1", token }); }
function equalDigest(left, right) {
  if (!SHA256.test(left) || !SHA256.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}
function runGit(cwd, args, options = {}) {
  try {
    return execFileSync(options.gitCommand || "git", args, {
      cwd, encoding: "utf8", timeout: options.timeoutMs || 60_000, maxBuffer: 1024 * 1024,
      env: options.env || process.env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"]
    }).trim();
  } catch (error) {
    const detail = String(error.stderr || error.stdout || "").trim().split(/\r?\n/).slice(-1)[0];
    throw new Error(`git ${args[0]} failed${detail ? `: ${detail}` : ""}`);
  }
}
function runGitRaw(cwd, args, options = {}) {
  try {
    return execFileSync(options.gitCommand || "git", args, {
      cwd, encoding: "utf8", timeout: options.timeoutMs || 60_000, maxBuffer: 4 * 1024 * 1024,
      env: options.env || process.env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"]
    });
  } catch (error) {
    const detail = String(error.stderr || error.stdout || "").trim().split(/\r?\n/).slice(-1)[0];
    throw new Error(`git ${args[0]} failed${detail ? `: ${detail}` : ""}`);
  }
}
function runGitWithInput(cwd, args, input, options = {}) {
  try {
    return execFileSync(options.gitCommand || "git", args, {
      cwd, input, encoding: "utf8", timeout: options.timeoutMs || 60_000, maxBuffer: 4 * 1024 * 1024,
      env: options.env || process.env, windowsHide: true, stdio: ["pipe", "pipe", "pipe"]
    }).trim();
  } catch (error) {
    const detail = String(error.stderr || error.stdout || "").trim().split(/\r?\n/).slice(-1)[0];
    throw new Error(`git ${args[0]} failed${detail ? `: ${detail}` : ""}`);
  }
}
function gitSucceeds(cwd, args, options = {}) {
  try { runGit(cwd, args, options); return true; } catch { return false; }
}
function commitPatch(workspace, commit, options = {}) {
  const ancestry = runGit(workspace, ["rev-list", "--parents", "-n", "1", commit], options).split(/\s+/);
  if (ancestry.length !== 2) throw new Error("backport source and result must each be one non-merge commit");
  return runGitRaw(workspace, ["show", "--format=", "--full-index", "--binary", commit], options);
}
function stablePatchId(workspace, patch, options = {}) {
  const output = runGitWithInput(workspace, ["patch-id", "--stable"], patch, options); const value = output.split(/\s+/)[0] || "";
  if (!COMMIT.test(value)) throw new Error("Git could not derive one stable patch-id");
  return value;
}
function changedPathsForCommit(workspace, commit, options = {}) {
  return runGit(workspace, ["diff-tree", "--no-commit-id", "--name-only", "-r", commit], options).split(/\r?\n/).filter(Boolean).sort();
}
function rangePatch(workspace, base, result, options = {}) {
  return runGitRaw(workspace, ["diff", "--full-index", "--binary", base, result], options);
}
function changedPathsForRange(workspace, base, result, options = {}) {
  return runGit(workspace, ["diff", "--name-only", base, result], options).split(/\r?\n/).filter(Boolean).sort();
}
function validateAdaptationReceipt(options, facts, claimedReceiptSha256) {
  const broker = options.backportReviewBroker;
  if (!broker || typeof broker !== "object" || typeof broker.verifyAdaptationReceipt !== "function" || typeof broker.integrationId !== "string" || broker.integrationId.trim() === "") {
    throw new Error("adapted backport planning requires a configured authenticated review broker");
  }
  const receipt = broker.verifyAdaptationReceipt(Object.freeze({ ...facts, claimed_receipt_sha256: claimedReceiptSha256 }));
  const fields = [
    "schema", "valid", "issuer_integration_id", "reviewer_identity", "review_identity_authenticated",
    "signature_verified", "signature_algorithm", "signer_key_id", "source_commit_sha", "expected_target_sha",
    "result_commit_sha", "source_diff_sha256", "result_range_diff_sha256", "source_tree_oid", "target_tree_oid",
    "result_tree_oid", "source_changed_paths_sha256", "result_changed_paths_sha256", "issued_at", "expires_at",
    "receipt_sha256"
  ];
  exactFields(receipt, fields, "adaptation review broker receipt");
  if (receipt.schema !== adaptationReviewReceiptSchema || receipt.valid !== true || receipt.issuer_integration_id !== broker.integrationId) throw new Error("adaptation review broker did not return a valid pinned receipt");
  if (receipt.review_identity_authenticated !== true || receipt.signature_verified !== true) throw new Error("adaptation review receipt lacks authenticated review identity or verified signature");
  match(receipt, "reviewer_identity", SAFE_ID); match(receipt, "signature_algorithm", SIGNATURE_ALGORITHM); match(receipt, "signer_key_id", SAFE_ID);
  for (const [key, value] of Object.entries(facts)) if (receipt[key] !== value) throw new Error(`adaptation review receipt ${key} does not match actual Git evidence`);
  if (receipt.receipt_sha256 !== claimedReceiptSha256 || !SHA256.test(receipt.receipt_sha256)) throw new Error("adaptation review receipt digest mismatch");
  const issuedAt = canonicalTimestamp(receipt.issued_at, "adaptation review receipt issued_at");
  const expiresAt = canonicalTimestamp(receipt.expires_at, "adaptation review receipt expires_at");
  const now = (options.now || new Date()).getTime();
  if (issuedAt > now || expiresAt <= issuedAt || now >= expiresAt) throw new Error("adaptation review receipt is not currently valid");
  return Object.freeze(receipt);
}
function worktrees(cwd, options = {}) {
  const output = runGit(cwd, ["worktree", "list", "--porcelain"], options);
  if (!output) return [];
  return output.split(/\r?\n\r?\n/).map((block) => {
    const item = {};
    for (const line of block.split(/\r?\n/)) {
      const space = line.indexOf(" "); const key = space < 0 ? line : line.slice(0, space); const value = space < 0 ? true : line.slice(space + 1);
      item[key] = value;
    }
    return item;
  });
}
function commonDirectory(cwd, options = {}) {
  const value = runGit(cwd, ["rev-parse", "--git-common-dir"], options);
  return realpathSync.native(isAbsolute(value) ? value : resolve(cwd, value));
}
function stateDirectory(commonDir) { return join(commonDir, "spipe-release-sessions"); }
function statePath(commonDir, sessionId) { return join(stateDirectory(commonDir), `${sessionId}.json`); }
function lockPath(commonDir, sessionId) { return join(stateDirectory(commonDir), `${sessionId}.lock`); }
function acquireSessionLock(commonDir, sessionId) {
  const directory = stateDirectory(commonDir); mkdirSync(directory, { recursive: true, mode: 0o700 });
  let descriptor;
  try { descriptor = openSync(lockPath(commonDir, sessionId), "wx", 0o600); }
  catch { throw new Error("release session_id is concurrently claimed or has an unresolved lock"); }
  return () => { try { closeSync(descriptor); } finally { rmSync(lockPath(commonDir, sessionId), { force: true }); } };
}
function proofBody(state) { const { proof_sha256: _proof, ...body } = state; return body; }
function validateState(state) {
  if (!state || typeof state !== "object" || Array.isArray(state) || state.schema !== sessionProofSchema) throw new Error("release session proof has invalid schema");
  exactFields(state, sessionStateFields, "release session proof");
  if (!SAFE_SESSION_ID.test(state.session_id) || !SAFE_ID.test(state.owner_id) || !SHA256.test(state.owner_token_sha256) || !SHA256.test(state.proof_sha256)) throw new Error("release session proof has invalid identity fields");
  if (state.integrity !== "self_hash_not_signature" || !COMMIT.test(state.base_sha) || !COMMIT.test(state.expected_target_sha) || !COMMIT.test(state.checkpoint_head_sha) || !SHA256.test(state.policy_sha256)) throw new Error("release session proof has invalid bound facts");
  safeWorkBranch(state.work_branch); safeTarget(state.target_ref);
  if (!SAFE_REMOTE.test(state.remote_name) || ![state.repository_common_dir, state.main_workspace_path, state.workspace_path].every(isAbsolute)) throw new Error("release session proof has invalid repository paths or remote");
  const created = canonicalTimestamp(state.created_at, "release session proof created_at"); const updated = canonicalTimestamp(state.updated_at, "release session proof updated_at");
  if (updated < created) throw new Error("release session proof updated_at precedes created_at");
  if (!equalDigest(state.proof_sha256, digest(proofBody(state)))) throw new Error("release session proof self-hash mismatch");
  return state;
}
function readState(commonDir, sessionId) {
  if (!SAFE_SESSION_ID.test(sessionId)) throw new Error("session_id must be one safe identifier");
  let state;
  try { state = JSON.parse(readFileSync(statePath(commonDir, sessionId), "utf8")); }
  catch { throw new Error("release session proof is missing or unreadable"); }
  return validateState(state);
}
function writeState(commonDir, state, options = {}) {
  const directory = stateDirectory(commonDir); mkdirSync(directory, { recursive: true, mode: 0o700 });
  const complete = Object.freeze({ ...state, proof_sha256: digest(state) });
  const temporary = join(directory, `.${state.session_id}.${randomUUID()}.tmp`);
  try {
    writeFileSync(temporary, `${JSON.stringify(complete, null, 2)}\n`, { encoding: "utf8", flag: "wx", mode: 0o600 });
    if (options.createOnly === true) linkSync(temporary, statePath(commonDir, state.session_id));
    else {
      if (!SHA256.test(options.expectedProofSha256 || "")) throw new Error("release session proof update requires an expected proof SHA-256");
      const current = readState(commonDir, state.session_id);
      if (!equalDigest(current.proof_sha256, options.expectedProofSha256)) throw new Error("release session proof compare-and-swap mismatch");
      renameSync(temporary, statePath(commonDir, state.session_id));
    }
  }
  catch (error) {
    if (error?.code === "EEXIST") throw new Error("release session proof is create-once and already exists");
    throw error;
  }
  finally { rmSync(temporary, { force: true }); }
  return complete;
}
function assertUniqueState(commonDir, sessionId, workspacePath, workBranch) {
  const directory = stateDirectory(commonDir);
  if (!existsSync(directory)) return;
  for (const name of readdirSync(directory).filter((entry) => entry.endsWith(".json"))) {
    let existing;
    try { existing = validateState(JSON.parse(readFileSync(join(directory, name), "utf8"))); }
    catch { throw new Error(`existing release session proof is invalid: ${name}`); }
    if (existing.session_id === sessionId) throw new Error("session_id is already owned");
    if (existing.workspace_path === workspacePath) throw new Error("workspace_path is already owned by another release session");
    if (existing.work_branch === workBranch) throw new Error("work_branch is already owned by another release session");
  }
}
function publicState(state) { const { owner_token_sha256: _ownerToken, ...visible } = state; return visible; }
function currentBranch(workspace, options = {}) { return runGit(workspace, ["symbolic-ref", "--quiet", "--short", "HEAD"], options); }
function currentHead(workspace, options = {}) { return runGit(workspace, ["rev-parse", "--verify", "HEAD"], options); }
function targetTrackingRef(state) { return `refs/remotes/${state.remote_name}/${state.target_ref}`; }
function verifyOwner(state, input, options) {
  if (state.owner_id !== input.owner_id) throw new Error("release session owner_id mismatch");
  if (!equalDigest(state.owner_token_sha256, ownerTokenSha256(ownerToken(options)))) throw new Error("release session ownership token mismatch");
}
function coreSessionChecksPass(checks) {
  return Object.entries(checks).filter(([key]) => !["clean", "head_matches_checkpoint", "target_ref_resolves", "target_matches_recorded_base"].includes(key)).every(([, value]) => value === true);
}
function statusFromState(workspace, commonDir, state, options = {}) {
  const list = worktrees(workspace, options); const branchRef = `refs/heads/${state.work_branch}`;
  const pathMatches = list.filter((item) => { try { return realpathSync.native(item.worktree) === workspace; } catch { return false; } });
  const branchMatches = list.filter((item) => item.branch === branchRef);
  const branch = currentBranch(workspace, options); const head = currentHead(workspace, options);
  const mergeBase = runGit(workspace, ["merge-base", state.base_sha, head], options);
  const baseAncestor = gitSucceeds(workspace, ["merge-base", "--is-ancestor", state.base_sha, head], options);
  let targetSha = ""; try { targetSha = runGit(workspace, ["rev-parse", "--verify", targetTrackingRef(state)], options); } catch { /* reported below */ }
  const checks = Object.freeze({
    repository_common_dir_matches: commonDir === state.repository_common_dir,
    workspace_matches: workspace === state.workspace_path,
    main_workspace_is_distinct: state.main_workspace_path !== workspace,
    branch_matches: branch === state.work_branch,
    head_matches_checkpoint: head === state.checkpoint_head_sha,
    base_is_ancestor: baseAncestor,
    merge_base_matches: mergeBase === state.base_sha,
    unique_worktree_path: pathMatches.length === 1,
    unique_worktree_branch: branchMatches.length === 1,
    clean: runGit(workspace, ["status", "--porcelain=v1", "--untracked-files=normal"], options) === "",
    target_ref_resolves: COMMIT.test(targetSha),
    target_matches_recorded_base: targetSha === state.expected_target_sha
  });
  const coreValid = coreSessionChecksPass(checks);
  const valid = coreValid && checks.target_ref_resolves && checks.target_matches_recorded_base;
  return Object.freeze({ schema: "spipe-session-status/1", valid, ready_for_mutation: valid && checks.clean, mutation: "none", session: publicState(state), actual: Object.freeze({ workspace_path: workspace, branch, head_sha: head, merge_base_sha: mergeBase, target_sha: targetSha }), checks });
}

export function releaseSessionStart(input, options = {}) {
  exactFields(input, sessionStartFields, "release session start");
  const repository = canonicalExistingDirectory(text(input, "repository_path"), "repository_path");
  const mainWorkspace = canonicalExistingDirectory(text(input, "main_workspace_path"), "main_workspace_path");
  const workspace = canonicalNewDirectory(text(input, "workspace_path"), "workspace_path");
  const sessionId = match(input, "session_id", SAFE_SESSION_ID); const ownerId = match(input, "owner_id", SAFE_ID);
  const branch = safeWorkBranch(text(input, "work_branch")); const targetRef = safeTarget(text(input, "target_ref")); const remote = match(input, "remote_name", SAFE_REMOTE);
  const baseSha = match(input, "base_sha", COMMIT); const expectedTarget = match(input, "expected_target_sha", COMMIT); match(input, "policy_sha256", SHA256);
  const ownerHash = ownerTokenSha256(ownerToken(options));
  if (baseSha !== expectedTarget) throw new Error("base_sha must equal expected_target_sha at session creation");
  const actualRoot = realpathSync.native(runGit(repository, ["rev-parse", "--show-toplevel"], options));
  if (actualRoot !== repository || repository !== mainWorkspace) throw new Error("repository_path and main_workspace_path must identify the physical main worktree root");
  const commonDir = commonDirectory(repository, options);
  let primaryWorktree;
  try { primaryWorktree = realpathSync.native(dirname(commonDir)); } catch { throw new Error("Git common directory does not identify a physical primary worktree"); }
  if (primaryWorktree !== mainWorkspace) throw new Error("main_workspace_path must be the primary Git worktree, not a linked worktree");
  const releaseLock = acquireSessionLock(commonDir, sessionId);
  try {
    const listed = worktrees(repository, options);
    if (listed.filter((item) => { try { return realpathSync.native(item.worktree) === mainWorkspace; } catch { return false; } }).length !== 1) throw new Error("main_workspace_path must identify exactly one registered Git worktree");
    assertUniqueState(commonDir, sessionId, workspace, branch);
    if (listed.some((item) => item.branch === `refs/heads/${branch}`) || gitSucceeds(repository, ["show-ref", "--verify", "--quiet", `refs/heads/${branch}`], options)) throw new Error("work_branch already exists or is checked out");
    runGit(repository, ["check-ref-format", "--branch", branch], options);
    runGit(repository, ["remote", "get-url", remote], options);
    runGit(repository, ["fetch", "--no-tags", remote, `+refs/heads/${targetRef}:refs/remotes/${remote}/${targetRef}`], options);
    const observedTarget = runGit(repository, ["rev-parse", "--verify", `refs/remotes/${remote}/${targetRef}`], options);
    if (observedTarget !== expectedTarget) throw new Error("expected_target_sha does not match the fetched target ref");
    let created = false; let stateCreated = false;
    try {
      runGit(repository, ["worktree", "add", "--no-track", "-b", branch, workspace, baseSha], options); created = true;
      const physicalWorkspace = canonicalExistingDirectory(workspace, "created workspace_path");
      if (physicalWorkspace !== workspace || currentBranch(workspace, options) !== branch || currentHead(workspace, options) !== baseSha) throw new Error("created worktree does not match requested path, branch, and base");
      const timestamp = (options.now || new Date()).toISOString();
      const state = writeState(commonDir, {
        schema: sessionProofSchema, integrity: "self_hash_not_signature", repository_common_dir: commonDir,
        main_workspace_path: mainWorkspace, workspace_path: workspace, session_id: sessionId, owner_id: ownerId,
        owner_token_sha256: ownerHash, work_branch: branch, target_ref: targetRef,
        remote_name: remote, base_sha: baseSha, expected_target_sha: expectedTarget, checkpoint_head_sha: baseSha,
        policy_sha256: input.policy_sha256, created_at: timestamp, updated_at: timestamp
      }, { createOnly: true }); stateCreated = true;
      const status = statusFromState(workspace, commonDir, state, options);
      if (!status.valid) throw new Error("created release session failed actual Git verification");
      return Object.freeze({ schema: "spipe-session-start-result/1", mutation: "local_git_worktree_and_branch", protected_ref_mutation: false, fetched_target_ref: `refs/remotes/${remote}/${targetRef}`, session: publicState(state), status });
    } catch (error) {
      if (stateCreated) rmSync(statePath(commonDir, sessionId), { force: true });
      if (created) {
        try { runGit(repository, ["worktree", "remove", "--force", workspace], options); } catch { /* best-effort rollback of this newly created path */ }
        try { runGit(repository, ["branch", "-D", branch], options); } catch { /* best-effort rollback of this newly created branch */ }
      }
      throw error;
    }
  } finally { releaseLock(); }
}

export function releaseSessionStatus(input, options = {}) {
  exactFields(input, sessionAccessFields, "release session status");
  const workspace = canonicalExistingDirectory(text(input, "workspace_path"), "workspace_path"); const sessionId = match(input, "session_id", SAFE_SESSION_ID); match(input, "owner_id", SAFE_ID);
  const commonDir = commonDirectory(workspace, options); const state = readState(commonDir, sessionId); verifyOwner(state, input, options);
  return statusFromState(workspace, commonDir, state, options);
}

export function releaseSessionSync(input, options = {}) {
  exactFields(input, sessionSyncFields, "release session sync"); match(input, "expected_head_sha", COMMIT); match(input, "expected_target_sha", COMMIT);
  const workspace = canonicalExistingDirectory(text(input, "workspace_path"), "workspace_path"); const sessionId = match(input, "session_id", SAFE_SESSION_ID);
  const commonDir = commonDirectory(workspace, options); const releaseLock = acquireSessionLock(commonDir, sessionId);
  try {
    const access = Object.fromEntries(sessionAccessFields.map((field) => [field, input[field]])); const before = releaseSessionStatus(access, options);
    if (!coreSessionChecksPass(before.checks) || !before.checks.clean) throw new Error("release session must have valid core proof and a clean worktree before sync");
    if (before.actual.head_sha !== input.expected_head_sha) throw new Error("expected_head_sha does not match the actual session HEAD");
    const state = before.session;
    runGit(workspace, ["fetch", "--no-tags", state.remote_name, `+refs/heads/${state.target_ref}:refs/remotes/${state.remote_name}/${state.target_ref}`], options);
    const fetchedTarget = runGit(workspace, ["rev-parse", "--verify", targetTrackingRef(state)], options);
    if (fetchedTarget !== input.expected_target_sha) throw new Error("expected_target_sha does not match the fetched target ref");
    const currentState = readState(commonDir, sessionId); verifyOwner(currentState, input, options);
    if (!equalDigest(currentState.proof_sha256, before.session.proof_sha256)) throw new Error("release session proof changed during sync");
    const guarded = statusFromState(workspace, commonDir, currentState, options);
    if (!coreSessionChecksPass(guarded.checks) || !guarded.checks.clean || guarded.actual.head_sha !== input.expected_head_sha) throw new Error("release session Git state changed during sync");
    try { runGit(workspace, ["rebase", fetchedTarget], options); }
    catch (error) { try { runGit(workspace, ["rebase", "--abort"], options); } catch { /* preserve original failure */ } throw error; }
    const head = currentHead(workspace, options); const timestamp = (options.now || new Date()).toISOString();
    let updated;
    try { updated = writeState(commonDir, { ...proofBody(currentState), base_sha: fetchedTarget, expected_target_sha: fetchedTarget, checkpoint_head_sha: head, updated_at: timestamp }, { expectedProofSha256: currentState.proof_sha256 }); }
    catch (error) { try { runGit(workspace, ["reset", "--hard", before.actual.head_sha], options); } catch { /* preserve proof CAS failure */ } throw error; }
    const after = statusFromState(workspace, commonDir, updated, options);
    if (!after.valid || !after.checks.clean) throw new Error("synced release session failed actual Git verification");
    return Object.freeze({ schema: "spipe-session-sync-result/1", mutation: "fetch_and_rebase_owned_session_branch", protected_ref_mutation: false, previous_head_sha: before.actual.head_sha, previous_base_sha: before.session.base_sha, head_sha: head, base_sha: fetchedTarget, session: publicState(updated), status: after });
  } finally { releaseLock(); }
}

function verifiedEnvelope(operation, releasePlan, status, gitFacts) {
  const body = { schema: verifiedReleasePlanSchema, operation, mutation: "none", session_proof_sha256: status.session.proof_sha256, git: gitFacts, release_plan: releasePlan };
  return Object.freeze({ ...body, verified_plan_sha256: digest(body) });
}
function requirePlanningSession(input, operationFields, options) {
  const access = Object.fromEntries(sessionAccessFields.map((field) => [field, input[field]])); const status = releaseSessionStatus(access, options);
  if (!status.valid || !status.checks.clean) throw new Error("verified release planning requires a valid clean owned session");
  const releaseInput = Object.fromEntries(operationFields.map((field) => [field, input[field]]));
  return { status, releaseInput };
}
// Future broker integration contract. Shipped CLI/MCP call only the exact-only
// public wrapper below and cannot inject this authority.
export function planInternalAuthenticatedBetaBackport(input, options = {}) {
  exactFields(input, verifiedBetaBackportFields, "verified beta backport plan");
  const { status, releaseInput } = requirePlanningSession(input, releaseOperations["beta-backport"], options); const releasePlan = createReleasePlan("beta-backport", releaseInput);
  if (status.session.target_ref !== input.target_line || status.session.base_sha !== input.expected_target_sha) throw new Error("beta backport target line/base does not match the owned session proof");
  if (status.actual.head_sha !== input.result_commit_sha) throw new Error("beta backport result_commit_sha does not match the actual session HEAD");
  const workspace = status.actual.workspace_path;
  if (runGit(workspace, ["cat-file", "-t", input.source_commit_sha], options) !== "commit") throw new Error("source_commit_sha is not an actual Git commit");
  if (input.direction === "main_to_beta" && !gitSucceeds(workspace, ["merge-base", "--is-ancestor", input.source_commit_sha, `refs/remotes/${status.session.remote_name}/main`], options)) throw new Error("source_commit_sha is not reachable from the actual remote main ref");
  const resultAncestry = runGit(workspace, ["rev-list", "--parents", "-n", "1", input.result_commit_sha], options).split(/\s+/);
  if (resultAncestry.length !== 2 || resultAncestry[1] !== input.expected_target_sha) throw new Error("backport result parent must be exactly expected_target_sha; multi-commit result ranges are unsupported");
  const sourcePatch = commitPatch(workspace, input.source_commit_sha, options); const resultPatch = rangePatch(workspace, input.expected_target_sha, input.result_commit_sha, options);
  const sourcePatchId = stablePatchId(workspace, sourcePatch, options); const resultPatchId = stablePatchId(workspace, resultPatch, options);
  const sourcePaths = changedPathsForCommit(workspace, input.source_commit_sha, options); const resultPaths = changedPathsForRange(workspace, input.expected_target_sha, input.result_commit_sha, options);
  if (sourcePaths.length === 0 || resultPaths.length === 0) throw new Error("backport source and result commits must each change at least one path");
  const sourceDiffSha256 = digest({ domain: "spipe-git-diff/1", patch: sourcePatch });
  const resultRangeDiffSha256 = digest({ domain: "spipe-git-diff/1", patch: resultPatch });
  const sourceTreeOid = runGit(workspace, ["rev-parse", `${input.source_commit_sha}^{tree}`], options);
  const targetTreeOid = runGit(workspace, ["rev-parse", `${input.expected_target_sha}^{tree}`], options);
  const resultTreeOid = runGit(workspace, ["rev-parse", `${input.result_commit_sha}^{tree}`], options);
  const exactPatch = sourcePatchId === resultPatchId;
  if (exactPatch && input.adaptation_reason !== "none") throw new Error("adaptation_reason must be none when stable source and result patch-ids are equal");
  if (exactPatch && input.adaptation_review_receipt_sha256 !== "") throw new Error("exact patch-id backports must not claim an adaptation review receipt");
  let adaptationReceipt = null;
  if (!exactPatch) {
    if (input.adaptation_reason === "none") throw new Error("result commit does not apply the reviewed source fix: stable patch-id mismatch without adaptation");
    if (!SHA256.test(input.adaptation_review_receipt_sha256)) throw new Error("adapted backport requires adaptation_review_receipt_sha256");
    const receiptFacts = Object.freeze({
      source_commit_sha: input.source_commit_sha, expected_target_sha: input.expected_target_sha, result_commit_sha: input.result_commit_sha,
      source_diff_sha256: sourceDiffSha256, result_range_diff_sha256: resultRangeDiffSha256,
      source_tree_oid: sourceTreeOid, target_tree_oid: targetTreeOid, result_tree_oid: resultTreeOid,
      source_changed_paths_sha256: digest({ domain: "spipe-changed-paths/1", paths: sourcePaths }),
      result_changed_paths_sha256: digest({ domain: "spipe-changed-paths/1", paths: resultPaths })
    });
    adaptationReceipt = validateAdaptationReceipt(options, receiptFacts, input.adaptation_review_receipt_sha256);
  }
  const relationshipBody = {
    domain: "spipe-beta-backport-relation/2", mode: exactPatch ? "stable_patch_id" : "broker_reviewed_adaptation",
    source_commit_sha: input.source_commit_sha, result_commit_sha: input.result_commit_sha,
    result_parent_sha: resultAncestry[1],
    expected_target_sha: input.expected_target_sha, adaptation_reason: input.adaptation_reason,
    adaptation_review_receipt_sha256: input.adaptation_review_receipt_sha256,
    adaptation_review: adaptationReceipt,
    source_patch_id: sourcePatchId, result_range_patch_id: resultPatchId,
    source_diff_sha256: sourceDiffSha256, result_range_diff_sha256: resultRangeDiffSha256,
    source_tree_oid: sourceTreeOid, target_tree_oid: targetTreeOid, result_tree_oid: resultTreeOid,
    source_changed_paths: sourcePaths, result_range_changed_paths: resultPaths
  };
  const relationship = Object.freeze({ ...relationshipBody, relationship_sha256: digest(relationshipBody) });
  return verifiedEnvelope("beta-backport", releasePlan, status, Object.freeze({ workspace_path: workspace, branch: status.actual.branch, head_sha: status.actual.head_sha, base_sha: status.session.base_sha, source_commit_sha: input.source_commit_sha, changed_paths: Object.freeze(sourcePaths), relationship }));
}
export function planPublicVerifiedBetaBackport(input, options = {}) {
  assertPublicExactBetaBackport(input);
  const { backportReviewBroker: _privateFutureBroker, ...publicOptions } = options;
  return planInternalAuthenticatedBetaBackport(input, publicOptions);
}
export function planVerifiedCandidate(input, options = {}) {
  exactFields(input, verifiedCandidateFields, "verified candidate plan");
  const { status, releaseInput } = requirePlanningSession(input, releaseOperations.candidate, options); const releasePlan = createReleasePlan("candidate", releaseInput);
  if (status.actual.head_sha !== input.commit_sha) throw new Error("candidate commit_sha does not match the actual session HEAD");
  if (status.session.policy_sha256 !== input.policy_sha256) throw new Error("candidate policy_sha256 does not match the owned session proof");
  const workspace = status.actual.workspace_path; const candidateRef = `refs/heads/${input.candidate_ref}`;
  const localRefs = runGit(workspace, ["for-each-ref", "--format=%(refname)"], options).split(/\r?\n/).filter(Boolean);
  if (localRefs.some((ref) => ref === candidateRef || ref.endsWith(`/${input.candidate_ref}`))) throw new Error("candidate_ref already exists locally and is create-once");
  const remoteRefs = runGit(workspace, ["ls-remote", "--refs", status.session.remote_name, candidateRef, `refs/tags/${input.candidate_ref}`, `refs/${input.candidate_ref}`], options);
  if (remoteRefs !== "") throw new Error("candidate_ref already exists remotely and is create-once");
  const gitTreeOid = runGit(workspace, ["rev-parse", `${input.commit_sha}^{tree}`], options);
  return verifiedEnvelope("candidate", releasePlan, status, Object.freeze({ workspace_path: workspace, branch: status.actual.branch, head_sha: status.actual.head_sha, base_sha: status.session.base_sha, git_tree_oid: gitTreeOid, candidate_ref_absent: true }));
}
