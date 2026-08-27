import { execFileSync } from "node:child_process";

export function configuredReviewAuthority(env = process.env) {
  const command = env.SPIPE_REVIEW_BROKER_COMMAND;
  const integrationId = env.SPIPE_REVIEW_BROKER_INTEGRATION_ID;
  if (!command || !integrationId) return undefined;
  function invoke(operation, input) {
    let output;
    try {
      output = execFileSync(command, [operation], {
        input: JSON.stringify(input), encoding: "utf8", timeout: 30_000,
        maxBuffer: 1024 * 1024, env: { PATH: env.PATH || "" }, windowsHide: true
      });
    } catch {
      throw new Error("configured review broker failed");
    }
    try { return JSON.parse(output); } catch { throw new Error("configured review broker returned invalid JSON"); }
  }
  return Object.freeze({
    integrationId,
    resolveAndVerify: (receipt) => invoke("validate-admission", receipt),
    resolveSelfReview: (request) => invoke("resolve-self-review", request),
    admitSelfReview: (admission) => invoke("emit-self-review-admission", admission)
  });
}
