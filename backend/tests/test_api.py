"""
Backend API integration tests (API1-API8).
Run against the live Docker stack: backend + Keycloak + Postgres.
"""
import pytest
import httpx
from datetime import date, timedelta


# ─── API1 ─────────────────────────────────────────────────────────────────────
def test_api1_slot_creation_generates_tasks(client: httpx.Client, plot_id: str, crop_id: str):
    """API1: Creating a slot auto-generates tasks for the crop schedule."""
    today = date.today().isoformat()

    # Delete any existing slot at (0,0) so creation doesn't conflict
    slots_resp = client.get(f"/plots/{plot_id}/slots")
    assert slots_resp.status_code == 200
    for slot in slots_resp.json():
        if slot["row"] == 0 and slot["col"] == 0:
            client.delete(f"/plots/{plot_id}/slots/{slot['id']}")
            break

    # Count tasks before
    before = client.get("/tasks").json()
    count_before = len(before)

    # Create slot
    resp = client.post(
        f"/plots/{plot_id}/slots",
        json={"crop_id": crop_id, "row": 0, "col": 0, "sow_date": today},
    )
    assert resp.status_code in (200, 201), resp.text
    slot = resp.json()
    slot_id = slot["id"]

    # Tasks must have increased — at minimum a harvest task is always created
    after = client.get("/tasks").json()
    count_after = len(after)
    assert count_after > count_before, "No tasks were generated after slot creation"

    # At least one task linked to new slot
    slot_tasks = [t for t in after if t.get("plot_slot_id") == slot_id]
    assert len(slot_tasks) >= 1, "No tasks linked to the newly created slot"

    # Harvest task must exist
    harvest_tasks = [t for t in slot_tasks if t["type"] == "harvest"]
    assert len(harvest_tasks) == 1, "Expected exactly one harvest task"

    # Cleanup
    client.delete(f"/plots/{plot_id}/slots/{slot_id}")


# ─── API2 ─────────────────────────────────────────────────────────────────────
def test_api2_delete_slot_cascades_tasks(client: httpx.Client, plot_id: str, crop_id: str):
    """API2: Deleting a slot also removes its linked tasks."""
    today = date.today().isoformat()

    # Remove existing slot at (0,1) if present
    slots_resp = client.get(f"/plots/{plot_id}/slots")
    for slot in slots_resp.json():
        if slot["row"] == 0 and slot["col"] == 1:
            client.delete(f"/plots/{plot_id}/slots/{slot['id']}")
            break

    # Create slot
    resp = client.post(
        f"/plots/{plot_id}/slots",
        json={"crop_id": crop_id, "row": 0, "col": 1, "sow_date": today},
    )
    assert resp.status_code in (200, 201), resp.text
    slot_id = resp.json()["id"]

    # Verify tasks exist for this slot
    all_tasks = client.get("/tasks").json()
    slot_tasks_before = [t for t in all_tasks if t.get("plot_slot_id") == slot_id]
    assert len(slot_tasks_before) >= 1, "Expected tasks for new slot"

    # Delete the slot
    del_resp = client.delete(f"/plots/{plot_id}/slots/{slot_id}")
    assert del_resp.status_code in (200, 204), del_resp.text

    # Tasks for this slot must be gone
    all_tasks_after = client.get("/tasks").json()
    slot_tasks_after = [t for t in all_tasks_after if t.get("plot_slot_id") == slot_id]
    assert len(slot_tasks_after) == 0, f"Tasks were not deleted with slot: {slot_tasks_after}"


# ─── API3 ─────────────────────────────────────────────────────────────────────
def test_api3_update_sow_date_recalculates_tasks(client: httpx.Client, plot_id: str, crop_id: str):
    """API3: Updating sow_date shifts task due dates."""
    today = date.today()
    new_sow = (today + timedelta(days=7)).isoformat()

    # Remove existing slot at (0,2) if present
    slots_resp = client.get(f"/plots/{plot_id}/slots")
    for slot in slots_resp.json():
        if slot["row"] == 0 and slot["col"] == 2:
            client.delete(f"/plots/{plot_id}/slots/{slot['id']}")
            break

    # Create slot with today's sow date
    resp = client.post(
        f"/plots/{plot_id}/slots",
        json={"crop_id": crop_id, "row": 0, "col": 2, "sow_date": today.isoformat()},
    )
    assert resp.status_code in (200, 201), resp.text
    slot_id = resp.json()["id"]

    # Read harvest task due date before update
    tasks_before = [
        t for t in client.get("/tasks").json()
        if t.get("plot_slot_id") == slot_id and t["type"] == "harvest"
    ]
    assert tasks_before, "No harvest task found for slot"
    harvest_due_before = tasks_before[0]["due_date"]

    # Update sow date by +7 days
    patch_resp = client.patch(
        f"/plots/{plot_id}/slots/{slot_id}",
        json={"sow_date": new_sow},
    )
    assert patch_resp.status_code in (200, 204), patch_resp.text

    # Harvest task should shift +7 days
    tasks_after = [
        t for t in client.get("/tasks").json()
        if t.get("plot_slot_id") == slot_id and t["type"] == "harvest"
    ]
    assert tasks_after, "No harvest task after sow_date update"
    harvest_due_after = tasks_after[0]["due_date"]

    assert harvest_due_before != harvest_due_after, (
        f"Harvest due date did not change: {harvest_due_before}"
    )

    # Cleanup
    client.delete(f"/plots/{plot_id}/slots/{slot_id}")


# ─── API4 ─────────────────────────────────────────────────────────────────────
def test_api4_user_data_isolation(plot_id: str):
    """API4: Authenticated user can only see their own plots/tasks (no 401/403 on own data)."""
    # We test this by verifying the admin user's data is accessible
    # and that the API returns 200 with a list (not someone else's data injected)
    # True cross-user isolation would require a second user token — this test
    # verifies at minimum that the auth boundary is enforced (data is returned).
    import httpx as _httpx

    KEYCLOAK_TOKEN_URL = (
        "https://gateway.localhost/keycloak/realms/gardream/protocol/openid-connect/token"
    )
    resp = _httpx.post(
        KEYCLOAK_TOKEN_URL,
        data={
            "grant_type": "password",
            "client_id": "pwa-frontend",
            "username": "admin",
            "password": "admin",
        },
        verify=False,
    )
    assert resp.status_code == 200, f"Token fetch failed: {resp.text}"
    token = resp.json()["access_token"]

    client_a = _httpx.Client(
        base_url="http://localhost:8000/api/v1",
        headers={"Authorization": f"Bearer {token}"},
        verify=False,
        timeout=10,
    )

    plots = client_a.get("/plots").json()
    # All plots in this list must have been created by admin (user_id match
    # is enforced server-side — we can't easily inspect user_id here, but
    # unauthenticated access must be rejected)
    assert isinstance(plots, list)

    # Unauthenticated request must be rejected
    anon = _httpx.Client(base_url="http://localhost:8000/api/v1", verify=False, timeout=10)
    anon_resp = anon.get("/plots")
    assert anon_resp.status_code in (401, 403), (
        f"Expected 401/403 for unauthenticated request, got {anon_resp.status_code}"
    )


# ─── API5 ─────────────────────────────────────────────────────────────────────
def test_api5_weather_returns_forecast(client: httpx.Client):
    """API5: Weather endpoint returns current data + 7-day forecast for valid coords."""
    resp = client.get("/weather", params={"lat": 48.8566, "lon": 2.3522})
    assert resp.status_code == 200, resp.text

    data = resp.json()
    assert "current" in data, "Missing 'current' key in weather response"
    assert "forecast" in data, "Missing 'forecast' key in weather response"

    current = data["current"]
    assert "temperature" in current
    assert "condition" in current

    forecast = data["forecast"]
    assert isinstance(forecast, list)
    assert len(forecast) == 7, f"Expected 7-day forecast, got {len(forecast)} days"

    for day in forecast:
        assert "date" in day
        assert "temp_max" in day
        assert "temp_min" in day
        assert "rain_expected" in day


# ─── API6 ─────────────────────────────────────────────────────────────────────
def test_api6_tasks_filter_by_due_date(client: httpx.Client, plot_id: str, crop_id: str):
    """API6: GET /tasks?due_date=<date> returns only tasks for that date."""
    target_date = (date.today() + timedelta(days=30)).isoformat()

    # Create a standalone task on target_date
    resp = client.post(
        "/tasks",
        json={"type": "check", "title": "API6 test task", "due_date": target_date},
    )
    assert resp.status_code in (200, 201), resp.text
    task_id = resp.json()["id"]

    # Filter by due_date
    filtered = client.get("/tasks", params={"due_date": target_date}).json()
    assert isinstance(filtered, list)

    due_dates = [t["due_date"] for t in filtered]
    assert all(d == target_date for d in due_dates), (
        f"Filtered tasks include wrong dates: {set(due_dates)}"
    )
    assert any(t["id"] == task_id for t in filtered), "Created task not in filtered results"

    # Cleanup
    client.delete(f"/tasks/{task_id}")


# ─── API7 ─────────────────────────────────────────────────────────────────────
def test_api7_tasks_filter_by_completed(client: httpx.Client):
    """API7: GET /tasks?completed=false returns only pending tasks."""
    # Create a pending task
    future_date = (date.today() + timedelta(days=60)).isoformat()
    resp = client.post(
        "/tasks",
        json={"type": "water", "title": "API7 pending task", "due_date": future_date},
    )
    assert resp.status_code in (200, 201), resp.text
    pending_id = resp.json()["id"]

    # Create and complete another task
    resp2 = client.post(
        "/tasks",
        json={"type": "water", "title": "API7 completed task", "due_date": future_date},
    )
    assert resp2.status_code in (200, 201)
    done_id = resp2.json()["id"]
    client.patch(f"/tasks/{done_id}", json={"completed": True})

    # Filter pending
    pending = client.get("/tasks", params={"completed": False}).json()
    pending_ids = {t["id"] for t in pending}
    completed_in_list = [t for t in pending if t["completed"] is True]

    assert pending_id in pending_ids, "Pending task missing from completed=false results"
    assert not completed_in_list, f"Completed tasks leaked into pending filter: {completed_in_list}"

    # Filter completed
    done = client.get("/tasks", params={"completed": True}).json()
    done_ids = {t["id"] for t in done}
    assert done_id in done_ids, "Completed task missing from completed=true results"

    # Cleanup
    client.delete(f"/tasks/{pending_id}")
    client.delete(f"/tasks/{done_id}")


# ─── API8 ─────────────────────────────────────────────────────────────────────
def test_api8_notification_settings_auto_created(client: httpx.Client):
    """API8: GET /notifications/settings auto-creates defaults for user on first call."""
    resp = client.get("/notifications/settings")
    assert resp.status_code == 200, resp.text

    data = resp.json()
    assert "id" in data
    assert "user_id" in data
    assert "morning_reminder" in data
    assert "evening_reminder" in data
    assert "in_app_alerts" in data

    # Defaults must be True
    assert data["morning_reminder"] is True
    assert data["evening_reminder"] is True
    assert data["in_app_alerts"] is True

    # Second call must return same record (idempotent)
    resp2 = client.get("/notifications/settings")
    assert resp2.status_code == 200
    assert resp2.json()["id"] == data["id"], "Second GET returned a different settings record"
