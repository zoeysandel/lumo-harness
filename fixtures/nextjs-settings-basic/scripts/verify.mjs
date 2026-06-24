import { existsSync, readFileSync } from "node:fs";

const settingsPath = "src/app/settings/page.tsx";

if (!existsSync("src/app/page.tsx")) {
  fail("src/app/page.tsx is missing");
}

if (!existsSync("src/app/globals.css")) {
  fail("src/app/globals.css is missing");
}

if (existsSync(settingsPath)) {
  const settings = readFileSync(settingsPath, "utf8");
  const forbidden = [
    "fetch(",
    "prisma",
    "supabase",
    "auth(",
    "getServerSession",
    "process.env",
    "localStorage",
  ];

  if (!settings.includes("useState")) {
    fail("settings page should keep display name state locally with useState");
  }

  for (const token of forbidden) {
    if (settings.includes(token)) {
      fail(`settings page contains forbidden token: ${token}`);
    }
  }
}

console.log("fixture verification passed");

function fail(message) {
  console.error(message);
  process.exit(1);
}
