import hashlib
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

SUPPORTED_ALGORITHMS = [
    "md5", "sha1", "sha224", "sha256", "sha384", "sha512",
    "sha3-256", "sha3-512", "ripemd160", "whirlpool",
    "ntlm", "md4", "mysql323",
]


class GenerateRequest(BaseModel):
    text: str
    algorithm: str


class GenerateResponse(BaseModel):
    hash: str
    algorithm: str


class BatchRequest(BaseModel):
    texts: list[str]
    algorithm: str


class BatchResponse(BaseModel):
    hashes: list[str]
    algorithm: str


def _compute_hash(text: str, algorithm: str) -> Optional[str]:
    word_bytes = text.encode("utf-8", errors="ignore")
    try:
        if algorithm in ("md5", "sha1", "sha256", "sha512", "sha224", "sha384",
                         "sha3-256", "sha3-512", "ripemd160", "whirlpool"):
            algo_map = {"sha3-256": "sha3_256", "sha3-512": "sha3_512"}
            algo = algo_map.get(algorithm, algorithm)
            return hashlib.new(algo, word_bytes).hexdigest()
        elif algorithm in ("ntlm", "md4"):
            return hashlib.new("md4", text.encode("utf-16-le")).hexdigest()
        elif algorithm == "mysql323":
            nr = 1345345333
            nr2 = 0x12345671
            add = 7
            for c in text:
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


@router.get("/algorithms")
async def list_algorithms():
    return SUPPORTED_ALGORITHMS


@router.post("/generate", response_model=GenerateResponse)
async def generate_hash(req: GenerateRequest):
    algo = req.algorithm.lower().strip()
    if algo not in SUPPORTED_ALGORITHMS:
        return GenerateResponse(hash="Unsupported algorithm", algorithm=algo)
    result = _compute_hash(req.text, algo)
    if result is None:
        return GenerateResponse(hash="Error computing hash", algorithm=algo)
    return GenerateResponse(hash=result, algorithm=algo)


@router.post("/batch", response_model=BatchResponse)
async def batch_generate(req: BatchRequest):
    algo = req.algorithm.lower().strip()
    if algo not in SUPPORTED_ALGORITHMS:
        return BatchResponse(hashes=[], algorithm=algo)
    hashes = []
    for text in req.texts:
        h = _compute_hash(text, algo) if text else ""
        hashes.append(h or "")
    return BatchResponse(hashes=hashes, algorithm=algo)
