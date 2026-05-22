import type { NextRequest } from "next/server";
import { LRUCache } from "lru-cache";
import { validateAddress, fetchAllHourlyTraffic } from "@/lib/maps";
import { shapeRoutes } from "@/lib/traffic";
import type { RoutesResponse } from "@/types/api";

export const runtime = "nodejs";

const cache = new LRUCache<string, RoutesResponse>({ max: 100, ttl: 1000 * 60 * 60 });

function prelimKey(text: string, placeId?: string | null): string {
  return placeId ? `place_id:${placeId}` : text.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    origin,
    destination,
    mode = "driving",
    now_hour,
    tz_offset = 0,
    origin_place_id,
    destination_place_id,
  } = body as {
    origin: string;
    destination: string;
    mode?: string;
    now_hour?: number;
    tz_offset?: number;
    origin_place_id?: string;
    destination_place_id?: string;
  };

  if (!origin || !destination) {
    return Response.json(
      { detail: "origin and destination are required" },
      { status: 422 },
    );
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY ?? "";

  // Fast-path prelim cache check (avoids geocoding on hit)
  const prelimCacheKey = [
    prelimKey(origin, origin_place_id),
    prelimKey(destination, destination_place_id),
    mode,
  ].join("|");

  const hit = cache.get(prelimCacheKey);
  if (hit) return Response.json(hit);

  // Resolve origin
  let resolvedOrigin: string;
  let originDirections: string;
  let originKey: string;
  if (origin_place_id) {
    resolvedOrigin = origin;
    originDirections = `place_id:${origin_place_id}`;
    originKey = `place_id:${origin_place_id}`;
  } else {
    const [valid, formatted] = await validateAddress(origin, apiKey);
    if (!valid || !formatted) {
      return Response.json(
        { detail: `Could not resolve origin: ${origin}` },
        { status: 422 },
      );
    }
    resolvedOrigin = formatted;
    originDirections = formatted;
    originKey = formatted;
  }

  // Resolve destination
  let resolvedDestination: string;
  let destinationDirections: string;
  let destinationKey: string;
  if (destination_place_id) {
    resolvedDestination = destination;
    destinationDirections = `place_id:${destination_place_id}`;
    destinationKey = `place_id:${destination_place_id}`;
  } else {
    const [valid, formatted] = await validateAddress(destination, apiKey);
    if (!valid || !formatted) {
      return Response.json(
        { detail: `Could not resolve destination: ${destination}` },
        { status: 422 },
      );
    }
    resolvedDestination = formatted;
    destinationDirections = formatted;
    destinationKey = formatted;
  }

  // Second cache check with resolved keys (catches same geocoded address via different text)
  const resolvedCacheKey = [originKey, destinationKey, mode].join("|");
  const resolvedHit = cache.get(resolvedCacheKey);
  if (resolvedHit) {
    cache.set(prelimCacheKey, resolvedHit);
    return Response.json(resolvedHit);
  }

  const hourlyData = await fetchAllHourlyTraffic(
    originDirections,
    destinationDirections,
    apiKey,
    mode,
    tz_offset,
  );

  const nowHour = Math.max(5, Math.min(23, now_hour ?? new Date().getHours()));
  const routes = shapeRoutes(hourlyData, mode, nowHour);

  if (!routes.length) {
    return Response.json(
      { detail: "No routes found between these locations" },
      { status: 404 },
    );
  }

  const response: RoutesResponse = {
    origin: resolvedOrigin,
    destination: resolvedDestination,
    routes,
  };

  cache.set(prelimCacheKey, response);
  cache.set(resolvedCacheKey, response);
  return Response.json(response);
}
