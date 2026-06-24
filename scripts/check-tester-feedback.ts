import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkTesterFeedback, renderTesterFeedbackReport } from "../src/tester-feedback.js";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const report = await checkTesterFeedback(repoRoot);

console.log(renderTesterFeedbackReport(report));

if (report.status === "unsafe_or_incomplete") {
  process.exitCode = 1;
}
