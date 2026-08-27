import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { callTool, tools } from "../../mcp/protocol/tools.js";
import { tools as pluginTools } from "../../plugin/mcp/protocol/tools.js";

const root = resolve(fileURLToPath(new URL("../../", import.meta.url)));
const run = (...args) => execFileSync(process.execPath, args, { cwd: root, encoding: "utf8" });

test("CLI and MCP explain the provider limit and distinct admission action", () => {
  const help = run("cli/spipe.js", "--help");
  assert.match(help, /GitHub forbids author APPROVED reviews/);
  assert.match(help, /self-review-guide/);
  for (const query of ["self approve", "approve PR", "author cannot approve"]) assert.match(help, new RegExp(query, "i"));
  const guide = run("cli/spipe.js", "self-review-guide");
  assert.match(guide, /authors cannot approve their own pull requests/);
  assert.match(guide, /default allow means \*eligible after review\*/i);
  assert.match(guide, /constraint_not_satisfied/);
  assert.match(guide, /high.*xhigh.*max.*ultra/s);
  assert.match(guide, /PASS.*P0=0.*P1=0/s);
  for (const field of ["pull_request_number", "expected_head_sha", "session_id", "reviewer_model", "reviewer_effort", "self_attestation='PASS:0:0'"]) assert.match(guide, new RegExp(field));
  assert.match(guide, /Poll the exact resolved SHA/);
  assert.match(guide, /not GitHub provider\s+`APPROVED`/);
  assert.match(guide, /spipe_self_review_privilege_evaluate.*only.*spipe_self_review_approve/s);
  assert.match(guide, /--repo ormastes\/simple/);
  assert.match(guide, /HEAD_SHA=\$\(gh pr view/);
  assert.match(guide, /before starting the review/i);
  assert.match(guide, /independently resolves the live PR head.*reject unless it equals `expected_head_sha`/s);
  assert.match(guide, /commits\/\$HEAD_SHA\/check-runs\?check_name=SPipe%20Self%20Review%20Admission/);
  assert.match(guide, /Do not call, combine, or reorder/);

  assert.deepEqual(pluginTools, tools);
  const guideTool = tools.find((tool) => tool.name === "spipe_self_review_guide");
  const admitTool = tools.find((tool) => tool.name === "spipe_self_review_approve");
  assert.match(guideTool.description, /author cannot approve/i);
  for (const query of ["self approve", "approve PR", "author cannot approve"]) assert.match(guideTool.description, new RegExp(query, "i"));
  assert.match(admitTool.description, /never submits one/);
  const mcpGuide = callTool(root, "spipe_self_review_guide").content[0].text;
  assert.equal(mcpGuide, readFileSync(resolve(root, "doc/00_llm_process/spipe/review_admission.md"), "utf8"));
});

test("Claude, Codex, Gemini, Pipe, and plugin guidance is generated from one source", () => {
  assert.match(run("scripts/project-self-review-guidance.js", "--check"), /projections: PASS/);
  const source = readFileSync(resolve(root, "doc/00_llm_process/spipe/self_review_skill.md"), "utf8");
  const begin = "<!-- spipe-self-review-guidance:begin -->";
  const end = "<!-- spipe-self-review-guidance:end -->";
  const canonical = source.slice(source.indexOf(begin), source.indexOf(end) + end.length);
  for (const path of [
    ".claude/skills/dev.md", ".codex/skills/dev/SKILL.md", ".gemini/commands/dev.toml",
    ".claude/skills/release.md", ".codex/skills/release/SKILL.md", ".gemini/commands/release.toml",
    "doc/00_llm_process/skill_command/skills/pipe/self-review/skill.md",
    "doc/00_llm_process/skill_command/skills/pipe/release/repo_and_pull_req/skill.md",
    "plugin/skills/spipe/SKILL.md", "plugin/skills/release/SKILL.md"
  ]) assert.ok(readFileSync(resolve(root, path), "utf8").includes(canonical), path);
});
