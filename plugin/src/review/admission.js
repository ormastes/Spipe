import {
  checksDigest, exactFields, fallbackAdmissionFields, independentAdmissionFields,
  reviewAdmissionCommonFields, reviewRequestDigest, reviewRequestFields, reviewSchemas
} from "./contract.js";

const COMMIT = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;
const SHA256 = /^[0-9a-f]{64}$/;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:/-]*$/;
const MAX_TTL_MS = 86_400_000;
const modes = new Set(["independent_verifier", "owner_attested_fallback"]);

function nonempty(value, key) {
  if (typeof value !== "string" || value.trim() === "" || /[\r\n]/.test(value)) throw new Error(`${key} is required`);
  return value;
}

function validateSelector(input) {
  nonempty(input.repository, "repository");
  if (!Number.isSafeInteger(input.pull_request_number) || input.pull_request_number < 0) throw new Error("pull_request_number must be a non-negative integer");
  if (typeof input.session_id !== "string" || typeof input.feature_id !== "string") throw new Error("session_id and feature_id must be strings");
  const selectors = Number(input.pull_request_number > 0) + Number(input.session_id !== "") + Number(input.feature_id !== "");
  if (selectors > 1) throw new Error("review scope must select only one pull request, session, or feature");
  for (const [key, value] of [["session_id", input.session_id], ["feature_id", input.feature_id]]) {
    if (value !== "" && !SAFE_ID.test(value)) throw new Error(`${key} must be one safe identifier`);
  }
  return input.pull_request_number > 0 ? "pull_request" : input.session_id !== "" ? "session" : input.feature_id !== "" ? "feature" : "repository";
}

function validateChecks(checks) {
  if (!Array.isArray(checks) || checks.length === 0) throw new Error("required_checks must be a non-empty array");
  if (checks.some((check) => typeof check !== "string" || !SAFE_ID.test(check))) throw new Error("required_checks must contain safe check identities");
  if (new Set(checks).size !== checks.length) throw new Error("required_checks must be unique");
}

function validateCommon(input) {
  const scope = validateSelector(input);
  validateChecks(input.required_checks);
  if (!modes.has(input.mode)) throw new Error("mode must be independent_verifier or owner_attested_fallback");
  nonempty(input.request_actor, "request_actor");
  if (!SAFE_ID.test(nonempty(input.request_id, "request_id"))) throw new Error("request_id must be one safe identifier");
  return scope;
}

export function createReviewRequest(input) {
  exactFields(input, reviewRequestFields, "review request");
  if (input.schema !== reviewSchemas.request) throw new Error(`schema must equal ${reviewSchemas.request}`);
  const scope = validateCommon(input);
  const body = {
    schema: reviewSchemas.request, mutation: "none", external_authority_required: true,
    scope, required_checks_sha256: checksDigest(input.required_checks), request: input,
    next_action: "submit to the configured review broker; the broker resolves the current head and this request never authorizes PASS"
  };
  return Object.freeze({ ...body, request_sha256: reviewRequestDigest(body) });
}

function validateFindings(findings) {
  if (!Array.isArray(findings)) throw new Error("findings must be an array");
  const fields = ["id", "severity", "path", "summary"];
  for (const [index, finding] of findings.entries()) {
    exactFields(finding, fields, `findings[${index}]`);
    if (!SAFE_ID.test(nonempty(finding.id, `findings[${index}].id`))) throw new Error(`findings[${index}].id has invalid format`);
    if (!["p0", "p1", "p2", "p3", "info"].includes(finding.severity)) throw new Error(`findings[${index}].severity has invalid value`);
    if (typeof finding.path !== "string" || /[\r\n]/.test(finding.path)) throw new Error(`findings[${index}].path has invalid format`);
    nonempty(finding.summary, `findings[${index}].summary`);
  }
  if (new Set(findings.map((finding) => finding.id)).size !== findings.length) throw new Error("finding ids must be unique");
}

function validateIndependent(input) {
  exactFields(input.verifier, ["kind", "identity", "provider", "model", "tier", "effort", "verdict"], "verifier");
  if (input.verifier.kind !== "high_capability_model") throw new Error("verifier.kind must be high_capability_model");
  for (const key of ["identity", "provider", "model", "tier", "effort"]) nonempty(input.verifier[key], `verifier.${key}`);
  if (input.verifier.verdict !== "pass") throw new Error("verifier.verdict must be pass for admission");
  if (input.findings.some((finding) => finding.severity === "p0" || finding.severity === "p1")) throw new Error("independent admission cannot contain open p0 or p1 findings");
  if (!SHA256.test(input.review_receipt_sha256)) throw new Error("review_receipt_sha256 has invalid format");
}

function validateFallback(input) {
  if (input.reason !== "no eligible independent reviewer") throw new Error("fallback reason must equal no eligible independent reviewer");
  exactFields(input.attestor, ["type", "id"], "attestor");
  if (input.attestor.type !== "User" || input.attestor.id !== 2378857) throw new Error("fallback attestor must be the pinned repository owner");
  if (!SHA256.test(input.unavailable_verifier_receipt_sha256)) throw new Error("unavailable_verifier_receipt_sha256 has invalid format");
  if (input.findings.length !== 0) throw new Error("owner-attested fallback cannot contain review findings");
}

function modeBrokerFields(mode) {
  return mode === "independent_verifier"
    ? ["verifier", "review_receipt_sha256"]
    : ["reason", "attestor", "unavailable_verifier_receipt_sha256"];
}

function sameJsonValue(left, right) {
  if (left === right) return true;
  if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => sameJsonValue(value, right[index]));
  if (!left || !right || typeof left !== "object" || typeof right !== "object") return false;
  const leftKeys = Object.keys(left).sort(); const rightKeys = Object.keys(right).sort();
  return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index] && sameJsonValue(left[key], right[key]));
}

function validateAdmissionReceipt(input, now) {
  if (!input || input.schema !== reviewSchemas.admission) throw new Error(`schema must equal ${reviewSchemas.admission}`);
  if (!modes.has(input.mode)) throw new Error("mode must be independent_verifier or owner_attested_fallback");
  exactFields(input, input.mode === "independent_verifier" ? independentAdmissionFields : fallbackAdmissionFields, "review admission");
  const scope = validateCommon(input);
  if (!COMMIT.test(input.head_sha)) throw new Error("head_sha has invalid format");
  validateFindings(input.findings);
  if (!SHA256.test(input.audit_receipt_sha256)) throw new Error("audit_receipt_sha256 has invalid format");
  if (input.mode === "independent_verifier") validateIndependent(input); else validateFallback(input);

  const issued = Date.parse(input.issued_at); const expires = Date.parse(input.expires_at); const current = now.getTime();
  if (!Number.isFinite(issued) || !Number.isFinite(expires)) throw new Error("issued_at and expires_at must be ISO timestamps");
  if (new Date(issued).toISOString() !== input.issued_at || new Date(expires).toISOString() !== input.expires_at) throw new Error("issued_at and expires_at must use canonical UTC ISO timestamps");
  if (issued > current) throw new Error("review admission is not yet valid");
  if (current >= expires) throw new Error("review admission has expired");
  if (expires <= issued || expires - issued > MAX_TTL_MS) throw new Error("review admission TTL must be positive and at most 86400 seconds");
  return scope;
}

export function planReviewAdmissionValidation(input, now = new Date()) {
  const scope = validateAdmissionReceipt(input, now);
  return Object.freeze({
    schema: reviewSchemas.admission, admitted: false, authoritative: false,
    broker_verified: false, mutation: "none", mode: input.mode, scope,
    request_id: input.request_id,
    next_action: "submit this receipt to an operator-owned MCP review broker; CLI environment values never authorize admission"
  });
}

export function validateReviewAdmission(input, authority, now = new Date()) {
  const scope = validateAdmissionReceipt(input, now);
  if (!authority || typeof authority.resolveAndVerify !== "function" || typeof authority.integrationId !== "string" || authority.integrationId === "") throw new Error("review broker authority is not configured");
  if (input.issuer_integration_id !== authority.integrationId) throw new Error("issuer integration does not match the configured review broker");

  const verified = authority.resolveAndVerify(input);
  if (!verified || verified.valid !== true) throw new Error("review broker rejected the admission receipt");
  exactFields(verified, ["valid", "integration_id", "mode", "repository", "pull_request_number", "session_id", "feature_id", "head_sha", "required_checks", "findings", "request_actor", "request_id", "issued_at", "expires_at", "audit_receipt_sha256", ...modeBrokerFields(input.mode)], "review broker result");
  for (const key of ["integration_id", "mode", "repository", "pull_request_number", "session_id", "feature_id", "head_sha", "findings", "request_actor", "request_id", "issued_at", "expires_at", "audit_receipt_sha256", ...modeBrokerFields(input.mode)]) {
    const receiptKey = key === "integration_id" ? "issuer_integration_id" : key;
    if (!sameJsonValue(verified[key], input[receiptKey])) throw new Error(`review broker ${key} does not match the admission receipt`);
  }
  validateChecks(verified.required_checks);
  if (checksDigest(verified.required_checks) !== checksDigest(input.required_checks)) throw new Error("review broker required checks do not match the admission receipt");
  const modeEvidence = input.mode === "independent_verifier"
    ? { verifier: Object.freeze({ ...input.verifier }), review_receipt_sha256: input.review_receipt_sha256 }
    : { reason: input.reason, attestor: Object.freeze({ ...input.attestor }), unavailable_verifier_receipt_sha256: input.unavailable_verifier_receipt_sha256 };
  const findings = Object.freeze(input.findings.map((finding) => Object.freeze({ ...finding })));
  return Object.freeze({ schema: reviewSchemas.admission, admitted: true, mutation: "none", mode: input.mode, scope, head_sha: input.head_sha, required_checks: Object.freeze([...input.required_checks]), findings, request_actor: input.request_actor, request_id: input.request_id, issued_at: input.issued_at, expires_at: input.expires_at, audit_receipt_sha256: input.audit_receipt_sha256, ...modeEvidence, status_context: "SPipe Review Admission", status_emission: "broker_only" });
}

export { reviewAdmissionCommonFields };
