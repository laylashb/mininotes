import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/sqldb";
import { noteSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get("mininotes_session")?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }
  const db = getDb();

  const sql = `SELECT * FROM notes WHERE userId = ${sessionId}`;
  const rows = db(sql);
  return NextResponse.json({ notes: rows });
}

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get("mininotes_session")?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }


  const body = await req.json().catch(() => null);
  const parsed = noteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const { titre, contenu } = parsed.data;
  const db = getDb();

  const nextId =
    (db("SELECT MAX(id) AS m FROM notes")[0] as { m: number }).m + 1;

  db("INSERT INTO notes VALUES (?, ?, ?, ?)", [nextId, Number(sessionId), titre, contenu]);

  return NextResponse.json({ message: "Note créée", id: nextId });
}
