import hashlib
import hmac
import time
import itertools
import string
import os
import re
import threading
from concurrent.futures import ThreadPoolExecutor
from typing import Optional, Callable

_WORKER_COUNT = max(2, os.cpu_count() or 4)

# ──────────────────────────────────────────────
#  Inline rainbow table: top common passwords
# ──────────────────────────────────────────────
COMMON_PASSWORDS = [
    # Top 100 most common
    "password","password1","123456","12345678","123456789","1234567890",
    "qwerty","abc123","monkey","1234567","letmein","trustno1","dragon",
    "master","hello","login","welcome","admin","pass","test","111111",
    "696969","shadow","superman","michael","football","baseball","batman",
    "access","iloveyou","1q2w3e4r","qazwsx","zxcvbn","princess","sunshine",
    "passw0rd","password123","Password1","Password123","P@ssw0rd","P@ssword1",
    "secret","root","toor","system","user","guest","default","service",
    "computer","internet","hunter2","solo","starwars","thomas","tigger",
    "jordan","harley","ranger","daniel","andrew","andrea","jessica","joshua",
    "charlie","george","robert","david","james","joseph",
    "john","william","richard","christopher","mark","ryan","donald","matthew",
    "nicholas","tyler","anthony","steven","jacob","eric",
    # Numeric patterns
    "1111","2222","3333","4444","5555","6666","7777","8888","9999","0000",
    "1234","4321","12345","54321","11111","22222","33333","44444","55555",
    "123123","321321","112233","121212","131313","654321","000000",
    "99999","123321","666666","111222","7654321","87654321",
    "999999","101010","010101","246810","13579","159753","147258",
    "999999999","123654","789456","456789","147852","852147","963852",
    "0123456789","1029384756","0987654321","9876543210","987654321",
    # Keyboard patterns
    "abc","abcd","abcdef","abcdefg","abcdefgh","abcdefghi","abcdefghij",
    "qwer","qwert","qwerty","qwertyu","qwertyui","qwertyuio","qwertyuiop",
    "asdf","asdfg","asdfgh","asdfghj","asdfghjk","asdfghjkl",
    "zxcv","zxcvb","zxcvbn","zxcvbnm",
    "azerty","dvorak","colemak","qazwsxedc","1qaz2wsx3edc",
    "zaq1zaq1","zaq12wsx","qaz123","wsx123","asd123",
    # Common words
    "monkey","dragon","baseball","football","soccer","hockey","golf",
    "apple","google","facebook","twitter","amazon","netflix","spotify",
    "iphone","android","windows","linux","ubuntu","debian","centos",
    "summer","winter","spring","autumn","january","february","march",
    "love","hate","life","game","fun","cool","sexy","dark","light",
    "blue","red","green","black","white","yellow","orange","purple",
    "dog","cat","fish","bird","horse","tiger","lion","bear","wolf",
    "coffee","pizza","burger","cheese","bread","water","milk","beer","wine",
    # Common with numbers
    "hello123","welcome1","admin123","root123","test123","user123",
    "pass123","pass1234","pass12345","password1!","Password1!",
    "qwerty123","qwerty1234","abc1234","12345abc","a123456","1234abc",
    "admin1","admin12","admin1234","root1234","test1234","user1234",
    "master1","master123","login1","login123","welcome123","welcome12",
    "hello1","hello12","hello1234","monkey1","monkey123","dragon1","dragon123",
    "shadow1","shadow123","michael1","michael123","jordan1","jordan23",
    "charlie1","charlie123","letmein1","letmein123","access1","access123",
    "superman1","batman1","batman123","football1","baseball1",
    # Pop culture / names
    "ninja","samurai","pirate","wizard","knight","hunter","warrior",
    "matrix","hacker","cyber","crypto","phantom","ghost",
    "killer","danger","death","blood","fire","earth","wind",
    "spiderman","ironman","captain","wolverine",
    "jedi","sith","darth","vader","yoda","luke","leia",
    "gandalf","frodo","aragorn","legolas","hobbit","magic",
    "butterfly","flower","rainbow","unicorn","queen","king",
    # Days/Months
    "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday",
    "January","February","March","April","May","June","July","August",
    "September","October","November","December",
    "monday","tuesday","wednesday","thursday","friday","saturday","sunday",
    # Common IT/admin
    "Sex","Sex123","Admin","Admin1","Admin123",
    "changeme","change","temp","temporary","testing","testtest",
    "backup","manager","oracle","cisco","router","switch",
    "server","database","demo","public","private","staff",
    "support","helpdesk","operator","monitor","nagios","zabbix",
    "tomcat","apache","nginx","mysql","postgres","redis",
    "vagrant","ansible","docker","kubernetes","jenkins","gitlab",
    # Keyboard combos
    "1qaz2wsx","1qaz!QAZ","!QAZ2wsx","1QAZ2WSX",
    "q1w2e3r4","q1w2e3","1q2w3e","zaq1xsw2",
    "!@#$%","!@#$%^","!@#$%^&*","qwerty!@#",
    # Leet/special variants
    "p@ssword","p@ssw0rd","p@55word","p455word","passw@rd",
    "P@$$w0rd","P@$$word","Pa$$word","Pa$$w0rd",
    "p@ss","p@ss123","p@ssw0rd123","Adm1n","adm1n","r00t",
    "t3st","gu3st","us3r","s3cret","s3cur1ty",
    # Vehicles
    "mustang","corvette","porsche","ferrari","lamborghini","bugatti",
    "mercedes","toyota","honda","nissan","subaru","mazda","bmw",
    # Extra common from breach databases
    "abc123456","trustno1","letmein1","whatever","qwerty1",
    "freedom","7777777","fuckme","fuckyou","ashley","bailey",
    "passpass","buster","hunter","soccer","master1","diamond",
    "ginger","cookie","silver","pepper","crystal","yankee",
    "thunder","junior","maggie","smokey","peanut","scooter",
    "hammer","jackson","dallas","austin","boston","phoenix",
    "paradise","money","amateur","banana","victoria","alexander",
    "elizabeth","jennifer","michelle","samantha","stephanie","patricia",
    "chocolate","butterfly123","sunshine1","princess1","password12",
    "iloveyou1","iloveyou2","trustme","fuckyou1","whatever1",
    "nothing","biteme","rockyou","lovely","cheese1",
    "pokemon","starcraft","warcraft","minecraft","roblox","fortnite",
    "eminem","metallica","slipknot","acdc","nirvana","greenday",
    "barcelona","arsenal","chelsea","liverpool","juventus","realmadrid",
    "ronaldo","messi","neymar","lebron","kobe","jordan",
    "password!","password?","password.","password#","password@",
    "admin!","admin@","admin#","root!","root@","root#",
    "Pa55w0rd","Passw0rd!","Password!","Welcome1","Welcome1!",
    "Qwerty123","Abc123!","Test1234","Temp1234","Change1",
]

# ──────────────────────────────────────────────
#  Fast hash builders (pre-bind algo for inner loops)
# ──────────────────────────────────────────────

def _make_fast_hasher(hash_type: str):
    """Return a (word -> hex_digest) function optimized for the given hash_type."""
    algo_map = {"sha3-256": "sha3_256", "sha3-512": "sha3_512"}
    if hash_type in ("ntlm", "md4", "lm"):
        def _h(word):
            return hashlib.new("md4", word.encode("utf-16-le")).hexdigest()
        return _h
    elif hash_type == "mysql323":
        def _h(word):
            nr, nr2, add = 1345345333, 0x12345671, 7
            for c in word:
                if c in (" ", "\t"):
                    continue
                tmp = ord(c)
                nr ^= (((nr & 63) + add) * tmp) + ((nr << 8) & 0xFFFFFFFF)
                nr2 = (nr2 + ((nr2 << 8) ^ nr)) & 0xFFFFFFFF
                add = (add + tmp) & 0xFFFFFFFF
            return "%08x%08x" % (nr & 0x7FFFFFFF, nr2 & 0x7FFFFFFF)
        return _h
    elif hash_type == "bcrypt":
        return None  # bcrypt uses verify, not computed hash
    elif hash_type in ("md5crypt", "sha512crypt", "sha256crypt"):
        return None  # passlib verify
    else:
        algo = algo_map.get(hash_type, hash_type)
        try:
            hashlib.new(algo, b"test")
        except ValueError:
            return None
        def _h(word):
            return hashlib.new(algo, word.encode("utf-8", errors="ignore")).hexdigest()
        return _h

# ──────────────────────────────────────────────
#  Hash verification helpers
# ──────────────────────────────────────────────

def _hash_word(word: str, hash_type: str) -> Optional[str]:
    word_bytes = word.encode("utf-8", errors="ignore")
    try:
        if hash_type in ("md5", "sha1", "sha256", "sha512", "sha224", "sha384",
                         "sha3-256", "sha3-512", "ripemd160", "whirlpool"):
            algo_map = {
                "sha3-256": "sha3_256",
                "sha3-512": "sha3_512",
            }
            algo = algo_map.get(hash_type, hash_type)
            return hashlib.new(algo, word_bytes).hexdigest()
        elif hash_type in ("ntlm", "md4", "lm"):
            return hashlib.new("md4", word.encode("utf-16-le")).hexdigest()
        elif hash_type == "mysql323":
            nr = 1345345333
            nr2 = 0x12345671
            add = 7
            for c in word:
                if c in (" ", "\t"):
                    continue
                tmp = ord(c)
                nr ^= (((nr & 63) + add) * tmp) + ((nr << 8) & 0xFFFFFFFF)
                nr2 = (nr2 + ((nr2 << 8) ^ nr)) & 0xFFFFFFFF
                add = (add + tmp) & 0xFFFFFFFF
            return "%08x%08x" % (nr & 0x7FFFFFFF, nr2 & 0x7FFFFFFF)
    except Exception:
        return None
    return None

# ──────────────────────────────────────────────
#  Rainbow table: COMMON_PASSWORDS × rules × algos
# ──────────────────────────────────────────────

def _make_rainbow() -> dict:
    table = {}
    passwords = list(dict.fromkeys(COMMON_PASSWORDS))

    # Expand with common transformations for broad rainbow coverage
    _rainbow_rules = [
        lambda w: w.capitalize(),
        lambda w: w.upper(),
        lambda w: w.lower(),
        lambda w: w + "1",
        lambda w: w + "2",
        lambda w: w + "3",
        lambda w: w + "7",
        lambda w: w + "12",
        lambda w: w + "21",
        lambda w: w + "69",
        lambda w: w + "99",
        lambda w: w + "123",
        lambda w: w + "1234",
        lambda w: w + "12345",
        lambda w: w + "666",
        lambda w: w + "777",
        lambda w: w + "007",
        lambda w: w + "!",
        lambda w: w + "@",
        lambda w: w + "#",
        lambda w: w + "$",
        lambda w: w + ".",
        lambda w: w + "?",
        lambda w: w + "*",
        lambda w: w + "!!",
        lambda w: w + "1!",
        lambda w: w + "!1",
        lambda w: w + "2024",
        lambda w: w + "2023",
        lambda w: w + "2022",
        lambda w: w + "2021",
        lambda w: w + "2020",
        lambda w: w + "00",
        lambda w: w + "01",
        lambda w: w + "10",
        lambda w: w[0].upper() + w[1:] + "1" if len(w) > 1 else w + "1",
        lambda w: w[0].upper() + w[1:] + "!" if len(w) > 1 else w + "!",
        lambda w: w[0].upper() + w[1:] + "123" if len(w) > 1 else w + "123",
        lambda w: w[0].upper() + w[1:] + "12" if len(w) > 1 else w + "12",
        lambda w: w[0].upper() + w[1:] + "1!" if len(w) > 1 else w + "1!",
        lambda w: w[0].upper() + w[1:] + "2024" if len(w) > 1 else w + "2024",
        lambda w: w.replace("a", "@").replace("e", "3").replace("i", "1").replace("o", "0"),
        lambda w: w.replace("a", "4").replace("e", "3").replace("o", "0").replace("s", "5"),
        lambda w: w.replace("a", "@").replace("s", "$"),
        lambda w: w.replace("o", "0").replace("l", "1"),
        lambda w: w[::-1],
        lambda w: w * 2 if len(w) <= 6 else w,
    ]

    all_candidates = set(passwords)
    for pw in passwords:
        for rule in _rainbow_rules:
            try:
                v = rule(pw)
                if v:
                    all_candidates.add(v)
            except Exception:
                pass

    for pw in all_candidates:
        pw_bytes = pw.encode("utf-8")
        for algo in ("md5", "sha1", "sha256", "sha512", "sha224", "sha384"):
            h = hashlib.new(algo, pw_bytes).hexdigest()
            if h not in table:
                table[h] = (pw, algo)
        for algo, name in (("sha3_256", "sha3-256"), ("sha3_512", "sha3-512")):
            try:
                h = hashlib.new(algo, pw_bytes).hexdigest()
                if h not in table:
                    table[h] = (pw, name)
            except Exception:
                pass
        for algo in ("ripemd160", "whirlpool"):
            try:
                h = hashlib.new(algo, pw_bytes).hexdigest()
                if h not in table:
                    table[h] = (pw, algo)
            except Exception:
                pass
        try:
            ntlm = hashlib.new("md4", pw.encode("utf-16-le")).hexdigest()
            if ntlm not in table:
                table[ntlm] = (pw, "ntlm")
        except Exception:
            pass
        mh = _hash_word(pw, "mysql323")
        if mh and mh not in table:
            table[mh] = (pw, "mysql323")
    return table

RAINBOW_TABLE: dict = _make_rainbow()

def _verify_bcrypt(word: str, hash_value: str) -> bool:
    try:
        import bcrypt
        return bcrypt.checkpw(word.encode("utf-8"), hash_value.encode("utf-8"))
    except Exception:
        return False

def _verify_md5crypt(word: str, hash_value: str) -> bool:
    try:
        from passlib.hash import md5_crypt
        return md5_crypt.verify(word, hash_value)
    except Exception:
        return False

def _verify_sha512crypt(word: str, hash_value: str) -> bool:
    try:
        from passlib.hash import sha512_crypt
        return sha512_crypt.verify(word, hash_value)
    except Exception:
        return False

def _verify_sha256crypt(word: str, hash_value: str) -> bool:
    try:
        from passlib.hash import sha256_crypt
        return sha256_crypt.verify(word, hash_value)
    except Exception:
        return False

def _verify_hash(word: str, hash_value: str, hash_type: str) -> bool:
    hv = hash_value.lower().strip()
    if hash_type == "bcrypt":
        return _verify_bcrypt(word, hash_value)
    if hash_type == "md5crypt":
        return _verify_md5crypt(word, hash_value)
    if hash_type == "sha512crypt":
        return _verify_sha512crypt(word, hash_value)
    if hash_type == "sha256crypt":
        return _verify_sha256crypt(word, hash_value)
    computed = _hash_word(word, hash_type)
    if computed is None:
        return False
    return computed.lower() == hv

# ──────────────────────────────────────────────
#  NTLMv1 / NTLMv2 (Net-NTLM) challenge-response
# ──────────────────────────────────────────────

_NTLMV2_RE = re.compile(
    r'^([^:]+)::([^:]*):([a-f0-9]+):([a-f0-9]{32}):([a-f0-9]+)$', re.IGNORECASE
)
_NTLMV1_RE = re.compile(
    r'^([^:]+)::([^:]*):([a-f0-9]{48}):([a-f0-9]{48}):([a-f0-9]{16})$', re.IGNORECASE
)

def _parse_ntlmv2(hash_string: str) -> Optional[dict]:
    """Parse NetNTLMv2: user::domain:server_challenge:nt_proof_str:blob"""
    m = _NTLMV2_RE.match(hash_string.strip())
    if not m:
        return None
    return {
        'username': m.group(1),
        'domain': m.group(2),
        'server_challenge': m.group(3),
        'nt_proof_str': m.group(4).lower(),
        'blob': m.group(5),
    }

def _parse_ntlmv1(hash_string: str) -> Optional[dict]:
    """Parse NetNTLMv1: user::domain:lm_response:ntlm_response:server_challenge"""
    m = _NTLMV1_RE.match(hash_string.strip())
    if not m:
        return None
    return {
        'username': m.group(1),
        'domain': m.group(2),
        'lm_response': m.group(3),
        'ntlm_response': m.group(4).lower(),
        'server_challenge': m.group(5),
    }

def _make_ntlmv2_verifier(parsed: dict):
    """Return a (word -> bool) closure for NTLMv2 verification."""
    identity = (parsed['username'].upper() + parsed['domain']).encode('utf-16-le')
    server_challenge = bytes.fromhex(parsed['server_challenge'])
    target_proof = parsed['nt_proof_str']
    blob = bytes.fromhex(parsed['blob'])
    challenge_blob = server_challenge + blob

    def verify(word: str) -> bool:
        nt_hash = hashlib.new('md4', word.encode('utf-16-le')).digest()
        ntlmv2_hash = hmac.new(nt_hash, identity, 'md5').digest()
        computed = hmac.new(ntlmv2_hash, challenge_blob, 'md5').hexdigest()
        return computed == target_proof
    return verify

def _des_expand_key(key_7: bytes) -> bytes:
    """Expand a 7-byte key to an 8-byte DES key with parity bits."""
    b = int.from_bytes(key_7, 'big')
    expanded = []
    for i in range(8):
        shift = 56 - i * 7
        val = ((b >> shift) & 0x7F) << 1
        expanded.append(val)
    return bytes(expanded)

def _ntlmv1_response(nt_hash: bytes, server_challenge: bytes) -> str:
    """Compute the 24-byte NTLM response for NTLMv1."""
    from Crypto.Cipher import DES
    # Pad NT hash to 21 bytes
    padded = nt_hash.ljust(21, b'\x00')
    result = b''
    for i in range(3):
        key_7 = padded[i * 7:(i + 1) * 7]
        des_key = _des_expand_key(key_7)
        cipher = DES.new(des_key, DES.MODE_ECB)
        result += cipher.encrypt(server_challenge)
    return result.hex()

def _make_ntlmv1_verifier(parsed: dict):
    """Return a (word -> bool) closure for NTLMv1 verification."""
    target_response = parsed['ntlm_response']
    server_challenge = bytes.fromhex(parsed['server_challenge'])

    def verify(word: str) -> bool:
        nt_hash = hashlib.new('md4', word.encode('utf-16-le')).digest()
        computed = _ntlmv1_response(nt_hash, server_challenge)
        return computed == target_response
    return verify

def _is_netntlm(hash_type: str) -> bool:
    """Check if the hash type is a challenge-response (NTLMv1/v2)."""
    return hash_type in ('ntlmv1', 'ntlmv2')

def _make_netntlm_verifier(hash_string: str, hash_type: str):
    """Parse and return a verifier for NTLMv1/v2 challenge-response hashes."""
    if hash_type == 'ntlmv2':
        parsed = _parse_ntlmv2(hash_string)
        if parsed:
            return _make_ntlmv2_verifier(parsed)
    elif hash_type == 'ntlmv1':
        parsed = _parse_ntlmv1(hash_string)
        if parsed:
            return _make_ntlmv1_verifier(parsed)
    return None

def _netntlm_attack(
    hash_string: str,
    hash_type: str,
    wordlist_path: Optional[str],
    strategies: list,
    stop_flag: Optional[list] = None,
    progress_cb: Optional[Callable] = None,
) -> Optional[dict]:
    """Crack a single NTLMv1/v2 hash through all strategies.
    progress_cb(phase, fraction) is called periodically with 0.0-1.0 overall progress."""
    verifier = _make_netntlm_verifier(hash_string, hash_type)
    if not verifier:
        return None

    start = time.perf_counter()
    check_interval = 2000

    # Count wordlist lines once for weight estimation and phase progress
    wl_lines = 0
    if wordlist_path:
        try:
            with open(wordlist_path, "rb") as f:
                wl_lines = sum(1 for _ in f)
        except Exception:
            pass

    # Estimate work per phase (candidate count) for proportional weights
    n_common = len(set(COMMON_PASSWORDS))
    n_rules = len(RULES)
    use_rules_global = any(s in strategies for s in ('rainbow', 'rules'))
    est_bruteforce = 111_111_111 + 12_356_630  # digits 1-8 + alpha 1-5

    phase_work = {}
    if any(s in strategies for s in ('rainbow', 'dictionary', 'rules', 'bruteforce')):
        phase_work['rainbow'] = n_common * (1 + n_rules) if use_rules_global else n_common
    if wordlist_path and 'dictionary' in strategies:
        phase_work['dictionary'] = max(1, wl_lines)
    if wordlist_path and 'rules' in strategies:
        phase_work['rules'] = max(1, wl_lines * n_rules)
    if 'bruteforce' in strategies:
        phase_work['bruteforce'] = est_bruteforce

    total_work = sum(phase_work.values()) or 1
    pw = {k: v / total_work for k, v in phase_work.items()}
    _base = [0.0]

    def _report(phase_name, fraction):
        if progress_cb:
            w = pw.get(phase_name, 0)
            overall = _base[0] + w * min(1.0, fraction)
            progress_cb(phase_name, min(1.0, overall))

    def _finish_phase(phase_name):
        _base[0] += pw.get(phase_name, 0)

    # 1. Common passwords (rainbow-equivalent)
    if any(s in strategies for s in ('rainbow', 'dictionary', 'rules', 'bruteforce')):
        passwords = list(dict.fromkeys(COMMON_PASSWORDS))
        total_pw = len(passwords)
        count = 0
        for pw_word in passwords:
            count += 1
            if count % 500 == 0:
                if stop_flag and stop_flag[0]:
                    return None
                _report('rainbow', count / total_pw)
            if verifier(pw_word):
                elapsed = (time.perf_counter() - start) * 1000
                return {"plaintext": pw_word, "strategy": "rainbow", "time_ms": round(elapsed, 3), "hash_type": hash_type}
            if use_rules_global:
                for rule in RULES:
                    try:
                        variant = rule(pw_word)
                        if variant and variant != pw_word and verifier(variant):
                            elapsed = (time.perf_counter() - start) * 1000
                            return {"plaintext": variant, "strategy": "rules", "time_ms": round(elapsed, 3), "hash_type": hash_type}
                    except Exception:
                        continue
        _report('rainbow', 1.0)
        _finish_phase('rainbow')

    # 2. Dictionary with wordlist file
    if wordlist_path and 'dictionary' in strategies:
        count = 0
        total_lines = max(1, wl_lines)
        try:
            with open(wordlist_path, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    count += 1
                    if count % check_interval == 0:
                        if stop_flag and stop_flag[0]:
                            return None
                        _report('dictionary', count / total_lines)
                    word = line.rstrip("\n\r")
                    if not word:
                        continue
                    if verifier(word):
                        elapsed = (time.perf_counter() - start) * 1000
                        return {"plaintext": word, "strategy": "dictionary", "time_ms": round(elapsed, 3), "hash_type": hash_type}
        except Exception:
            pass
        _report('dictionary', 1.0)
        _finish_phase('dictionary')

    # 3. Rules with wordlist file
    if wordlist_path and 'rules' in strategies:
        count = 0
        total_lines = max(1, wl_lines)
        try:
            with open(wordlist_path, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    count += 1
                    if count % check_interval == 0:
                        if stop_flag and stop_flag[0]:
                            return None
                        _report('rules', count / total_lines)
                    base = line.rstrip("\n\r")
                    if not base:
                        continue
                    for rule in RULES:
                        try:
                            variant = rule(base)
                            if variant and verifier(variant):
                                elapsed = (time.perf_counter() - start) * 1000
                                return {"plaintext": variant, "strategy": "rules", "time_ms": round(elapsed, 3), "hash_type": hash_type}
                        except Exception:
                            continue
        except Exception:
            pass
        _report('rules', 1.0)
        _finish_phase('rules')

    # 4. Brute-force
    if 'bruteforce' in strategies:
        count = 0
        # Digits up to 8
        for length in range(1, 9):
            for combo in itertools.product(string.digits, repeat=length):
                count += 1
                if count % 10000 == 0:
                    if stop_flag and stop_flag[0]:
                        return None
                    _report('bruteforce', count / est_bruteforce)
                word = "".join(combo)
                if verifier(word):
                    elapsed = (time.perf_counter() - start) * 1000
                    return {"plaintext": word, "strategy": "bruteforce", "time_ms": round(elapsed, 3), "hash_type": hash_type}
        # Lowercase alpha up to 5
        for length in range(1, 6):
            for combo in itertools.product(string.ascii_lowercase, repeat=length):
                count += 1
                if count % 10000 == 0:
                    if stop_flag and stop_flag[0]:
                        return None
                    _report('bruteforce', count / est_bruteforce)
                word = "".join(combo)
                if verifier(word):
                    elapsed = (time.perf_counter() - start) * 1000
                    return {"plaintext": word, "strategy": "bruteforce", "time_ms": round(elapsed, 3), "hash_type": hash_type}

    return None

# ──────────────────────────────────────────────
#  Rule transformations
# ──────────────────────────────────────────────

RULES = [
    lambda w: w,
    lambda w: w.capitalize(),
    lambda w: w.upper(),
    lambda w: w.lower(),
    lambda w: w.swapcase(),
    # Append digits
    lambda w: w + "1",
    lambda w: w + "2",
    lambda w: w + "3",
    lambda w: w + "7",
    lambda w: w + "12",
    lambda w: w + "13",
    lambda w: w + "21",
    lambda w: w + "69",
    lambda w: w + "99",
    lambda w: w + "123",
    lambda w: w + "1234",
    lambda w: w + "12345",
    lambda w: w + "666",
    lambda w: w + "777",
    lambda w: w + "007",
    # Append symbols
    lambda w: w + "!",
    lambda w: w + "@",
    lambda w: w + "#",
    lambda w: w + "$",
    lambda w: w + ".",
    lambda w: w + "?",
    lambda w: w + "*",
    lambda w: w + "!!",
    lambda w: w + "!?",
    lambda w: w + "1!",
    lambda w: w + "!1",
    lambda w: w + "@1",
    lambda w: w + "#1",
    # Years
    lambda w: w + "2024",
    lambda w: w + "2023",
    lambda w: w + "2022",
    lambda w: w + "2021",
    lambda w: w + "2020",
    lambda w: w + "2019",
    lambda w: w + "2018",
    # Prepend
    lambda w: "1" + w,
    lambda w: "!" + w,
    lambda w: "123" + w,
    lambda w: "@" + w,
    # Capitalize + suffix
    lambda w: w[0].upper() + w[1:] + "1" if len(w) > 1 else w + "1",
    lambda w: w[0].upper() + w[1:] + "!" if len(w) > 1 else w + "!",
    lambda w: w[0].upper() + w[1:] + "123" if len(w) > 1 else w + "123",
    lambda w: w[0].upper() + w[1:] + "12" if len(w) > 1 else w + "12",
    lambda w: w[0].upper() + w[1:] + "1!" if len(w) > 1 else w + "1!",
    lambda w: w[0].upper() + w[1:] + "@1" if len(w) > 1 else w + "@1",
    lambda w: w[0].upper() + w[1:] + "2024" if len(w) > 1 else w + "2024",
    lambda w: w[0].upper() + w[1:] + "2023" if len(w) > 1 else w + "2023",
    lambda w: w.capitalize() + "!",
    lambda w: w.capitalize() + "@",
    lambda w: w.capitalize() + "#",
    lambda w: w.capitalize() + "123",
    lambda w: w.capitalize() + "1!",
    lambda w: w.capitalize() + "!1",
    lambda w: w.capitalize() + "2024!",
    # Leet speak
    lambda w: w.replace("a", "@").replace("e", "3").replace("i", "1").replace("o", "0"),
    lambda w: w.replace("a", "4").replace("e", "3").replace("o", "0").replace("s", "5"),
    lambda w: w.replace("a", "@").replace("s", "$"),
    lambda w: w.replace("e", "3").replace("a", "@").replace("o", "0").replace("i", "!"),
    lambda w: w.replace("a", "@").replace("e", "3"),
    lambda w: w.replace("o", "0").replace("l", "1"),
    # Structural
    lambda w: w + "00",
    lambda w: w + "01",
    lambda w: w + "10",
    lambda w: w[::-1],
    lambda w: w * 2 if len(w) <= 6 else w,
    lambda w: w + w[0] if w else w,
    lambda w: w + w[-1] if w else w,
    # Toggle first char case
    lambda w: w[0].swapcase() + w[1:] if len(w) > 1 else w.swapcase(),
]

# ──────────────────────────────────────────────
#  Main cracking functions
# ──────────────────────────────────────────────

def rainbow_lookup(hash_value: str) -> Optional[tuple]:
    return RAINBOW_TABLE.get(hash_value.lower().strip())

def dictionary_attack(
    hash_value: str,
    hash_types: list,
    wordlist_path: str,
    progress_cb: Optional[Callable] = None,
    stop_flag: Optional[list] = None,
) -> Optional[tuple]:
    h = hash_value.lower().strip()
    # Pre-bind hash functions for speed
    hashers = [(ht, _make_fast_hasher(ht)) for ht in hash_types]
    hashers = [(ht, fn) for ht, fn in hashers if fn is not None]
    if not hashers:
        return None
    count = 0
    check_interval = 5000
    with open(wordlist_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            count += 1
            if count % check_interval == 0:
                if stop_flag and stop_flag[0]:
                    return None
                if progress_cb:
                    progress_cb(count)
            word = line.rstrip("\n\r")
            if not word:
                continue
            for ht, fn in hashers:
                if fn(word) == h:
                    return (word, ht)
    return None

def rules_attack(
    hash_value: str,
    hash_types: list,
    wordlist_path: str,
    progress_cb: Optional[Callable] = None,
    stop_flag: Optional[list] = None,
) -> Optional[tuple]:
    h = hash_value.lower().strip()
    hashers = [(ht, _make_fast_hasher(ht)) for ht in hash_types]
    hashers = [(ht, fn) for ht, fn in hashers if fn is not None]
    if not hashers:
        return None
    count = 0
    check_interval = 2000
    with open(wordlist_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            count += 1
            if count % check_interval == 0:
                if stop_flag and stop_flag[0]:
                    return None
                if progress_cb:
                    progress_cb(count)
            base = line.rstrip("\n\r")
            if not base:
                continue
            for rule in RULES:
                try:
                    variant = rule(base)
                    if variant:
                        for ht, fn in hashers:
                            if fn(variant) == h:
                                return (variant, ht)
                except Exception:
                    continue
    return None

def _builtin_attack(
    hash_value: str,
    hash_types: list,
    use_rules: bool = True,
    stop_flag: Optional[list] = None,
) -> Optional[tuple]:
    """Try COMMON_PASSWORDS (+ rules) against the hash in-memory."""
    h = hash_value.lower().strip()
    hashers = [(ht, _make_fast_hasher(ht)) for ht in hash_types]
    hashers = [(ht, fn) for ht, fn in hashers if fn is not None]
    if not hashers:
        return None
    passwords = list(dict.fromkeys(COMMON_PASSWORDS))
    count = 0
    for pw in passwords:
        count += 1
        if count % 500 == 0 and stop_flag and stop_flag[0]:
            return None
        for ht, fn in hashers:
            if fn(pw) == h:
                return (pw, ht, "dictionary")
        if use_rules:
            for rule in RULES:
                try:
                    variant = rule(pw)
                    if variant and variant != pw:
                        for ht, fn in hashers:
                            if fn(variant) == h:
                                return (variant, ht, "rules")
                except Exception:
                    continue
    return None

def _bruteforce_attack(
    hash_value: str,
    hash_types: list,
    max_length: int = 8,
    stop_flag: Optional[list] = None,
) -> Optional[tuple]:
    """Brute-force passwords: digits up to 8, alpha up to 6, alphanumeric up to 5."""
    h = hash_value.lower().strip()
    hashers = [(ht, _make_fast_hasher(ht)) for ht in hash_types]
    hashers = [(ht, fn) for ht, fn in hashers if fn is not None]
    if not hashers:
        return None
    count = 0
    check_interval = 10000
    # Phase 1: all-digit passwords 1-8 chars
    for length in range(1, min(max_length + 1, 9)):
        for combo in itertools.product(string.digits, repeat=length):
            count += 1
            if count % check_interval == 0 and stop_flag and stop_flag[0]:
                return None
            word = "".join(combo)
            for ht, fn in hashers:
                if fn(word) == h:
                    return (word, ht)
    # Phase 2: lowercase alpha 1-6 chars
    for length in range(1, min(max_length + 1, 7)):
        for combo in itertools.product(string.ascii_lowercase, repeat=length):
            count += 1
            if count % check_interval == 0 and stop_flag and stop_flag[0]:
                return None
            word = "".join(combo)
            for ht, fn in hashers:
                if fn(word) == h:
                    return (word, ht)
    # Phase 3: uppercase alpha 1-4 chars
    for length in range(1, min(max_length + 1, 5)):
        for combo in itertools.product(string.ascii_uppercase, repeat=length):
            count += 1
            if count % check_interval == 0 and stop_flag and stop_flag[0]:
                return None
            word = "".join(combo)
            for ht, fn in hashers:
                if fn(word) == h:
                    return (word, ht)
    # Phase 4: alphanumeric (lower + digits) 1-5 chars
    alnum = string.ascii_lowercase + string.digits
    for length in range(1, min(max_length + 1, 6)):
        for combo in itertools.product(alnum, repeat=length):
            count += 1
            if count % check_interval == 0 and stop_flag and stop_flag[0]:
                return None
            word = "".join(combo)
            for ht, fn in hashers:
                if fn(word) == h:
                    return (word, ht)
    return None

def crack_single(
    hash_value: str,
    hash_type: str,
    strategies: list,
    wordlist_path: Optional[str],
    stop_flag: Optional[list] = None,
    variants: Optional[list] = None,
) -> dict:
    start = time.perf_counter()
    h = hash_value.strip()
    types_to_try = variants if variants else [hash_type]

    # Handle NTLMv1/v2 challenge-response hashes via dedicated pipeline
    if _is_netntlm(hash_type):
        result = _netntlm_attack(h, hash_type, wordlist_path, strategies, stop_flag)
        return result if result else {}

    # 1. Rainbow lookup (instant)
    if "rainbow" in strategies:
        result = rainbow_lookup(h)
        if result:
            elapsed = (time.perf_counter() - start) * 1000
            return {"plaintext": result[0], "strategy": "rainbow", "time_ms": round(elapsed, 3), "hash_type": result[1]}

    # 2. Dictionary with wordlist file
    if wordlist_path and "dictionary" in strategies:
        result = dictionary_attack(h, types_to_try, wordlist_path, stop_flag=stop_flag)
        if result:
            elapsed = (time.perf_counter() - start) * 1000
            return {"plaintext": result[0], "strategy": "dictionary", "time_ms": round(elapsed, 3), "hash_type": result[1]}

    # 3. Rules with wordlist file
    if wordlist_path and "rules" in strategies:
        result = rules_attack(h, types_to_try, wordlist_path, stop_flag=stop_flag)
        if result:
            elapsed = (time.perf_counter() - start) * 1000
            return {"plaintext": result[0], "strategy": "rules", "time_ms": round(elapsed, 3), "hash_type": result[1]}

    # 4. Built-in attack: COMMON_PASSWORDS + rules (fallback — always runs if any strategy active)
    if any(s in strategies for s in ("rainbow", "dictionary", "rules", "bruteforce")):
        use_rules = any(s in strategies for s in ("rainbow", "rules"))
        result = _builtin_attack(h, types_to_try, use_rules, stop_flag=stop_flag)
        if result:
            elapsed = (time.perf_counter() - start) * 1000
            strategy_label = result[2]
            if "rainbow" in strategies and "dictionary" not in strategies and "rules" not in strategies:
                strategy_label = "rainbow"
            return {"plaintext": result[0], "strategy": strategy_label, "time_ms": round(elapsed, 3), "hash_type": result[1]}

    # 5. Brute-force short passwords
    if "bruteforce" in strategies:
        result = _bruteforce_attack(h, types_to_try, max_length=8, stop_flag=stop_flag)
        if result:
            elapsed = (time.perf_counter() - start) * 1000
            return {"plaintext": result[0], "strategy": "bruteforce", "time_ms": round(elapsed, 3), "hash_type": result[1]}

    return {}


# ──────────────────────────────────────────────
#  Batch crack: process multiple hashes in one wordlist pass
# ──────────────────────────────────────────────

def crack_batch(
    hash_entries: list,
    strategies: list,
    wordlist_path: Optional[str],
    stop_flag: Optional[list] = None,
    on_cracked: Optional[Callable] = None,
    progress: Optional[dict] = None,
):
    """Crack multiple hashes efficiently with multi-threaded wordlist processing.
    hash_entries = [(hash_value, hash_type, variants), ...].
    Calls on_cracked(index, result_dict) for each cracked hash.
    progress dict is updated in-place with phase/phase_progress for live tracking.
    Returns dict of {index: result_dict}."""
    results = {}
    remaining = {}  # index -> (hash_lower, raw, types)
    starts = {}

    for i, (hv, ht, variants) in enumerate(hash_entries):
        h = hv.strip().lower()
        types = variants if variants else [ht]
        remaining[i] = (h, hv.strip(), types)
        starts[i] = time.perf_counter()

    # Identify netntlm hashes upfront (needed for weight calculation)
    netntlm_indices = [i for i, (h, raw, types) in remaining.items() if any(_is_netntlm(t) for t in types)]
    n_regular = len(remaining) - len(netntlm_indices)

    # Count wordlist lines once for work estimation
    wl_lines = 0
    if wordlist_path:
        try:
            with open(wordlist_path, "rb") as f:
                wl_lines = sum(1 for _ in f)
        except Exception:
            pass

    # Estimate work per phase (candidate count) for proportional progress weights
    n_common = len(set(COMMON_PASSWORDS))
    n_rules = len(RULES)
    est_bruteforce_single = 111_111_111 + 12_356_630 + 456_976 + 60_466_176  # digits8+alpha5+ALPHA4+alnum5

    phase_work = {}
    if netntlm_indices:
        # NetNTLM pipeline work: common_passwords×rules + wordlist + wordlist×rules + bruteforce
        ntlm_work_per_hash = n_common * (1 + n_rules) + wl_lines + wl_lines * n_rules + est_bruteforce_single
        phase_work["netntlm"] = len(netntlm_indices) * ntlm_work_per_hash
    if "rainbow" in strategies and n_regular > 0:
        phase_work["rainbow"] = 1  # instant table lookup
    if wordlist_path and "dictionary" in strategies and n_regular > 0:
        phase_work["dictionary"] = max(1, wl_lines)
    if wordlist_path and "rules" in strategies and n_regular > 0:
        phase_work["rules"] = max(1, wl_lines * n_rules)
    if any(s in strategies for s in ("rainbow", "dictionary", "rules", "bruteforce")) and n_regular > 0:
        phase_work["builtin"] = max(1, n_common * (1 + n_rules) * n_regular)
    if "bruteforce" in strategies and n_regular > 0:
        phase_work["bruteforce"] = est_bruteforce_single * max(1, n_regular)

    total_work = sum(phase_work.values()) or 1
    phase_weights = {k: v / total_work for k, v in phase_work.items()}
    _base = [0.0]  # cumulative completed phase weight

    def _update_progress(phase, phase_frac=0.0):
        if progress is not None:
            if phase == "done":
                progress["phase"] = "done"
                progress["phase_progress"] = 1.0
            else:
                w = phase_weights.get(phase, 0)
                overall = _base[0] + w * min(1.0, phase_frac)
                progress["phase"] = phase
                progress["phase_progress"] = min(1.0, overall)
            progress["cracked"] = len(results)

    def _finish_phase(phase):
        _base[0] += phase_weights.get(phase, 0)

    _update_progress("rainbow", 0.0)

    # 0. Handle NTLMv1/v2 challenge-response hashes via dedicated pipeline
    if netntlm_indices:
        _update_progress("netntlm", 0.0)
        n_total = len(netntlm_indices)
        for ci, i in enumerate(netntlm_indices):
            if stop_flag and stop_flag[0]:
                break
            h, raw, types = remaining[i]
            ht = next((t for t in types if _is_netntlm(t)), types[0])

            def _ntlm_progress_cb(phase_name, fraction, _ci=ci):
                # Map per-hash progress into global progress: each hash gets 1/n_total slice
                overall = (_ci + fraction) / n_total
                _update_progress("netntlm", overall)

            r = _netntlm_attack(raw, ht, wordlist_path, strategies, stop_flag, progress_cb=_ntlm_progress_cb)
            if r:
                results[i] = r
                if on_cracked:
                    on_cracked(i, r)
            del remaining[i]
        _finish_phase("netntlm")
        _update_progress("netntlm", 0.0)  # flush final value

    if not remaining:
        _update_progress("done", 1.0)
        return results

    # 1. Rainbow lookup (instant, per hash)
    if "rainbow" in strategies:
        found = []
        for i, (h, raw, types) in remaining.items():
            r = rainbow_lookup(raw)
            if r:
                elapsed = (time.perf_counter() - starts[i]) * 1000
                result = {"plaintext": r[0], "strategy": "rainbow", "time_ms": round(elapsed, 3), "hash_type": r[1]}
                results[i] = result
                found.append(i)
                if on_cracked:
                    on_cracked(i, result)
        for i in found:
            del remaining[i]
    _finish_phase("rainbow")

    if not remaining:
        _update_progress("done", 1.0)
        return results

    # 2+3. Dictionary + Rules: multi-threaded wordlist processing
    if wordlist_path and remaining:
        # Build target set per hash_type: hash_lower -> index
        target_map = {}  # ht -> [(index, hash_lower, hasher_fn)]
        for i, (h, raw, types) in remaining.items():
            for ht in types:
                fn = _make_fast_hasher(ht)
                if fn:
                    target_map.setdefault(ht, []).append((i, h, fn))

        use_dict = "dictionary" in strategies
        use_rules = "rules" in strategies

        if (use_dict or use_rules) and target_map:
            type_targets = []
            for ht, entries in target_map.items():
                fn = entries[0][2]
                hash_set = {e[1]: e[0] for e in entries}  # hash_lower -> index
                type_targets.append((ht, fn, hash_set))

            # Read entire wordlist into memory for parallel chunk processing
            try:
                with open(wordlist_path, "r", encoding="utf-8", errors="ignore") as f:
                    lines = f.readlines()
            except Exception:
                lines = []

            if lines:
                found_lock = threading.Lock()
                found_indices = set()
                all_found_event = threading.Event()
                total_remaining = len(remaining)
                total_lines = len(lines)
                # Shared line counter for progress tracking
                _lines_done = [0]
                _progress_lock = threading.Lock()

                def _tick_progress(local_count, phase_name):
                    """Update shared progress counter every 1000 lines."""
                    if local_count % 1000 == 0:
                        with _progress_lock:
                            _lines_done[0] += 1000
                        _update_progress(phase_name, min(1.0, _lines_done[0] / total_lines))

                def _flush_progress(local_count, phase_name):
                    """Flush remaining line count at end of chunk."""
                    leftover = local_count % 1000
                    if leftover:
                        with _progress_lock:
                            _lines_done[0] += leftover
                        _update_progress(phase_name, min(1.0, _lines_done[0] / total_lines))

                def _process_chunk_dict(chunk):
                    """Process a chunk of wordlist lines for dictionary attack."""
                    local_results = []
                    local_count = 0
                    for raw_line in chunk:
                        if all_found_event.is_set() or (stop_flag and stop_flag[0]):
                            break
                        local_count += 1
                        _tick_progress(local_count, "dictionary")
                        word = raw_line.rstrip("\n\r")
                        if not word:
                            continue
                        for ht, fn, hash_set in type_targets:
                            computed = fn(word)
                            with found_lock:
                                idx = hash_set.get(computed)
                                if idx is not None and idx not in found_indices:
                                    found_indices.add(idx)
                                    elapsed = (time.perf_counter() - starts[idx]) * 1000
                                    local_results.append((idx, ht, word, "dictionary", elapsed))
                                    del hash_set[computed]
                                    if len(found_indices) >= total_remaining:
                                        all_found_event.set()
                    _flush_progress(local_count, "dictionary")
                    return local_results

                def _process_chunk_rules(chunk):
                    """Process a chunk of wordlist lines for rules attack."""
                    local_results = []
                    local_count = 0
                    for raw_line in chunk:
                        if all_found_event.is_set() or (stop_flag and stop_flag[0]):
                            break
                        local_count += 1
                        _tick_progress(local_count, "rules")
                        base = raw_line.rstrip("\n\r")
                        if not base:
                            continue
                        for rule in RULES:
                            if all_found_event.is_set():
                                break
                            try:
                                variant = rule(base)
                                if not variant:
                                    continue
                            except Exception:
                                continue
                            for ht, fn, hash_set in type_targets:
                                computed = fn(variant)
                                with found_lock:
                                    idx = hash_set.get(computed)
                                    if idx is not None and idx not in found_indices:
                                        found_indices.add(idx)
                                        elapsed = (time.perf_counter() - starts[idx]) * 1000
                                        local_results.append((idx, ht, variant, "rules", elapsed))
                                        del hash_set[computed]
                                        if len(found_indices) >= total_remaining:
                                            all_found_event.set()
                    _flush_progress(local_count, "rules")
                    return local_results

                # Split lines into chunks for parallel processing
                n_workers = _WORKER_COUNT
                chunk_size = max(1, len(lines) // n_workers)
                chunks = [lines[i:i + chunk_size] for i in range(0, len(lines), chunk_size)]

                # Dictionary pass (multi-threaded)
                if use_dict:
                    _update_progress("dictionary", 0.0)
                    _lines_done[0] = 0
                    with ThreadPoolExecutor(max_workers=n_workers) as pool:
                        futures = [pool.submit(_process_chunk_dict, c) for c in chunks]
                        for fut in futures:
                            for idx, ht, word, strategy, elapsed in fut.result():
                                result = {"plaintext": word, "strategy": strategy, "time_ms": round(elapsed, 3), "hash_type": ht}
                                results[idx] = result
                                if on_cracked:
                                    on_cracked(idx, result)
                    _finish_phase("dictionary")

                # Rules pass (multi-threaded) — only for still-unfound hashes
                if use_rules and len(found_indices) < total_remaining:
                    _update_progress("rules", 0.0)
                    _lines_done[0] = 0
                    all_found_event.clear()
                    with ThreadPoolExecutor(max_workers=n_workers) as pool:
                        futures = [pool.submit(_process_chunk_rules, c) for c in chunks]
                        for fut in futures:
                            for idx, ht, word, strategy, elapsed in fut.result():
                                result = {"plaintext": word, "strategy": strategy, "time_ms": round(elapsed, 3), "hash_type": ht}
                                results[idx] = result
                                if on_cracked:
                                    on_cracked(idx, result)
                    _finish_phase("rules")

            for i in found_indices:
                if i in remaining:
                    del remaining[i]

    if not remaining:
        _update_progress("done", 1.0)
        return results

    # 4+5. Builtin + Bruteforce: per-hash (these don't benefit from single-pass)
    remaining_list = list(remaining.items())
    n_rem = max(1, len(remaining_list))
    # Combined weight for both per-hash phases
    _combined_w = phase_weights.get("builtin", 0) + phase_weights.get("bruteforce", 0)

    for ci, (i, (h, raw, types)) in enumerate(remaining_list):
        if stop_flag and stop_flag[0]:
            break

        # Report per-hash progress across combined builtin+bruteforce weight
        def _per_hash_progress(phase_name, frac_within_hash):
            if progress is not None:
                overall = _base[0] + _combined_w * (ci + frac_within_hash) / n_rem
                progress["phase"] = phase_name
                progress["phase_progress"] = min(1.0, overall)
                progress["cracked"] = len(results)

        _per_hash_progress("builtin", 0.0)
        use_r = any(s in strategies for s in ("rainbow", "rules"))
        r = _builtin_attack(raw, types, use_r, stop_flag=stop_flag)
        if r:
            elapsed = (time.perf_counter() - starts[i]) * 1000
            result = {"plaintext": r[0], "strategy": r[2], "time_ms": round(elapsed, 3), "hash_type": r[1]}
            results[i] = result
            if on_cracked:
                on_cracked(i, result)
            del remaining[i]
            continue

        if "bruteforce" in strategies:
            _per_hash_progress("bruteforce", 0.3)  # builtin ~30% of per-hash work
            r = _bruteforce_attack(raw, types, max_length=8, stop_flag=stop_flag)
            if r:
                elapsed = (time.perf_counter() - starts[i]) * 1000
                result = {"plaintext": r[0], "strategy": "bruteforce", "time_ms": round(elapsed, 3), "hash_type": r[1]}
                results[i] = result
                if on_cracked:
                    on_cracked(i, result)
                del remaining[i]

    _update_progress("done", 1.0)
    return results
