from services import traffic
from tests.conftest import DIRECTIONS_ROUTE, DIRECTIONS_ROUTE_B, DIRECTIONS_ROUTE_NO_TRAFFIC, TRANSIT_ROUTE

NOW = 9  # fixed now_hour for deterministic tests


def _hourly(route, hours=range(5, 24)):
    return {h: [route] for h in hours}


def test_shape_routes_basic():
    results = traffic.shape_routes(_hourly(DIRECTIONS_ROUTE), now_hour=NOW)
    assert len(results) == 1
    r = results[0]
    assert r.index == 0
    assert r.summary == "Orchard Road"
    assert r.distance == "5 km"
    assert r.duration_current == "14 mins"
    assert r.duration_typical == "10 mins"
    assert len(r.hourly_traffic) == 19
    assert r.hourly_traffic[0].hour == "05:00"
    assert r.hourly_traffic[0].duration_minutes == 14.0   # 840s / 60
    assert r.hourly_traffic[3].hour == "08:00"


def test_shape_routes_fallback_to_duration():
    """When duration_in_traffic is absent, duration.value is used instead."""
    results = traffic.shape_routes(_hourly(DIRECTIONS_ROUTE_NO_TRAFFIC), now_hour=NOW)
    assert results[0].hourly_traffic[0].duration_minutes == 10.0   # 600s / 60


def test_shape_routes_gap_in_hourly_data():
    """Hours missing from hourly_data produce no HourlyDataPoint for that hour."""
    hourly = _hourly(DIRECTIONS_ROUTE, hours=range(12, 24))
    results = traffic.shape_routes(hourly, now_hour=NOW)
    assert len(results[0].hourly_traffic) == 12
    hours_present = [pt.hour for pt in results[0].hourly_traffic]
    assert "05:00" not in hours_present
    assert "12:00" in hours_present


def test_shape_routes_route_missing_at_hour():
    """If an anchor route has no summary match at a specific hour, that hour is skipped."""
    hourly = {}
    for h in range(5, 24):
        hourly[h] = [DIRECTIONS_ROUTE] if h == 5 else [DIRECTIONS_ROUTE, DIRECTIONS_ROUTE_B]

    results = traffic.shape_routes(hourly, now_hour=NOW)
    # Sort by now_hour (9am): Orchard Road = 14 min, Marina Boulevard = 25 min
    assert results[0].summary == "Orchard Road"
    assert results[1].summary == "Marina Boulevard"
    assert len(results[0].hourly_traffic) == 19          # Orchard Road always present
    assert len(results[1].hourly_traffic) == 18          # Marina Boulevard missing hour 5
    hours_in_route_b = [pt.hour for pt in results[1].hourly_traffic]
    assert "05:00" not in hours_in_route_b


def test_shape_routes_reorder_stability():
    """Chart lines stay consistent when Google reorders routes between hours."""
    route_cte = {
        "legs": [{"distance": {"text": "5 km", "value": 5000},
                  "duration": {"text": "10 mins", "value": 600},
                  "duration_in_traffic": {"text": "14 mins", "value": 840}}],
        "summary": "via CTE",
    }
    route_aye = {
        "legs": [{"distance": {"text": "7 km", "value": 7000},
                  "duration": {"text": "12 mins", "value": 720},
                  "duration_in_traffic": {"text": "25 mins", "value": 1500}}],
        "summary": "via AYE",
    }

    normal = [route_cte, route_aye]
    reordered = [route_aye, route_cte]

    hourly = {h: normal for h in range(5, 24)}
    hourly[17] = reordered

    results = traffic.shape_routes(hourly, now_hour=NOW)

    assert len(results[0].hourly_traffic) == 19   # via CTE
    assert len(results[1].hourly_traffic) == 19   # via AYE

    cte_at_17 = next(p for p in results[0].hourly_traffic if p.hour == "17:00")
    aye_at_17 = next(p for p in results[1].hourly_traffic if p.hour == "17:00")
    assert cte_at_17.duration_minutes == 14.0
    assert aye_at_17.duration_minutes == 25.0


def test_shape_routes_aggregates_across_hours():
    """Unique routes appearing in different hourly slots all get their own card."""
    route_a = {**DIRECTIONS_ROUTE, "summary": "via CTE"}
    route_b = {**DIRECTIONS_ROUTE_B, "summary": "via AYE"}
    route_c = {
        "legs": [{"distance": {"text": "9 km", "value": 9000},
                  "duration": {"text": "15 mins", "value": 900},
                  "duration_in_traffic": {"text": "30 mins", "value": 1800}}],
        "summary": "via PIE",
    }

    # Hours 5-12: routes A and B only; hours 13-23: routes A, B, and C
    hourly = {}
    for h in range(5, 13):
        hourly[h] = [route_a, route_b]
    for h in range(13, 24):
        hourly[h] = [route_a, route_b, route_c]

    results = traffic.shape_routes(hourly, now_hour=NOW)

    summaries = {r.summary for r in results}
    assert summaries == {"via CTE", "via AYE", "via PIE"}
    assert len(results) == 3

    # PIE only appears in hours 13-23 (11 hours)
    pie = next(r for r in results if r.summary == "via PIE")
    assert len(pie.hourly_traffic) == 11
    assert pie.hourly_traffic[0].hour == "13:00"


def test_shape_transit_routes_basic():
    """Transit mode: uses duration (not duration_in_traffic) and extracts transit legs."""
    results = traffic.shape_routes(_hourly(TRANSIT_ROUTE), mode="transit", now_hour=NOW)
    assert len(results) == 1
    r = results[0]
    assert r.summary == "NEL → 65"
    assert r.distance == "8 km"
    assert r.duration_current == "25 mins"
    assert r.duration_typical == "25 mins"
    assert len(r.hourly_traffic) == 19
    assert r.hourly_traffic[0].duration_minutes == 25.0   # 1500s / 60, starts at 05:00
    assert r.transit_legs is not None
    assert len(r.transit_legs) == 2
    assert r.transfers == 1


def test_shape_transit_legs_fields():
    """Transit legs are extracted with correct field values."""
    results = traffic.shape_routes({9: [TRANSIT_ROUTE]}, mode="transit", now_hour=9)
    r = results[0]
    nel = r.transit_legs[0]
    assert nel.line_name == "North East Line"
    assert nel.short_name == "NEL"
    assert nel.vehicle_type == "SUBWAY"
    assert nel.num_stops == 4
    assert nel.departure_stop == "Dhoby Ghaut"
    assert nel.arrival_stop == "Outram Park"

    bus = r.transit_legs[1]
    assert bus.short_name == "65"
    assert bus.vehicle_type == "BUS"
    assert r.transfers == 1


def test_shape_transit_drops_duration_outliers():
    """Hours where duration > 3x the route minimum are dropped (e.g. 1am night-bus anomaly)."""
    normal_route = {
        "legs": [{
            "distance": {"text": "8 km", "value": 8000},
            "duration": {"text": "35 mins", "value": 2100},
            "steps": [],
        }]
    }
    outlier_route = {
        "legs": [{
            "distance": {"text": "8 km", "value": 8000},
            "duration": {"text": "269 mins", "value": 16140},
            "steps": [],
        }]
    }
    hourly = {h: [normal_route] for h in range(5, 24)}
    hourly[22] = [outlier_route]

    results = traffic.shape_routes(hourly, mode="transit", now_hour=NOW)
    hours_present = [p.hour for p in results[0].hourly_traffic]
    assert "22:00" not in hours_present
    assert "08:00" in hours_present
    assert len(results[0].hourly_traffic) == 18


def test_shape_transit_no_transit_steps():
    """Route with only walking steps produces empty transit_legs and summary 'Transit'."""
    walking_only = {
        "legs": [{
            "distance": {"text": "1 km", "value": 1000},
            "duration": {"text": "12 mins", "value": 720},
            "steps": [{"travel_mode": "WALKING"}, {"travel_mode": "WALKING"}],
        }],
        "summary": "",
    }
    results = traffic.shape_routes({9: [walking_only]}, mode="transit", now_hour=9)
    r = results[0]
    assert r.summary == "Transit"
    assert r.transit_legs == []
    assert r.transfers == 0
