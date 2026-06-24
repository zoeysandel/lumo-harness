import { NextResponse } from "next/server";

type HealthResponse = {
  ok: true;
  service: "intake-dashboard";
};

export async function GET() {
  const body: HealthResponse = {
    ok: true,
    service: "intake-dashboard",
  };

  return NextResponse.json(body);
}
