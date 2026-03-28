import hashlib
import hmac
import time
import itertools
import string
from typing import Optional, Callable

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
    count = 0
    with open(wordlist_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            if stop_flag and stop_flag[0]:
                return None
            word = line.rstrip("\n\r")
            if not word:
                continue
            count += 1
            for ht in hash_types:
                if _verify_hash(word, h, ht):
                    return (word, ht)
            if progress_cb and count % 50000 == 0:
                progress_cb(count)
    return None

def rules_attack(
    hash_value: str,
    hash_types: list,
    wordlist_path: str,
    progress_cb: Optional[Callable] = None,
    stop_flag: Optional[list] = None,
) -> Optional[tuple]:
    h = hash_value.lower().strip()
    count = 0
    with open(wordlist_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            if stop_flag and stop_flag[0]:
                return None
            base = line.rstrip("\n\r")
            if not base:
                continue
            count += 1
            for rule in RULES:
                try:
                    variant = rule(base)
                    if variant:
                        for ht in hash_types:
                            if _verify_hash(variant, h, ht):
                                return (variant, ht)
                except Exception:
                    continue
            if progress_cb and count % 10000 == 0:
                progress_cb(count)
    return None

def _builtin_attack(
    hash_value: str,
    hash_types: list,
    use_rules: bool = True,
    stop_flag: Optional[list] = None,
) -> Optional[tuple]:
    """Try COMMON_PASSWORDS (+ rules) against the hash in-memory."""
    h = hash_value.lower().strip()
    passwords = list(dict.fromkeys(COMMON_PASSWORDS))
    for pw in passwords:
        if stop_flag and stop_flag[0]:
            return None
        for ht in hash_types:
            if _verify_hash(pw, h, ht):
                return (pw, ht, "dictionary")
        if use_rules:
            for rule in RULES:
                try:
                    variant = rule(pw)
                    if variant and variant != pw:
                        for ht in hash_types:
                            if _verify_hash(variant, h, ht):
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
    # Phase 1: all-digit passwords 1-8 chars
    for length in range(1, min(max_length + 1, 9)):
        for combo in itertools.product(string.digits, repeat=length):
            if stop_flag and stop_flag[0]:
                return None
            word = "".join(combo)
            for ht in hash_types:
                if _verify_hash(word, h, ht):
                    return (word, ht)
    # Phase 2: lowercase alpha 1-6 chars
    for length in range(1, min(max_length + 1, 7)):
        for combo in itertools.product(string.ascii_lowercase, repeat=length):
            if stop_flag and stop_flag[0]:
                return None
            word = "".join(combo)
            for ht in hash_types:
                if _verify_hash(word, h, ht):
                    return (word, ht)
    # Phase 3: uppercase alpha 1-4 chars
    for length in range(1, min(max_length + 1, 5)):
        for combo in itertools.product(string.ascii_uppercase, repeat=length):
            if stop_flag and stop_flag[0]:
                return None
            word = "".join(combo)
            for ht in hash_types:
                if _verify_hash(word, h, ht):
                    return (word, ht)
    # Phase 4: alphanumeric (lower + digits) 1-5 chars
    alnum = string.ascii_lowercase + string.digits
    for length in range(1, min(max_length + 1, 6)):
        for combo in itertools.product(alnum, repeat=length):
            if stop_flag and stop_flag[0]:
                return None
            word = "".join(combo)
            for ht in hash_types:
                if _verify_hash(word, h, ht):
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
