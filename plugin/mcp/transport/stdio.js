import { errorResult } from "../protocol/errors.js";
import { stableJson } from "../../src/format/stable.js";

export function createLineHandler(router, write) {
  return function handleLine(line) {
    let message;
    let requestId = null;
    try {
      message = JSON.parse(line);
      requestId = message && Object.hasOwn(message, "id") ? message.id : null;
      const response = router(message);
      if (response !== undefined) write(`${stableJson(response)}\n`);
    } catch (error) {
      write(`${stableJson(errorResult(requestId, error))}\n`);
    }
  };
}

export function runStdioTransport(router, input = process.stdin, output = process.stdout) {
  let buffer = "";
  const handleLine = createLineHandler(router, (content) => output.write(content));
  input.setEncoding("utf8");
  input.on("data", (chunk) => {
    buffer += chunk;
    let newline;
    while ((newline = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line) handleLine(line);
    }
  });
}
