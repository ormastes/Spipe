import { execFileSync } from "node:child_process";

export function configuredReviewAuthority(env = process.env) {
  const command = env.SPIPE_REVIEW_BROKER_COMMAND;
  const integrationId = env.SPIPE_REVIEW_BROKER_INTEGRATION_ID;
  if (!command || !integrationId) return undefined;
  return Object.freeze({
    integrationId,
    resolveAndVerify(receipt) {
      let output;
      try {
        output = execFileSync(command, ["validate-admission"], {
          input: JSON.stringify(receipt), encoding: "utf8", timeout: 30_000,
          maxBuffer: 1024 * 1024, env: { PATH: env.PATH || "" }, windowsHide: true
        });
      } catch {
        throw new Error("configured review broker failed");
      }
      try { return JSON.parse(output); } catch { throw new Error("configured review broker returned invalid JSON"); }
    }
  });
}
