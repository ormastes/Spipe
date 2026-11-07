import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const guides = ["simple_native_test_binaries.md", "build_debug_continuation.md"];

test("packaged wiki guides match canonical sources with plugin-local backlinks", () => {
  for (const name of guides) {
    const canonical = readFileSync(join(root,"wiki",name),"utf8");
    const packaged = readFileSync(join(root,"plugin/wiki",name),"utf8");
    assert.equal(packaged,canonical.replaceAll("../plugin/skills/","../skills/"),name);
  }
});

test("skill and guide links stay inside a standalone installed version directory", () => {
  const temporary = mkdtempSync(join(tmpdir(),"spipe-plugin-guides-"));
  const version = join(temporary,"spipe","0.2.0");
  try {
    cpSync(join(root,"plugin"),version,{recursive:true});
    const installed = realpathSync(version);
    const pages = ["skills/spipe/SKILL.md","skills/spipe-loop/SKILL.md",...guides.map(name => "wiki/"+name)];
    let checked = 0;
    for (const page of pages) {
      const absolute = join(installed,page);
      for (const [,link] of readFileSync(absolute,"utf8").matchAll(/\]\(([^)]+)\)/g)) {
        if (/^[a-z][a-z0-9+.-]*:/i.test(link)) continue;
        const target = realpathSync(resolve(dirname(absolute),link.split("#",1)[0]));
        const local = relative(installed,target);
        assert.ok(local !== ".." && !local.startsWith(".."+sep),page+": "+link);
        assert.ok(!isAbsolute(local),page+": "+link);
        assert.ok(statSync(target).isFile(),page+": "+link);
        checked += 1;
      }
    }
    assert.equal(checked,7);
  } finally {
    rmSync(temporary,{recursive:true,force:true});
  }
});
