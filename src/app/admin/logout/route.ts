import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { SITE_URL } from "@/lib/site";

export async function POST() {
  await destroySession();
  return NextResponse.redirect(`${SITE_URL}/admin/login`, { status: 303 });
}
