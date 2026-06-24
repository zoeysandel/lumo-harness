import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const dashboardPath = "src/app/page.tsx";
const healthRoutePath = "src/app/api/health/route.ts";
const clientCardPath = "src/components/client-card.tsx";
const httpPath = "src/lib/http.ts";
const escalationRoutePath = "src/app/api/client/escalations/route.ts";

mustExist("package.json");
mustExist(dashboardPath);
mustExist(healthRoutePath);
mustExist(clientCardPath);
mustExist(httpPath);
mustExist("src/lib/auth.ts");
mustExist("src/lib/db.ts");
mustExist("src/lib/email-provider.ts");
mustExist("src/lib/crm.ts");
mustExist("src/lib/billing.ts");

if (existsSync(escalationRoutePath)) {
  const route = readFileSync(escalationRoutePath, "utf8");
  const lowerRoute = route.toLowerCase();

  if (!route.includes("export async function POST")) {
    fail("client escalation route must export async function POST");
  }

  if (!route.includes("okResponse") || !route.includes("validationError")) {
    fail("client escalation route should reuse okResponse and validationError");
  }

  for (const required of ["client", "reason", "urgency"]) {
    if (!lowerRoute.includes(required)) {
      fail(`client escalation route should include ${required}`);
    }
  }

  if (!route.includes("400")) {
    fail("client escalation route must return validation errors with status 400");
  }
}

const uiContent = [dashboardPath, ...listFiles("src/components")]
  .filter((filePath) => filePath.endsWith(".tsx"))
  .map((filePath) => readFileSync(filePath, "utf8"))
  .join("\n");

if (existsSync(escalationRoutePath)) {
  if (!uiContent.includes("ClientCard")) {
    fail("dashboard UI should keep using the ClientCard pattern");
  }

  if (!uiContent.toLowerCase().includes("escalat")) {
    fail("dashboard UI should include an escalation action");
  }

  const evalFiles = listFiles("tests").filter((filePath) => filePath.endsWith(".ts") || filePath.endsWith(".json"));

  if (evalFiles.length === 0) {
    fail("client escalation workflow should include one local fixture eval/example under tests/");
  }

  const evalContent = evalFiles.map((filePath) => readFileSync(filePath, "utf8")).join("\n").toLowerCase();

  if (!evalContent.includes("client") || !evalContent.includes("escalat")) {
    fail("fixture eval should describe the client escalation case");
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

