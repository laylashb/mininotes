
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/sqldb";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const db = getDb();

  const sql = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
  console.log("🔎 SQL exécuté :", sql);

  const rows = db(sql) as Array<{ id: number; email: string; role: string }>;

  if (rows.length === 0) {
    return NextResponse.json(
      { error: `Aucun compte ${email} avec ce mot de passe` },
      { status: 401 }
    );
  }

  const user = rows[0];
  const res = NextResponse.json({ message: "Connecté", user });

  res.cookies.set("mininotes_session", String(user.id), { httpOnly: false, path: "/" });
  return res;
}
