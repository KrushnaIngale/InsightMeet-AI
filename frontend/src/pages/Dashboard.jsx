import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listDocuments } from "../services/api";
import DocumentCard from "../components/DocumentCard";
import Waveform from "../components/Waveform";

function StatCard({ label, value, color = "paper" }) {
  return (
    <div className="bg-panel border border-line rounded-xl p-5">
      <p className="font-mono text-xs uppercase tracking-wide text-muted mb-2">{label}</p>
      <p className={`font-display text-4xl text-${color}`}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    listDocuments()
      .then((res) => setDocuments(res.data.documents))
      .catch(() => setError("Could not reach the backend. Is the API running?"))
      .finally(() => setLoading(false));
  }, []);

  const ready = documents.filter((d) => d.status === "ready").length;
  const processing = documents.filter((d) => d.status === "processing").length;
  const failed = documents.filter((d) => d.status === "failed").length;

  return (
    <div className="max-w-6xl mx-auto px-10 py-10">
      {/* Hero */}
      <div className="mb-10">
        <div className="h-14 mb-4 w-full max-w-xl">
          <Waveform seed="dashboard-hero" bars={64} color="amber" />
        </div>
        <h2 className="font-display text-3xl text-paper mb-2">
          Every meeting, indexed and searchable.
        </h2>
        <p className="text-muted max-w-xl">
          Upload a recording, a YouTube link, or a PDF. InsightMeet transcribes it,
          pulls out the decisions and action items, and turns it into something
          you can ask questions of later.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total documents" value={documents.length} />
        <StatCard label="Ready" value={ready} color="teal" />
        <StatCard label="Processing" value={processing} color="amber" />
        <StatCard label="Failed" value={failed} color="rust" />
      </div>

      {/* Recent documents */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl text-paper">Recent documents</h3>
        <Link to="/documents" className="text-sm text-amber hover:text-paper transition-colors">
          View all →
        </Link>
      </div>

      {loading && <p className="text-muted font-mono text-sm">Loading…</p>}
      {error && <p className="text-rust font-mono text-sm">{error}</p>}

      {!loading && !error && documents.length === 0 && (
        <div className="border border-dashed border-line rounded-xl p-10 text-center">
          <p className="text-muted mb-4">No documents yet. Upload your first meeting to get started.</p>
          <Link
            to="/upload"
            className="inline-block bg-amber text-ink font-medium px-5 py-2.5 rounded-lg hover:bg-amber/90 transition-colors"
          >
            Upload a document
          </Link>
        </div>
      )}

      {!loading && documents.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.slice(0, 6).map((doc) => (
            <DocumentCard key={doc.document_id} doc={doc} />
          ))}
        </div>
      )}
    </div>
  );
}
