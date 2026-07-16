import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, Link2, FileVideo } from "lucide-react";
import { uploadDocument } from "../services/api";
import Waveform from "../components/Waveform";

export default function Upload() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("file"); // "file" | "youtube"
  const [file, setFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [language, setLanguage] = useState("english");
  const [dragOver, setDragOver] = useState(false);

  const [status, setStatus] = useState("idle"); // idle | processing | done | error
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      setMode("file");
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("processing");
    setError(null);
    try {
      const res = await uploadDocument({
        file: mode === "file" ? file : undefined,
        youtubeUrl: mode === "youtube" ? youtubeUrl : undefined,
        language,
      });
      setResult(res.data);
      setStatus("done");
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong while processing this document.");
      setStatus("error");
    }
  }

  if (status === "processing") {
    return (
      <div className="max-w-2xl mx-auto px-10 py-24 text-center">
        <div className="h-16 mb-8 mx-auto max-w-sm">
          <Waveform seed={file?.name || youtubeUrl || "processing"} bars={48} animated color="amber" />
        </div>
        <h2 className="font-display text-2xl text-paper mb-2">Transcribing and analyzing…</h2>
        <p className="text-muted font-mono text-sm">
          Extracting audio, running speech-to-text, summarizing, and building the search index.
          This can take a few minutes for longer recordings.
        </p>
      </div>
    );
  }

  if (status === "done" && result) {
    return (
      <div className="max-w-2xl mx-auto px-10 py-16">
        <div className="bg-panel border border-teal/30 rounded-xl p-8">
          <p className="font-mono text-xs uppercase tracking-wide text-teal mb-3">Ready</p>
          <h2 className="font-display text-2xl text-paper mb-4">{result.summary.title}</h2>
          <p className="text-muted mb-6 whitespace-pre-line leading-relaxed">{result.summary.summary}</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/documents/${result.document_id}`)}
              className="bg-amber text-ink font-medium px-5 py-2.5 rounded-lg hover:bg-amber/90 transition-colors"
            >
              View full summary
            </button>
            <button
              onClick={() => navigate(`/chat?doc=${result.document_id}`)}
              className="border border-line text-paper font-medium px-5 py-2.5 rounded-lg hover:border-amber/40 transition-colors"
            >
              Chat with it
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-10 py-10">
      <h2 className="font-display text-3xl text-paper mb-2">Upload a document</h2>
      <p className="text-muted mb-8">
        Video, audio, a YouTube link, or a PDF — InsightMeet will read it and make it chattable.
      </p>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            mode === "file" ? "border-amber text-amber bg-amber/10" : "border-line text-muted hover:text-paper"
          }`}
        >
          <FileVideo className="w-4 h-4" strokeWidth={1.75} /> File
        </button>
        <button
          type="button"
          onClick={() => setMode("youtube")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            mode === "youtube" ? "border-amber text-amber bg-amber/10" : "border-line text-muted hover:text-paper"
          }`}
        >
          <Link2 className="w-4 h-4" strokeWidth={1.75} /> YouTube URL
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === "file" ? (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl h-48 cursor-pointer transition-colors mb-6 ${
              dragOver ? "border-amber bg-amber/5" : "border-line hover:border-amber/40"
            }`}
          >
            <UploadCloud className="w-8 h-8 text-muted" strokeWidth={1.5} />
            {file ? (
              <p className="text-paper font-mono text-sm">{file.name}</p>
            ) : (
              <>
                <p className="text-paper font-medium">Drop a file, or click to browse</p>
                <p className="text-muted text-xs font-mono">MP4, MOV, WAV, MP3, PDF</p>
              </>
            )}
            <input
              type="file"
              className="hidden"
              accept=".mp4,.mov,.mkv,.avi,.webm,.wav,.mp3,.m4a,.flac,.ogg,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
        ) : (
          <input
            type="url"
            required
            placeholder="https://youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="w-full bg-panel border border-line rounded-lg px-4 py-3 mb-6 text-paper placeholder:text-muted font-mono text-sm focus:border-amber outline-none"
          />
        )}

        <div className="mb-8">
          <label className="block font-mono text-xs uppercase tracking-wide text-muted mb-2">
            Spoken language
          </label>
          <div className="flex gap-2">
            {["english", "hinglish"].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border capitalize transition-colors ${
                  language === lang
                    ? "border-amber text-amber bg-amber/10"
                    : "border-line text-muted hover:text-paper"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-rust font-mono text-sm mb-4">{error}</p>
        )}

        <button
          type="submit"
          disabled={mode === "file" ? !file : !youtubeUrl}
          className="w-full bg-amber text-ink font-medium py-3 rounded-lg hover:bg-amber/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Process document
        </button>
      </form>
    </div>
  );
}
