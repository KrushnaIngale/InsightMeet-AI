# InsightMeet AI

AI meeting/document intelligence: upload a video, audio file, YouTube link,
or PDF and get a transcript, a summary, action items, key decisions, open
questions, and a RAG chat interface — grounded only in that document.

This is a refactor of an original Streamlit prototype into a production
architecture. **No AI logic was rewritten** — transcription (Groq
Whisper / Sarvam), summarization/extraction (Mistral), and retrieval
(ChromaDB + HuggingFace embeddings via LangChain) all use the exact same
prompts and chains as the original. Only the architecture changed:
Streamlit → FastAPI REST API + React frontend.

```
backend/    FastAPI REST API (Python)
frontend/   React + Vite + Tailwind (talks to the API only via HTTP/Axios)
```

## Architecture

```
API Route  →  Service Layer  →  Core AI Modules  →  Utilities
(routes_*)    (services/*)      (core/*)             (utils/*)
```

Routes contain no AI logic — they parse the request, call a service, and
map errors to HTTP status codes. Services orchestrate; core modules are
your original AI code, moved but not rewritten.

### REST API

| Method | Path                  | Description                                  |
|--------|-----------------------|-----------------------------------------------|
| POST   | `/upload`              | Upload file or `youtube_url`; runs the full pipeline synchronously |
| GET    | `/documents`            | List all documents                          |
| GET    | `/documents/{id}`       | Metadata + summary + transcript             |
| DELETE | `/documents/{id}`       | Delete a document and its stored data       |
| POST   | `/chat`                 | `{document_id, question}` → grounded answer |
| GET    | `/health`               | Health check                                |

### Storage layout

```
backend/app/uploads/document_001/
    source.<ext>       # original upload
    transcript.txt
    summary.json        # title, summary, action_items, key_decisions, open_questions
    metadata.json        # status, file_type, language, timestamps
    chroma/              # this document's own vector collection
```

## Local development

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in GROQ_API_KEY, SARVAM_API_KEY, MISTRAL_API_KEY
uvicorn app.main:app --reload
```
API runs at `http://localhost:8000` (docs at `/docs`).

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:8000
npm run dev
```
App runs at `http://localhost:5173`.

## Deployment

**Frontend → Vercel**
1. Import the `frontend/` folder as a Vercel project (framework preset: Vite).
2. Set env var `VITE_API_BASE_URL` to your deployed backend URL.
3. `vercel.json` already handles the SPA rewrite for React Router.

**Backend → Render or Railway**

Render: `render.yaml` is preconfigured (build/start commands, health check
path, env var placeholders). Push to a connected repo or use the Render
dashboard's "New from render.yaml" flow. Set `GROQ_API_KEY`,
`SARVAM_API_KEY`, `MISTRAL_API_KEY`, and `ALLOWED_ORIGINS` (your Vercel
URL) as environment variables in the dashboard.

Railway: `railway.json` + `Procfile` are preconfigured. Set the same env
vars in the Railway dashboard.

**Important — persistent storage:** both platforms' default disks are
*ephemeral* and get wiped on redeploy/restart. Uploaded files, transcripts,
and Chroma vector data live on local disk under `backend/app/uploads/`. For
documents to survive redeploys in production, attach a persistent volume
(Render: Disks; Railway: Volumes) mounted at `backend/app/uploads`, or
migrate storage to S3/a managed vector DB — not required to get this
running, but required before you'd call it durable for real users.

## What changed vs. the original Streamlit app (and what didn't)

**Unchanged:** every prompt, every model choice (Groq Whisper, Sarvam,
Mistral), the map-reduce summarization chain, the LCEL RAG chain, the
Chroma + HuggingFace embedding setup, the audio chunking/conversion logic.

**Changed (architecture only):**
- Vector store and RAG chain are now parametrized per `document_id`
  (the original used one shared collection, so a second upload would
  overwrite the first's embeddings).
- Config centralized into `app/config.py` instead of scattered `os.getenv()`.
- Added PDF upload support (extraction only — new, isolated module) since
  the original had PDF export dependencies but no PDF input path.
- Streamlit UI replaced by a React frontend that talks to the API over
  HTTP only.
