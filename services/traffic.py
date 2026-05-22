from __future__ import annotations

from models.schemas import HourlyDataPoint, RouteResult


def shape_routes(
    current_routes: list[dict],
    hourly_data: dict[int, list[dict]],
) -> list[RouteResult]:
    results = []
    for i, route in enumerate(current_routes):
        leg = route["legs"][0]

        hourly_points: list[HourlyDataPoint] = []
        for hour in range(24):
            routes_at_hour = hourly_data.get(hour, [])
            if i < len(routes_at_hour):
                hour_leg = routes_at_hour[i]["legs"][0]
                raw = hour_leg.get("duration_in_traffic", hour_leg["duration"])
                duration_minutes = round(raw["value"] / 60, 1)
                hourly_points.append(
                    HourlyDataPoint(hour=f"{hour:02d}:00", duration_minutes=duration_minutes)
                )

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
