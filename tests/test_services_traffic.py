from services import traffic
from tests.conftest import DIRECTIONS_ROUTE, DIRECTIONS_ROUTE_NO_TRAFFIC, TRANSIT_ROUTE


def _hourly(route, hours=range(24)):
    return {h: [route] for h in hours}


def test_shape_routes_basic():
    results = traffic.shape_routes([DIRECTIONS_ROUTE], _hourly(DIRECTIONS_ROUTE))
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
    hourly = _hourly(DIRECTIONS_ROUTE_NO_TRAFFIC)
    results = traffic.shape_routes([DIRECTIONS_ROUTE_NO_TRAFFIC], hourly)
    assert results[0].hourly_traffic[0].duration_minutes == 10.0   # 600s / 60


def test_shape_routes_gap_in_hourly_data():
    """Hours missing from hourly_data produce no HourlyDataPoint for that hour."""
    hourly = _hourly(DIRECTIONS_ROUTE, hours=range(12, 24))   # only PM hours
    results = traffic.shape_routes([DIRECTIONS_ROUTE], hourly)
    assert len(results[0].hourly_traffic) == 12
    hours_present = [pt.hour for pt in results[0].hourly_traffic]
    assert "00:00" not in hours_present
    assert "12:00" in hours_present


def test_shape_routes_route_missing_at_hour():
    """If a route index is absent at a specific hour, that hour is skipped for that route."""
    hourly = {}
    for h in range(24):
        # Route index 1 is missing at hour 5
        hourly[h] = [DIRECTIONS_ROUTE] if h == 5 else [DIRECTIONS_ROUTE, DIRECTIONS_ROUTE]

    results = traffic.shape_routes([DIRECTIONS_ROUTE, DIRECTIONS_ROUTE], hourly)
    assert len(results[0].hourly_traffic) == 19          # route 0 always present (hours 5–23)
    assert len(results[1].hourly_traffic) == 18          # route 1 missing hour 5
    hours_in_route_1 = [pt.hour for pt in results[1].hourly_traffic]
    assert "05:00" not in hours_in_route_1


def test_shape_transit_routes_basic():
    """Transit mode: uses duration (not duration_in_traffic) and extracts transit legs."""
    hourly = {h: [TRANSIT_ROUTE] for h in range(24)}
    results = traffic.shape_routes([TRANSIT_ROUTE], hourly, mode="transit")
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
    results = traffic.shape_routes([TRANSIT_ROUTE], {}, mode="transit")
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
    assert r.transfers == 1   # two transit legs = one transfer


def test_shape_transit_drops_duration_outliers():
    """Hours where duration > 3x the route minimum are dropped (e.g. 1am night-bus anomaly)."""
    normal_route = {
        "legs": [{
            "distance": {"text": "8 km", "value": 8000},
            "duration": {"text": "35 mins", "value": 2100},   # 35 min — typical
            "steps": [],
        }]
    }
    outlier_route = {
        "legs": [{
            "distance": {"text": "8 km", "value": 8000},
            "duration": {"text": "269 mins", "value": 16140},  # 269 min — 1am anomaly
            "steps": [],
        }]
    }
    hourly = {h: [normal_route] for h in range(5, 24)}  # hours 5–23: 35 min each
    hourly[22] = [outlier_route]                         # hour 22: 269 min (outlier)

    results = traffic.shape_routes([normal_route], hourly, mode="transit")
    hours_present = [p.hour for p in results[0].hourly_traffic]
    assert "22:00" not in hours_present          # outlier dropped
    assert "08:00" in hours_present              # normal hours kept
    assert len(results[0].hourly_traffic) == 18  # 19 hours minus the outlier


def test_shape_transit_no_transit_steps():
    """Route with only walking steps produces empty transit_legs and summary 'Transit'."""
    walking_only = {
        "legs": [
            {
                "distance": {"text": "1 km", "value": 1000},
                "duration": {"text": "12 mins", "value": 720},
                "steps": [{"travel_mode": "WALKING"}, {"travel_mode": "WALKING"}],
            }
        ],
        "summary": "",
    }
    results = traffic.shape_routes([walking_only], {}, mode="transit")
    r = results[0]
    assert r.summary == "Transit"
    assert r.transit_legs == []
    assert r.transfers == 0
