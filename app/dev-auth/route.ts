import { NextRequest, NextResponse } from "next/server";

const DEV_SECRET = process.env.DEV_AUTH_SECRET;

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!DEV_SECRET) {
    return new NextResponse("DEV_AUTH_SECRET not set", { status: 500 });
  }
  const body = (await req.json()) as { secret?: string; email?: string };
  if (body.secret !== DEV_SECRET || !body.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  // Set a marker cookie the client AdminProvider/useViewer can read in
  // dev to short-circuit auth. Production auth is unaffected.
  const res = NextResponse.json({ ok: true, email: body.email });
  res.cookies.set("dev_admin_email", body.email, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  return res;
}
