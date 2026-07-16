"""
Speech-to-text transcription.

AI logic is UNCHANGED from the original core/transcriber.py:
- Groq Whisper for "english"
- Sarvam STT-translate (25s pieces) for "hinglish"

Only change: reads credentials from app.config.settings instead of
calling os.getenv() directly, so config is centralized.
"""

import os
from groq import Groq
import requests
from pydub import AudioSegment

from app.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)
MODEL_NAME = settings.GROQ_WHISPER_MODEL

SARVAM_API_KEY = settings.SARVAM_API_KEY
SARVAM_STT_TRANSLATE_URL = settings.SARVAM_STT_TRANSLATE_URL
SARVAM_MODEL = settings.SARVAM_STT_MODEL
SARVAM_PIECE_SECONDS = settings.SARVAM_PIECE_SECONDS


def transcribe_chunk_whisper(chunk_path: str) -> str:
    with open(chunk_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            file=audio_file,
            model=MODEL_NAME,
            response_format="text"
        )
    return transcription


def _send_to_sarvam(piece_path: str) -> str:
    """Send one ≤30s WAV file to Sarvam and return the English transcript."""
    headers = {"api-subscription-key": SARVAM_API_KEY}

    with open(piece_path, "rb") as f:
        files = {"file": (os.path.basename(piece_path), f, "audio/wav")}
        data = {"model": SARVAM_MODEL, "with_diarization": "false"}
        response = requests.post(
            SARVAM_STT_TRANSLATE_URL,
            headers=headers,
            files=files,
            data=data,
            timeout=120,
        )

        if not response.ok:
            print(f"\n❌ Sarvam returned {response.status_code}")
            print(f"Response body: {response.text}\n")
            response.raise_for_status()

        return response.json().get("transcript", "")


def transcribe_chunk_sarvam(chunk_path: str) -> str:
    """
    Sarvam sync API only accepts ≤30s audio. We split this chunk into
    25-second pieces, send each separately, and join the transcripts.
    """
    if not SARVAM_API_KEY:
        raise RuntimeError("SARVAM_API_KEY is not set in environment / .env")

    audio = AudioSegment.from_wav(chunk_path)
    piece_ms = SARVAM_PIECE_SECONDS * 1000

    full_text = ""
    total_pieces = (len(audio) + piece_ms - 1) // piece_ms

    for i, start in enumerate(range(0, len(audio), piece_ms)):
        piece = audio[start: start + piece_ms]
        piece_path = f"{chunk_path}_sv_{i}.wav"
        piece.export(piece_path, format="wav")

        try:
            print(f"  → Sarvam piece {i + 1}/{total_pieces} ...")
            full_text += _send_to_sarvam(piece_path) + " "
        finally:
            if os.path.exists(piece_path):
                os.remove(piece_path)

    return full_text.strip()


def transcribe_chunk(chunk_path: str, language: str = "english") -> str:
    """
    Route one chunk to Whisper or Sarvam depending on language choice.
    - english  → Whisper (local model)
    - hinglish → Sarvam (translates to English while transcribing)
    """
    if language.lower() == "hinglish":
        return transcribe_chunk_sarvam(chunk_path)
    return transcribe_chunk_whisper(chunk_path)


def transcribe_all(chunks: list, language: str = "english") -> str:
    full_transcript = ""

    engine = "Sarvam AI" if language.lower() == "hinglish" else "Groq Whisper"
    print(f"Using {engine} for transcription.")

    for i, chunk in enumerate(chunks):
        print(f"Transcribing chunk {i+1}/{len(chunks)}...")
        text = transcribe_chunk(chunk, language=language)

        full_transcript += text + " "

    print("Transcription completed.")

    return full_transcript
