from pydantic import BaseModel, Field

class DebateVerdict(BaseModel):
    winner: str = Field(description="The name of the winner (Debater A or Debater B).")
    confidence: int = Field(description="Confidence score between 0 and 100.")
    reason: str = Field(description="A concise reason for the verdict (under 40 words).")
