export interface DebateTurn {
  speaker: string;
  content: string;
  round: number;
}

export interface DebateResult {
  transcript: DebateTurn[];
  winner: string;
  confidence: number;
  reason: string;
}
