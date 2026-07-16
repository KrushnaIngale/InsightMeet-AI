"""
PDF text extraction for PDF-type uploads.

This module is NEW — the original project's requirements.txt included
reportlab/fpdf2 but no PDF-reading module existed yet. Kept isolated
and small so it doesn't touch the working video/audio pipeline.
Downstream (summarizer, extractor, rag_engine) reuse the exact same
transcript-shaped string this returns, so no other AI logic changes.
"""

from pypdf import PdfReader


def extract_text_from_pdf(pdf_path: str) -> str:
    reader = PdfReader(pdf_path)
    text_parts = []
    for page in reader.pages:
        page_text = page.extract_text() or ""
        text_parts.append(page_text)
    return "\n".join(text_parts).strip()
