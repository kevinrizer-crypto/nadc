import { NextResponse } from "next/server";
import { consumeLoginToken, createSession } from "@/lib/auth";
import { SITE_URL } from "@/lib/site";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.redirect(`${SITE_URL}/admin/login?error=invalid`);

  const email = await consumeLoginToken(token);
  if (!email) return NextResponse.redirect(`${SITE_URL}/admin/login?error=invalid`);

  await createSession(email);
  return NextResponse.redirect(`${SITE_URL}/admin`);
}
