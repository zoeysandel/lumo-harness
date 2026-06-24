import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const packageJsonPath = "package.json";
const healthRoutePath = "src/app/api/health/route.ts";
const triageRoutePath = "src/app/api/intake/triage/route.ts";

mustExist(packageJsonPath);
mustExist(healthRoutePath);

const packageJson = readFileSync(packageJsonPath, "utf8").toLowerCase();
const forbiddenPackageTokens = [
  "openai",
  "anthropic",
  "@ai-sdk",
  "\"ai\"",
  "langchain",
  "llamaindex",
  "prisma",
  "supabase",
  "mongoose",
  "drizzle",
  "typeorm",
  "zod",
  "axios",
  "stripe",
];

for (const token of forbiddenPackageTokens) {
  if (packageJson.includes(token)) {
    fail(`package.json contains forbidden dependency token: ${token}`);
  }
}

if (existsSync(triageRoutePath)) {
  const route = readFileSync(triageRoutePath, "utf8");
  const lowerRoute = route.toLowerCase();
  const forbiddenRouteTokens = [
    "openai",
    "anthropic",
    "@ai-sdk",
    "generatetext",
    "chat.completions",
    "responses.create",
    "process.env",
    "fetch(",
    "axios",
    "apikey",
    "prisma",
    "supabase",
    "mongoose",
    "drizzle",
    "typeorm",
    "database",
    "db.",
    ".insert(",
    "auth(",
    "getserversession",
    "cookies(",
    "headers(",
    "queue",
    "webhook",
    "crm",
    "localstorage",
    "writefile",
    "appendfile",
    "createwritestream",
  ];

  if (!route.includes("export async function POST")) {
    fail("triage route must export async function POST");
  }

  if (!route.includes("NextResponse.json")) {
    fail("triage route should use NextResponse.json like the existing health route");
  }

  for (const required of ["message", "category", "urgency"]) {
    if (!lowerRoute.includes(required)) {
      fail(`triage route should include ${required}`);
    }
  }

  if (!lowerRoute.includes("suggestednextstep") && !lowerRoute.includes("suggested_next_step")) {
    fail("triage route should include a suggested next step field");
  }

  if (!route.includes("400")) {
    fail("triage route must return validation errors with status 400");
  }

  if (!lowerRoute.includes("error")) {
    fail("triage route must include an error response shape");
  }

  if (!lowerRoute.includes("unconfirmed") && !lowerRoute.includes("deterministic")) {
    fail("triage route should mark the local AI-style classification as deterministic or UNCONFIRMED");
  }

  for (const token of forbiddenRouteTokens) {
    if (lowerRoute.includes(token)) {
      fail(`triage route contains forbidden token: ${token}`);
    }
  }

  const evalFiles = listFiles("tests").filter((filePath) => filePath.endsWith(".ts") || filePath.endsWith(".json"));

  if (evalFiles.length === 0) {
    fail("triage route should include one local fixture eval/example under tests/");
  }

  const evalContent = evalFiles.map((filePath) => readFileSync(filePath, "utf8")).join("\n").toLowerCase();

  if (!evalContent.includes("intake") && !evalContent.includes("triage")) {
    fail("fixture eval should describe the intake triage case");
  }

  for (const token of forbiddenRouteTokens) {
    if (evalContent.includes(token)) {
      fail(`fixture eval contains forbidden token: ${token}`);
    }
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
