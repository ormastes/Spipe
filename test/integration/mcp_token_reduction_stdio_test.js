import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const moduleRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const server = join(moduleRoot, "mcp/server.js");
const MAX_DOC_BYTES = 256 * 1024;

// Replies are matched to requests by order (the transport processes lines
// synchronously); handler refusals arrive as JSON-RPC errors, never content.
test("packaged stdio server keeps MCP responses bounded and refuses traversal", () => {
  const root = mkdtempSync(join(tmpdir(), "spipe-mcp-stdio-bounds-"));
  try {
    const largestDoc = "doc/00_llm_process/spipe/skill.md";
    const messages = [
      { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "spipe_read_doc", arguments: { path: "../AGENTS.md" } } },
      { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "spipe_read_doc", arguments: { path: "/etc/passwd" } } },
      { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "spipe_read_doc", arguments: { path: "package.json" } } },
      { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "spipe_read_doc", arguments: { path: largestDoc } } },
      { jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "spipe_experts", arguments: {} } }
    ];
    const run = spawnSync(process.execPath, [server], {
      input: `${messages.map(JSON.stringify).join("\n")}\n`, encoding: "utf8", timeout: 10_000
    });
    assert.equal(run.status, 0, run.stderr);
    const replies = run.stdout.trim().split("\n").map(JSON.parse);
    assert.equal(replies.length, messages.length);

    // Traversal and allowlist refusals arrive as errors, never content.
    assert.match(replies[0].error.message, /relative path inside the SPipe module/);
    assert.match(replies[1].error.message, /relative path inside the SPipe module/);
    assert.match(replies[2].error.message, /outside the SPipe documentation allowlist/);

    // The largest whitelisted document in the tree stays under the 256 KiB cap.
    const docText = replies[3].result.content[0].text;
    assert.ok(Buffer.byteLength(docText, "utf8") <= MAX_DOC_BYTES, "whitelisted doc response exceeds the size cap");
    assert.match(docText, /skill/i);

    // Expert listing stays compact.
    const experts = replies[4].result.content[0].text;
    assert.ok(Buffer.byteLength(experts, "utf8") < 4096, "expert listing is not compact");
  } finally { rmSync(root, { recursive: true, force: true }); }
});
