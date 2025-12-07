from app.agents.definitions import neo, smith, morpheus, oracle, summarizer
from app.models import DebateResult, DebateTurn
import json
import re
import asyncio
import time

class DebateWorkflow:
    def __init__(self):
        self.transcript = []

    async def run(self, topic: str) -> DebateResult:
        # This method is kept for compatibility but run_stream is the main one used
        pass

    async def run_stream(self, topic: str):
        self.transcript = []
        loop = asyncio.get_running_loop()
        
        # Helper to clean summary
        def clean_summary(text):
            # Remove bold markers
            text = text.replace('**', '')
            lines = text.split('\n')
            cleaned_lines = [line for line in lines if line.strip().startswith(('*', '-'))]
            return '\n'.join(cleaned_lines) if cleaned_lines else text

        # --- Round 1: Parallel Perspectives ---
        yield json.dumps({"type": "info", "message": "Initializing The Matrix... Loading Constructs..."}) + "\n"
        yield json.dumps({"type": "info", "message": "Round 1: Divergent Perspectives"}) + "\n"

        # 1. Define Prompts
        prompt_neo_1 = f"""Topic: {topic}
1. Analyze the topic from a Scientific/Optimistic perspective.
2. Produce your opening argument (YES).
Format:
THINKING: (Your thought process)
FINAL_ANSWER: YES
(Your argument)"""

        prompt_smith_1 = f"""Topic: {topic}
1. Analyze the topic from a Cynical/Negative perspective.
2. Produce your opening argument (NO).
Format:
THINKING: (Your thought process)
FINAL_ANSWER: NO
(Your argument)"""

        prompt_morpheus_1 = f"""Topic: {topic}
1. Analyze the topic from a Philosophical perspective.
2. Question the nature of the question itself.
Format:
THINKING: (Your thought process)
FINAL_ANSWER: PHILOSOPHICAL
(Your argument)"""

        # 2. Run Agents in Parallel
        future_neo_1 = loop.run_in_executor(None, neo.generate, prompt_neo_1)
        future_smith_1 = loop.run_in_executor(None, smith.generate, prompt_smith_1)
        future_morpheus_1 = loop.run_in_executor(None, morpheus.generate, prompt_morpheus_1)

        resp_neo_1 = await future_neo_1
        resp_smith_1 = await future_smith_1
        resp_morpheus_1 = await future_morpheus_1

        # 3. Summarize in Parallel
        prompt_sum_neo = f"Summarize this argument into 3 concise bullet points (Key Pillars). Remove thinking.\n\n{resp_neo_1}"
        prompt_sum_smith = f"Summarize this argument into 3 concise bullet points (Counter-Points). Remove thinking.\n\n{resp_smith_1}"
        prompt_sum_morpheus = f"Summarize this argument into 3 concise bullet points (Philosophical Insights). Remove thinking.\n\n{resp_morpheus_1}"

        future_sum_neo = loop.run_in_executor(None, summarizer.generate, prompt_sum_neo)
        future_sum_smith = loop.run_in_executor(None, summarizer.generate, prompt_sum_smith)
        future_sum_morpheus = loop.run_in_executor(None, summarizer.generate, prompt_sum_morpheus)

        sum_neo_1 = await future_sum_neo
        sum_smith_1 = await future_sum_smith
        sum_morpheus_1 = await future_sum_morpheus

        content_neo_1 = clean_summary(sum_neo_1)
        content_smith_1 = clean_summary(sum_smith_1)
        content_morpheus_1 = clean_summary(sum_morpheus_1)

        # 4. Yield Turns (Interleaved)
        points_neo = [p for p in content_neo_1.split('\n') if p.strip()]
        points_smith = [p for p in content_smith_1.split('\n') if p.strip()]
        points_morpheus = [p for p in content_morpheus_1.split('\n') if p.strip()]

        # Determine max length to iterate safely
        max_len = max(len(points_neo), len(points_smith), len(points_morpheus))

        for i in range(max_len):
            if i < len(points_neo):
                turn_neo = DebateTurn(speaker="Neo", content=points_neo[i], round=1)
                self.transcript.append(turn_neo)
                yield json.dumps({"type": "turn", "speaker": "Neo", "content": points_neo[i], "round": 1}) + "\n"
            
            if i < len(points_morpheus):
                turn_morpheus = DebateTurn(speaker="Morpheus", content=points_morpheus[i], round=1)
                self.transcript.append(turn_morpheus)
                yield json.dumps({"type": "turn", "speaker": "Morpheus", "content": points_morpheus[i], "round": 1}) + "\n"

            if i < len(points_smith):
                turn_smith = DebateTurn(speaker="Agent Smith", content=points_smith[i], round=1)
                self.transcript.append(turn_smith)
                yield json.dumps({"type": "turn", "speaker": "Agent Smith", "content": points_smith[i], "round": 1}) + "\n"

        # --- Buffer Start ---
        yield json.dumps({"type": "info", "message": "Analyzing System Anomalies... (Buffer)"}) + "\n"
        # buffer_start_time = time.time() # Removed as we don't enforce min time anymore

        # --- Round 2: The Clash (Rebuttals) - Generation ---
        prompt_neo_2 = f"""Topic: {topic}
Review the arguments:
Smith (NO): {content_smith_1}
Morpheus (PHIL): {content_morpheus_1}

Provide a rebuttal supporting YES. Focus on why the cynical view is limited and how the philosophical view supports progress.
Format:
THINKING: (Process)
FINAL_ANSWER: REBUTTAL
(Argument)"""

        prompt_smith_2 = f"""Topic: {topic}
Review the arguments:
Neo (YES): {content_neo_1}
Morpheus (PHIL): {content_morpheus_1}

Provide a rebuttal supporting NO. Deconstruct Neo's optimism as naive and Morpheus's philosophy as irrelevant.
Format:
THINKING: (Process)
FINAL_ANSWER: REBUTTAL
(Argument)"""

        prompt_morpheus_2 = f"""Topic: {topic}
Review the arguments:
Neo (YES): {content_neo_1}
Smith (NO): {content_smith_1}

Synthesize the conflict. Show how both are parts of a larger truth (or illusion).
Format:
THINKING: (Process)
FINAL_ANSWER: SYNTHESIS
(Argument)"""

        # Run Round 2 Parallel
        future_neo_2 = loop.run_in_executor(None, neo.generate, prompt_neo_2)
        future_smith_2 = loop.run_in_executor(None, smith.generate, prompt_smith_2)
        future_morpheus_2 = loop.run_in_executor(None, morpheus.generate, prompt_morpheus_2)

        resp_neo_2 = await future_neo_2
        resp_smith_2 = await future_smith_2
        resp_morpheus_2 = await future_morpheus_2

        # Summarize Round 2
        prompt_sum_neo_2 = f"Summarize this rebuttal into 3 concise bullet points. Remove thinking.\n\n{resp_neo_2}"
        prompt_sum_smith_2 = f"Summarize this rebuttal into 3 concise bullet points. Remove thinking.\n\n{resp_smith_2}"
        prompt_sum_morpheus_2 = f"Summarize this synthesis into 3 concise bullet points. Remove thinking.\n\n{resp_morpheus_2}"

        future_sum_neo_2 = loop.run_in_executor(None, summarizer.generate, prompt_sum_neo_2)
        future_sum_smith_2 = loop.run_in_executor(None, summarizer.generate, prompt_sum_smith_2)
        future_sum_morpheus_2 = loop.run_in_executor(None, summarizer.generate, prompt_sum_morpheus_2)

        sum_neo_2 = await future_sum_neo_2
        sum_smith_2 = await future_sum_smith_2
        sum_morpheus_2 = await future_sum_morpheus_2

        # --- Buffer End ---
        # No artificial delay. Proceed immediately when synthesis is done.

        yield json.dumps({"type": "info", "message": "Round 2: Systemic Anomaly Check (Rebuttals)"}) + "\n"

        content_neo_2 = clean_summary(sum_neo_2)
        content_smith_2 = clean_summary(sum_smith_2)
        content_morpheus_2 = clean_summary(sum_morpheus_2)

        # Yield Round 2 (Interleaved)
        points_neo_2 = [p for p in content_neo_2.split('\n') if p.strip()]
        points_smith_2 = [p for p in content_smith_2.split('\n') if p.strip()]
        points_morpheus_2 = [p for p in content_morpheus_2.split('\n') if p.strip()]

        max_len_2 = max(len(points_neo_2), len(points_smith_2), len(points_morpheus_2))

        for i in range(max_len_2):
            if i < len(points_neo_2):
                turn_neo_2 = DebateTurn(speaker="Neo", content=points_neo_2[i], round=2)
                self.transcript.append(turn_neo_2)
                yield json.dumps({"type": "turn", "speaker": "Neo", "content": points_neo_2[i], "round": 2}) + "\n"
            
            if i < len(points_morpheus_2):
                turn_morpheus_2 = DebateTurn(speaker="Morpheus", content=points_morpheus_2[i], round=2)
                self.transcript.append(turn_morpheus_2)
                yield json.dumps({"type": "turn", "speaker": "Morpheus", "content": points_morpheus_2[i], "round": 2}) + "\n"

            if i < len(points_smith_2):
                turn_smith_2 = DebateTurn(speaker="Agent Smith", content=points_smith_2[i], round=2)
                self.transcript.append(turn_smith_2)
                yield json.dumps({"type": "turn", "speaker": "Agent Smith", "content": points_smith_2[i], "round": 2}) + "\n"

        # --- Round 3: The Oracle's Verdict ---
        yield json.dumps({"type": "info", "message": "Consulting The Oracle..."}) + "\n"

        transcript_text = "\n".join([f"{t.speaker}: {t.content}" for t in self.transcript])
        prompt_verdict = f"""Topic: {topic}
        
Review the Debate Transcript:
{transcript_text}

Determine the final verdict. Who revealed the greater truth?
Output strict JSON matching the DebateVerdict schema.
"""
        verdict_json = oracle.generate(prompt_verdict)
        
        # Clean markdown code blocks if present
        if "```json" in verdict_json:
            verdict_json = verdict_json.split("```json")[1].split("```")[0].strip()
        elif "```" in verdict_json:
            verdict_json = verdict_json.split("```")[1].split("```")[0].strip()

        yield json.dumps({"type": "verdict", "content": verdict_json}) + "\n"
