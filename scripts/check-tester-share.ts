import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkTesterShare, renderTesterShareReport } from "../src/tester-share.js";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const report = await checkTesterShare(repoRoot);

console.log(renderTesterShareReport(report));

if (report.status === "not_ready") {
  process.exitCode = 1;
}
