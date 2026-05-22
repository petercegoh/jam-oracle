import pytest
import httpx
from httpx import ASGITransport

# ---------------------------------------------------------------------------
# Fake Google Maps API payloads — importable by all test modules
# ---------------------------------------------------------------------------

GEOCODE_OK = {
    "status": "OK",
    "results": [{"formatted_address": "Orchard Road, Singapore 238823"}],
}
GEOCODE_FAIL = {"status": "ZERO_RESULTS", "results": []}

PLACES_OK = {
    "status": "OK",
    "predictions": [
        {"description": "Orchard Road, Singapore"},
        {"description": "Orchard MRT, Singapore"},
        {"description": "Orchard Boulevard, Singapore"},
        {"description": "Orchard Turn, Singapore"},  # 4th — should be excluded
    ],
}
PLACES_FAIL = {"status": "ZERO_RESULTS", "predictions": []}

DIRECTIONS_ROUTE = {
    "legs": [
        {
            "distance": {"text": "5 km", "value": 5000},
            "duration": {"text": "10 mins", "value": 600},
            "duration_in_traffic": {"text": "14 mins", "value": 840},
        }
    ],
    "summary": "Orchard Road",
}
DIRECTIONS_ROUTE_NO_TRAFFIC = {
    "legs": [
        {
            "distance": {"text": "5 km", "value": 5000},
            "duration": {"text": "10 mins", "value": 600},
            # no duration_in_traffic key — tests fallback behaviour
        }
    ],
    "summary": "Orchard Road",
}
DIRECTIONS_OK = {"routes": [DIRECTIONS_ROUTE]}
DIRECTIONS_EMPTY = {"routes": []}

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def clear_route_cache():
    """Clear the in-memory TTL cache before and after every test."""
    from api.routes import _cache
    _cache.clear()
    yield
    _cache.clear()


@pytest.fixture
async def client():
    """Async HTTPX client pointed at the FastAPI app (no real network)."""
    from api.routes import app
    async with httpx.AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c
