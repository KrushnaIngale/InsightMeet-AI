"""
AI pipeline orchestration.

This is the direct replacement for the original main.py's run_pipeline().
Every AI call here is the exact same function, from the exact same
core module, with the exact same prompts, as your original project:

    utils.audio_processor.process_input   (chunk video/audio)
    core.transcriber.transcribe_all        (Groq Whisper / Sarvam)
    core.summarizer.generate_title         (Mistral)
    core.summarizer.summarize              (Mistral)
    core.extractor.extract_action_items    (Mistral)
    core.extractor.extract_key_decisions   (Mistral)
    core.extractor.extract_questions       (Mistral)
    core.vector_store.build_vector_store   (Chroma + HuggingFace embeddings)

The only structural change: instead of returning an in-memory
`rag_chain` (which can't be persisted or returned as JSON), we persist
the vector store to disk under the document's own folder and rebuild
the chain on-demand in chat_service. This satisfies the "never store
everything in memory" requirement without touching AI logic.
"""

from app.core import transcriber, summarizer, extractor, vector_store, pdf_processor
from app.utils import audio_processor


def _run_text_pipeline(transcript: str, document_id: str) -> dict:
    """Shared second half of the pipeline: title/summary/extraction/vectorization.
    Identical for video, audio, and PDF sources once we have a transcript-like text.
    """
    title = summarizer.generate_title(transcript)
    summary = summarizer.summarize(transcript)
    action_items = extractor.extract_action_items(transcript)
    key_decisions = extractor.extract_key_decisions(transcript)
    open_questions = extractor.extract_questions(transcript)

    # Persist embeddings for this document (per-document Chroma collection)
    vector_store.build_vector_store(transcript, document_id)

    return {
        "title": title,
        "transcript": transcript,
        "summary": summary,
        "action_items": action_items,
        "key_decisions": key_decisions,
        "open_questions": open_questions,
    }


def process_media(source: str, document_id: str, output_dir: str, language: str = "english") -> dict:
    """
    Video/audio pipeline. `source` is either a YouTube URL or a path to a
    locally-saved uploaded file. Mirrors the original run_pipeline() exactly.
    """
    print("starting AI Video Assistant")

    chunks = audio_processor.process_input(source, output_dir)

    transcript = transcriber.transcribe_all(chunks, language)
    print(f"raw transcription (first 300 characters) {transcript[:300]}")

    return _run_text_pipeline(transcript, document_id)


def process_pdf(pdf_path: str, document_id: str) -> dict:
    """
    PDF pipeline (new capability). Extracts text, then reuses the exact
    same title/summary/extraction/vectorization logic as video/audio,
    so a PDF is chattable the same way a meeting transcript is.
    """
    transcript = pdf_processor.extract_text_from_pdf(pdf_path)
    if not transcript:
        raise ValueError("Could not extract any text from this PDF.")

    return _run_text_pipeline(transcript, document_id)
