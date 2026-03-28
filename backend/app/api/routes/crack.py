import asyncio
import uuid
import json
from typing import Optional, List
from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse

from app.models import CrackRequest, TaskResponse, TaskStatus
from app.core.detector import detect_hash
from app.core.cracker import crack_single, crack_batch
from app.core.wordlist_manager import get_wordlist_by_id, update_wordlist_stats
from app.database import get_db
from app.api import ws_manager

router = APIRouter()
_stop_flags: dict = {}

def _save_cracked(db, hash_val, hash_type, plaintext, strategy, time_ms, wordlist_name, task_id):
    try:
        db.execute(
            """INSERT OR IGNORE INTO cracked_hashes
               (hash, hash_type, plaintext, strategy, time_ms, wordlist_used)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (hash_val.lower(), hash_type, plaintext, strategy, time_ms, wordlist_name),
        )
        db.commit()
    except Exception:
        pass

async def _run_task(task_id: str, hashes: List[str], strategies: list,
                    wordlist_path: Optional[str], wordlist_name: Optional[str]):
    db = get_db()
    total = len(hashes)
    cracked = 0
    results = []
    stop_flag = _stop_flags.setdefault(task_id, [False])

    db.execute(
        "UPDATE tasks SET status='running', updated_at=datetime('now') WHERE id=?",
        (task_id,),
    )
    db.commit()

    await ws_manager.broadcast(task_id, {
        "status": "running", "total": total,
        "processed": 0, "cracked": 0, "results": [],
        "phase": "", "phase_progress": 0,
    })

    loop = asyncio.get_event_loop()

    # Detect all hash types first
    hash_entries = []
    for h in hashes:
        try:
            detection = detect_hash(h)
            hash_type = detection.detected_type or "md5"
            variants = detection.variants if detection.variants else [hash_type]
        except Exception:
            hash_type = "md5"
            variants = ["md5"]
        hash_entries.append((h, hash_type, variants))

    # Shared progress dict updated by crack_batch threads
    progress_info = {"phase": "", "phase_progress": 0.0, "cracked": 0}
    batch_results = {}

    def on_cracked(idx, result):
        batch_results[idx] = result

    # Run crack_batch in executor (non-blocking)
    crack_future = loop.run_in_executor(
        None,
        crack_batch,
        hash_entries, strategies, wordlist_path, stop_flag, on_cracked, progress_info,
    )

    # Poll progress and broadcast until cracking is done
    while not crack_future.done():
        await asyncio.sleep(0.35)
        current_cracked = len(batch_results)
        current_results = []
        for idx, cr in list(batch_results.items()):
            h_val = hashes[idx] if idx < len(hashes) else ""
            actual_type = cr.get("hash_type", "")
            current_results.append({
                "hash": h_val, "hash_type": actual_type,
                "plaintext": cr["plaintext"], "strategy": cr["strategy"],
                "time_ms": cr["time_ms"],
            })

        await ws_manager.broadcast(task_id, {
            "status": "running",
            "total": total,
            "processed": current_cracked,
            "cracked": current_cracked,
            "phase": progress_info.get("phase", ""),
            "phase_progress": round(progress_info.get("phase_progress", 0), 4),
            "results": current_results[-50:],
        })

    # Get final result
    try:
        batch_results = crack_future.result()
    except Exception:
        batch_results = {}

    # Process results and save to DB
    processed = 0
    for idx, (h, hash_type, variants) in enumerate(hash_entries):
        if stop_flag[0]:
            break
        processed += 1
        crack_result = batch_results.get(idx)
        if crack_result:
            cracked += 1
            actual_type = crack_result.get("hash_type", hash_type)
            entry = {
                "hash": h,
                "hash_type": actual_type,
                "plaintext": crack_result["plaintext"],
                "strategy": crack_result["strategy"],
                "time_ms": crack_result["time_ms"],
            }
            results.append(entry)
            _save_cracked(db, h, actual_type, crack_result["plaintext"],
                          crack_result["strategy"], crack_result["time_ms"],
                          wordlist_name, task_id)

        db.execute(
            "UPDATE tasks SET processed=?, cracked=?, updated_at=datetime('now') WHERE id=?",
            (processed, cracked, task_id),
        )
        db.commit()

    if wordlist_name:
        update_wordlist_stats(wordlist_name, cracked)

    final_status = "stopped" if stop_flag[0] else "completed"
    db.execute(
        "UPDATE tasks SET status=?, processed=?, cracked=?, updated_at=datetime('now') WHERE id=?",
        (final_status, processed, cracked, task_id),
    )
    db.commit()

    await ws_manager.broadcast(task_id, {
        "status": final_status,
        "total": total,
        "processed": processed,
        "cracked": cracked,
        "phase": "done",
        "phase_progress": 1.0,
        "results": results,
    })

@router.post("/crack", response_model=TaskResponse)
async def start_crack(req: CrackRequest, background_tasks: BackgroundTasks):
    if not req.hashes:
        raise HTTPException(400, "No hashes provided")

    # Deduplicate
    hashes = list(dict.fromkeys(h.strip() for h in req.hashes if h.strip()))

    wordlist_path = None
    wordlist_name = None

    if req.wordlist_id:
        wl = get_wordlist_by_id(req.wordlist_id)
        if not wl:
            raise HTTPException(404, "Wordlist not found")
        import os
        if not os.path.exists(wl["path"]):
            raise HTTPException(404, f"Wordlist file not found on disk: {wl['path']}")
        wordlist_path = wl["path"]
        wordlist_name = wl["name"]

    task_id = str(uuid.uuid4())
    strategies = [s.value if hasattr(s, "value") else s for s in req.strategies]

    db = get_db()
    db.execute(
        """INSERT INTO tasks (id, status, total_hashes, processed, cracked, wordlist_name, strategies)
           VALUES (?, 'queued', ?, 0, 0, ?, ?)""",
        (task_id, len(hashes), wordlist_name, json.dumps(strategies)),
    )
    db.commit()

    ws_manager.register(task_id)

    background_tasks.add_task(
        _run_task, task_id, hashes, strategies, wordlist_path, wordlist_name
    )

    return TaskResponse(
        task_id=task_id,
        status="queued",
        total_hashes=len(hashes),
        wordlist_used=wordlist_name,
    )

@router.get("/crack/{task_id}", response_model=TaskStatus)
async def get_task(task_id: str):
    db = get_db()
    row = db.execute("SELECT * FROM tasks WHERE id=?", (task_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Task not found")

    rows = db.execute(
        "SELECT * FROM cracked_hashes WHERE wordlist_used IS NOT NULL OR strategy='rainbow' ORDER BY found_at DESC LIMIT 200"
    ).fetchall()

    return TaskStatus(
        task_id=task_id,
        status=row["status"],
        total_hashes=row["total_hashes"],
        processed=row["processed"],
        cracked=row["cracked"],
    )

@router.post("/crack/{task_id}/stop")
async def stop_task(task_id: str):
    if task_id in _stop_flags:
        _stop_flags[task_id][0] = True
    return {"message": "Stop signal sent"}

@router.post("/detect")
async def detect_hashes(body: dict):
    hashes = body.get("hashes", [])
    if not hashes:
        raise HTTPException(400, "No hashes provided")
    results = []
    for h in hashes[:500]:
        d = detect_hash(h.strip())
        results.append({
            "hash": h,
            "detected_type": d.detected_type,
            "confidence": d.confidence,
            "variants": d.variants,
            "hashcat_mode": d.hashcat_mode,
        })
    return results

@router.get("/results/export/{fmt}")
async def export_results(fmt: str, task_id: Optional[str] = None):
    db = get_db()
    if task_id:
        rows = db.execute(
            "SELECT hash, hash_type, plaintext, strategy, found_at, time_ms FROM cracked_hashes WHERE wordlist_used IS NOT NULL LIMIT 10000"
        ).fetchall()
    else:
        rows = db.execute(
            "SELECT hash, hash_type, plaintext, strategy, found_at, time_ms FROM cracked_hashes LIMIT 10000"
        ).fetchall()

    data = [dict(r) for r in rows]

    if fmt == "json":
        return JSONResponse(content=data)
    elif fmt == "csv":
        import io
        buf = io.StringIO()
        buf.write("hash,hash_type,plaintext,strategy,found_at,time_ms\n")
        for r in data:
            buf.write(f"{r['hash']},{r['hash_type']},{r['plaintext']},{r['strategy']},{r['found_at']},{r['time_ms']}\n")
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse(buf.getvalue(), media_type="text/csv",
                                  headers={"Content-Disposition": "attachment; filename=results.csv"})
    elif fmt in ("txt", "potfile"):
        lines = "\n".join(f"{r['hash']}:{r['plaintext']}" for r in data)
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse(lines, media_type="text/plain",
                                  headers={"Content-Disposition": f"attachment; filename=results.{fmt}"})
    else:
        raise HTTPException(400, "Unsupported format. Use json, csv, txt, potfile")
