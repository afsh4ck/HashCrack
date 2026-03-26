import os
import gzip
import zipfile
import shutil
from pathlib import Path
from typing import List, Optional
from app.config import SYSTEM_WORDLIST_DIRS, WORDLIST_EXTENSIONS, WORDLIST_COMPRESSED, TEMP_DIR, CATEGORY_PATTERNS
from app.database import get_db

def _count_lines(path: str) -> int:
    count = 0
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            for _ in f:
                count += 1
    except Exception:
        pass
    return count

def _detect_category(path: str, is_custom: int = 0) -> str:
    if is_custom:
        return "Custom"
    for cat, patterns in CATEGORY_PATTERNS.items():
        for pat in patterns:
            if pat.lower() in path.lower():
                return cat
    return "Other"

def _is_wordlist(filename: str) -> bool:
    name = filename.lower()
    ext = Path(name).suffix
    if ext in WORDLIST_EXTENSIONS:
        return True
    if ext in WORDLIST_COMPRESSED:
        stem = Path(name).stem
        return Path(stem).suffix in WORDLIST_EXTENSIONS or any(
            kw in stem for kw in ("word", "pass", "dict", "rockyou", "seclist", "list")
        )
    return False

def scan_directories(extra_dirs: List[str] = None) -> List[dict]:
    dirs = list(SYSTEM_WORDLIST_DIRS)
    if extra_dirs:
        dirs.extend(extra_dirs)

    found = []
    seen_paths = set()

    for directory in dirs:
        directory = os.path.expanduser(directory)
        if not os.path.isdir(directory):
            continue
        for root, _, files in os.walk(directory):
            for fname in files:
                if not _is_wordlist(fname):
                    continue
                full_path = os.path.join(root, fname)
                if full_path in seen_paths:
                    continue
                seen_paths.add(full_path)
                try:
                    size = os.path.getsize(full_path)
                except OSError:
                    size = 0
                found.append({
                    "name": fname,
                    "path": full_path,
                    "file_size": size,
                    "is_custom": 0,
                })
    return found

def decompress_wordlist(src_path: str) -> str:
    src = Path(src_path)
    if src.suffix == ".gz":
        out_path = TEMP_DIR / src.stem
        with gzip.open(src_path, "rb") as gz_in:
            with open(out_path, "wb") as f_out:
                shutil.copyfileobj(gz_in, f_out)
        return str(out_path)
    elif src.suffix == ".zip":
        out_dir = TEMP_DIR / src.stem
        out_dir.mkdir(exist_ok=True)
        with zipfile.ZipFile(src_path, "r") as zf:
            zf.extractall(out_dir)
        txt_files = list(out_dir.rglob("*.txt"))
        if txt_files:
            return str(txt_files[0])
    return src_path

def register_wordlist(path: str, name: Optional[str] = None, is_custom: int = 1) -> dict:
    actual_path = path
    if path.endswith((".gz", ".zip")):
        actual_path = decompress_wordlist(path)

    file_name = name or Path(actual_path).name
    size = os.path.getsize(actual_path) if os.path.exists(actual_path) else 0
    words = _count_lines(actual_path)
    category = _detect_category(actual_path, is_custom)

    db = get_db()
    try:
        db.execute(
            """INSERT OR REPLACE INTO wordlists
               (name, path, total_words, file_size, is_custom, category)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (file_name, actual_path, words, size, is_custom, category),
        )
        db.commit()
        row = db.execute("SELECT * FROM wordlists WHERE name = ?", (file_name,)).fetchone()
        return dict(row) if row else {}
    except Exception as e:
        db.rollback()
        raise e

def get_all_wordlists() -> List[dict]:
    db = get_db()
    rows = db.execute("SELECT * FROM wordlists ORDER BY total_words DESC").fetchall()
    return [dict(r) for r in rows]

def get_wordlist_categories() -> List[str]:
    db = get_db()
    rows = db.execute("SELECT DISTINCT category FROM wordlists WHERE category IS NOT NULL ORDER BY category").fetchall()
    return [r["category"] for r in rows]

def get_wordlist_by_id(wid: int) -> Optional[dict]:
    db = get_db()
    row = db.execute("SELECT * FROM wordlists WHERE id = ?", (wid,)).fetchone()
    return dict(row) if row else None

def delete_wordlist(wid: int) -> bool:
    db = get_db()
    row = db.execute("SELECT * FROM wordlists WHERE id = ?", (wid,)).fetchone()
    if not row:
        return False
    db.execute("DELETE FROM wordlists WHERE id = ?", (wid,))
    db.commit()
    return True

def update_wordlist_stats(wordlist_name: str, cracked: int):
    db = get_db()
    db.execute(
        """UPDATE wordlists SET
           total_cracks = total_cracks + ?,
           total_attempts = total_attempts + 1,
           last_used = datetime('now'),
           success_rate = CAST(total_cracks + ? AS REAL) / (total_attempts + 1) * 100
           WHERE name = ?""",
        (cracked, cracked, wordlist_name),
    )
    db.commit()

def preview_wordlist(path: str, limit: int = 100, offset: int = 0) -> List[str]:
    lines = []
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            for i, line in enumerate(f):
                if i < offset:
                    continue
                if len(lines) >= limit:
                    break
                word = line.strip()
                if word:
                    lines.append(word)
    except Exception:
        pass
    return lines
