import re
from typing import Optional
from dataclasses import dataclass, field

@dataclass
class DetectionResult:
    detected_type: Optional[str]
    confidence: float
    variants: list
    hashcat_mode: Optional[str]

HASH_PATTERNS = [
    # (name, length, regex, confidence_boost, hashcat_mode)
    ("md5",       32,  r"^[a-f0-9]{32}$",                          0.0,  "0"),
    ("ntlm",      32,  r"^[a-f0-9]{32}$",                          0.0,  "1000"),
    ("md4",       32,  r"^[a-f0-9]{32}$",                          0.0,  "900"),
    ("lm",        32,  r"^[a-f0-9]{32}$",                          0.0,  "3000"),
    ("sha1",      40,  r"^[a-f0-9]{40}$",                          0.0,  "100"),
    ("sha224",    56,  r"^[a-f0-9]{56}$",                          0.0,  "1300"),
    ("sha256",    64,  r"^[a-f0-9]{64}$",                          0.0,  "1400"),
    ("sha384",    96,  r"^[a-f0-9]{96}$",                          0.0,  "10800"),
    ("sha512",   128,  r"^[a-f0-9]{128}$",                         0.0,  "1700"),
    ("sha3-256",  64,  r"^[a-f0-9]{64}$",                          0.0,  "17300"),
    ("sha3-512", 128,  r"^[a-f0-9]{128}$",                         0.0,  "17600"),
    ("ripemd160", 40,  r"^[a-f0-9]{40}$",                          0.0,  "6000"),
    ("whirlpool", 128, r"^[a-f0-9]{128}$",                         0.0,  "6100"),
    ("mysql323",  16,  r"^[a-f0-9]{16}$",                          0.0,  "200"),
    ("mysql41",   41,  r"^\*[A-F0-9]{40}$",                        0.9,  "300"),
    ("md5crypt",  0,   r"^\$1\$[./a-zA-Z0-9]{1,8}\$[./a-zA-Z0-9]{22}$", 0.99, "500"),
    ("sha256crypt",0,  r"^\$5\$[./a-zA-Z0-9]{1,16}\$[./a-zA-Z0-9]{43}$", 0.99, "7400"),
    ("sha512crypt",0,  r"^\$6\$[./a-zA-Z0-9]{1,16}\$[./a-zA-Z0-9]{86}$", 0.99, "1800"),
    ("bcrypt",    0,   r"^\$2[ayb]?\$\d{2}\$[./A-Za-z0-9]{53}$",  0.99, "3200"),
    ("argon2i",   0,   r"^\$argon2i\$",                             0.99, "13400"),
    ("argon2id",  0,   r"^\$argon2id\$",                            0.99, "13400"),
    ("scrypt",    0,   r"^\$scrypt\$",                               0.99, "8900"),
    ("drupal7",   0,   r"^\$S\$[A-Za-z0-9./]{52}$",                0.99, "7900"),
    ("wordpress", 0,   r"^\$P\$[A-Za-z0-9./]{31}$",                0.99, "400"),
    ("joomla",    32,  r"^[a-f0-9]{32}:[a-zA-Z0-9]{32}$",          0.99, "11"),
    ("phpass",    0,   r"^\$H\$[A-Za-z0-9./]{31}$",                0.99, "400"),
    ("mssql2000", 0,   r"^0x0100[a-f0-9]{88}$",                    0.99, "131"),
    ("mssql2005", 0,   r"^0x0100[a-f0-9]{48}$",                    0.99, "132"),
    ("oracle11g", 0,   r"^S:[A-F0-9]{60}$",                        0.99, "112"),
    ("sha1django",0,   r"^sha1\$[a-zA-Z0-9]+\$[a-f0-9]{40}$",     0.99, "124"),
    ("pbkdf2sha256",0, r"^pbkdf2_sha256\$",                         0.99, "10900"),
    ("wpa",       64,  r"^[a-f0-9]{64}$",                           0.0,  "2500"),
    ("cisco7",    0,   r"^\d{2}[A-F0-9]+$",                         0.85, "2"),
    ("cisco5",    0,   r"^\$1\$",                                    0.90, "500"),
    ("ntlmv1",   0,   r"^[^:]+::[^:]*:[a-f0-9]{48}:[a-f0-9]{48}:[a-f0-9]{16}$", 0.99, "5500"),
    ("ntlmv2",   0,   r"^[^:]+::[^:]*:[a-f0-9]+:[a-f0-9]{32}:[a-f0-9]+$",       0.95, "5600"),
    ("kerberos5", 0,   r"^\$krb5tgs\$",                              0.99, "13100"),
    ("kerberos5as",0,  r"^\$krb5asrep\$",                            0.99, "18200"),
    ("sha512django",0, r"^sha512_pbkdf2_hmac_sha256\$",              0.99, "10000"),
]

MULTI_VARIANTS = {
    32:  ["md5", "ntlm", "md4", "lm"],
    40:  ["sha1", "ripemd160"],
    56:  ["sha224"],
    64:  ["sha256", "sha3-256", "wpa"],
    96:  ["sha384"],
    128: ["sha512", "sha3-512", "whirlpool"],
    16:  ["mysql323"],
}

HASHCAT_MODES = {
    "md5": "0", "ntlm": "1000", "md4": "900", "lm": "3000",
    "sha1": "100", "sha224": "1300", "sha256": "1400", "sha384": "10800",
    "sha512": "1700", "sha3-256": "17300", "sha3-512": "17600",
    "ripemd160": "6000", "bcrypt": "3200", "md5crypt": "500",
    "sha256crypt": "7400", "sha512crypt": "1800", "argon2id": "13400",
    "wordpress": "400", "drupal7": "7900", "joomla": "11",
    "pbkdf2sha256": "10900", "kerberos5": "13100",
    "ntlmv1": "5500", "ntlmv2": "5600",
}

def detect_hash(hash_string: str) -> DetectionResult:
    h = hash_string.strip()

    # High-confidence prefix/pattern checks first
    for name, length, pattern, boost, mode in HASH_PATTERNS:
        if boost >= 0.85 and re.match(pattern, h, re.IGNORECASE):
            return DetectionResult(
                detected_type=name,
                confidence=boost,
                variants=[name],
                hashcat_mode=mode,
            )

    # Length-based detection for hex hashes
    h_lower = h.lower()
    if re.match(r"^[a-f0-9]+$", h_lower):
        length = len(h)
        variants = MULTI_VARIANTS.get(length, [])
        if variants:
            primary = variants[0]
            mode = HASHCAT_MODES.get(primary)
            confidence = 0.7 if len(variants) == 1 else 0.5
            return DetectionResult(
                detected_type=primary,
                confidence=confidence,
                variants=variants,
                hashcat_mode=mode,
            )

    return DetectionResult(
        detected_type="unknown",
        confidence=0.0,
        variants=[],
        hashcat_mode=None,
    )

def detect_hashes_bulk(hash_list: list) -> list:
    return [{"hash": h, **detect_hash(h).__dict__} for h in hash_list]
