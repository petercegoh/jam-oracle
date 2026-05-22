import type { Mode, RoutesResponse, Suggestion } from "@/types/api";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function fetchRoutes(
  origin: string,
  destination: string,
  mode: Mode = "driving",
  originPlaceId?: string,
  destinationPlaceId?: string,
): Promise<RoutesResponse> {
  const res = await fetch(`${BASE}/api/routes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      origin,
      destination,
      mode,
      now_hour: new Date().getHours(),
      tz_offset: new Date().getTimezoneOffset(),
      ...(originPlaceId && { origin_place_id: originPlaceId }),
      ...(destinationPlaceId && { destination_place_id: destinationPlaceId }),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export async function fetchSuggestions(q: string): Promise<Suggestion[]> {
  if (!q.trim()) return [];
  const res = await fetch(`${BASE}/api/suggest?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data as { suggestions: Suggestion[] }).suggestions;
}
