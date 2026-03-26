from pydantic import BaseModel
from typing import Optional, List
from enum import Enum

class HashStrategy(str, Enum):
    RAINBOW = "rainbow"
    DICTIONARY = "dictionary"
    RULES = "rules"
    MASK = "mask"
    BRUTEFORCE = "bruteforce"

class CrackRequest(BaseModel):
    hashes: List[str]
    strategies: List[HashStrategy] = [HashStrategy.RAINBOW, HashStrategy.DICTIONARY, HashStrategy.RULES]
    wordlist_id: Optional[int] = None
    timeout: int = 300
    max_length: int = 12

class TaskResponse(BaseModel):
    task_id: str
    status: str
    total_hashes: int
    wordlist_used: Optional[str] = None

class CrackedHash(BaseModel):
    hash: str
    hash_type: Optional[str]
    plaintext: str
    strategy: str
    time_ms: float

class TaskStatus(BaseModel):
    task_id: str
    status: str
    total_hashes: int
    processed: int
    cracked: int
    results: List[CrackedHash] = []
    error: Optional[str] = None

class WordlistInfo(BaseModel):
    id: Optional[int]
    name: str
    path: str
    total_words: int
    file_size: int
    size_mb: float
    last_used: Optional[str]
    success_rate: float
    total_cracks: int
    is_custom: bool
    added_at: Optional[str]

class HashDetectionResult(BaseModel):
    hash: str
    detected_type: Optional[str]
    confidence: float
    variants: List[str]
    hashcat_mode: Optional[str]

class ScanResult(BaseModel):
    found: int
    wordlists: List[WordlistInfo]
