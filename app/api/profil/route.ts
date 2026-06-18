import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/sqldb";
import { z } from "zod";

export const runtime = "nodejs";

const profilSchema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get("mininotes_session")?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const cookieToken = req.cookies.get("csrf")?.value;
  const headerToken = req.headers.get("x-csrf-token");
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return NextResponse.json({ error: "Jeton CSRF invalide" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = profilSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const db = getDb();
  db("UPDATE users SET email = ? WHERE id = ?", [parsed.data.email, Number(sessionId)]);

  return NextResponse.json({ message: "Email mis à jour" });
}
