import assert from "node:assert/strict";
import test from "node:test";

import {
  approveSelfReview, changedPathsManifestDigest, diffIdentityDigest, evaluateSelfReviewPrivilege,
  parseSelfReviewPolicy, planSelfReviewRequest, selfReviewSchemas
} from "../../src/review/self_review.js";
import { tools } from "../../mcp/protocol/tools.js";
import { tools as pluginTools } from "../../plugin/mcp/protocol/tools.js";

const head = "a".repeat(40); const baseHead = "9".repeat(40); const mergeBase = "8".repeat(40); const blob = "b".repeat(40); const receipt = "c".repeat(64);
const now = new Date("2026-08-27T12:00:00.000Z");
function request(overrides = {}) { return { schema: selfReviewSchemas.request, repo_id: "42", pull_request: 7, session_id: "session-7", reviewer_id: "codex:session-7", reviewer_provider: "openai", reviewer_model: "gpt-5.6-sol", higher_model_receipt_digest: receipt, request_id: "self-review-7", ...overrides }; }
function policy(...records) { return parseSelfReviewPolicy([JSON.stringify({ schema: selfReviewSchemas.policy_db, record_type: "header", default_allow: true }), ...records.map(JSON.stringify)].join("\n")); }
function change(path, overrides = {}) { return { status: "modified", old_path: path, new_path: path, old_blob_sha: blob, new_blob_sha: "d".repeat(40), old_mode: "100644", new_mode: "100644", semantic_flags: [], ...overrides }; }
function manifest(changes) { return { schema: selfReviewSchemas.path_manifest, repository: { provider: "github", id: 42, node_id: "R_42", name: "ormastes/Simple" }, pull_request_number: 7, head_sha: head, base_repository: { provider: "github", id: 42, node_id: "R_42", name: "ormastes/Simple" }, base_ref: "refs/heads/main", base_sha: baseHead, merge_base_sha: mergeBase, changes }; }
function authority(changes, overrides = {}) {
  const exactManifest = { ...manifest(changes), ...overrides.manifest }; const inputPolicy = overrides.policy || policy();
  return {
    integrationId: "github-app:31415",
    policy: inputPolicy,
    resolveSelfReview: () => { const manifestSha = changedPathsManifestDigest(exactManifest); const result = { schema: selfReviewSchemas.resolution, valid: true, integration_id: "github-app:31415", repo_id: "42", pull_request: 7, session_id: "session-7", request_id: "self-review-7", head_sha: head, base_repo_id: "42", base_ref: "refs/heads/main", base_sha: baseHead, merge_base_sha: mergeBase, diff_sha256: diffIdentityDigest(exactManifest, manifestSha), target_repo_id: "42", target_ref: "refs/heads/main", target_ruleset_id: "github:ruleset:123", strict_up_to_date: true, protected_target: true, manifest: exactManifest, changed_paths_manifest_sha256: manifestSha, policy_db_sha256: inputPolicy.policy_db_sha256, policy_authenticated: true, reviewer_id: "codex:session-7", reviewer_provider: "openai", reviewer_model: "gpt-5.6-sol", higher_model_receipt_digest: receipt, review_verdict: "pass", p0_findings: 0, p1_findings: 0, issued_at: "2026-08-27T11:00:00.000Z", expires_at: "2026-08-27T13:00:00.000Z", ...overrides.resolution }; if (overrides.omit_resolution_field) delete result[overrides.omit_resolution_field]; return result; },
    admitSelfReview: (command) => { const result = { admitted: true, integration_id: "github-app:31415", repo_id: command.repo_id, pull_request: command.pull_request, session_id: command.session_id, request_id: command.request_id, head_sha: command.head_sha, base_repo_id: command.base_repo_id, base_ref: command.base_ref, base_sha: command.base_sha, merge_base_sha: command.merge_base_sha, diff_sha256: command.diff_sha256, target_repo_id: command.target_repo_id, target_ref: command.target_ref, target_ruleset_id: command.target_ruleset_id, strict_up_to_date: command.strict_up_to_date, protected_target: command.protected_target, changed_paths_manifest_sha256: command.changed_paths_manifest_sha256, policy_audit_digest: command.policy_audit_digest, status_context: "SPipe Self Review Admission", check_run_id: "check:99", admitted_at: "2026-08-27T12:01:00.000Z", ...overrides.admission }; if (overrides.omit_admission_field) delete result[overrides.omit_admission_field]; return result; }
  };
}
function subject(overrides = {}) { return { schema: selfReviewSchemas.subject_policy, record_type: "subject_policy", policy_id: "policy-1", effect: "deny", repository_id: "42", session_id: "session-7", reviewer_id: "codex:session-7", allow_scopes: [], deny_scopes: [], issued_by: { type: "User", id: 2378857 }, issued_at: "2026-08-27T10:00:00.000Z", not_before: "2026-08-27T10:00:00.000Z", expires_at: "2026-08-27T14:00:00.000Z", issuer_key_id: "owner:key-1", previous_record_sha256: "", signature: "test-signature", ...overrides }; }

test("headless request plan cannot accept caller head or diff", () => {
  assert.equal(planSelfReviewRequest(request()).decision, "pending");
  assert.throws(() => planSelfReviewRequest({ ...request(), head_sha: head }), /unknown fields: head_sha/);
  assert.throws(() => planSelfReviewRequest({ ...request(), changed_paths: [] }), /unknown fields: changed_paths/);
});

test("MCP and plugin expose identical headless evaluate/admit request schemas", () => {
  assert.deepEqual(pluginTools, tools);
  for (const name of ["spipe_self_review_privilege_evaluate", "spipe_self_review_approve"]) {
    const tool = tools.find((candidate) => candidate.name === name); assert.ok(tool);
    assert.equal(Object.hasOwn(tool.inputSchema.properties, "head_sha"), false);
    assert.equal(Object.hasOwn(tool.inputSchema.properties, "changed_paths"), false);
  }
});

test("default allow covers ordinary code, text, and review policy after exact higher-model PASS", () => {
  const inputPolicy = policy(); const broker = authority([change("src/app/main.spl"), change("doc/guide.md"), change("src/review/admission.js")], { policy: inputPolicy });
  const decision = evaluateSelfReviewPrivilege(request(), inputPolicy, broker, now);
  assert.equal(decision.eligible, true); assert.equal(decision.reason_code, "default_allow_exact_review"); assert.deepEqual(decision.matched_restriction_ids, []);
});

test("fixed secret and policy DB restrictions cannot be overridden", () => {
  for (const [path, restriction] of [["config/.env.production", "SELF001"], [".spipe/self-review-policy.jsonl", "SELF005"]]) {
    const inputPolicy = policy(); const decision = evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change(path)], { policy: inputPolicy }), now);
    assert.equal(decision.eligible, false); assert.deepEqual(decision.matched_restriction_ids, [restriction]);
  }
  const inputPolicy = policy(); const semantic = change("doc/deployment.md", { semantic_flags: ["credentials_or_secrets"] });
  assert.equal(evaluateSelfReviewPrivilege(request(), inputPolicy, authority([semantic], { policy: inputPolicy }), now).reason_code, "fixed_restriction");
  const authoritySemantic = change("doc/ordinary-name.md", { semantic_flags: ["self_review_authority"] });
  const authorityDecision = evaluateSelfReviewPrivilege(request(), inputPolicy, authority([authoritySemantic], { policy: inputPolicy }), now);
  assert.deepEqual(authorityDecision.matched_restriction_ids, ["SELF004"]);
});

test("subject deny wins and constrain scopes narrow default allow", () => {
  const deniedPolicy = policy(subject());
  assert.equal(evaluateSelfReviewPrivilege(request(), deniedPolicy, authority([change("src/main.spl")], { policy: deniedPolicy }), now).reason_code, "subject_denied");
  const constrainedPolicy = policy(subject({ effect: "constrain", allow_scopes: [{ kind: "directory_files", path: "src/app" }], deny_scopes: [{ kind: "file", path: "src/app/blocked.spl" }] }));
  assert.equal(evaluateSelfReviewPrivilege(request(), constrainedPolicy, authority([change("src/app/main.spl")], { policy: constrainedPolicy }), now).eligible, true);
  assert.equal(evaluateSelfReviewPrivilege(request(), constrainedPolicy, authority([change("src/app/nested/main.spl")], { policy: constrainedPolicy }), now).reason_code, "constraint_not_satisfied");
  assert.equal(evaluateSelfReviewPrivilege(request(), constrainedPolicy, authority([change("src/app/blocked.spl")], { policy: constrainedPolicy }), now).reason_code, "path_denied");
});

test("rename evaluates both endpoints and symlink/traversal shapes fail closed", () => {
  const constrainedPolicy = policy(subject({ effect: "constrain", allow_scopes: [{ kind: "directory_recursive", path: "src/new" }], deny_scopes: [] }));
  const renamed = change("src/new/file.spl", { status: "renamed", old_path: "src/old/file.spl", new_path: "src/new/file.spl" });
  assert.equal(evaluateSelfReviewPrivilege(request(), constrainedPolicy, authority([renamed], { policy: constrainedPolicy }), now).eligible, false);
  const inputPolicy = policy();
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/../secret")], { policy: inputPolicy }), now), /traversal/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("link", { old_mode: "120000", new_mode: "120000" })], { policy: inputPolicy }), now), /symbolic link/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("module", { old_mode: "160000", new_mode: "160000" })], { policy: inputPolicy }), now), /submodule/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl", { old_mode: 100644 })], { policy: inputPolicy }), now), /Git mode/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl", { new_mode: "10064x" })], { policy: inputPolicy }), now), /Git mode/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl", { old_blob_sha: "" })], { policy: inputPolicy }), now), /old endpoint must be complete/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/new.spl", { status: "added", old_path: "", old_blob_sha: blob, old_mode: "" })], { policy: inputPolicy }), now), /old endpoint must be complete/);
});

test("broker-only approval emits an exact-head admission check, never a PR approval", () => {
  const inputPolicy = policy(); const broker = authority([change("src/main.spl")], { policy: inputPolicy });
  const admitted = approveSelfReview(request(), inputPolicy, broker, now);
  assert.equal(admitted.admitted, true); assert.equal(admitted.mutation, "provider_status_check"); assert.equal(admitted.status_context, "SPipe Self Review Admission"); assert.equal(Object.hasOwn(admitted, "provider_review_id"), false);
  assert.throws(() => approveSelfReview(request(), inputPolicy, { integrationId: "x", resolveSelfReview: broker.resolveSelfReview }, now), /admission broker/);
  const moved = authority([change("src/main.spl")], { policy: inputPolicy, admission: { head_sha: "e".repeat(40) } });
  assert.throws(() => approveSelfReview(request(), inputPolicy, moved, now), /head_sha mismatch/);
});

test("resolution is exact, authenticated, current, and bound to the higher-model receipt", () => {
  const inputPolicy = policy();
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, resolution: { review_verdict: "fail" } }), now), /higher-model PASS/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, resolution: { policy_authenticated: false } }), now), /authenticate/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, resolution: { head_sha: "e".repeat(40) } }), now), /manifest repository, PR, or head mismatch/);
  assert.throws(() => evaluateSelfReviewPrivilege(request({ session_id: "session-8" }), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy }), now), /session_id does not match/);
  assert.throws(() => evaluateSelfReviewPrivilege(request({ request_id: "self-review-8" }), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy }), now), /request_id does not match/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, resolution: { base_repo_id: "77" } }), now), /base_repo_id does not match/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, resolution: { base_ref: "refs/heads/release" } }), now), /base_ref does not match/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, resolution: { merge_base_sha: "7".repeat(40) } }), now), /merge_base_sha does not match/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, resolution: { diff_sha256: "f".repeat(64) } }), now), /diff identity mismatch/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, manifest: { base_repository: { provider: "github", id: {}, node_id: "R_42", name: "ormastes/Simple" } } }), now), /positive safe integer/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, resolution: { changed_paths_manifest_sha256: 42 } }), now), /manifest digest mismatch/);
});

test("admission re-resolution rejects session replay and base or diff retargeting", () => {
  const inputPolicy = policy();
  for (const admission of [
    { session_id: "session-8" }, { request_id: "self-review-8" },
    { base_repo_id: "77" }, { base_ref: "refs/heads/release" },
    { base_sha: "7".repeat(40) }, { merge_base_sha: "6".repeat(40) },
    { diff_sha256: "f".repeat(64) }, { target_repo_id: "77" },
    { target_ref: "refs/heads/release" }, { target_ruleset_id: "github:ruleset:999" },
    { strict_up_to_date: false }, { protected_target: false }
  ]) {
    assert.throws(() => approveSelfReview(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, admission }), now), /mismatch/);
  }
  assert.throws(() => approveSelfReview(request(), inputPolicy, authority([change("src/main.spl")], { policy: inputPolicy, omit_admission_field: "target_ruleset_id" }), now), /missing fields: target_ruleset_id/);
});

test("provider contract denies unprotected, non-strict, retargeted, or unprovable targets", () => {
  const inputPolicy = policy(); const changed = [change("src/main.spl")];
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority(changed, { policy: inputPolicy, resolution: { strict_up_to_date: false } }), now), /strict up-to-date/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority(changed, { policy: inputPolicy, resolution: { protected_target: false } }), now), /protected target/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority(changed, { policy: inputPolicy, resolution: { target_ref: "refs/heads/release" } }), now), /target repository\/ref/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority(changed, { policy: inputPolicy, resolution: { target_repo_id: "77" } }), now), /target repository\/ref/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority(changed, { policy: inputPolicy, resolution: { target_ruleset_id: "" } }), now), /target_ruleset_id/);
  assert.throws(() => evaluateSelfReviewPrivilege(request(), inputPolicy, authority(changed, { policy: inputPolicy, omit_resolution_field: "target_ruleset_id" }), now), /missing fields: target_ruleset_id/);
});
