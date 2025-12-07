from pydantic import BaseModel
from typing import List, Optional

class DebateRequest(BaseModel):
    question: str

class DebateTurn(BaseModel):
    speaker: str
    content: str
    round: int = 1

class DebateResult(BaseModel):
    transcript: List[DebateTurn]
    winner: str
    confidence: int
    reason: str
