import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.config import WORDLISTS_DIR
from app.core.wordlist_manager import register_wordlist, get_all_wordlists
from app.api.routes import crack, wordlists, statistics
from app.api import ws_manager

app = FastAPI(title="HashCrack API", version="1.0.0", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(crack.router, prefix="/api", tags=["crack"])
app.include_router(wordlists.router, prefix="/api/wordlists", tags=["wordlists"])
app.include_router(statistics.router, prefix="/api", tags=["statistics"])

DEFAULT_WORDLIST = "rockyou-50.txt"

@app.on_event("startup")
async def startup():
    init_db()
    # Auto-register default wordlist if present on disk
    default_path = str(WORDLISTS_DIR / DEFAULT_WORDLIST)
    if os.path.isfile(default_path):
        existing = get_all_wordlists()
        if not any(w["name"] == DEFAULT_WORDLIST for w in existing):
            try:
                register_wordlist(default_path, DEFAULT_WORDLIST, is_custom=0)
            except Exception:
                pass

@app.websocket("/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    await ws_manager.connect(task_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await ws_manager.disconnect(task_id, websocket)

@app.get("/health")
async def health():
    return {"status": "ok"}
