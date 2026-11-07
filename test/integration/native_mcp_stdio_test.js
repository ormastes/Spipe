import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = process.env.SPIPE_TEST_MODULE_ROOT || fileURLToPath(new URL("../../", import.meta.url));
const native = process.env.SPIPE_NATIVE_EXE;
test("native SPipe emits parsed initialize, schemas, useful document replies and tool errors", {skip: !native && "set SPIPE_NATIVE_EXE to a built native executable; source fallback is excluded"}, () => {
  const docs = [
    ["spipe_read_doc", "doc/00_llm_process/spipe/self_review_skill.md"],
    ["spipe_fine_tune_guide", "doc/00_llm_process/spipe/llm_finetune.md"],
    ["spipe_fine_tune_model_guide", "doc/00_llm_process/spipe/llm_model_research.md"],
    ["spipe_fine_tune_template", "doc/00_llm_process/spipe/llm_finetune_attempt_template.sdn"],
    ["spipe_self_review_guide", "doc/00_llm_process/spipe/self_review_skill.md"],
    ["spipe_release_guide", "doc/00_llm_process/skill_command/command/release.md"]
  ];
  const calls = [{name:"spipe_info",arguments:{}}, {name:"spipe_experts",arguments:{}}, ...docs.map(([name,path]) => ({name,arguments:name === "spipe_read_doc" ? {path} : {}}))];
  const requests = [{jsonrpc:"2.0",id:1,method:"initialize",params:{}}, {jsonrpc:"2.0",method:"notifications/initialized"}, {jsonrpc:"2.0",id:2,method:"tools/list"},
    ...calls.map((params,index) => ({jsonrpc:"2.0",id:index+3,method:"tools/call",params})),
    {jsonrpc:"2.0",id:11,method:"tools/call",params:{name:"no_such",arguments:{}}},
    {jsonrpc:"2.0",id:12,method:"tools/call",params:{name:"spipe_release_capabilities",arguments:{}}}];
  const result = spawnSync(resolve(native), [], {encoding:"utf8",windowsHide:true,timeout:20000,maxBuffer:2*1024*1024,
    env:{...process.env,SPIPE_MODULE_ROOT:root}, input:requests.map(message => JSON.stringify(message)).join("\n")+"\n"});
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  const replies = result.stdout.trim().split(/\r?\n/).map(line => JSON.parse(line));
  assert.deepEqual(replies.map(reply => reply.id), [1,2,3,4,5,6,7,8,9,10,11,12]);
  assert.equal(replies[0].result.protocolVersion, "2024-11-05");
  assert.equal(replies[0].result.serverInfo.name, "spipe");
  const tools = replies[1].result.tools;
  assert.ok(tools.length >= calls.length);
  for (const tool of tools) assert.equal(tool.inputSchema.type, "object", tool.name);
  const texts = replies.slice(2,10).map(reply => {
    assert.equal(reply.error, undefined);
    assert.notEqual(reply.result.isError, true);
    return reply.result.content.filter(part => part.type === "text").map(part => part.text).join("\n");
  });
  assert.ok(texts[0].includes("module="+root.replaceAll("\\","/").replace(/\/$/,"")));
  assert.ok(texts[1].includes("project_expert="));
  docs.forEach(([,path],index) => assert.equal(texts[index+2], readFileSync(resolve(root,path),"utf8")));
  assert.equal(replies[10].error.code, -32000);
  assert.match(replies[10].error.message, /unknown tool: no_such/);
  assert.equal(replies[11].error.code, -32000);
  assert.match(replies[11].error.message, /not yet ported/);
});
