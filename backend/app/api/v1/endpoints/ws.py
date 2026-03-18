"""
WebSocket endpoint — authenticated via token query parameter.
Usage: wss://localhost/api/v1/ws/example?token=<keycloak_access_token>
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status

from app.core.security import verify_token

router = APIRouter()


@router.websocket("/{channel}")
async def websocket_endpoint(
    websocket: WebSocket,
    channel: str,
    token: str = Query(...),
):
    try:
        user = await verify_token(token)
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    try:
        await websocket.send_json({
            "event": "connected",
            "channel": channel,
            "user": user.get("sub"),
        })
        while True:
            data = await websocket.receive_json()
            # Echo back — replace with your business logic
            await websocket.send_json({"event": "message", "data": data})
    except WebSocketDisconnect:
        pass
