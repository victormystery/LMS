from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
import json
import time

from backend.app.api.depend import get_current_user
from backend.app.services.notification import NotificationManager
from backend.app.core.security import decode_access_token
from backend.app.db.session import get_db
from backend.app.crud import user_crud
from fastapi import WebSocket, WebSocketDisconnect
import asyncio
import json

router = APIRouter()


class MarkReadRequest(BaseModel):
    id: int


@router.get("/", tags=["notifications"])
def list_notifications(current_user=Depends(get_current_user)):
    """Return unread notifications for the current user."""
    nm = NotificationManager.get_instance()
    items = nm.get_notifications_for_user(current_user.id)
    return {"items": items, "count": len(items)}


@router.post("/mark-read", tags=["notifications"])
def mark_read(req: MarkReadRequest, current_user=Depends(get_current_user)):
    nm = NotificationManager.get_instance()
    # simple ownership check: find notification and ensure user_id matches
    for n in nm._store:
        if n.get("id") == req.id:
            if n.get("user_id") != current_user.id:
                return {"ok": False, "message": "not allowed"}
            ok = nm.mark_read(req.id)
            return {"ok": ok}
    return {"ok": False, "message": "not found"}


@router.get("/stream", tags=["notifications"])
def stream_notifications(request: Request, token: str = None):
    """SSE stream of notifications for the user identified by the token query param.

    Note: EventSource cannot set Authorization headers in browsers; for demo we accept a `token` query param.
    """
    # Prefer token from query param; fallback to cookie named `access_token`
    if not token:
        token = request.cookies.get("access_token")

    if not token:
        return StreamingResponse(iter([b"Unauthorized\n"]), status_code=401)

    # validate token and load user
    try:
        payload = decode_access_token(token)
        username = payload.get("sub")
        if not username:
            return StreamingResponse(iter([b"Invalid token\n"]), status_code=401)
    except Exception:
        return StreamingResponse(iter([b"Invalid token\n"]), status_code=401)

    # get user from DB
    db = next(get_db())
    user = user_crud.get_user_by_username(db, username)
    if not user:
        return StreamingResponse(iter([b"User not found\n"]), status_code=404)

    nm = NotificationManager.get_instance()
    sub = nm.subscribe(user.id)

    def event_generator():
        try:
            # initial keepalive
            yield "event: ping\ndata: \n\n"
            while True:
                # wait for items with a timeout
                with sub["cond"]:
                    if not sub["items"]:
                        sub["cond"].wait(timeout=15)
                    items = list(sub["items"]) if sub["items"] else []
                    sub["items"].clear()
                for it in items:
                    data = json.dumps(it, default=str)
                    yield f"data: {data}\n\n"
                # periodic keepalive
                yield "event: ping\ndata: \n\n"
        finally:
            nm.unsubscribe(user.id, sub)

    # StreamingResponse needs a sync iterator that yields bytes/str
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.websocket("/ws")
async def websocket_notifications(websocket: WebSocket, token: str = None):
    # Accept websocket connection
    await websocket.accept()
    # Try token from query param or cookie
    if not token:
        token = websocket.cookies.get("access_token")

    if not token:
        await websocket.close(code=1008)
        return

    try:
        payload = decode_access_token(token)
        username = payload.get("sub")
        if not username:
            await websocket.close(code=1008)
            return
    except Exception:
        await websocket.close(code=1008)
        return

    # get user
    db = next(get_db())
    user = user_crud.get_user_by_username(db, username)
    if not user:
        await websocket.close(code=1008)
        return

    nm = NotificationManager.get_instance()
    sub = nm.subscribe(user.id)

    try:
        while True:
            # check for new items
            items = []
            with sub["cond"]:
                if not sub["items"]:
                    # wait with timeout so we can periodically ping
                    sub["cond"].wait(timeout=5)
                items = list(sub["items"]) if sub["items"] else []
                sub["items"].clear()
            for it in items:
                try:
                    await websocket.send_text(json.dumps(it, default=str))
                except Exception:
                    pass
            # small sleep to yield
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        pass
    finally:
        nm.unsubscribe(user.id, sub)


# NOTE: EventSource clients cannot set Authorization headers. The `/stream` endpoint
# accepts a `token` query param for demo purposes and keeps a long-lived connection
# that is notified whenever NotificationManager.push() adds a new notification.
