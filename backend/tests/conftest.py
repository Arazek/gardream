"""
Shared fixtures for backend API tests.
Tests run against the live Docker stack (backend + Keycloak + Postgres).
"""
import pytest
import httpx

BACKEND_URL = "http://localhost:8000/api/v1"
KEYCLOAK_TOKEN_URL = (
    "https://gateway.localhost/keycloak/realms/gardream/protocol/openid-connect/token"
)
CREDENTIALS = {"username": "admin", "password": "admin", "client_id": "pwa-frontend"}


@pytest.fixture(scope="session")
def token() -> str:
    """Obtain a real Keycloak token for admin user."""
    resp = httpx.post(
        KEYCLOAK_TOKEN_URL,
        data={
            "grant_type": "password",
            "client_id": CREDENTIALS["client_id"],
            "username": CREDENTIALS["username"],
            "password": CREDENTIALS["password"],
        },
        verify=False,  # self-signed cert on local stack
    )
    assert resp.status_code == 200, f"Token fetch failed: {resp.text}"
    return resp.json()["access_token"]


@pytest.fixture(scope="session")
def client(token: str) -> httpx.Client:
    """Authenticated httpx client."""
    return httpx.Client(
        base_url=BACKEND_URL,
        headers={"Authorization": f"Bearer {token}"},
        verify=False,
        timeout=10,
    )


@pytest.fixture(scope="session")
def plot_id(client: httpx.Client) -> str:
    """Return first available plot id, or create one."""
    resp = client.get("/plots")
    assert resp.status_code == 200
    plots = resp.json()
    if plots:
        return plots[0]["id"]
    # Create a plot for tests
    resp = client.post("/plots", json={
        "name": "Test Plot API",
        "plot_type": "ground_bed",
        "rows": 4,
        "cols": 4,
        "watering_days": [0, 2, 4],
    })
    assert resp.status_code in (200, 201)
    return resp.json()["id"]


@pytest.fixture(scope="session")
def crop_id(client: httpx.Client) -> str:
    """Return first available crop id."""
    resp = client.get("/crops")
    assert resp.status_code == 200
    crops = resp.json()
    assert len(crops) > 0
    return crops[0]["id"]
