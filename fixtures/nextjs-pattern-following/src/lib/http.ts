import { NextResponse } from "next/server";

export type ValidationError = {
  code: "validation_error";
  fields: Record<string, string>;
};

export function okResponse<TPayload extends Record<string, unknown>>(payload: TPayload) {
  return NextResponse.json({ ok: true, data: payload });
}

export function validationError(fields: Record<string, string>) {
  return NextResponse.json({ ok: false, error: { code: "validation_error", fields } satisfies ValidationError }, { status: 400 });
}
