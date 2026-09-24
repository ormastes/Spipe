import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalVersion } from "../../src/release/version.js";

export const PROTOCOL_VERSION = "2024-11-05";
const moduleRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export function initializeResult() {
  return {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: { tools: {}, resources: {} },
    serverInfo: { name: "spipe", version: canonicalVersion(moduleRoot) }
  };
}
