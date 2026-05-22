import httpx
import respx

from services import maps
from services.maps import GEOCODING_URL, PLACES_URL, DIRECTIONS_URL
from tests.conftest import GEOCODE_OK, GEOCODE_FAIL, PLACES_OK, PLACES_FAIL, DIRECTIONS_OK, TRANSIT_ROUTE

API_KEY = "fake-key"


@respx.mock
async def test_validate_address_valid():
    respx.get(GEOCODING_URL).mock(return_value=httpx.Response(200, json=GEOCODE_OK))
    valid, addr = await maps.validate_address("Orchard Road", API_KEY)
    assert valid is True
    assert addr == "Orchard Road, Singapore 238823"


@respx.mock
async def test_validate_address_invalid():
    respx.get(GEOCODING_URL).mock(return_value=httpx.Response(200, json=GEOCODE_FAIL))
    valid, addr = await maps.validate_address("xyzzy nowhere", API_KEY)
    assert valid is False
    assert addr is None


@respx.mock
async def test_suggest_address_returns_top_3():
    respx.get(PLACES_URL).mock(return_value=httpx.Response(200, json=PLACES_OK))
    suggestions = await maps.suggest_address("Orchard", API_KEY)
    assert len(suggestions) == 3
    assert suggestions[0] == "Orchard Road, Singapore"
    assert suggestions[2] == "Orchard Boulevard, Singapore"


@respx.mock
async def test_suggest_address_no_results():
    respx.get(PLACES_URL).mock(return_value=httpx.Response(200, json=PLACES_FAIL))
    suggestions = await maps.suggest_address("xyzzy", API_KEY)
    assert suggestions == []


@respx.mock
async def test_fetch_all_hourly_traffic_24_calls():
    route = respx.get(DIRECTIONS_URL).mock(
        return_value=httpx.Response(200, json=DIRECTIONS_OK)
    )
    result = await maps.fetch_all_hourly_traffic("Origin, SG", "Dest, SG", API_KEY)
    assert len(result) == 24
    assert set(result.keys()) == set(range(24))
    assert route.call_count == 24
    # Each value is the raw routes list from the API
    assert result[0] == DIRECTIONS_OK["routes"]


@respx.mock
async def test_fetch_current_routes_returns_routes():
    respx.get(DIRECTIONS_URL).mock(return_value=httpx.Response(200, json=DIRECTIONS_OK))
    routes = await maps.fetch_current_routes("Origin, SG", "Dest, SG", API_KEY)
    assert len(routes) == 1
    assert routes[0]["summary"] == "Orchard Road"


@respx.mock
async def test_fetch_hourly_transit_skips_no_service_hours():
    """Transit hours where actual departure is >30 min later than requested return empty."""
    no_service_route = {
        **TRANSIT_ROUTE,
        "legs": [{
            **TRANSIT_ROUTE["legs"][0],
            # Year 2286 — guaranteed > 30 min after any requested departure time
            "departure_time": {"value": 9_999_999_999},
        }],
    }
    respx.get(DIRECTIONS_URL).mock(
        return_value=httpx.Response(200, json={"routes": [no_service_route]})
    )
    result = await maps.fetch_all_hourly_traffic("O, SG", "D, SG", API_KEY, mode="transit")
    assert len(result) == 24
    assert all(routes == [] for routes in result.values())


@respx.mock
async def test_fetch_hourly_transit_within_threshold_passes():
    """Transit routes whose departure is within 30 min of requested time are kept."""
    import time
    on_time_route = {
        **TRANSIT_ROUTE,
        "legs": [{
            **TRANSIT_ROUTE["legs"][0],
            # 10 minutes from now — well within the 30-min threshold
            "departure_time": {"value": int(time.time()) + 600},
        }],
    }
    respx.get(DIRECTIONS_URL).mock(
        return_value=httpx.Response(200, json={"routes": [on_time_route]})
    )
    result = await maps.fetch_all_hourly_traffic("O, SG", "D, SG", API_KEY, mode="transit")
    # Routes within threshold should be kept (not filtered out)
    assert any(routes != [] for routes in result.values())
