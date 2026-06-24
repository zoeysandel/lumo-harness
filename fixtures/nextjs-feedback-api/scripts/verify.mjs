import { existsSync, readFileSync } from "node:fs";

const packageJsonPath = "package.json";
const homePath = "src/app/page.tsx";
const healthRoutePath = "src/app/api/health/route.ts";
const feedbackRoutePath = "src/app/api/feedback/route.ts";

mustExist(packageJsonPath);
mustExist(homePath);
mustExist(healthRoutePath);

const packageJson = readFileSync(packageJsonPath, "utf8");
const forbiddenPackageTokens = ["prisma", "supabase", "mongoose", "drizzle", "typeorm", "zod", "axios"];

for (const token of forbiddenPackageTokens) {
  if (packageJson.toLowerCase().includes(token)) {
    fail(`package.json contains forbidden dependency token: ${token}`);
  }
}

if (existsSync(feedbackRoutePath)) {
  const route = readFileSync(feedbackRoutePath, "utf8");
  const lowerRoute = route.toLowerCase();
  const forbiddenRouteTokens = [
    "prisma",
    "supabase",
    "mongoose",
    "drizzle",
    "typeorm",
    "process.env",
    "fetch(",
    "axios",
    "getserversession",
    "auth(",
    "cookies(",
    "headers(",
    "localstorage",
    "writefile",
    "appendfile",
    "createwritestream",
    ".push(",
  ];

  if (!route.includes("export async function POST")) {
    fail("feedback route must export async function POST");
  }

  if (!route.includes("NextResponse.json")) {
    fail("feedback route should use NextResponse.json like the existing health route");
  }

  if (!lowerRoute.includes("message")) {
    fail("feedback route must validate or return the message field");
  }

  if (!lowerRoute.includes("email")) {
    fail("feedback route must validate or return the email field");
  }

  if (!route.includes("400")) {
    fail("feedback route must return a validation error with status 400");
  }

  if (!lowerRoute.includes("error")) {
    fail("feedback route must include a typed error response shape");
  }

  for (const token of forbiddenRouteTokens) {
    if (lowerRoute.includes(token)) {
      fail(`feedback route contains forbidden token: ${token}`);
    }
  }
}

console.log("fixture verification passed");

function mustExist(filePath) {
  if (!existsSync(filePath)) {
    fail(`${filePath} is missing`);
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
