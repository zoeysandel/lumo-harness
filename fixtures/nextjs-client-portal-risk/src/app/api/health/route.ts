import { okResponse } from "../../../lib/http";

export function GET() {
  return okResponse({
    service: "client-portal-risk",
    status: "ok",
  });
}

