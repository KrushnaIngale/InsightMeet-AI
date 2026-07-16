import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getDocument } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import Waveform from "../components/Waveform";
import FileTypeIcon, { fileTypeLabel } from "../components/FileTypeIcon";

function Section({ title, children }) {
  return (
    <div className="bg-panel border border-line rounded-xl p-6 mb-4">
      <h3 className="font-mono text-xs uppercase tracking-wide text-amber mb-3">{title}</h3>
      <div className="text-paper leading-relaxed whitespace-pre-line text-sm">{children}</div>
    </div>
  );
}

export default function MeetingSummary() {
  const { documentId } = useParams();
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    getDocument(documentId)
      .then((res) => setDoc(res.data))
      .catch((err) =>
        setError(err.response?.data?.detail || "Could not load this document.")
      );
  }, [documentId]);

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-10 py-16 text-center">
        <p className="text-rust font-mono text-sm mb-4">{error}</p>
        <Link to="/documents" className="text-amber hover:text-paper">
          ← Back to documents
        </Link>
      </div>
    );
  }

  if (!doc) {
    return <div className="max-w-3xl mx-auto px-10 py-16 text-muted font-mono text-sm">Loading…</div>;
  }

  const { metadata, summary, transcript } = doc;

  return (
    <div className="max-w-3xl mx-auto px-10 py-10">
      <Link to="/documents" className="text-muted hover:text-amber text-sm font-mono mb-6 inline-block">
        ← All documents
      </Link>

      <div className="flex items-start justify-between gap-4 mb-2">
        <h2 className="font-display text-3xl text-paper">
          {summary?.title || metadata.original_filename}
        </h2>
        <StatusBadge status={metadata.status} />
      </div>

      <div className="flex items-center gap-3 text-muted text-sm font-mono mb-6">
        <FileTypeIcon type={metadata.file_type} />
        {fileTypeLabel(metadata.file_type)} · {metadata.document_id}
        {metadata.language && <> · {metadata.language}</>}
      </div>

      <div className="h-10 mb-8">
        <Waveform seed={metadata.document_id} bars={56} color="amber" />
      </div>

      {metadata.status !== "ready" && (
        <div className="border border-amber/30 bg-amber/5 rounded-xl p-6 mb-6 text-center">
          <p className="text-amber font-mono text-sm">
            {metadata.status === "processing"
              ? "Still processing — check back shortly."
              : "Processing failed for this document."}
          </p>
        </div>
      )}

      {summary && (
        <>
          <Section title="Summary">{summary.summary}</Section>
          <Section title="Action Items">{summary.action_items}</Section>
          <Section title="Key Decisions">{summary.key_decisions}</Section>
          <Section title="Open Questions">{summary.open_questions}</Section>
        </>
      )}

      {transcript && (
        <div className="bg-panel border border-line rounded-xl p-6 mb-4">
          <button
            onClick={() => setShowTranscript((s) => !s)}
            className="font-mono text-xs uppercase tracking-wide text-muted hover:text-paper transition-colors"
          >
            {showTranscript ? "Hide" : "Show"} full transcript
          </button>
          {showTranscript && (
            <p className="mt-4 font-mono text-xs text-muted leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap">
              {transcript}
            </p>
          )}
        </div>
      )}

      {metadata.status === "ready" && (
        <Link
          to={`/chat?doc=${metadata.document_id}`}
          className="inline-block mt-2 bg-amber text-ink font-medium px-5 py-2.5 rounded-lg hover:bg-amber/90 transition-colors"
        >
          Chat with this document
        </Link>
      )}
    </div>
  );
}
