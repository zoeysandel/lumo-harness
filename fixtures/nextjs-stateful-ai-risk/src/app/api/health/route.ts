import { NextResponse } from "next/server";

type HealthResponse = {
  ok: true;
  service: "stateful-intake-dashboard";
};

export async function GET() {
  return NextResponse.json<HealthResponse>({
    ok: true,
    service: "stateful-intake-dashboard",
  });
}
