import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createToken, cookieOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string };
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const ownerEmail = process.env.OWNER_EMAIL;
    const ownerHash = process.env.OWNER_PASSWORD_HASH;

    if (!ownerEmail || !ownerHash) {
      return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
    }

    // OWNER_PASSWORD_HASH is stored as base64 to avoid $ parsing issues in .env
    const rawHash = Buffer.from(ownerHash, "base64").toString("utf8");
    const emailMatch = email.toLowerCase() === ownerEmail.toLowerCase();
    const passwordMatch = await bcrypt.compare(password, rawHash);

    if (!emailMatch || !passwordMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await createToken({ email: ownerEmail, role: "owner" });
    const secure = process.env.NODE_ENV === "production";
    const opts = cookieOptions(secure);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(opts.name, token, opts);
    return response;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
