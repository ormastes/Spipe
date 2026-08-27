import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

const syncPaths = [
  "doc/00_llm_process/skill_command/skills/codex/sync/skill.md",
  "doc/00_llm_process/skill_command/skills/gemini/sync/skill.md",
  "doc/00_llm_process/skill_command/skills/pipe/impl/sync/skill.md",
  ".claude/skills/sync.md",
  ".codex/skills/sync/SKILL.md",
  ".gemini/commands/sync.toml",
  "plugin/skills/sync/SKILL.md"
];

const guardedGuidancePaths = [
  ".claude/agents/vcs.md",
  ".claude/agents/build.md",
  ".claude/agents/spipe/ship.md",
  ".claude/skills/lib/worktree.md",
  "doc/00_llm_process/skill_command/skills/claude/lib/worktree/skill.md",
  ...syncPaths,
  ".claude/skills/sstack.md",
  ".claude/agents/spipe/dev.md",
  "doc/00_llm_process/skill_command/skills/pipe/impl/sstack/skill.md",
  "plugin/skills/sstack/SKILL.md"
];

const forbiddenLegacyPatterns = [
  /jj\s+bookmark\s+set\s+main/i,
  /git\s+push\s+(?:origin\s+)?main\b/i,
  /git\s+push\s+--tags\b/i,
  /\bNO\s+branches\b/i,
  /work\s+directly\s+on\s+main/i,
  /\brm\s+-[^\n]*rf\b/i,
  /internal:ours/i,
  /resolve\s+--tool[^\n]*ours/i,
  /git\s+tag\s+(?:-a\s+)?v/i,
  /jj\s+squash\s+--from/i,
  /commit\s+all\s+changes/i
];

test("canonical and packaged VCS session policies stay byte-identical", () => {
  assert.equal(
    read("plugin/doc/00_llm_process/skill_command/vcs_session_policy.md"),
    read("doc/00_llm_process/skill_command/vcs_session_policy.md")
  );
});

test("canonical and projected worktree guidance stay byte-identical", () => {
  assert.equal(
    read(".claude/skills/lib/worktree.md"),
    read("doc/00_llm_process/skill_command/skills/claude/lib/worktree/skill.md")
  );
});

test("every sync projection preserves the isolated-session contract", () => {
  for (const path of syncPaths) {
    const content = read(path);
    const flat = content.replace(/\s+/g, " ");
    assert.match(flat, /session-owned [`]?work\/\*/i, path);
    assert.match(flat, /non-main linked worktree/i, path);
    for (const identity of ["owner", "session ID", "worktree", "work branch", "target", "base", "expected target"])
      assert.match(flat, new RegExp(identity, "i"), `${path}: missing identity ${identity}`);
    assert.match(flat, /rebase only a private unsubmitted work branch/i, path);
    assert.match(flat, /renew evidence.*base\/head\/diff|renew all.*base, head, or diff/i, path);
    assert.match(flat, /push only the owned work ref with (?:an )?exact lease(?:\/CAS| or compare-and-swap)/i, path);
    assert.match(flat, /PR\/integration authority/i, path);
    assert.match(flat, /never move a protected ref or release tag|never moves [`]?main/i, path);
    assert.match(flat, /conflicts semantically.*regenerate/i, path);
    assert.match(flat, /recursive force deletion is outside/i, path);
  }
});

test("dev routing creates an isolated session before Phase 1", () => {
  for (const path of [
    ".claude/skills/sstack.md",
    ".claude/agents/spipe/dev.md",
    "doc/00_llm_process/skill_command/skills/pipe/impl/sstack/skill.md",
    "plugin/skills/sstack/SKILL.md"
  ]) {
    const content = read(path);
    const flat = content.replace(/\s+/g, " ");
    assert.match(flat, /session-owned [`]?work\/\*/i, path);
    assert.match(flat, /linked worktree physically separate from the protected main worktree/i, path);
    for (const identity of ["owner", "session ID", "worktree path", "work branch", "target ref", "base commit", "expected target commit"])
      assert.match(flat, new RegExp(identity, "i"), `${path}: missing identity ${identity}`);
  }

  for (const path of [
    ".claude/skills/dev.md",
    ".claude/skills/sp_dev.md",
    ".codex/skills/dev/SKILL.md",
    ".codex/skills/sp_dev/SKILL.md",
    ".gemini/commands/dev.toml",
    ".gemini/commands/sp_dev.toml",
    "plugin/skills/dev/SKILL.md",
    "plugin/skills/sp-dev/SKILL.md"
  ]) assert.match(read(path), /sstack/i, `${path}: dev alias must route through SStack`);
});

test("VCS build and ship agents preserve protected boundaries", () => {
  const vcs = read(".claude/agents/vcs.md");
  const build = read(".claude/agents/build.md");
  const ship = read(".claude/agents/spipe/ship.md");

  for (const [path, content] of [
    [".claude/agents/vcs.md", vcs],
    [".claude/agents/build.md", build],
    [".claude/agents/spipe/ship.md", ship]
  ]) {
    assert.match(content, /session-owned [`]?work\/\*/i, path);
    assert.match(content, /signed annotated tag/i, path);
    assert.match(content, /Build and ordinary ship phases (?:do not|never) create/i, path);
  }
  assert.match(build, /Promotion reuses admitted artifacts without rebuilding/i);
  assert.match(ship, /PR or integration authority/i);
  assert.match(ship, /output is a submitted work branch/i);
});

test("shipped guidance contains no forbidden legacy VCS recipe", () => {
  for (const path of guardedGuidancePaths) {
    const content = read(path);
    for (const pattern of forbiddenLegacyPatterns)
      assert.equal(pattern.test(content), false, `${path}: forbidden legacy guidance ${pattern}`);
  }
});
