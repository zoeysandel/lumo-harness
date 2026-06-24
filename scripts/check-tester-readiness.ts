import { fileURLToPath } from "node:url";
import { checkTesterReadiness, renderTesterReadinessReport } from "../src/tester-readiness.js";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const report = await checkTesterReadiness(repoRoot);

console.log(renderTesterReadinessReport(report));

if (report.status === "not_ready") {
  process.exitCode = 1;
}
