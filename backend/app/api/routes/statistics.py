from fastapi import APIRouter
from app.database import get_db

router = APIRouter()

@router.get("/stats")
async def get_stats():
    db = get_db()
    total_cracked = db.execute("SELECT COUNT(*) FROM cracked_hashes").fetchone()[0]
    tasks_done = db.execute("SELECT COUNT(*) FROM tasks WHERE status='completed'").fetchone()[0]
    tasks_total = db.execute("SELECT COUNT(*) FROM tasks").fetchone()[0]

    type_dist = db.execute(
        "SELECT hash_type, COUNT(*) as cnt FROM cracked_hashes GROUP BY hash_type ORDER BY cnt DESC LIMIT 10"
    ).fetchall()

    strategy_dist = db.execute(
        "SELECT strategy, COUNT(*) as cnt FROM cracked_hashes GROUP BY strategy ORDER BY cnt DESC"
    ).fetchall()

    top_wordlists = db.execute(
        "SELECT name, success_rate, total_cracks, total_words FROM wordlists ORDER BY total_cracks DESC LIMIT 5"
    ).fetchall()

    recent = db.execute(
        "SELECT hash, hash_type, plaintext, strategy, found_at, time_ms FROM cracked_hashes ORDER BY found_at DESC LIMIT 20"
    ).fetchall()

    return {
        "total_cracked": total_cracked,
        "tasks_completed": tasks_done,
        "tasks_total": tasks_total,
        "hash_type_distribution": [dict(r) for r in type_dist],
        "strategy_distribution": [dict(r) for r in strategy_dist],
        "top_wordlists": [dict(r) for r in top_wordlists],
        "recent_cracks": [dict(r) for r in recent],
    }

@router.delete("/stats")
async def clear_stats():
    db = get_db()
    db.execute("DELETE FROM cracked_hashes")
    db.execute("DELETE FROM tasks")
    db.execute("UPDATE wordlists SET total_cracks = 0, total_attempts = 0, success_rate = 0.0, last_used = NULL")
    db.commit()
    return {"status": "ok"}

@router.get("/tasks")
async def list_tasks(limit: int = 20, offset: int = 0):
    db = get_db()
    rows = db.execute(
        "SELECT * FROM tasks ORDER BY created_at DESC LIMIT ? OFFSET ?",
        (limit, offset),
    ).fetchall()
    return [dict(r) for r in rows]
