import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
WORDLISTS_DIR = DATA_DIR / "wordlists"
RESULTS_DIR = DATA_DIR / "results"
DB_PATH = DATA_DIR / "hashcrack.db"

WORDLISTS_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

SYSTEM_WORDLIST_DIRS = [
    "/usr/share/wordlists",
    "/usr/share/seclists",
    "/usr/share/metasploit-framework/data/wordlists",
    "/usr/share/dirb/wordlists",
    "/usr/share/dirbuster/wordlists",
    "/usr/share/wfuzz/wordlist",
    "/usr/share/john",
    "/usr/share/nmap/nselib/data",
    "/usr/share/dict",
    "/usr/share/sqlmap/data/txt",
    "/usr/share/legion/wordlists",
    "/usr/share/amass/wordlists",
    "/usr/share/commix",
    "/usr/share/set",
    "/opt/wordlists",
    "/opt/SecLists",
    str(Path.home() / "wordlists"),
    str(Path.home() / "Documents" / "wordlists"),
    str(WORDLISTS_DIR),
]

# Category detection from path
CATEGORY_PATTERNS = {
    "SecLists":    ["/seclists/", "/SecLists/"],
    "Metasploit":  ["/metasploit-framework/", "/metasploit/", "/msf/"],
    "Dirb":        ["/dirb/"],
    "Dirbuster":   ["/dirbuster/"],
    "Wfuzz":       ["/wfuzz/"],
    "John":        ["/john/"],
    "Nmap":        ["/nmap/"],
    "SQLMap":      ["/sqlmap/"],
    "Rockyou":     ["rockyou"],
    "System":      ["/usr/share/dict/"],
}

WORDLIST_EXTENSIONS = {".txt", ".lst", ".dict", ".csv", ".list"}
WORDLIST_COMPRESSED = {".gz", ".zip", ".bz2", ".xz"}

MAX_UPLOAD_SIZE = 500 * 1024 * 1024  # 500 MB
TEMP_DIR = DATA_DIR / "tmp"
TEMP_DIR.mkdir(parents=True, exist_ok=True)
