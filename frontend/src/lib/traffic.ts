import type { HourlyDataPoint, RouteResult, TransitLeg } from "@/types/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GoogleRoute = Record<string, any>;
type HourlyData = Record<number, GoogleRoute[]>;
type ByHour = { [hour: number]: [number, string] }; // hour -> [minutes, text]

function extractTransitLegs(route: GoogleRoute): TransitLeg[] {
  const legs: TransitLeg[] = [];
  for (const step of (route.legs?.[0]?.steps ?? []) as GoogleRoute[]) {
    if (step.travel_mode !== "TRANSIT") continue;
    const td: GoogleRoute = step.transit_details ?? {};
    const line: GoogleRoute = td.line ?? {};
    const vehicle: GoogleRoute = line.vehicle ?? {};
    legs.push({
      line_name: (line.name as string) ?? "Unknown",
      short_name: (line.short_name as string) ?? (line.name as string) ?? "?",
      vehicle_type: (vehicle.type as string) ?? "BUS",
      num_stops: (td.num_stops as number) ?? 0,
      departure_stop: (td.departure_stop?.name as string) ?? "",
      arrival_stop: (td.arrival_stop?.name as string) ?? "",
    });
  }
  return legs;
}

function transitSummary(legs: TransitLeg[]): string {
  if (!legs.length) return "Transit";
  return legs.map((l) => l.short_name).join(" → ");
}

function routeKey(route: GoogleRoute, mode: string): string {
  if (mode === "transit") {
    const names: string[] = [];
    for (const step of (route.legs?.[0]?.steps ?? []) as GoogleRoute[]) {
      if (step.travel_mode !== "TRANSIT") continue;
      names.push((step.transit_details?.line?.short_name as string) ?? "");
    }
    return names.join("-");
  }
  return ((route.summary as string) ?? "").trim().toLowerCase();
}

function buildRouteResult(
  rep: GoogleRoute,
  byHour: ByHour,
  mode: string,
  nowHour: number,
  index: number,
): RouteResult {
  const repLeg = rep.legs[0];

  let hourlyPoints: HourlyDataPoint[] = Object.entries(byHour)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([h, [mins]]) => ({
      hour: `${String(h).padStart(2, "0")}:00`,
      duration_minutes: mins,
    }));

  // Transit outlier filter: drop hours where duration > 3x the route minimum
  if (mode === "transit" && hourlyPoints.length > 1) {
    const minDur = Math.min(...hourlyPoints.map((p) => p.duration_minutes));
    const kept = new Set(
      hourlyPoints
        .filter((p) => p.duration_minutes <= minDur * 3)
        .map((p) => Number(p.hour.slice(0, 2))),
    );
    hourlyPoints = hourlyPoints.filter((p) => kept.has(Number(p.hour.slice(0, 2))));
    for (const h of Object.keys(byHour)) {
      if (!kept.has(Number(h))) delete byHour[Number(h)];
    }
  }

  let durationCurrent: string;
  const hourKeys = Object.keys(byHour).map(Number);
  if (hourKeys.length > 0) {
    const closestHour = hourKeys.reduce((a, b) =>
      Math.abs(a - nowHour) <= Math.abs(b - nowHour) ? a : b,
    );
    durationCurrent = byHour[closestHour][1];
  } else {
    durationCurrent = "—";
  }

  if (mode === "transit") {
    const transitLegs = extractTransitLegs(rep);
    return {
      index,
      summary: transitSummary(transitLegs),
      distance: (repLeg.distance.text as string),
      duration_current: durationCurrent,
      duration_typical: (repLeg.duration.text as string),
      hourly_traffic: hourlyPoints,
      transit_legs: transitLegs,
      transfers: Math.max(0, transitLegs.length - 1),
    };
  }

  return {
    index,
    summary: (rep.summary as string) ?? "Route",
    distance: (repLeg.distance.text as string),
    duration_current: durationCurrent,
    duration_typical: (repLeg.duration.text as string),
    hourly_traffic: hourlyPoints,
    transit_legs: null,
    transfers: null,
  };
}

function shapeDrivingRoutes(hourlyData: HourlyData, nowHour: number): RouteResult[] {
  let anchorHour = nowHour;
  if (!hourlyData[anchorHour]?.length) {
    const candidates = Array.from({ length: 19 }, (_, i) => i + 5).sort(
      (a, b) => Math.abs(a - nowHour) - Math.abs(b - nowHour),
    );
    anchorHour = candidates.find((h) => hourlyData[h]?.length) ?? nowHour;
  }

  const anchorRoutes = (hourlyData[anchorHour] ?? []).slice(0, 3);
  if (!anchorRoutes.length) return [];

  const anchorKeys = anchorRoutes.map((r) => routeKey(r, "driving"));
  const unique: Record<string, { rep: GoogleRoute; byHour: ByHour }> = {};
  for (let i = 0; i < anchorKeys.length; i++) {
    unique[anchorKeys[i]] = { rep: anchorRoutes[i], byHour: {} };
  }

  for (let hour = 5; hour < 24; hour++) {
    for (const route of hourlyData[hour] ?? []) {
      const key = routeKey(route, "driving");
      if (!(key in unique)) continue;
      const leg = route.legs[0];
      const raw: GoogleRoute = leg.duration_in_traffic ?? leg.duration;
      unique[key].byHour[hour] = [
        Math.round(((raw.value as number) / 60) * 10) / 10,
        raw.text as string,
      ];
    }
  }

  return anchorKeys.map((key, i) =>
    buildRouteResult(unique[key].rep, unique[key].byHour, "driving", nowHour, i),
  );
}

function shapeTransitRoutes(hourlyData: HourlyData, nowHour: number): RouteResult[] {
  const unique: Record<string, { rep: GoogleRoute; byHour: ByHour }> = {};

  for (let hour = 5; hour < 24; hour++) {
    for (const route of (hourlyData[hour] ?? []).slice(0, 3)) {
      const key = routeKey(route, "transit");
      if (!(key in unique)) unique[key] = { rep: route, byHour: {} };
      const leg = route.legs[0];
      const raw: GoogleRoute = leg.duration;
      unique[key].byHour[hour] = [
        Math.round(((raw.value as number) / 60) * 10) / 10,
        raw.text as string,
      ];
    }
  }

  const nowLabel = `${String(nowHour).padStart(2, "0")}:00`;
  const results = Object.values(unique)
    .map((data) => buildRouteResult(data.rep, data.byHour, "transit", nowHour, 0))
    .sort((a, b) => {
      const scoreA =
        a.hourly_traffic.find((p) => p.hour === nowLabel)?.duration_minutes ??
        (a.hourly_traffic.length
          ? a.hourly_traffic.reduce((s, p) => s + p.duration_minutes, 0) /
            a.hourly_traffic.length
          : Infinity);
      const scoreB =
        b.hourly_traffic.find((p) => p.hour === nowLabel)?.duration_minutes ??
        (b.hourly_traffic.length
          ? b.hourly_traffic.reduce((s, p) => s + p.duration_minutes, 0) /
            b.hourly_traffic.length
          : Infinity);
      return scoreA - scoreB;
    });

  results.forEach((r, i) => {
    r.index = i;
  });
  return results;
}

export function shapeRoutes(
  hourlyData: HourlyData,
  mode: string = "driving",
  nowHour: number = 9,
): RouteResult[] {
  if (mode === "driving") return shapeDrivingRoutes(hourlyData, nowHour);
  return shapeTransitRoutes(hourlyData, nowHour);
}
