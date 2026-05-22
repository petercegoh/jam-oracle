import httpx
import respx

from services import maps
from services.maps import GEOCODING_URL, PLACES_URL, DIRECTIONS_URL
from tests.conftest import GEOCODE_OK, GEOCODE_FAIL, PLACES_OK, PLACES_FAIL, DIRECTIONS_OK

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
