import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

/**
 * Upload a video/audio/PDF file, or process a YouTube URL.
 * Exactly one of { file } or { youtubeUrl } should be provided.
 */
export function uploadDocument({ file, youtubeUrl, language = "english" }) {
  const form = new FormData();
  if (file) form.append("file", file);
  if (youtubeUrl) form.append("youtube_url", youtubeUrl);
  form.append("language", language);

  return api.post("/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function listDocuments() {
  return api.get("/documents");
}

export function getDocument(documentId) {
  return api.get(`/documents/${documentId}`);
}

export function deleteDocument(documentId) {
  return api.delete(`/documents/${documentId}`);
}

export function askQuestion(documentId, question) {
  return api.post("/chat", { document_id: documentId, question });
}

export function checkHealth() {
  return api.get("/health");
}
