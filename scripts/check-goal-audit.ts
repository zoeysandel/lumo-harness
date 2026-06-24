import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkGoalAudit, renderGoalAuditReport } from "../src/goal-audit.js";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const report = await checkGoalAudit(repoRoot);

console.log(renderGoalAuditReport(report));

if (report.status === "not_ready") {
  process.exitCode = 1;
}
