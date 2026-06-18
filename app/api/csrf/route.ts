import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function GET() {
  const token = randomUUID();
  const res = NextResponse.json({ csrfToken: token });
  res.cookies.set("csrf", token, { httpOnly: false, sameSite: "lax", path: "/" });
  return res;
}
