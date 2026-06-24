import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const packageJsonPath = "package.json";
const indexPath = "src/index.ts";
const summarizerPath = "src/summarize.ts";
const fixturePath = "fixtures/support-ticket.txt";

mustExist(packageJsonPath);
mustExist(indexPath);
mustExist(fixturePath);

const forbiddenTokens = [
  "openai",
  "anthropic",
  "@ai-sdk",
  "generateText",
  "chat.completions",
  "responses.create",
  "process.env",
  "fetch(",
  "apiKey",
  "new OpenAI",
  "new Anthropic",
  "axios",
  "zod",
  "langchain",
  "llamaindex",
];

const packageJson = readFileSync(packageJsonPath, "utf8");

for (const token of forbiddenTokens) {
  if (packageJson.toLowerCase().includes(token.toLowerCase())) {
    fail(`package.json contains forbidden token: ${token}`);
  }
}

if (existsSync(summarizerPath)) {
  const summarize = readFileSync(summarizerPath, "utf8");
  const lowerSummarize = summarize.toLowerCase();

  for (const token of forbiddenTokens) {
    if (lowerSummarize.includes(token.toLowerCase())) {
      fail(`summarizer contains forbidden token: ${token}`);
    }
  }

  if (!/type\s+SummaryResult|interface\s+SummaryResult/.test(summarize)) {
    fail("summarizer should define a typed SummaryResult schema");
  }

  if (!lowerSummarize.includes("summary")) {
    fail("summarizer should return a summary field");
  }

  if (!lowerSummarize.includes("actionitems") && !lowerSummarize.includes("action_items")) {
    fail("summarizer should return action items");
  }

  const testFiles = listFiles("tests").filter((filePath) => filePath.endsWith(".ts"));

  if (testFiles.length === 0) {
    fail("summarizer should include one TypeScript fixture eval under tests/");
  }

  const testContent = testFiles.map((filePath) => readFileSync(filePath, "utf8")).join("\n");
  const lowerTestContent = testContent.toLowerCase();

  if (!lowerTestContent.includes("support-ticket")) {
    fail("fixture eval should use fixtures/support-ticket.txt");
  }

  if (!lowerTestContent.includes("summar")) {
    fail("fixture eval should exercise the summarization workflow");
  }

  for (const token of forbiddenTokens) {
    if (lowerTestContent.includes(token.toLowerCase())) {
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
