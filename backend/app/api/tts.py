from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google.cloud import texttospeech
import base64
import os

router = APIRouter()

class TTSRequest(BaseModel):
    text: str
    voice_id: str = "en-US-Neural2-D"

@router.post("/speak")
async def speak(request: TTSRequest):
    try:
        # Instantiates a client
        client = texttospeech.TextToSpeechClient()

        # Set the text input to be synthesized
        synthesis_input = texttospeech.SynthesisInput(text=request.text)

        # Build the voice request, select the language code ("en-US") and the ssml
        # voice gender ("neutral")
        voice_name = request.voice_id
        language_code = "-".join(voice_name.split("-")[:2])
        
        voice = texttospeech.VoiceSelectionParams(
            language_code=language_code, 
            name=voice_name
        )

        # Select the type of audio file you want returned
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )

        # Perform the text-to-speech request on the text input with the selected
        # voice parameters and audio file type
        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )

        # The response's audio_content is binary.
        # We encode it to base64 to send it to the frontend.
        audio_content = base64.b64encode(response.audio_content).decode("utf-8")
        
        return {"audio_content": audio_content}

    except Exception as e:
        print(f"TTS Error: {str(e)}")
        # For development without credentials, we might want to return a mock or specific error
        if "DefaultCredentialsError" in str(e):
             raise HTTPException(status_code=500, detail="Google Cloud Credentials not found. Please set GOOGLE_APPLICATION_CREDENTIALS.")
        raise HTTPException(status_code=500, detail=str(e))
