from services import traffic
from tests.conftest import DIRECTIONS_ROUTE, DIRECTIONS_ROUTE_NO_TRAFFIC


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
    assert len(r.hourly_traffic) == 24
    assert r.hourly_traffic[0].hour == "00:00"
    assert r.hourly_traffic[0].duration_minutes == 14.0   # 840s / 60
    assert r.hourly_traffic[8].hour == "08:00"


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
    assert len(results[0].hourly_traffic) == 24          # route 0 always present
    assert len(results[1].hourly_traffic) == 23          # route 1 missing hour 5
    hours_in_route_1 = [pt.hour for pt in results[1].hourly_traffic]
    assert "05:00" not in hours_in_route_1
