const GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const PLACES_URL = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
const DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GoogleRoute = Record<string, any>;

export async function validateAddress(
  address: string,
  apiKey: string,
): Promise<[boolean, string | null]> {
  const url = new URL(GEOCODING_URL);
  url.searchParams.set("address", address);
  url.searchParams.set("key", apiKey);
  const resp = await fetch(url.toString());
  const data = await resp.json();
  const results: GoogleRoute[] = data.results ?? [];
  if (data.status === "OK" && results.length) {
    return [true, results[0].formatted_address as string];
  }
  return [false, null];
}

export async function suggestAddress(
  query: string,
  apiKey: string,
): Promise<{ description: string; place_id: string }[]> {
  const url = new URL(PLACES_URL);
  url.searchParams.set("input", query);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("language", "en");
  const resp = await fetch(url.toString());
  const data = await resp.json();
  if (data.status === "OK" && (data.predictions as GoogleRoute[])?.length) {
    return (data.predictions as GoogleRoute[]).slice(0, 5).map((p) => ({
      description: p.description as string,
      place_id: p.place_id as string,
    }));
  }
  return [];
}

async function fetchHourly(
  origin: string,
  destination: string,
  hour: number,
  apiKey: string,
  mode: string,
): Promise<[number, GoogleRoute[]]> {
  const now = new Date();
  const departure = new Date(now);
  departure.setHours(hour, 0, 0, 0);
  if (departure < now) departure.setDate(departure.getDate() + 1);
  const departureTime = Math.floor(departure.getTime() / 1000);

  const url = new URL(DIRECTIONS_URL);
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("mode", mode);
  url.searchParams.set("departure_time", String(departureTime));
  url.searchParams.set("alternatives", "true");
  if (mode === "driving") url.searchParams.set("traffic_model", "best_guess");

  const resp = await fetch(url.toString());
  const data = await resp.json();
  const routes: GoogleRoute[] = data.routes ?? [];

  if (mode === "transit" && routes.length) {
    const actual: number = routes[0].legs?.[0]?.departure_time?.value ?? 0;
    if (actual - departureTime > 1800) return [hour, []];
  }

  return [hour, routes];
}

export async function fetchAllHourlyTraffic(
  origin: string,
  destination: string,
  apiKey: string,
  mode: string = "driving",
): Promise<Record<number, GoogleRoute[]>> {
  const hours = Array.from({ length: 19 }, (_, i) => i + 5); // 5..23
  const results = await Promise.all(
    hours.map((hour) => fetchHourly(origin, destination, hour, apiKey, mode)),
  );
  return Object.fromEntries(results);
}
