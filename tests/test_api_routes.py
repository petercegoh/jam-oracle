from tests.conftest import DIRECTIONS_ROUTE, TRANSIT_ROUTE

ORIGIN = "Orchard Road, Singapore"
DEST = "Marina Bay Sands, Singapore"
PAYLOAD = {"origin": "orchard", "destination": "mbs"}

_HOURLY = {h: [DIRECTIONS_ROUTE] for h in range(24)}


def _patch_valid_addresses(mocker):
    return mocker.patch(
        "api.routes.maps.validate_address",
        side_effect=[(True, ORIGIN), (True, DEST)],
    )


async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


async def test_suggest_returns_suggestions(client, mocker):
    mocker.patch(
        "api.routes.maps.suggest_address",
        return_value=["Orchard Road, SG", "Orchard MRT, SG", "Orchard Blvd, SG"],
    )
    resp = await client.get("/api/suggest", params={"q": "orchard"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["suggestions"] == ["Orchard Road, SG", "Orchard MRT, SG", "Orchard Blvd, SG"]


async def test_suggest_empty_query_rejected(client):
    resp = await client.get("/api/suggest", params={"q": ""})
    assert resp.status_code == 422


async def test_routes_success(client, mocker):
    _patch_valid_addresses(mocker)
    mocker.patch("api.routes.maps.fetch_all_hourly_traffic", return_value=_HOURLY)

    resp = await client.post("/api/routes", json=PAYLOAD)
    assert resp.status_code == 200
    body = resp.json()
    assert body["origin"] == ORIGIN
    assert body["destination"] == DEST
    assert len(body["routes"]) == 1
    assert body["routes"][0]["summary"] == "Orchard Road"
    assert len(body["routes"][0]["hourly_traffic"]) == 19


async def test_routes_invalid_origin(client, mocker):
    mocker.patch(
        "api.routes.maps.validate_address",
        side_effect=[(False, None), (True, DEST)],
    )
    resp = await client.post("/api/routes", json=PAYLOAD)
    assert resp.status_code == 422
    assert "origin" in resp.json()["detail"].lower()


async def test_routes_invalid_destination(client, mocker):
    mocker.patch(
        "api.routes.maps.validate_address",
        side_effect=[(True, ORIGIN), (False, None)],
    )
    resp = await client.post("/api/routes", json=PAYLOAD)
    assert resp.status_code == 422
    assert "destination" in resp.json()["detail"].lower()


async def test_routes_no_routes_found(client, mocker):
    _patch_valid_addresses(mocker)
    mocker.patch("api.routes.maps.fetch_all_hourly_traffic", return_value={h: [] for h in range(5, 24)})

    resp = await client.post("/api/routes", json=PAYLOAD)
    assert resp.status_code == 404


async def test_routes_cache_hit(client, mocker):
    """Second identical request must not trigger another fetch_all_hourly_traffic call."""
    mocker.patch(
        "api.routes.maps.validate_address",
        side_effect=[
            (True, ORIGIN), (True, DEST),   # first request
            (True, ORIGIN), (True, DEST),   # second request
        ],
    )
    hourly_mock = mocker.patch(
        "api.routes.maps.fetch_all_hourly_traffic", return_value=_HOURLY
    )

    await client.post("/api/routes", json=PAYLOAD)
    await client.post("/api/routes", json=PAYLOAD)

    assert hourly_mock.call_count == 1


_TRANSIT_HOURLY = {h: [TRANSIT_ROUTE] for h in range(24)}
TRANSIT_PAYLOAD = {"origin": "orchard", "destination": "mbs", "mode": "transit"}


async def test_routes_transit_success(client, mocker):
    """Transit mode returns transit_legs, transfers, and uses duration not duration_in_traffic."""
    _patch_valid_addresses(mocker)
    mocker.patch("api.routes.maps.fetch_all_hourly_traffic", return_value=_TRANSIT_HOURLY)

    resp = await client.post("/api/routes", json=TRANSIT_PAYLOAD)
    assert resp.status_code == 200
    body = resp.json()
    route = body["routes"][0]
    assert route["summary"] == "NEL → 65"
    assert route["duration_current"] == "25 mins"
    assert len(route["transit_legs"]) == 2
    assert route["transfers"] == 1
    assert route["transit_legs"][0]["vehicle_type"] == "SUBWAY"
    assert route["transit_legs"][1]["vehicle_type"] == "BUS"


async def test_routes_transit_cache_separate_from_driving(client, mocker):
    """Transit and driving caches are independent — both fetch when first called."""
    mocker.patch(
        "api.routes.maps.validate_address",
        side_effect=[
            (True, ORIGIN), (True, DEST),   # driving request
            (True, ORIGIN), (True, DEST),   # transit request
        ],
    )
    hourly_mock = mocker.patch(
        "api.routes.maps.fetch_all_hourly_traffic",
        side_effect=[_HOURLY, _TRANSIT_HOURLY],
    )

    await client.post("/api/routes", json=PAYLOAD)
    await client.post("/api/routes", json=TRANSIT_PAYLOAD)

    assert hourly_mock.call_count == 2
