import asyncio
import json
from typing import Dict, Set
from fastapi import WebSocket

# task_id -> set of connected WebSockets
_connections: Dict[str, Set[WebSocket]] = {}
# task_id -> latest status snapshot
_task_state: Dict[str, dict] = {}

def register(task_id: str):
    _connections.setdefault(task_id, set())
    _task_state[task_id] = {"status": "queued", "processed": 0, "cracked": 0, "results": []}

async def connect(task_id: str, ws: WebSocket):
    await ws.accept()
    _connections.setdefault(task_id, set()).add(ws)
    # Send current snapshot immediately
    if task_id in _task_state:
        try:
            await ws.send_json(_task_state[task_id])
        except Exception:
            pass

async def disconnect(task_id: str, ws: WebSocket):
    _connections.get(task_id, set()).discard(ws)

async def broadcast(task_id: str, data: dict):
    _task_state[task_id] = data
    dead = set()
    for ws in list(_connections.get(task_id, set())):
        try:
            await ws.send_json(data)
        except Exception:
            dead.add(ws)
    for ws in dead:
        _connections.get(task_id, set()).discard(ws)

def update_state(task_id: str, **kwargs):
    _task_state.setdefault(task_id, {}).update(kwargs)
