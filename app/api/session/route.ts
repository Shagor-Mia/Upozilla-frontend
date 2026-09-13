import { NextResponse } from "next/server";

import { getSession } from "@/lib/session";

/** Tiny endpoint so the (static-rendered) SiteHeader can hydrate auth state
 * client-side, instead of the header reading cookies() directly — that would
 * force every route in the app to render dynamically, defeating the ISR/SSG
 * Section 15 requires for public content pages. */
export async function GET() {
  const session = await getSession();
  return NextResponse.json({ session });
}
