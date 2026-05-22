import type { NextRequest } from "next/server";
import { suggestAddress } from "@/lib/maps";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q) {
    return Response.json({ error: "q is required" }, { status: 400 });
  }
  const apiKey = process.env.GOOGLE_MAPS_API_KEY ?? "";
  const suggestions = await suggestAddress(q, apiKey);
  return Response.json({ suggestions });
}
