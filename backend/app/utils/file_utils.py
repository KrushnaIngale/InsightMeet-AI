"""
Filesystem helpers for the per-document storage layout:

    uploads/document_001/
        source.<ext>
        transcript.txt
        summary.json
        metadata.json
        chroma/

No AI logic here — pure architecture/storage plumbing.
"""

import json
import os
import re
from datetime import datetime, timezone

from app.config import settings

VIDEO_EXTS = {".mp4", ".mov", ".mkv", ".avi", ".webm"}
AUDIO_EXTS = {".wav", ".mp3", ".m4a", ".flac", ".ogg"}
PDF_EXTS = {".pdf"}


def detect_file_type(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    if ext in VIDEO_EXTS:
        return "video"
    if ext in AUDIO_EXTS:
        return "audio"
    if ext in PDF_EXTS:
        return "pdf"
    raise ValueError(f"Unsupported file type: {ext}")


def next_document_id() -> str:
    """document_001, document_002, ... based on existing folders."""
    existing = [
        d for d in os.listdir(settings.UPLOADS_DIR)
        if os.path.isdir(settings.UPLOADS_DIR / d) and re.match(r"^document_\d+$", d)
    ]
    numbers = [int(d.split("_")[1]) for d in existing] if existing else [0]
    next_num = max(numbers) + 1
    return f"document_{next_num:03d}"


def _document_path(document_id: str) -> str:
    """Path only — never creates anything. Safe to call for reads/existence checks."""
    return str(settings.UPLOADS_DIR / document_id)


def document_dir(document_id: str) -> str:
    """Path AND creates the folder. Only call this from write paths (upload)."""
    path = settings.UPLOADS_DIR / document_id
    path.mkdir(parents=True, exist_ok=True)
    return str(path)


def document_exists(document_id: str) -> bool:
    return os.path.isdir(_document_path(document_id)) and document_id in list_document_ids()


def write_metadata(document_id: str, **fields) -> None:
    path = os.path.join(document_dir(document_id), "metadata.json")
    data = {}
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    data.update(fields)
    data["document_id"] = document_id
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def read_metadata(document_id: str) -> dict:
    path = os.path.join(_document_path(document_id), "metadata.json")
    if not os.path.exists(path):
        raise FileNotFoundError(f"No metadata for {document_id}")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_transcript(document_id: str, transcript: str) -> str:
    path = os.path.join(document_dir(document_id), "transcript.txt")
    with open(path, "w", encoding="utf-8") as f:
        f.write(transcript)
    return path


def read_transcript(document_id: str) -> str:
    path = os.path.join(_document_path(document_id), "transcript.txt")
    if not os.path.exists(path):
        raise FileNotFoundError(f"No transcript for {document_id}")
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def write_summary_bundle(document_id: str, bundle: dict) -> str:
    path = os.path.join(document_dir(document_id), "summary.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(bundle, f, indent=2)
    return path


def read_summary_bundle(document_id: str) -> dict:
    path = os.path.join(_document_path(document_id), "summary.json")
    if not os.path.exists(path):
        raise FileNotFoundError(f"No summary for {document_id}")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def list_document_ids() -> list:
    return sorted(
        d for d in os.listdir(settings.UPLOADS_DIR)
        if os.path.isdir(settings.UPLOADS_DIR / d) and re.match(r"^document_\d+$", d)
    )
