import { NextResponse } from "next/server";

export type ValidationIssue = {
  field: string;
  message: string;
};

export function okResponse<TPayload extends Record<string, unknown>>(payload: TPayload, init?: ResponseInit) {
  return NextResponse.json(
    {
      ok: true,
      data: payload,
    },
    init,
  );
}

export function validationError(issues: ValidationIssue[]) {
  return NextResponse.json(
    {
      ok: false,
      error: "validation_error",
      issues,
    },
    { status: 400 },
  );
}

