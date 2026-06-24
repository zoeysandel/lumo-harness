import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkTesterFeedback } from "../src/tester-feedback.js";
import { renderTesterNextAction } from "../src/tester-next.js";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const report = await checkTesterFeedback(repoRoot);

console.log(renderTesterNextAction(report));

if (report.status === "unsafe_or_incomplete") {
  process.exitCode = 1;
}
