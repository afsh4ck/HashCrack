import os
import uuid
import aiofiles
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from app.core.wordlist_manager import (
    scan_directories, register_wordlist, get_all_wordlists,
    get_wordlist_by_id, delete_wordlist, preview_wordlist,
    get_wordlist_categories,
)
from app.config import TEMP_DIR

router = APIRouter()

def _fmt(wl: dict) -> dict:
    size_mb = round(wl.get("file_size", 0) / (1024 * 1024), 2)
    return {**wl, "size_mb": size_mb}

@router.get("")
async def list_wordlists():
    return [_fmt(w) for w in get_all_wordlists()]

@router.get("/categories")
async def list_categories():
    return get_wordlist_categories()

@router.post("/scan")
async def scan_wordlists():
    found_raw = scan_directories()
    new_count = 0
    for item in found_raw:
        try:
            wl = register_wordlist(item["path"], item["name"], is_custom=0)
            if wl:
                new_count += 1
        except Exception:
            pass
    # Return ALL wordlists (including previously registered ones)
    all_wl = get_all_wordlists()
    return {"found": new_count, "wordlists": [_fmt(w) for w in all_wl]}

@router.post("/upload")
async def upload_wordlist(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
):
    if not file.filename:
        raise HTTPException(400, "No file provided")

    ext = os.path.splitext(file.filename)[1].lower()
    allowed = {".txt", ".lst", ".dict", ".gz", ".zip"}
    if ext not in allowed:
        raise HTTPException(400, f"Unsupported file type: {ext}")

    tmp_filename = f"{uuid.uuid4()}{ext}"
    tmp_path = TEMP_DIR / tmp_filename

    async with aiofiles.open(tmp_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    display_name = name or file.filename
    try:
        wl = register_wordlist(str(tmp_path), display_name, is_custom=1)
    except Exception as e:
        raise HTTPException(500, f"Failed to register wordlist: {e}")

    return _fmt(wl)

@router.get("/{wid}/preview")
async def preview(wid: int, limit: int = 100, offset: int = 0):
    wl = get_wordlist_by_id(wid)
    if not wl:
        raise HTTPException(404, "Wordlist not found")
    if not os.path.exists(wl["path"]):
        raise HTTPException(404, "Wordlist file not found on disk")
    words = preview_wordlist(wl["path"], limit=limit, offset=offset)
    return {"words": words, "total": wl["total_words"]}

@router.get("/{wid}")
async def get_wordlist(wid: int):
    wl = get_wordlist_by_id(wid)
    if not wl:
        raise HTTPException(404, "Wordlist not found")
    return _fmt(wl)

@router.delete("/{wid}")
async def remove_wordlist(wid: int):
    wl = get_wordlist_by_id(wid)
    if not wl:
        raise HTTPException(404, "Wordlist not found")
    delete_wordlist(wid)
    return {"message": "Wordlist removed"}
