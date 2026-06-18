
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/sqldb";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const sessionId = req.cookies.get("mininotes_session")?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const db = getDb();

  const rows = db(
    "SELECT * FROM notes WHERE id = ? AND userId = ?",
    [Number(id), Number(sessionId)]
  );

  if (!rows.length) {
    return NextResponse.json({ error: "Note introuvable" }, { status: 404 });
  }


  return NextResponse.json({ note: rows[0] });
}
