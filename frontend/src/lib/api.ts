import type { Mode, RoutesResponse } from "@/types/api";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchRoutes(
  origin: string,
  destination: string,
  mode: Mode = "driving"
): Promise<RoutesResponse> {
  const res = await fetch(`${BASE}/api/routes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origin, destination, mode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export async function fetchSuggestions(q: string): Promise<string[]> {
  if (!q.trim()) return [];
  const res = await fetch(`${BASE}/api/suggest?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data as { suggestions: string[] }).suggestions;
}
