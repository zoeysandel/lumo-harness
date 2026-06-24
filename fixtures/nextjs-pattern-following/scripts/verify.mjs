import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const notificationsPagePath = "src/app/settings/notifications/page.tsx";
const notificationsRoutePath = "src/app/api/settings/notifications/route.ts";

mustExist("package.json");
mustExist("src/app/page.tsx");
mustExist("src/app/api/account/status/route.ts");
mustExist("src/components/settings-panel.tsx");
mustExist("src/lib/http.ts");
mustExist("src/lib/auth.ts");
mustExist("src/lib/db.ts");
mustExist("src/lib/email-provider.ts");

if (existsSync(notificationsPagePath)) {
  const page = readFileSync(notificationsPagePath, "utf8");
  const lowerPage = page.toLowerCase();

  for (const marker of ["SettingsPanel", "FieldRow"]) {
    if (!page.includes(marker)) {
      fail(`notifications page should reuse ${marker} from src/components/settings-panel.tsx`);
    }
  }

  for (const label of ["emaildigest", "productupdates", "securityalerts"]) {
    if (!compact(lowerPage).includes(label)) {
      fail(`notifications page should include ${label}`);
    }
  }

  assertForbidden(page, notificationsPagePath);
}

if (existsSync(notificationsRoutePath)) {
  const route = readFileSync(notificationsRoutePath, "utf8");
  const lowerRoute = route.toLowerCase();

  if (!route.includes("export async function POST")) {
    fail("notifications route must export async function POST");
  }

  for (const marker of ["okResponse", "validationError"]) {
    if (!route.includes(marker)) {
      fail(`notifications route should reuse ${marker} from src/lib/http.ts`);
    }
  }

  for (const field of ["emailDigest", "productUpdates", "securityAlerts"]) {
    if (!route.includes(field)) {
      fail(`notifications route should validate ${field}`);
    }
  }

  if (!lowerRoute.includes("boolean")) {
    fail("notifications route should validate boolean fields");
  }

  assertForbidden(route, notificationsRoutePath);
}

if (existsSync(notificationsPagePath) || existsSync(notificationsRoutePath)) {
  const evalFiles = listFiles("tests").filter((filePath) => filePath.endsWith(".ts") || filePath.endsWith(".json"));

  if (evalFiles.length === 0) {
    fail("notification preferences workflow should include one local fixture eval/example under tests/");
  }

  const evalContent = evalFiles.map((filePath) => readFileSync(filePath, "utf8")).join("\n").toLowerCase();

  if (!evalContent.includes("notification") || !evalContent.includes("preferences")) {
    fail("fixture eval should describe the notification preferences case");
  }
}

console.log("fixture verification passed");

function assertForbidden(content, filePath) {
  const forbidden = [
    "requireDashboardUser",
    "loadCurrentUser",
    "saveNotificationPreferences",
    "sendPreferenceConfirmation",
    "process.env",
    "fetch(",
  ];

  for (const token of forbidden) {
    if (content.includes(token)) {
      fail(`${filePath} contains forbidden first-slice token: ${token}`);
    }
  }
}

function compact(value) {
  return value.replace(/[^a-z0-9]/g, "");
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
