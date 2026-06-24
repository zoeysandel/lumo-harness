import { NextResponse } from "next/server";

type HealthResponse = {
  ok: true;
  service: "dashboard-action-risk";
};

export async function GET() {
  return NextResponse.json<HealthResponse>({
    ok: true,
    service: "dashboard-action-risk",
  });
}
