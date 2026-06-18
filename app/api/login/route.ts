import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/sqldb";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const db = getDb();

  const rows = db("SELECT * FROM users WHERE email = ?", [email]) as Array<{
    id: number; email: string; password: string; role: string;
  }>;
  const user = rows[0];


  const motDePasseOk = user ? await bcrypt.compare(password, user.password) : false;
  if (!user || !motDePasseOk) {
    return NextResponse.json({ error: "Email ou mot de passe invalide" }, { status: 401 });
  }

  const res = NextResponse.json({
    message: "Connecté",
    user: { id: user.id, email: user.email, role: user.role },
  });

  res.cookies.set("mininotes_session", String(user.id), { httpOnly: false, path: "/" });
  return res;

}
