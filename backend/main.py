from dotenv import load_dotenv
import os
import sys

# Debug print to check if app starts
print("Starting application...", file=sys.stderr)

# Load environment variables first, before importing any other modules
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import endpoints
from app.api import tts

app = FastAPI(title="LLM Debate Agent")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(endpoints.router, prefix="/api")
app.include_router(tts.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "LLM Debate Agent API is running"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
