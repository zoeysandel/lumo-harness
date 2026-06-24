import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildTesterPacket, renderTesterPacket, validateGeneratedTesterPacket } from "../src/tester-readiness.js";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const packet = await buildTesterPacket(repoRoot);
const rendered = renderTesterPacket(packet);
const outputPath = path.join(repoRoot, "docs/first-tester-packet.generated.md");

await writeFile(outputPath, rendered);
const generatedValidation = await validateGeneratedTesterPacket(repoRoot);

console.log(rendered);
console.log(`\nWritten: ${path.relative(repoRoot, outputPath)}`);

if (generatedValidation.status === "fail") {
  console.error("\nGenerated packet validation failed:");
  for (const check of generatedValidation.checks) {
    if (check.status === "fail") {
      console.error(`- ${check.name}: ${check.detail}`);
    }
  }
}

if (packet.readiness.status === "not_ready" || generatedValidation.status === "fail") {
  process.exitCode = 1;
}
