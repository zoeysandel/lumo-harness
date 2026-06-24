import { okResponse } from "../../../lib/http";

export function GET() {
  return okResponse({
    service: "nextjs-ops-console-advanced-risk",
    status: "ok"
  });
}
