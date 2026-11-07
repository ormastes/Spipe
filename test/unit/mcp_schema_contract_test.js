import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";

const root = process.env.SPIPE_TEST_MODULE_ROOT || fileURLToPath(new URL("../../", import.meta.url));
test("MCP owner, plugin and native fixture expose object schemas with both strict admission alternatives", async () => {
  const { tools } = await import(pathToFileURL(resolve(root,"mcp/protocol/tools.js")));
  const { tools: pluginTools } = await import(pathToFileURL(resolve(root,"plugin/mcp/protocol/tools.js")));
  const { independentAdmissionFields, fallbackAdmissionFields } = await import(pathToFileURL(resolve(root,"src/review/contract.js")));
  const fixture = JSON.parse(readFileSync(resolve(root,"src/spipe_mcp/tools_list_fixture.json"),"utf8"));
  assert.equal(new Set(tools.map(tool => tool.name)).size, tools.length);
  for (const tool of tools) assert.equal(tool.inputSchema.type,"object",tool.name);
  const schemas = list => list.map(({name,inputSchema}) => ({name,inputSchema}));
  assert.deepEqual(schemas(pluginTools),schemas(tools));
  assert.deepEqual(schemas(fixture.tools),schemas(tools));
  const admission = tools.find(tool => tool.name === "spipe_review_admission_validate").inputSchema;
  assert.equal(admission.oneOf.length,2);
  admission.oneOf.forEach((branch,index) => {
    const fields = [independentAdmissionFields,fallbackAdmissionFields][index];
    assert.equal(branch.type,"object");
    assert.equal(branch.additionalProperties,false);
    assert.deepEqual(branch.required,[...fields]);
    assert.deepEqual(Object.keys(branch.properties).sort(),[...fields].sort());
  });
});
