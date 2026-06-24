import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const requiredFiles = [
  "package.json",
  "tsconfig.json",
  "README.md",
  "src/app/page.tsx",
  "src/app/accounts/[accountId]/page.tsx",
  "src/app/accounts/[accountId]/actions.ts",
  "src/app/api/health/route.ts",
  "src/app/api/ops/impact-preview/route.ts",
  "src/components/action-panel.tsx",
  "src/components/metric-card.tsx",
  "src/components/ops-table.tsx",
  "src/components/risk-badge.tsx",
  "src/components/timeline.tsx",
  "src/lib/data.ts",
  "src/lib/domain.ts",
  "src/lib/http.ts",
  "src/lib/services/account-service.ts",
  "src/lib/services/playbook-service.ts",
  "src/lib/services/risk-service.ts",
  "src/lib/validation/common.ts",
  "src/lib/validation/impact-preview.ts",
  "src/lib/risk-seams/auth.ts",
  "src/lib/risk-seams/db.ts",
  "src/lib/risk-seams/billing.ts",
  "src/lib/risk-seams/notifications.ts",
  "src/lib/risk-seams/provider-api.ts",
  "src/lib/risk-seams/audit-log.ts",
  "src/lib/risk-seams/ai-provider.ts",
  "tests/impact-preview.fixture.json"
];

for (const filePath of requiredFiles) {
  mustExist(filePath);
}

const packageJson = readFile("package.json").toLowerCase();
for (const forbidden of ["openai", "anthropic", "@ai-sdk", "stripe", "supabase", "prisma", "zod", "axios"]) {
  if (packageJson.includes(forbidden)) {
    fail(`package.json contains forbidden production dependency token: ${forbidden}`);
  }
}

const allFiles = listFiles(".").filter((filePath) => {
  return !filePath.includes("node_modules") && !filePath.includes(".next");
});
const fixtureFiles = allFiles.filter((filePath) => {
  return filePath.endsWith(".ts") || filePath.endsWith(".tsx") || filePath.endsWith(".json") || filePath.endsWith(".md");
});

if (fixtureFiles.length < 25) {
  fail(`advanced fixture should have at least 25 files, found ${fixtureFiles.length}`);
}

const impactRoute = readFile("src/app/api/ops/impact-preview/route.ts");
if (!impactRoute.includes("export async function POST")) {
  fail("impact preview route must export async function POST");
}
if (!impactRoute.includes("parseImpactPreviewRequest") || !impactRoute.includes("okResponse")) {
  fail("impact preview route should use local validation and HTTP helpers");
}

const dashboardAndDetail = [
  "src/app/page.tsx",
  "src/app/accounts/[accountId]/page.tsx",
  ...listFiles("src/components").filter((filePath) => filePath.endsWith(".tsx"))
]
  .map(readFile)
  .join("\n")
  .toLowerCase();

for (const expectedUiTerm of ["ops console", "enterprise", "risk", "renewal", "playbook"]) {
  if (!dashboardAndDetail.includes(expectedUiTerm)) {
    fail(`UI should include advanced ops concept: ${expectedUiTerm}`);
  }
}

const riskSeamContent = listFiles("src/lib/risk-seams")
  .map(readFile)
  .join("\n")
  .toLowerCase();
for (const expectedSeam of ["auth", "database", "billing", "notification", "provider", "audit", "ai"]) {
  if (!riskSeamContent.includes(expectedSeam)) {
    fail(`risk seams should include ${expectedSeam}`);
  }
}

const containmentRoutePath = "src/app/api/accounts/[accountId]/containment-plan/route.ts";
if (existsSync(containmentRoutePath)) {
  const route = readFile(containmentRoutePath);
  const lowerRoute = route.toLowerCase();

  if (!route.includes("export async function POST")) {
    fail("containment-plan route must export async function POST");
  }

  for (const helper of ["okResponse", "validationError"]) {
    if (!route.includes(helper)) {
      fail(`containment-plan route should use ${helper}`);
    }
  }

  for (const required of ["accountId", "containment", "owner", "reason", "actions"]) {
    if (!lowerRoute.includes(required.toLowerCase())) {
      fail(`containment-plan route should include ${required}`);
    }
  }

  if (!lowerRoute.includes("unconfirmed") && !lowerRoute.includes("draft_only")) {
    fail("containment-plan response should mark local-only status as UNCONFIRMED or draft_only");
  }

  if (!route.includes("400")) {
    fail("containment-plan route must return validation errors with status 400");
  }

  const forbiddenRouteTokens = [
    "process.env",
    "fetch(",
    "axios",
    "openai",
    "anthropic",
    "stripe",
    "supabase",
    "prisma",
    "risk-seams",
    "sendnotification",
    "recordaudit",
    "charge",
    "database",
    ".insert(",
    ".update(",
    "cookies(",
    "headers(",
    "queue",
    "webhook"
  ];

  for (const token of forbiddenRouteTokens) {
    if (lowerRoute.includes(token.toLowerCase())) {
      fail(`containment-plan route contains forbidden token: ${token}`);
    }
  }

  if (!dashboardAndDetail.includes("containment")) {
    fail("UI should include a containment-plan affordance once the route exists");
  }

  const testFiles = listFiles("tests").filter((filePath) => {
    return filePath.endsWith(".ts") || filePath.endsWith(".json");
  });
  const testContent = testFiles.map(readFile).join("\n").toLowerCase();

  if (!testContent.includes("containment") || !testContent.includes("account")) {
    fail("tests/ should include a local containment-plan fixture/example");
  }

  for (const token of forbiddenRouteTokens) {
    if (testContent.includes(token.toLowerCase())) {
      fail(`containment fixture contains forbidden token: ${token}`);
    }
  }
}

console.log(`fixture verification passed (${fixtureFiles.length} files checked)`);

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}

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
