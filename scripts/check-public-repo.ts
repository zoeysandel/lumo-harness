import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkPublicRepoReadiness, renderPublicRepoReadinessReport } from "../src/public-repo-readiness.js";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const report = await checkPublicRepoReadiness(repoRoot);

console.log(renderPublicRepoReadinessReport(report));

if (report.status === "not_ready") {
  process.exitCode = 1;
}
