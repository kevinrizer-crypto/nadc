import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, hashIp, rateLimit } from "@/lib/security";

/**
 * Address → representative lookup via Geocodio's `cd` and `stateleg` data
 * appends (one key covers federal congressional + state legislators;
 * https://www.geocod.io — free tier 2,500 lookups/day).
 *
 * Note: Google's Civic Information representatives endpoint was retired in
 * April 2025, which is why Geocodio is the scaffolded provider. County/city
 * officials aren't covered by any national API — for those we link users to
 * the project's municipality page from the tracker.
 *
 * Honesty contract: without GEOCODIO_API_KEY this returns 503 — no fake
 * representatives, ever. Addresses are never logged or stored.
 */
const lookupSchema = z.object({ address: z.string().min(4).max(500) });

export async function POST(req: Request) {
  const key = process.env.GEOCODIO_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Representative lookup isn't live yet — the civic-data provider is not configured." },
      { status: 503 }
    );
  }

  if (!(await rateLimit(`officials:${hashIp(clientIp(req))}`, 20, 3600))) {
    return NextResponse.json({ error: "Too many lookups. Please try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = lookupSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please enter a full street address." }, { status: 400 });

  const url = new URL("https://api.geocod.io/v1.7/geocode");
  url.searchParams.set("q", parsed.data.address);
  url.searchParams.set("fields", "cd,stateleg");
  url.searchParams.set("api_key", key);

  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) {
    return NextResponse.json({ error: "Lookup failed — please check the address and try again." }, { status: 502 });
  }
  const data = await res.json();
  const result = data.results?.[0];
  if (!result) return NextResponse.json({ error: "Address not found. Try adding city, state, and ZIP." }, { status: 404 });

  type Official = { name: string; role: string; level: "federal" | "state"; party?: string; contactUrl?: string; phone?: string };
  const officials: Official[] = [];

  for (const district of result.fields?.congressional_districts ?? []) {
    for (const legislator of district.current_legislators ?? []) {
      officials.push({
        name: `${legislator.bio?.first_name ?? ""} ${legislator.bio?.last_name ?? ""}`.trim(),
        role:
          legislator.type === "senator"
            ? `U.S. Senator, ${result.address_components?.state}`
            : `U.S. Representative, ${result.address_components?.state}-${district.district_number}`,
        level: "federal",
        party: legislator.bio?.party,
        contactUrl: legislator.contact?.url,
        phone: legislator.contact?.phone,
      });
    }
  }
  const stateleg = result.fields?.state_legislative_districts;
  for (const chamber of ["senate", "house"] as const) {
    for (const district of stateleg?.[chamber] ?? []) {
      officials.push({
        name: district.current_legislators?.[0]
          ? `${district.current_legislators[0].bio?.first_name ?? ""} ${district.current_legislators[0].bio?.last_name ?? ""}`.trim()
          : `District ${district.district_number} (see your state legislature site)`,
        role: `State ${chamber === "senate" ? "Senator" : "Representative"}, District ${district.district_number}`,
        level: "state",
        party: district.current_legislators?.[0]?.bio?.party,
        contactUrl: district.current_legislators?.[0]?.contact?.url,
        phone: district.current_legislators?.[0]?.contact?.phone,
      });
    }
  }

  return NextResponse.json({
    officials,
    location: {
      city: result.address_components?.city,
      state: result.address_components?.state,
      zip: result.address_components?.zip,
    },
  });
}
