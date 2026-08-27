import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { releaseCapabilities, releaseContractHash, releaseOperations, releaseSchemas } from "../../src/release/contract.js";
import { createReleasePlan } from "../../src/release/planner.js";
import {
  assertPublicExactBetaBackport, planPublicVerifiedBetaBackport, planVerifiedCandidate, releaseSessionStart, releaseSessionStatus,
  releaseSessionSync, sessionAccessFields, sessionStartFields, sessionSyncFields,
  verifiedBetaBackportFields, verifiedCandidateFields
} from "../../src/release/session.js";
import { checkVersionAuthority } from "../../src/release/version.js";
import { createReviewRequest, validateReviewAdmission } from "../../src/review/admission.js";
import { configuredReviewAuthority } from "../../src/review/broker.js";
import {
  approveSelfReview, evaluateSelfReviewPrivilege, loadSelfReviewPolicy,
  selfReviewProviderGuidance, selfReviewRequestFields, selfReviewSchemas
} from "../../src/review/self_review.js";
import {
  fallbackAdmissionFields, independentAdmissionFields, reviewCapabilities,
  reviewRequestFields, reviewSchemas
} from "../../src/review/contract.js";

const booleanFields = new Set(["read_only_snapshot", "main_is_independent_trunk", "forward_port_required", "release_first_exception_approved", "reviewed", "main_tests_renewed", "protected_ref_direct_update", "signed_tag", "annotated_tag", "exact_tag_push", "rebuild", "fallback_artifact", "release_authority_approved", "published_tag_preserved", "published_assets_preserved", "history_preserved", "replacement_is_new_version", "withdrawal_authority_approved"]);
const integerFields = new Set(["attempt", "candidate_attempt", "interval_seconds", "last_scan_epoch", "now_epoch"]);
const arrayFields = new Set(["candidates", "selected_commit_shas"]);
function releasePlanSchema(operation) {
  const fields = releaseOperations[operation];
  return {
    type: "object",
    description: `Exact ${operation} planning facts. Unknown, missing, or malformed authority evidence is rejected.`,
    properties: Object.fromEntries(fields.map((field) => [field, { type: booleanFields.has(field) ? "boolean" : integerFields.has(field) ? "integer" : arrayFields.has(field) ? "array" : "string" }])),
    required: [...fields],
    additionalProperties: false
  };
}
function operationalReleaseSchema(fields) {
  return {
    type: "object",
    properties: Object.fromEntries(fields.map((field) => [field, { type: booleanFields.has(field) ? "boolean" : integerFields.has(field) ? "integer" : arrayFields.has(field) ? "array" : "string" }])),
    required: [...fields],
    additionalProperties: false
  };
}

const reviewIntegers = new Set(["pull_request_number"]);
const reviewArrays = new Set(["required_checks", "findings"]);
const reviewObjects = new Set(["verifier", "attestor"]);
function reviewProperties(fields) {
  return Object.fromEntries(fields.map((field) => [field, {
    type: reviewIntegers.has(field) ? "integer" : reviewArrays.has(field) ? "array" : reviewObjects.has(field) ? "object" : "string"
  }]));
}
const reviewRequestSchema = Object.freeze({ type: "object", properties: reviewProperties(reviewRequestFields), required: [...reviewRequestFields], additionalProperties: false });
const reviewAdmissionSchema = Object.freeze({ oneOf: [independentAdmissionFields, fallbackAdmissionFields].map((fields) => ({ type: "object", properties: reviewProperties(fields), required: [...fields], additionalProperties: false })) });
const selfReviewRequestSchema = Object.freeze({
  type: "object",
  properties: Object.fromEntries(selfReviewRequestFields.map((field) => [field, { type: field === "pull_request" ? "integer" : "string" }])),
  required: [...selfReviewRequestFields],
  additionalProperties: false
});

export const tools = Object.freeze([
  { name: "spipe_info", description: "Return SPipe module paths and link surfaces.", inputSchema: { type: "object", properties: {} } },
  { name: "spipe_experts", description: "List project, domain, and tool experts packaged with SPipe.", inputSchema: { type: "object", properties: {} } },
  {
    name: "spipe_read_doc",
    description: "Read a whitelisted SPipe document by relative path.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "Relative path under the SPipe module." } },
      required: ["path"]
    }
  },
  { name: "spipe_fine_tune_guide", description: "Read the SPipe LLM fine-tune process guide.", inputSchema: { type: "object", properties: {} } },
  { name: "spipe_fine_tune_model_guide", description: "Read the SPipe LLM model research and architecture guide.", inputSchema: { type: "object", properties: {} } },
  { name: "spipe_fine_tune_template", description: "Read the SPipe LLM fine-tune attempt record template.", inputSchema: { type: "object", properties: {} } },
  { name: "spipe_release_guide", description: "Read the canonical protected software-release and beta-backport guide.", inputSchema: { type: "object", properties: {} } },
  { name: "spipe_release_capabilities", description: "Return declared release/session/candidate schemas and safe planning capabilities.", inputSchema: { type: "object", properties: {} } },
  { name: "spipe_release_version_check", description: "Verify canonical SPipe version authority and all declared projections.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "spipe_release_session_plan", description: "Validate and plan an isolated release session. Performs no workspace or ref mutation.", inputSchema: releasePlanSchema("isolated-session") },
  { name: "spipe_release_session_start", description: "Fetch an exact target and create one locally owned worktree/branch. Requires SPIPE_RELEASE_SESSION_TOKEN; never changes a protected ref.", inputSchema: operationalReleaseSchema(sessionStartFields) },
  { name: "spipe_release_session_status", description: "Verify configured ownership and actual Git worktree, branch, HEAD, base, cleanliness, and uniqueness.", inputSchema: operationalReleaseSchema(sessionAccessFields) },
  { name: "spipe_release_session_sync", description: "Fetch and rebase only a clean token-owned session branch with exact-head and exact-target compare-and-swap checks.", inputSchema: operationalReleaseSchema(sessionSyncFields) },
  { name: "spipe_release_beta_backport_plan", description: "Validate one exact patch-equivalent reviewed beta cherry-pick. Adapted backports are unsupported until an authenticated broker is configured; performs no cherry-pick.", inputSchema: releasePlanSchema("beta-backport") },
  { name: "spipe_release_beta_backport_verified_plan", description: "Bind one exact patch-equivalent reviewed beta cherry-pick to an actual clean owned Git session. Adapted backports are unsupported; performs no cherry-pick.", inputSchema: operationalReleaseSchema(verifiedBetaBackportFields) },
  { name: "spipe_release_candidate_plan", description: "Validate an immutable build-once candidate plan. Performs no candidate creation or build.", inputSchema: releasePlanSchema("candidate") },
  { name: "spipe_release_candidate_verified_plan", description: "Bind an immutable candidate plan to an actual clean owned Git session HEAD, policy digest, and absent create-once candidate ref.", inputSchema: operationalReleaseSchema(verifiedCandidateFields) },
  { name: "spipe_release_promotion_plan", description: "Validate exact admitted promotion inputs. Performs no tag, push, delete, rebuild, or publication.", inputSchema: releasePlanSchema("promotion") },
  { name: "spipe_release_withdrawal_plan", description: "Validate a non-destructive published-release withdrawal. Preserves tags, assets, artifacts, and history.", inputSchema: releasePlanSchema("withdrawal") },
  { name: "spipe_release_main_fix_discovery_plan", description: "Check supplied immutable snapshots for reviewed bug-fix candidates. Never selects or cherry-picks a fix.", inputSchema: releasePlanSchema("main-fix-discovery") },
  { name: "spipe_release_forward_port_plan", description: "Validate an isolated main forward-port for an approved release-first fix. Never pushes a protected ref.", inputSchema: releasePlanSchema("forward-port") },
  { name: "spipe_review_request_create", description: "Create a non-mutating repo/PR/session/feature review request. Caller head SHAs are rejected; the broker resolves the head.", inputSchema: reviewRequestSchema },
  { name: "spipe_review_admission_validate", description: "Validate an exact-head, exact-check review receipt through the configured pinned broker. Unavailable without broker authority.", inputSchema: reviewAdmissionSchema },
  { name: "spipe_review_capabilities", description: "Return review request/admission schemas and fail-closed broker capabilities.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "spipe_self_review_guide", description: "Canonical help for self approve, approve PR, or author cannot approve: run a high/xhigh exact-head review with zero P0/P1, dispatch protected SPipe Self Review Admission with PR/session/model/effort/PASS:0:0, and poll that exact head. This status is never provider APPROVED.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "spipe_self_review_privilege_evaluate", description: "Require current user-authorization actor/timestamp/receipt evidence, authenticate it through the broker with the live PR head/diff and higher-model receipt, then apply default ordinary code/text eligibility plus operator and fixed restrictions. Returns exact reason_code and remediation.", inputSchema: selfReviewRequestSchema },
  { name: "spipe_self_review_approve", description: "Compatibility-named admission action: after allow, re-resolve and emit only SPipe Self Review Admission with bound expiry and registered fail-closed status invalidation. GitHub forbids an author APPROVED review, so this never submits one.", inputSchema: selfReviewRequestSchema }
]);

function text(content) {
  return { content: [{ type: "text", text: content }] };
}

function listDirs(moduleRoot, root) {
  const abs = join(moduleRoot, root);
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function readDoc(moduleRoot, path) {
  if (!path || path.includes("..") || path.startsWith("/") || path.startsWith("\\")) {
    throw new Error("path must be a relative path inside the SPipe module");
  }
  const allowed = [
    "README.md",
    "doc/00_llm_process/spipe/",
    "doc/00_llm_process/skill_command/",
    "doc/00_llm_process/project_expert/",
    "doc/00_llm_process/domain_expert/",
    "doc/00_llm_process/tool_expert/",
    "doc/00_llm_process/template/"
  ];
  if (!allowed.some((prefix) => path === prefix || path.startsWith(prefix))) {
    throw new Error("path is outside the SPipe documentation allowlist");
  }
  const abs = join(moduleRoot, path);
  if (!existsSync(abs)) throw new Error(`document not found: ${path}`);
  return readFileSync(abs, "utf8");
}

export function callTool(moduleRoot, name, args = {}, options = {}) {
  if (name === "spipe_info") {
    return text([
      `module=${moduleRoot}`,
      "surface=doc/00_llm_process/skill_command",
      "surface=doc/00_llm_process/spipe",
      "surface=doc/00_llm_process/template",
      "surface=doc/00_llm_process/project_expert",
      "surface=doc/00_llm_process/domain_expert",
      "surface=doc/00_llm_process/tool_expert"
    ].join("\n"));
  }
  if (name === "spipe_experts") {
    return text([
      `project_expert=${listDirs(moduleRoot, "doc/00_llm_process/project_expert").join(",")}`,
      `domain_expert=${listDirs(moduleRoot, "doc/00_llm_process/domain_expert").join(",")}`,
      `tool_expert=${listDirs(moduleRoot, "doc/00_llm_process/tool_expert").join(",")}`
    ].join("\n"));
  }
  if (name === "spipe_read_doc") return text(readDoc(moduleRoot, args.path));
  if (name === "spipe_fine_tune_guide") return text(readDoc(moduleRoot, "doc/00_llm_process/spipe/llm_finetune.md"));
  if (name === "spipe_fine_tune_model_guide") return text(readDoc(moduleRoot, "doc/00_llm_process/spipe/llm_model_research.md"));
  if (name === "spipe_fine_tune_template") return text(readDoc(moduleRoot, "doc/00_llm_process/spipe/llm_finetune_attempt_template.sdn"));
  if (name === "spipe_self_review_guide") return text(readDoc(moduleRoot, "doc/00_llm_process/spipe/review_admission.md"));
  if (name === "spipe_release_guide") return text(readDoc(moduleRoot, "doc/00_llm_process/skill_command/command/release.md"));
  if (name === "spipe_release_capabilities") return text([
    ...Object.entries(releaseSchemas).map(([key, value]) => `${key}=${value}`),
    ...Object.entries(releaseCapabilities).map(([key, value]) => `${key}=${value}`),
    `contract_sha256=${releaseContractHash()}`
  ].join("\n"));
  if (name === "spipe_release_version_check") return text(JSON.stringify(checkVersionAuthority(moduleRoot), null, 2));
  if (name === "spipe_review_capabilities") return text([
    ...Object.entries(reviewSchemas).map(([key, value]) => `${key}=${value}`),
    ...Object.entries(selfReviewSchemas).map(([key, value]) => `self_review_${key}=${value}`),
    ...Object.entries(reviewCapabilities).map(([key, value]) => `${key}=${value}`),
    ...Object.entries(selfReviewProviderGuidance).map(([key, value]) => `self_review_${key}=${value}`)
  ].join("\n"));
  if (name === "spipe_review_request_create") return text(JSON.stringify(createReviewRequest(args), null, 2));
  if (name === "spipe_review_admission_validate") return text(JSON.stringify(validateReviewAdmission(args, options.reviewAuthority || configuredReviewAuthority()), null, 2));
  if (name === "spipe_self_review_privilege_evaluate" || name === "spipe_self_review_approve") {
    const authority = options.reviewAuthority || configuredReviewAuthority();
    const policy = options.selfReviewPolicy || loadSelfReviewPolicy(
      options.selfReviewPolicyPath || process.env.SPIPE_SELF_REVIEW_POLICY_DB,
      options.selfReviewPolicyTrustPath || process.env.SPIPE_SELF_REVIEW_POLICY_TRUST
    );
    const result = name === "spipe_self_review_privilege_evaluate"
      ? evaluateSelfReviewPrivilege(args, policy, authority)
      : approveSelfReview(args, policy, authority);
    return text(JSON.stringify(result, null, 2));
  }
  const releaseTools = {
    spipe_release_session_plan: "isolated-session",
    spipe_release_beta_backport_plan: "beta-backport",
    spipe_release_candidate_plan: "candidate",
    spipe_release_promotion_plan: "promotion",
    spipe_release_withdrawal_plan: "withdrawal",
    spipe_release_main_fix_discovery_plan: "main-fix-discovery",
    spipe_release_forward_port_plan: "forward-port"
  };
  const releaseOwnerOptions = { ownerToken: options.releaseOwnerToken, env: options.env };
  const operationalReleaseTools = {
    spipe_release_session_start: releaseSessionStart,
    spipe_release_session_status: releaseSessionStatus,
    spipe_release_session_sync: releaseSessionSync,
    spipe_release_beta_backport_verified_plan: planPublicVerifiedBetaBackport,
    spipe_release_candidate_verified_plan: planVerifiedCandidate
  };
  if (operationalReleaseTools[name]) return text(JSON.stringify(operationalReleaseTools[name](args, releaseOwnerOptions), null, 2));
  if (releaseTools[name]) {
    if (releaseTools[name] === "beta-backport") assertPublicExactBetaBackport(args);
    return text(JSON.stringify(createReleasePlan(releaseTools[name], args), null, 2));
  }
  throw new Error(`unknown tool: ${name}`);
}
