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


def _build_route_result(
    data: dict,
    mode: str,
    now_hour: int,
    index: int,
) -> RouteResult:
    rep = data["rep"]
    rep_leg = rep["legs"][0]
    by_hour: dict = data["by_hour"]

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

    if by_hour:
        closest = min(by_hour.keys(), key=lambda h: abs(h - now_hour))
        _, duration_current = by_hour[closest]
    else:
        duration_current = "—"

    duration_typical = rep_leg["duration"]["text"]

    if mode == "transit":
        transit_legs = _extract_transit_legs(rep)
        summary = _transit_summary(transit_legs)
        return RouteResult(
            index=index,
            summary=summary,
            distance=rep_leg["distance"]["text"],
            duration_current=duration_current,
            duration_typical=duration_typical,
            hourly_traffic=hourly_points,
            transit_legs=transit_legs,
            transfers=max(0, len(transit_legs) - 1),
        )
    return RouteResult(
        index=index,
        summary=rep.get("summary", "Route"),
        distance=rep_leg["distance"]["text"],
        duration_current=duration_current,
        duration_typical=duration_typical,
        hourly_traffic=hourly_points,
    )


def _shape_driving_routes(
    hourly_data: dict[int, list[dict]],
    now_hour: int,
) -> list[RouteResult]:
    # Anchor: top 3 routes at now_hour (Google's ranking = best_guess ETA order).
    # Fall back to the nearest hour that has data if now_hour is empty.
    anchor_hour = now_hour
    if not hourly_data.get(anchor_hour):
        candidates = sorted(range(5, 24), key=lambda h: abs(h - now_hour))
        anchor_hour = next((h for h in candidates if hourly_data.get(h)), now_hour)

    anchor_routes = hourly_data.get(anchor_hour, [])[:3]
    if not anchor_routes:
        return []

    anchor_keys = [_route_key(r, "driving") for r in anchor_routes]
    unique: dict[str, dict] = {
        k: {"rep": r, "by_hour": {}}
        for k, r in zip(anchor_keys, anchor_routes)
    }

    # Collect hourly data — only for anchor keys; any new route at other hours is ignored.
    for hour in range(5, 24):
        for route in hourly_data.get(hour, []):
            key = _route_key(route, "driving")
            if key not in unique:
                continue
            leg = route["legs"][0]
            raw = leg.get("duration_in_traffic", leg["duration"])
            unique[key]["by_hour"][hour] = (round(raw["value"] / 60, 1), raw["text"])

    # Preserve Google's anchor ordering (index 0 = recommended route).
    return [
        _build_route_result(unique[key], "driving", now_hour, i)
        for i, key in enumerate(anchor_keys)
    ]


def _shape_transit_routes(
    hourly_data: dict[int, list[dict]],
    now_hour: int,
) -> list[RouteResult]:
    # Aggregate all unique transit routes across every hourly slot.
    unique: dict[str, dict] = {}

    for hour in range(5, 24):
        for route in hourly_data.get(hour, [])[:3]:
            key = _route_key(route, "transit")
            if key not in unique:
                unique[key] = {"rep": route, "by_hour": {}}
            leg = route["legs"][0]
            raw = leg["duration"]
            unique[key]["by_hour"][hour] = (round(raw["value"] / 60, 1), raw["text"])

    results = [
        _build_route_result(data, "transit", now_hour, 0)
        for data in unique.values()
    ]

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


def shape_routes(
    hourly_data: dict[int, list[dict]],
    mode: str = "driving",
    now_hour: int = 9,
) -> list[RouteResult]:
    if mode == "driving":
        return _shape_driving_routes(hourly_data, now_hour)
    return _shape_transit_routes(hourly_data, now_hour)
