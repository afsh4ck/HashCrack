import sqlite3
import threading
from pathlib import Path
from app.config import DB_PATH

_local = threading.local()

def get_db():
    if not hasattr(_local, "conn") or _local.conn is None:
        _local.conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
        _local.conn.row_factory = sqlite3.Row
    return _local.conn

def init_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.executescript("""
    CREATE TABLE IF NOT EXISTS cracked_hashes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash TEXT UNIQUE NOT NULL,
        hash_type TEXT,
        plaintext TEXT NOT NULL,
        strategy TEXT,
        found_at TEXT DEFAULT (datetime('now')),
        attempts INTEGER DEFAULT 0,
        wordlist_used TEXT,
        time_ms REAL
    );

    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        status TEXT DEFAULT 'queued',
        total_hashes INTEGER DEFAULT 0,
        processed INTEGER DEFAULT 0,
        cracked INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        wordlist_name TEXT,
        strategies TEXT,
        error TEXT
    );

    CREATE TABLE IF NOT EXISTS wordlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        path TEXT NOT NULL,
        total_words INTEGER DEFAULT 0,
        file_size INTEGER DEFAULT 0,
        last_used TEXT,
        success_rate REAL DEFAULT 0.0,
        total_attempts INTEGER DEFAULT 0,
        total_cracks INTEGER DEFAULT 0,
        is_custom INTEGER DEFAULT 0,
        category TEXT DEFAULT 'Other',
        added_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_cracked_hash ON cracked_hashes(hash);
    CREATE INDEX IF NOT EXISTS idx_task_status ON tasks(status);
    """)

    # Migration: add category column if missing
    try:
        cur.execute("SELECT category FROM wordlists LIMIT 1")
    except sqlite3.OperationalError:
        cur.execute("ALTER TABLE wordlists ADD COLUMN category TEXT DEFAULT 'Other'")

    # Migration: add subcategory column if missing
    try:
        cur.execute("SELECT subcategory FROM wordlists LIMIT 1")
    except sqlite3.OperationalError:
        cur.execute("ALTER TABLE wordlists ADD COLUMN subcategory TEXT DEFAULT ''")

    conn.commit()
    conn.close()
