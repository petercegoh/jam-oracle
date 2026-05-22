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


def shape_routes(
    current_routes: list[dict],
    hourly_data: dict[int, list[dict]],
    mode: str = "driving",
) -> list[RouteResult]:
    results = []
    for i, route in enumerate(current_routes):
        leg = route["legs"][0]

        hourly_points: list[HourlyDataPoint] = []
        for hour in range(24):
            routes_at_hour = hourly_data.get(hour, [])
            if i < len(routes_at_hour):
                hour_leg = routes_at_hour[i]["legs"][0]
                if mode == "driving":
                    raw = hour_leg.get("duration_in_traffic", hour_leg["duration"])
                else:
                    raw = hour_leg["duration"]
                duration_minutes = round(raw["value"] / 60, 1)
                hourly_points.append(
                    HourlyDataPoint(hour=f"{hour:02d}:00", duration_minutes=duration_minutes)
                )

        if mode == "transit" and len(hourly_points) > 1:
            min_dur = min(p.duration_minutes for p in hourly_points)
            hourly_points = [p for p in hourly_points if p.duration_minutes <= min_dur * 3]

        if mode == "transit":
            transit_legs = _extract_transit_legs(route)
            summary = _transit_summary(transit_legs)
            results.append(
                RouteResult(
                    index=i,
                    summary=summary,
                    distance=leg["distance"]["text"],
                    duration_current=leg["duration"]["text"],
                    duration_typical=leg["duration"]["text"],
                    hourly_traffic=hourly_points,
                    transit_legs=transit_legs,
                    transfers=max(0, len(transit_legs) - 1),
                )
            )
        else:
            results.append(
                RouteResult(
                    index=i,
                    summary=route.get("summary", f"Route {i + 1}"),
                    distance=leg["distance"]["text"],
                    duration_current=leg.get("duration_in_traffic", leg["duration"])["text"],
                    duration_typical=leg["duration"]["text"],
                    hourly_traffic=hourly_points,
                )
            )

    return results
