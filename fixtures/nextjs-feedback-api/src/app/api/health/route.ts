import { NextResponse } from "next/server";

type HealthResponse = {
  ok: true;
  service: "dashboard";
};

export async function GET() {
  const body: HealthResponse = {
    ok: true,
    service: "dashboard",
  };

  return NextResponse.json(body);
}
