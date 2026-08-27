import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { extname, posix } from "node:path";
import { digest } from "../release/contract.js";
import { exactFields } from "./contract.js";

export const selfReviewSchemas = Object.freeze({ request: "spipe-self-review-request/2", policy_db: "spipe-self-review-policy-db/2", subject_policy: "spipe-self-review-subject-policy/2", path_manifest: "spipe-changed-path-manifest/1", resolution: "spipe-self-review-resolution/2", decision: "spipe-self-review-decision/2", admission_command: "spipe-self-review-admission-command/2", admission: "spipe-self-review-admission/2" });
export const selfReviewRequestFields = Object.freeze(["schema", "repo_id", "pull_request", "session_id", "reviewer_id", "reviewer_provider", "reviewer_model", "higher_model_receipt_digest", "user_authorization_actor", "user_authorization_receipt_digest", "user_authorized_at", "request_id"]);
export const fixedSelfReviewRestrictions = Object.freeze([
  Object.freeze({ id: "SELF001", description: "credentials, secrets, private keys, certificates, and secret-bearing environment files" }),
  Object.freeze({ id: "SELF002", description: "live ruleset or environment policy authority" }),
  Object.freeze({ id: "SELF003", description: "signing or publication authority" }),
  Object.freeze({ id: "SELF004", description: "review approval, workflow, or self-review authority, independent of its filename" }),
  Object.freeze({ id: "SELF005", description: "the external self-review policy DB and checked-in authority projections" })
]);
export const selfReviewProviderGuidance = Object.freeze({
  provider: "github",
  provider_review_action: "none",
  provider_review_reason: "GitHub forbids a pull-request author from submitting an APPROVED review on their own pull request.",
  admission_action: "emit the broker-owned SPipe Self Review Admission required check with bound expiry and registered fail-closed invalidation",
  authorization_requirement: "the user must request or authorize self-review; default eligibility never authorizes automatic use"
});
export const selfReviewDecisionGuidance = Object.freeze({
  default_allow_exact_review: Object.freeze({
    reason: "ordinary reviewed code/text passed the exact-head higher-model review and no operator or fixed restriction matched",
    remediation: "No remediation is required. If user authorization is still active, request the broker-owned SPipe Self Review Admission check."
  }),
  fixed_restriction: Object.freeze({
    reason: "one or more changed paths matched a fixed secret or self-review-authority restriction",
    remediation: "Use an independent reviewer, or move the restricted change to a separately reviewed pull request; never weaken the fixed restriction."
  }),
  subject_denied: Object.freeze({
    reason: "an active operator policy denies self-review for this repository, session, or reviewer",
    remediation: "Use an independent reviewer, or ask the operator to issue a new explicit scoped policy before starting a fresh evaluation."
  }),
  path_denied: Object.freeze({
    reason: "an active operator deny scope matched at least one changed path",
    remediation: "Use an independent reviewer, split the denied paths into a separately reviewed pull request, or ask the operator for a new explicit scope."
  }),
  constraint_not_satisfied: Object.freeze({
    reason: "at least one changed path is outside an active operator allow constraint",
    remediation: "Use an independent reviewer, narrow the pull request to the allowed scope, or ask the operator for a new explicit scope, then run a fresh evaluation."
  })
});

const headerFields = ["schema", "record_type", "default_allow", "max_ttl_seconds", "authority"];
const authorityFields = ["type", "id", "key_id"];
const policyFields = ["schema", "record_type", "policy_id", "effect", "subject", "changed_paths_manifest_sha256", "higher_model_receipt_digest", "allow_scopes", "deny_scopes", "issued_by", "issued_at", "not_before", "expires_at", "previous_record_sha256", "signature"];
const subjectFields = ["repository", "pull_request_number", "head_sha", "session_id", "reviewer"];
const reviewerFields = ["provider", "id", "model"];
const scopeFields = ["kind", "path"];
const repositoryFields = ["provider", "id", "node_id", "name"];
const manifestFields = ["schema", "repository", "pull_request_number", "head_sha", "base_repository", "base_ref", "base_sha", "merge_base_sha", "changes"];
const changeFields = ["status", "old_path", "new_path", "old_blob_sha", "new_blob_sha", "old_mode", "new_mode", "semantic_flags"];
const resolutionFields = ["schema", "valid", "integration_id", "repo_id", "pull_request", "session_id", "request_id", "head_sha", "base_repo_id", "base_ref", "base_sha", "merge_base_sha", "diff_sha256", "target_repo_id", "target_ref", "target_ruleset_id", "strict_up_to_date", "protected_target", "manifest", "changed_paths_manifest_sha256", "policy_db_sha256", "policy_authenticated", "reviewer_id", "reviewer_provider", "reviewer_model", "higher_model_receipt_digest", "user_authorization_actor", "user_authorization_receipt_digest", "user_authorized_at", "user_authorization_authenticated", "review_verdict", "p0_findings", "p1_findings", "issued_at", "expires_at"];
const admissionResultFields = ["admitted", "integration_id", "repo_id", "pull_request", "session_id", "request_id", "head_sha", "base_repo_id", "base_ref", "base_sha", "merge_base_sha", "diff_sha256", "target_repo_id", "target_ref", "target_ruleset_id", "strict_up_to_date", "protected_target", "changed_paths_manifest_sha256", "user_authorization_actor", "user_authorization_receipt_digest", "user_authorized_at", "policy_audit_digest", "status_context", "check_run_id", "admitted_at", "expires_at", "invalidation_registered", "invalidation_at", "invalidation_mode"];
const INVALIDATION_MODE = "broker_rechecks_bound_inputs_and_fails_check_on_change_or_expiry";
const MAX_POLICY_TTL_SECONDS = 86_400;
const HASH_CHAIN_ROOT = "0".repeat(64);
const SHA256 = /^[0-9a-f]{64}$/; const OBJECT_SHA = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/; const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:/@-]*$/; const GIT_MODE = /^[0-9]{6}$/;
const scopeKinds = new Set(["code", "text", "file", "directory_files", "directory_recursive"]);
const statuses = new Set(["added", "modified", "deleted", "renamed", "copied", "type_changed"]);
const semanticFlags = new Set(["credentials_or_secrets", "live_ruleset_or_environment_policy", "signing_or_publish_authority", "review_approval_policy_or_workflow", "self_review_authority"]);
const textExtensions = new Set([".adoc", ".md", ".markdown", ".rst", ".text", ".txt"]);

function nonempty(value, key) { if (typeof value !== "string" || value.trim() === "" || value !== value.trim() || /[\0\r\n]/.test(value)) throw new Error(`${key} is required and must be canonical single-line text`); return value; }
function safeId(value, key) { if (!SAFE_ID.test(nonempty(value, key))) throw new Error(`${key} must be one safe identifier`); return value; }
function canonicalTimestamp(value, key) { const parsed = Date.parse(value); if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) throw new Error(`${key} must be a canonical UTC ISO timestamp`); return parsed; }
function noLoneSurrogates(value, key) { for (let index = 0; index < value.length; index += 1) { const unit = value.charCodeAt(index); if (unit >= 0xd800 && unit <= 0xdbff) { const next = value.charCodeAt(index + 1); if (!(next >= 0xdc00 && next <= 0xdfff)) throw new Error(`${key} must be valid UTF-8 text`); index += 1; } else if (unit >= 0xdc00 && unit <= 0xdfff) throw new Error(`${key} must be valid UTF-8 text`); } }

export function normalizeRepoPath(value, key = "path") {
  nonempty(value, key); noLoneSurrogates(value, key);
  if (value.includes("\\") || value.startsWith("/") || /^[A-Za-z]:/.test(value)) throw new Error(`${key} must be a normalized repository-relative path`);
  if (value !== value.normalize("NFC")) throw new Error(`${key} must use NFC Unicode normalization`);
  const parts = value.split("/");
  if (parts.some((part) => part === "" || part === "." || part === "..")) throw new Error(`${key} must not contain empty, dot, or traversal segments`);
  if (parts[0] === ".git") throw new Error(`${key} must not address repository metadata`);
  if (posix.normalize(value) !== value) throw new Error(`${key} is not canonical`);
  return value;
}

function validateRequest(input, now = new Date()) {
  exactFields(input, selfReviewRequestFields, "self-review request");
  if (input.schema !== selfReviewSchemas.request) throw new Error(`schema must equal ${selfReviewSchemas.request}`);
  nonempty(input.repo_id, "repo_id"); if (!Number.isSafeInteger(input.pull_request) || input.pull_request <= 0) throw new Error("pull_request must be a positive integer");
  for (const key of ["session_id", "reviewer_id", "reviewer_provider", "reviewer_model", "user_authorization_actor", "request_id"]) safeId(input[key], key);
  if (typeof input.higher_model_receipt_digest !== "string" || !SHA256.test(input.higher_model_receipt_digest)) throw new Error("higher_model_receipt_digest has invalid format");
  if (typeof input.user_authorization_receipt_digest !== "string" || !SHA256.test(input.user_authorization_receipt_digest)) throw new Error("user_authorization_receipt_digest has invalid format");
  const authorized = canonicalTimestamp(input.user_authorized_at, "user_authorized_at"); const current = now.getTime();
  if (authorized > current || current - authorized > 86_400_000) throw new Error("user authorization evidence is not current or exceeds 24 hours");
  return Object.freeze({ ...input });
}

function validateScope(scope, label) {
  exactFields(scope, scopeFields, label); if (!scopeKinds.has(scope.kind)) throw new Error(`${label}.kind has invalid value`);
  if (scope.kind === "code" || scope.kind === "text") { if (scope.path !== "") throw new Error(`${label}.path must be empty for ${scope.kind} scope`); return Object.freeze({ kind: scope.kind, path: "" }); }
  return Object.freeze({ kind: scope.kind, path: normalizeRepoPath(scope.path, `${label}.path`) });
}

function validateAuthority(authority, label) { exactFields(authority, authorityFields, label); if (authority.type !== "operator_owned_external") throw new Error(`${label}.type must equal operator_owned_external`); safeId(authority.id, `${label}.id`); safeId(authority.key_id, `${label}.key_id`); return Object.freeze({ ...authority }); }
function parseHeader(record) { exactFields(record, headerFields, "self-review policy DB header"); if (record.schema !== selfReviewSchemas.policy_db || record.record_type !== "header" || record.default_allow !== true) throw new Error("self-review policy DB header must declare schema spipe-self-review-policy-db/2, record_type header, and default_allow true"); if (!Number.isSafeInteger(record.max_ttl_seconds) || record.max_ttl_seconds <= 0 || record.max_ttl_seconds > MAX_POLICY_TTL_SECONDS) throw new Error("self-review policy DB max_ttl_seconds must be within 24 hours"); return Object.freeze({ ...record, authority: validateAuthority(record.authority, "self-review policy DB authority") }); }
function validateSubjectPolicy(record, index, header) {
  const label = `self-review policy record ${index}`; exactFields(record, policyFields, label);
  if (record.schema !== selfReviewSchemas.subject_policy || record.record_type !== "subject_policy") throw new Error(`${label} has invalid schema or record_type`);
  safeId(record.policy_id, `${label}.policy_id`); if (!new Set(["deny", "constrain"]).has(record.effect)) throw new Error(`${label}.effect must be deny or constrain`);
  exactFields(record.subject, subjectFields, `${label}.subject`); const repository = validateRepository(record.subject.repository, `${label}.subject.repository`); if (!Number.isSafeInteger(record.subject.pull_request_number) || record.subject.pull_request_number <= 0) throw new Error(`${label}.subject.pull_request_number must be a positive integer`); if (typeof record.subject.head_sha !== "string" || !OBJECT_SHA.test(record.subject.head_sha)) throw new Error(`${label}.subject.head_sha has invalid commit identity`); safeId(record.subject.session_id, `${label}.subject.session_id`); exactFields(record.subject.reviewer, reviewerFields, `${label}.subject.reviewer`); for (const key of reviewerFields) safeId(record.subject.reviewer[key], `${label}.subject.reviewer.${key}`);
  if (typeof record.changed_paths_manifest_sha256 !== "string" || !SHA256.test(record.changed_paths_manifest_sha256)) throw new Error(`${label}.changed_paths_manifest_sha256 has invalid format`); if (typeof record.higher_model_receipt_digest !== "string" || !SHA256.test(record.higher_model_receipt_digest)) throw new Error(`${label}.higher_model_receipt_digest has invalid format`);
  if (!Array.isArray(record.allow_scopes) || !Array.isArray(record.deny_scopes)) throw new Error(`${label} scopes must be arrays`);
  if (record.effect === "constrain" && record.allow_scopes.length === 0) throw new Error(`${label} constrain policy requires allow_scopes`);
  if (record.effect === "deny" && record.allow_scopes.length !== 0) throw new Error(`${label} deny policy cannot contain allow_scopes`);
  const issuedBy = validateAuthority(record.issued_by, `${label}.issued_by`); if (issuedBy.type !== header.authority.type || issuedBy.id !== header.authority.id || issuedBy.key_id !== header.authority.key_id) throw new Error(`${label}.issued_by does not match the policy DB authority`);
  nonempty(record.signature, `${label}.signature`); if (record.signature.length < 32 || record.signature.length > 4096) throw new Error(`${label}.signature length is invalid`); if (!SHA256.test(record.previous_record_sha256)) throw new Error(`${label}.previous_record_sha256 has invalid format`);
  const issued = canonicalTimestamp(record.issued_at, `${label}.issued_at`); const notBefore = canonicalTimestamp(record.not_before, `${label}.not_before`); const expires = canonicalTimestamp(record.expires_at, `${label}.expires_at`);
  if (notBefore < issued || expires <= notBefore || expires - issued > header.max_ttl_seconds * 1000) throw new Error(`${label} validity must start at/after issuance and expire within max_ttl_seconds`);
  return Object.freeze({ ...record, subject: Object.freeze({ ...record.subject, repository, reviewer: Object.freeze({ ...record.subject.reviewer }) }), issued_by: issuedBy, allow_scopes: Object.freeze(record.allow_scopes.map((scope, scopeIndex) => validateScope(scope, `${label}.allow_scopes[${scopeIndex}]`))), deny_scopes: Object.freeze(record.deny_scopes.map((scope, scopeIndex) => validateScope(scope, `${label}.deny_scopes[${scopeIndex}]`))) });
}
function textSha256(value) { return createHash("sha256").update(value, "utf8").digest("hex"); }

export function parseSelfReviewPolicy(content) {
  if (typeof content !== "string" || content.trim() === "") throw new Error("self-review policy DB must be non-empty UTF-8 JSONL text"); noLoneSurrogates(content, "self-review policy DB"); if (content.includes("\r")) throw new Error("self-review policy DB must use canonical LF JSONL");
  const lines = content.split("\n"); if (lines.at(-1) === "") lines.pop(); if (lines.some((line) => line === "" || line !== line.trim())) throw new Error("self-review policy DB must contain canonical non-empty JSONL records"); let records;
  try { records = lines.map((line) => JSON.parse(line)); } catch { throw new Error("self-review policy DB must be valid one-record-per-line JSONL"); }
  const header = parseHeader(records[0]); const policies = records.slice(1).map((record, index) => validateSubjectPolicy(record, index + 2, header));
  if (new Set(policies.map((record) => record.policy_id)).size !== policies.length) throw new Error("self-review policy_id values must be unique");
  for (let index = 0; index < policies.length; index += 1) { const expected = index === 0 ? HASH_CHAIN_ROOT : textSha256(lines[index]); if (policies[index].previous_record_sha256 !== expected) throw new Error(`self-review policy hash chain mismatch at record ${index + 2}`); }
  return Object.freeze({ header, policies: Object.freeze(policies), policy_db_sha256: textSha256(content) });
}
export function loadSelfReviewPolicy(path) { if (!path) throw new Error("self-review policy DB is not configured"); let content; try { content = readFileSync(path, "utf8"); } catch { throw new Error("configured self-review policy DB could not be read"); } return parseSelfReviewPolicy(content); }

function validateRepository(repository, label = "changed path manifest repository") { exactFields(repository, repositoryFields, label); for (const key of repositoryFields) { if (key === "id") { if (!(typeof repository.id === "string" && repository.id !== "") && !(Number.isSafeInteger(repository.id) && repository.id > 0)) throw new Error(`${label}.id must be a non-empty string or positive safe integer`); } else nonempty(repository[key], `${label}.${key}`); } return Object.freeze({ ...repository }); }
function optionalPath(value, key) { if (typeof value !== "string") throw new Error(`${key} must be a string`); return value === "" ? "" : normalizeRepoPath(value, key); }
function optionalObjectSha(value, key) { if (typeof value !== "string" || (value !== "" && !OBJECT_SHA.test(value))) throw new Error(`${key} has invalid object identity`); return value; }
function optionalMode(value, key) { if (typeof value !== "string" || (value !== "" && !GIT_MODE.test(value))) throw new Error(`${key} has invalid Git mode`); if (value !== "" && !new Set(["100644", "100755", "120000", "160000"]).has(value)) throw new Error(`${key} has unsupported Git mode`); return value; }
function validateChange(change, index) {
  const label = `manifest.changes[${index}]`; exactFields(change, changeFields, label); if (!statuses.has(change.status)) throw new Error(`${label}.status has invalid value`);
  const oldPath = optionalPath(change.old_path, `${label}.old_path`); const newPath = optionalPath(change.new_path, `${label}.new_path`); const oldBlob = optionalObjectSha(change.old_blob_sha, `${label}.old_blob_sha`); const newBlob = optionalObjectSha(change.new_blob_sha, `${label}.new_blob_sha`); const oldMode = optionalMode(change.old_mode, `${label}.old_mode`); const newMode = optionalMode(change.new_mode, `${label}.new_mode`);
  if (!Array.isArray(change.semantic_flags) || change.semantic_flags.some((flag) => !semanticFlags.has(flag)) || new Set(change.semantic_flags).size !== change.semantic_flags.length) throw new Error(`${label}.semantic_flags has invalid values`);
  if ([oldMode, newMode].some((mode) => mode === "120000" || mode === "160000")) throw new Error(`${label} changes a symbolic link or submodule`);
  const oldParts = [oldPath, oldBlob, oldMode]; const newParts = [newPath, newBlob, newMode];
  const absentOld = oldParts.every((part) => part === ""); const absentNew = newParts.every((part) => part === "");
  if (!absentOld && oldParts.some((part) => part === "")) throw new Error(`${label} old endpoint must be complete`);
  if (!absentNew && newParts.some((part) => part === "")) throw new Error(`${label} new endpoint must be complete`);
  if (change.status === "added" && (!absentOld || absentNew)) throw new Error(`${label} added shape is inconsistent`);
  if (change.status === "deleted" && (absentOld || !absentNew)) throw new Error(`${label} deleted shape is inconsistent`);
  if (["renamed", "copied"].includes(change.status) && (absentOld || absentNew || oldPath === newPath)) throw new Error(`${label} rename/copy shape is inconsistent`);
  if (["modified", "type_changed"].includes(change.status) && (absentOld || absentNew || oldPath !== newPath)) throw new Error(`${label} modified/type_changed shape is inconsistent`);
  return Object.freeze({ ...change, old_path: oldPath, new_path: newPath, old_blob_sha: oldBlob, new_blob_sha: newBlob, old_mode: oldMode, new_mode: newMode, semantic_flags: Object.freeze([...change.semantic_flags].sort()) });
}
export function changedPathsManifestDigest(manifest) {
  const canonical = { ...manifest, changes: [...manifest.changes].sort((left, right) => `${left.old_path}\0${left.new_path}`.localeCompare(`${right.old_path}\0${right.new_path}`)) };
  return digest({ domain: selfReviewSchemas.path_manifest, manifest: canonical });
}
function validateManifest(manifest, request, headSha) {
  exactFields(manifest, manifestFields, "changed path manifest"); if (manifest.schema !== selfReviewSchemas.path_manifest) throw new Error(`manifest schema must equal ${selfReviewSchemas.path_manifest}`);
  const repository = validateRepository(manifest.repository); const baseRepository = validateRepository(manifest.base_repository, "changed path manifest base_repository");
  if (String(repository.id) !== request.repo_id || manifest.pull_request_number !== request.pull_request || manifest.head_sha !== headSha) throw new Error("changed path manifest repository, PR, or head mismatch");
  nonempty(manifest.base_ref, "manifest.base_ref");
  for (const key of ["base_sha", "merge_base_sha"]) if (typeof manifest[key] !== "string" || !OBJECT_SHA.test(manifest[key])) throw new Error(`manifest.${key} has invalid commit identity`);
  if (!Array.isArray(manifest.changes) || manifest.changes.length === 0) throw new Error("changed path manifest changes must be a non-empty array");
  const changes = manifest.changes.map(validateChange).sort((left, right) => `${left.old_path}\0${left.new_path}`.localeCompare(`${right.old_path}\0${right.new_path}`)); return Object.freeze({ ...manifest, repository, base_repository: baseRepository, changes: Object.freeze(changes) });
}
export function diffIdentityDigest(manifest, manifestSha256) { return digest({ domain: "spipe-self-review-diff/1", repository_id: String(manifest.repository.id), pull_request: manifest.pull_request_number, head_sha: manifest.head_sha, base_repo_id: String(manifest.base_repository.id), base_ref: manifest.base_ref, base_sha: manifest.base_sha, merge_base_sha: manifest.merge_base_sha, changed_paths_manifest_sha256: manifestSha256 }); }
function validateResolution(input, request, policy, integrationId, now) {
  exactFields(input, resolutionFields, "self-review broker resolution"); if (input.schema !== selfReviewSchemas.resolution || input.valid !== true) throw new Error("self-review broker rejected the request"); if (input.integration_id !== integrationId) throw new Error("self-review broker integration identity mismatch");
  for (const key of ["repo_id", "pull_request", "session_id", "request_id", "reviewer_id", "reviewer_provider", "reviewer_model", "higher_model_receipt_digest", "user_authorization_actor", "user_authorization_receipt_digest", "user_authorized_at"]) if (input[key] !== request[key]) throw new Error(`self-review broker ${key} does not match the request`);
  if (input.user_authorization_authenticated !== true) throw new Error("self-review broker did not authenticate the explicit user authorization receipt");
  if (typeof input.head_sha !== "string" || !OBJECT_SHA.test(input.head_sha)) throw new Error("self-review broker head_sha has invalid format"); if (input.policy_authenticated !== true || input.policy_db_sha256 !== policy.policy_db_sha256) throw new Error("self-review broker did not authenticate the configured policy DB"); if (input.review_verdict !== "pass" || input.p0_findings !== 0 || input.p1_findings !== 0) throw new Error("self-review requires an authenticated exact-head higher-model PASS with no P0/P1 findings");
  const authorized = canonicalTimestamp(request.user_authorized_at, "user_authorized_at"); const issued = canonicalTimestamp(input.issued_at, "resolution.issued_at"); const expires = canonicalTimestamp(input.expires_at, "resolution.expires_at"); const current = now.getTime(); if (issued < authorized || issued > current || current >= expires || expires <= issued || expires - issued > 86_400_000 || expires - authorized > 86_400_000) throw new Error("self-review resolution is not currently valid or exceeds the user authorization lifetime");
  const manifest = validateManifest(input.manifest, request, input.head_sha); if (typeof input.changed_paths_manifest_sha256 !== "string" || !SHA256.test(input.changed_paths_manifest_sha256) || changedPathsManifestDigest(manifest) !== input.changed_paths_manifest_sha256) throw new Error("self-review changed path manifest digest mismatch");
  for (const key of ["base_repo_id", "base_ref", "base_sha", "merge_base_sha"]) { const manifestKey = key === "base_repo_id" ? String(manifest.base_repository.id) : manifest[key]; if (input[key] !== manifestKey) throw new Error(`self-review broker ${key} does not match the manifest`); }
  if (typeof input.diff_sha256 !== "string" || !SHA256.test(input.diff_sha256) || input.diff_sha256 !== diffIdentityDigest(manifest, input.changed_paths_manifest_sha256)) throw new Error("self-review broker diff identity mismatch");
  if (input.target_repo_id !== input.base_repo_id || input.target_ref !== input.base_ref) throw new Error("self-review broker target repository/ref does not match the resolved protected base target");
  safeId(input.target_ruleset_id, "target_ruleset_id");
  if (input.strict_up_to_date !== true || input.protected_target !== true) throw new Error("self-review requires a protected target with strict up-to-date required-status policy");
  return Object.freeze({ ...input, manifest });
}

function scopeMatches(scope, path) { if (scope.kind === "text") return textExtensions.has(extname(path).toLowerCase()); if (scope.kind === "code") return !textExtensions.has(extname(path).toLowerCase()); if (scope.kind === "file") return path === scope.path; if (scope.kind === "directory_files") return posix.dirname(path) === scope.path; return path.startsWith(`${scope.path}/`); }
function endpoints(change) { if (change.status === "added" || change.status === "copied") return [change.new_path]; if (change.status === "deleted") return [change.old_path]; if (change.status === "renamed") return [change.old_path, change.new_path]; return [change.new_path]; }
function fixedRestrictions(change, path) {
  const lower = path.toLowerCase(); const base = posix.basename(lower); const found = new Set();
  if (change.semantic_flags.includes("credentials_or_secrets") || base === ".env" || base.startsWith(".env.") || /(^|\/)(secrets?|credentials?|private[_-]?keys?)(\/|\.|$)/.test(lower) || /\.(pem|p12|pfx|key|jks|keystore)$/.test(base)) found.add("SELF001");
  if (change.semantic_flags.includes("live_ruleset_or_environment_policy")) found.add("SELF002");
  if (change.semantic_flags.includes("signing_or_publish_authority")) found.add("SELF003");
  if (change.semantic_flags.includes("review_approval_policy_or_workflow") || change.semantic_flags.includes("self_review_authority")) found.add("SELF004");
  if (/(^|\/)(self[-_]review[^/]*\.(jsonl|json|sdn))$/.test(lower) || lower.startsWith(".spipe/self-review")) found.add("SELF005"); return [...found];
}
function activeMatchingPolicies(policy, request, resolution, now) { const current = now.getTime(); return policy.policies.filter((record) => String(record.subject.repository.id) === request.repo_id && record.subject.repository.provider === resolution.manifest.repository.provider && record.subject.repository.node_id === resolution.manifest.repository.node_id && record.subject.repository.name === resolution.manifest.repository.name && record.subject.pull_request_number === request.pull_request && record.subject.head_sha === resolution.head_sha && record.subject.session_id === request.session_id && record.subject.reviewer.provider === request.reviewer_provider && record.subject.reviewer.id === request.reviewer_id && record.subject.reviewer.model === request.reviewer_model && record.changed_paths_manifest_sha256 === resolution.changed_paths_manifest_sha256 && record.higher_model_receipt_digest === request.higher_model_receipt_digest && canonicalTimestamp(record.not_before, `${record.policy_id}.not_before`) <= current && current < canonicalTimestamp(record.expires_at, `${record.policy_id}.expires_at`)); }

export function planSelfReviewRequest(input, now = new Date()) { const request = validateRequest(input, now); return Object.freeze({ schema: selfReviewSchemas.request, decision: "pending", authoritative: false, mutation: "none", request, request_digest: digest({ domain: selfReviewSchemas.request, request }), provider_guidance: selfReviewProviderGuidance, default_policy: "ordinary reviewed code/text is eligible only with current explicit user authorization evidence and unless an operator deny/constrain or fixed restriction applies", scope_kinds: Object.freeze([...scopeKinds]), invalidation: Object.freeze(["new head commit", "base or merge-base movement", "diff change", "pull-request retarget", "ruleset change", "policy DB change", "review receipt change", "user authorization expiry", "admission expiry"]), invalidation_mode: INVALIDATION_MODE, fixed_restrictions: fixedSelfReviewRestrictions, next_action: "submit to an operator-owned MCP server; its pinned broker resolves the live PR head/diff and authenticates both exact higher-model and user authorization receipts" }); }
export function evaluateSelfReviewPrivilege(input, policy, authority, now = new Date()) {
  const request = validateRequest(input, now); if (!authority || typeof authority.resolveSelfReview !== "function" || typeof authority.integrationId !== "string" || authority.integrationId === "") throw new Error("self-review broker identity is not configured");
  const resolution = validateResolution(authority.resolveSelfReview(request), request, policy, authority.integrationId, now); const policies = activeMatchingPolicies(policy, request, resolution, now); const fullDenies = policies.filter((record) => record.effect === "deny" && record.deny_scopes.length === 0); const constraints = policies.filter((record) => record.effect === "constrain"); const denyScopes = policies.flatMap((record) => record.deny_scopes.map((scope) => ({ policy_id: record.policy_id, scope }))); const pathResults = [];
  for (const change of resolution.manifest.changes) for (const path of endpoints(change)) { const fixed = fixedRestrictions(change, path); const denyMatches = denyScopes.filter(({ scope }) => scopeMatches(scope, path)).map(({ policy_id }) => policy_id); const failedConstraints = constraints.filter((record) => !record.allow_scopes.some((scope) => scopeMatches(scope, path))).map((record) => record.policy_id); pathResults.push(Object.freeze({ path, fixed_restriction_ids: Object.freeze(fixed), deny_policy_ids: Object.freeze(denyMatches), failed_constraint_policy_ids: Object.freeze(failedConstraints) })); }
  const matchedRestrictionIds = [...new Set(pathResults.flatMap((result) => result.fixed_restriction_ids))].sort(); const matchedPolicyIds = [...new Set([...fullDenies.map((record) => record.policy_id), ...pathResults.flatMap((result) => [...result.deny_policy_ids, ...result.failed_constraint_policy_ids])])].sort(); const eligible = matchedRestrictionIds.length === 0 && matchedPolicyIds.length === 0; const reasonCode = eligible ? "default_allow_exact_review" : matchedRestrictionIds.length ? "fixed_restriction" : fullDenies.length ? "subject_denied" : pathResults.some((result) => result.deny_policy_ids.length) ? "path_denied" : "constraint_not_satisfied";
  const audit = { domain: selfReviewSchemas.decision, request, integration_id: authority.integrationId, head_sha: resolution.head_sha, base_repo_id: resolution.base_repo_id, base_ref: resolution.base_ref, base_sha: resolution.base_sha, merge_base_sha: resolution.merge_base_sha, diff_sha256: resolution.diff_sha256, target_repo_id: resolution.target_repo_id, target_ref: resolution.target_ref, target_ruleset_id: resolution.target_ruleset_id, strict_up_to_date: resolution.strict_up_to_date, protected_target: resolution.protected_target, changed_paths_manifest_sha256: resolution.changed_paths_manifest_sha256, policy_db_sha256: policy.policy_db_sha256, issued_at: resolution.issued_at, expires_at: resolution.expires_at, matched_policy_ids: matchedPolicyIds, matched_restriction_ids: matchedRestrictionIds, decision: eligible ? "allow" : "deny", reason_code: reasonCode };
  const guidance = selfReviewDecisionGuidance[reasonCode];
  return Object.freeze({ schema: selfReviewSchemas.decision, decision: eligible ? "allow" : "deny", eligible, authoritative: true, mutation: "none", reason_code: reasonCode, reason: guidance.reason, remediation: guidance.remediation, provider_guidance: selfReviewProviderGuidance, repo_id: request.repo_id, pull_request: request.pull_request, session_id: request.session_id, request_id: request.request_id, head_sha: resolution.head_sha, base_repo_id: resolution.base_repo_id, base_ref: resolution.base_ref, base_sha: resolution.base_sha, merge_base_sha: resolution.merge_base_sha, diff_sha256: resolution.diff_sha256, target_repo_id: resolution.target_repo_id, target_ref: resolution.target_ref, target_ruleset_id: resolution.target_ruleset_id, strict_up_to_date: resolution.strict_up_to_date, protected_target: resolution.protected_target, reviewer_id: request.reviewer_id, reviewer_provider: request.reviewer_provider, reviewer_model: request.reviewer_model, higher_model_receipt_digest: request.higher_model_receipt_digest, user_authorization_actor: request.user_authorization_actor, user_authorization_receipt_digest: request.user_authorization_receipt_digest, user_authorized_at: request.user_authorized_at, changed_paths_manifest_sha256: resolution.changed_paths_manifest_sha256, policy_db_sha256: policy.policy_db_sha256, matched_policy_ids: Object.freeze(matchedPolicyIds), matched_restriction_ids: Object.freeze(matchedRestrictionIds), path_results: Object.freeze(pathResults), fixed_restrictions: fixedSelfReviewRestrictions, issued_at: resolution.issued_at, expires_at: resolution.expires_at, invalidation_mode: INVALIDATION_MODE, policy_audit_digest: digest(audit) });
}
export function approveSelfReview(input, policy, authority, now = new Date()) {
  if (!authority || typeof authority.admitSelfReview !== "function") throw new Error("self-review admission broker is not configured; remediation: configure the operator-owned pinned broker or use an independent reviewer"); const decision = evaluateSelfReviewPrivilege(input, policy, authority, now); if (!decision.eligible) throw new Error(`self-review privilege denied [${decision.reason_code}]: ${decision.reason}; remediation: ${decision.remediation}`);
  const command = Object.freeze({ schema: selfReviewSchemas.admission_command, repo_id: decision.repo_id, pull_request: decision.pull_request, session_id: decision.session_id, request_id: decision.request_id, head_sha: decision.head_sha, base_repo_id: decision.base_repo_id, base_ref: decision.base_ref, base_sha: decision.base_sha, merge_base_sha: decision.merge_base_sha, diff_sha256: decision.diff_sha256, target_repo_id: decision.target_repo_id, target_ref: decision.target_ref, target_ruleset_id: decision.target_ruleset_id, strict_up_to_date: decision.strict_up_to_date, protected_target: decision.protected_target, changed_paths_manifest_sha256: decision.changed_paths_manifest_sha256, reviewer_id: decision.reviewer_id, reviewer_provider: decision.reviewer_provider, reviewer_model: decision.reviewer_model, higher_model_receipt_digest: decision.higher_model_receipt_digest, user_authorization_actor: decision.user_authorization_actor, user_authorization_receipt_digest: decision.user_authorization_receipt_digest, user_authorized_at: decision.user_authorized_at, policy_db_sha256: decision.policy_db_sha256, policy_audit_digest: decision.policy_audit_digest, expires_at: decision.expires_at, invalidation_mode: decision.invalidation_mode }); const result = authority.admitSelfReview(command); exactFields(result, admissionResultFields, "self-review broker admission");
  if (result.admitted !== true || result.integration_id !== authority.integrationId || result.status_context !== "SPipe Self Review Admission") throw new Error("self-review broker did not emit the configured admission check"); for (const key of ["repo_id", "pull_request", "session_id", "request_id", "head_sha", "base_repo_id", "base_ref", "base_sha", "merge_base_sha", "diff_sha256", "target_repo_id", "target_ref", "target_ruleset_id", "strict_up_to_date", "protected_target", "changed_paths_manifest_sha256", "user_authorization_actor", "user_authorization_receipt_digest", "user_authorized_at", "policy_audit_digest", "expires_at"]) if (result[key] !== command[key]) throw new Error(`self-review broker admission ${key} mismatch`); safeId(result.check_run_id, "check_run_id"); const admitted = canonicalTimestamp(result.admitted_at, "admitted_at"); const expires = canonicalTimestamp(result.expires_at, "expires_at"); if (admitted > now.getTime() || admitted >= expires || now.getTime() >= expires) throw new Error("self-review admission is not current at check emission"); if (result.invalidation_registered !== true || result.invalidation_at !== result.expires_at || result.invalidation_mode !== INVALIDATION_MODE) throw new Error("self-review broker did not register fail-closed status invalidation for bound-input change or expiry");
  return Object.freeze({ schema: selfReviewSchemas.admission, admitted: true, mutation: "provider_status_check", provider_review_action: selfReviewProviderGuidance.provider_review_action, provider_review_reason: selfReviewProviderGuidance.provider_review_reason, integration_id: result.integration_id, repo_id: result.repo_id, pull_request: result.pull_request, session_id: result.session_id, request_id: result.request_id, head_sha: result.head_sha, base_repo_id: result.base_repo_id, base_ref: result.base_ref, base_sha: result.base_sha, merge_base_sha: result.merge_base_sha, diff_sha256: result.diff_sha256, target_repo_id: result.target_repo_id, target_ref: result.target_ref, target_ruleset_id: result.target_ruleset_id, strict_up_to_date: result.strict_up_to_date, protected_target: result.protected_target, changed_paths_manifest_sha256: result.changed_paths_manifest_sha256, reviewer_id: decision.reviewer_id, reviewer_provider: decision.reviewer_provider, reviewer_model: decision.reviewer_model, higher_model_receipt_digest: decision.higher_model_receipt_digest, user_authorization_actor: result.user_authorization_actor, user_authorization_receipt_digest: result.user_authorization_receipt_digest, user_authorized_at: result.user_authorized_at, policy_db_sha256: decision.policy_db_sha256, policy_audit_digest: result.policy_audit_digest, status_context: result.status_context, check_run_id: result.check_run_id, admitted_at: result.admitted_at, expires_at: result.expires_at, invalidation_registered: result.invalidation_registered, invalidation_at: result.invalidation_at, invalidation_mode: result.invalidation_mode });
}
