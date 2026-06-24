import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const healthRoutePath = "src/app/api/health/route.ts";
const dashboardPath = "src/app/page.tsx";
const actionCardPath = "src/components/intake-action-card.tsx";
const escalationRoutePath = "src/app/api/intake/escalations/route.ts";

mustExist("package.json");
mustExist(healthRoutePath);
mustExist(dashboardPath);
mustExist(actionCardPath);
mustExist("src/lib/auth.ts");
mustExist("src/lib/db.ts");
mustExist("src/lib/openai.ts");
mustExist("src/lib/crm.ts");
mustExist("src/lib/billing.ts");

if (existsSync(escalationRoutePath)) {
  const route = readFileSync(escalationRoutePath, "utf8");
  const lowerRoute = route.toLowerCase();

  if (!route.includes("export async function POST")) {
    fail("escalation route must export async function POST");
  }

  if (!route.includes("NextResponse.json")) {
    fail("escalation route should use NextResponse.json like the existing health route");
  }

  for (const required of ["intake", "reason", "priority"]) {
    if (!lowerRoute.includes(required)) {
      fail(`escalation route should include ${required}`);
    }
  }

  if (!route.includes("400")) {
    fail("escalation route must return validation errors with status 400");
  }

  if (!lowerRoute.includes("error")) {
    fail("escalation route must include an error response shape");
  }
}

const uiContent = [dashboardPath, ...listFiles("src/components")]
  .filter((filePath) => filePath.endsWith(".tsx"))
  .map((filePath) => readFileSync(filePath, "utf8"))
  .join("\n")
  .toLowerCase();

if (existsSync(escalationRoutePath)) {
  if (!uiContent.includes("escalat")) {
    fail("dashboard UI should include an escalation action");
  }

  const evalFiles = listFiles("tests").filter((filePath) => filePath.endsWith(".ts") || filePath.endsWith(".json"));

  if (evalFiles.length === 0) {
    fail("dashboard escalation should include one local fixture eval/example under tests/");
  }

  const evalContent = evalFiles.map((filePath) => readFileSync(filePath, "utf8")).join("\n").toLowerCase();

  if (!evalContent.includes("escalat") || !evalContent.includes("intake")) {
    fail("fixture eval should describe the intake escalation case");
  }
}

console.log("fixture verification passed");

function mustExist(filePath) {
  if (!existsSync(filePath)) {
    fail(`${filePath} is missing`);
  }
}

function listFiles(dirPath) {
  if (!existsSync(dirPath)) {
    return [];
  }

  return readdirSync(dirPath).flatMap((entry) => {
    const filePath = path.join(dirPath, entry);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      return listFiles(filePath);
    }

    return filePath;
  });
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
