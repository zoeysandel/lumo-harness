import { okResponse } from "../../../../lib/http";

export async function GET() {
  return okResponse({
    accountId: "acct_local_demo",
    mode: "local",
  });
}
