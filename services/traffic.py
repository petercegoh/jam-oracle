from __future__ import annotations

from models.schemas import HourlyDataPoint, RouteResult, TransitLeg


def _extract_transit_legs(route: dict) -> list[TransitLeg]:
    legs = []
    for step in route["legs"][0].get("steps", []):
        if step.get("travel_mode") != "TRANSIT":
            continue
        td = step.get("transit_details", {})
        line = td.get("line", {})
        vehicle = line.get("vehicle", {})
        legs.append(
            TransitLeg(
                line_name=line.get("name", "Unknown"),
                short_name=line.get("short_name", line.get("name", "?")),
                vehicle_type=vehicle.get("type", "BUS"),
                num_stops=td.get("num_stops", 0),
                departure_stop=td.get("departure_stop", {}).get("name", ""),
                arrival_stop=td.get("arrival_stop", {}).get("name", ""),
            )
        )
    return legs


def _transit_summary(transit_legs: list[TransitLeg]) -> str:
    if not transit_legs:
        return "Transit"
    return " → ".join(leg.short_name for leg in transit_legs)


def _route_key(route: dict, mode: str) -> str:
    if mode == "transit":
        names = []
        for step in route["legs"][0].get("steps", []):
            if step.get("travel_mode") != "TRANSIT":
                continue
            short = step.get("transit_details", {}).get("line", {}).get("short_name", "")
            names.append(short)
        return "-".join(names)
    return route.get("summary", "").strip().lower()


def shape_routes(
    hourly_data: dict[int, list[dict]],
    mode: str = "driving",
    now_hour: int = 9,
) -> list[RouteResult]:
    # Aggregate all unique routes across every hourly slot.
    # unique[key] = {"rep": route_dict, "by_hour": {hour: (duration_min, duration_text)}}
    unique: dict[str, dict] = {}

    for hour in range(5, 24):
        for route in hourly_data.get(hour, [])[:3]:
            key = _route_key(route, mode)
            if key not in unique:
                unique[key] = {"rep": route, "by_hour": {}}
            leg = route["legs"][0]
            if mode == "driving":
                raw = leg.get("duration_in_traffic", leg["duration"])
            else:
                raw = leg["duration"]
            unique[key]["by_hour"][hour] = (round(raw["value"] / 60, 1), raw["text"])

    results = []
    for key, data in unique.items():
        rep = data["rep"]
        rep_leg = rep["legs"][0]
        by_hour = data["by_hour"]

        hourly_points = [
            HourlyDataPoint(hour=f"{h:02d}:00", duration_minutes=mins)
            for h, (mins, _) in sorted(by_hour.items())
        ]

        # Transit outlier filter: drop hours where duration > 3x the route minimum.
        if mode == "transit" and len(hourly_points) > 1:
            min_dur = min(p.duration_minutes for p in hourly_points)
            kept = {int(p.hour.split(":")[0]) for p in hourly_points if p.duration_minutes <= min_dur * 3}
            hourly_points = [p for p in hourly_points if int(p.hour.split(":")[0]) in kept]
            by_hour = {h: v for h, v in by_hour.items() if h in kept}

        # duration_current from the nearest available hour to now.
        if by_hour:
            closest = min(by_hour.keys(), key=lambda h: abs(h - now_hour))
            _, duration_current = by_hour[closest]
        else:
            duration_current = "—"

        duration_typical = rep_leg["duration"]["text"]

        if mode == "transit":
            transit_legs = _extract_transit_legs(rep)
            summary = _transit_summary(transit_legs)
            results.append(RouteResult(
                index=0,
                summary=summary,
                distance=rep_leg["distance"]["text"],
                duration_current=duration_current,
                duration_typical=duration_typical,
                hourly_traffic=hourly_points,
                transit_legs=transit_legs,
                transfers=max(0, len(transit_legs) - 1),
            ))
        else:
            results.append(RouteResult(
                index=0,
                summary=rep.get("summary", "Route"),
                distance=rep_leg["distance"]["text"],
                duration_current=duration_current,
                duration_typical=duration_typical,
                hourly_traffic=hourly_points,
            ))

    # Sort by duration at now_hour (ascending); fall back to average.
    def _sort_key(r: RouteResult) -> float:
        now_label = f"{now_hour:02d}:00"
        pt = next((p for p in r.hourly_traffic if p.hour == now_label), None)
        if pt:
            return pt.duration_minutes
        if r.hourly_traffic:
            return sum(p.duration_minutes for p in r.hourly_traffic) / len(r.hourly_traffic)
        return float("inf")

    results.sort(key=_sort_key)
    for i, r in enumerate(results):
        r.index = i

    return results
