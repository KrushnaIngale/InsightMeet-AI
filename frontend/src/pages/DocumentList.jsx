import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listDocuments, deleteDocument } from "../services/api";
import DocumentCard from "../components/DocumentCard";

export default function DocumentList() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  function refresh() {
    setLoading(true);
    listDocuments()
      .then((res) => setDocuments(res.data.documents))
      .catch(() => setError("Could not reach the backend. Is the API running?"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function confirmDelete(id) {
    await deleteDocument(id);
    setPendingDelete(null);
    refresh();
  }

  return (
    <div className="max-w-6xl mx-auto px-10 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-3xl text-paper mb-2">Documents</h2>
          <p className="text-muted">Every meeting and file you've processed.</p>
        </div>
        <Link
          to="/upload"
          className="bg-amber text-ink font-medium px-5 py-2.5 rounded-lg hover:bg-amber/90 transition-colors whitespace-nowrap"
        >
          Upload new
        </Link>
      </div>

      {loading && <p className="text-muted font-mono text-sm">Loading…</p>}
      {error && <p className="text-rust font-mono text-sm">{error}</p>}

      {!loading && !error && documents.length === 0 && (
        <div className="border border-dashed border-line rounded-xl p-10 text-center">
          <p className="text-muted">No documents yet.</p>
        </div>
      )}

      {!loading && documents.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <DocumentCard key={doc.document_id} doc={doc} onDelete={() => setPendingDelete(doc.document_id)} />
          ))}
        </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 bg-ink/80 flex items-center justify-center px-4 z-50">
          <div className="bg-panel border border-line rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-display text-lg text-paper mb-2">Delete this document?</h3>
            <p className="text-muted text-sm mb-6">
              This removes the source file, transcript, summary, and search index for{" "}
              <span className="font-mono text-paper">{pendingDelete}</span>. This can't be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setPendingDelete(null)}
                className="px-4 py-2 rounded-lg text-sm text-muted hover:text-paper transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(pendingDelete)}
                className="px-4 py-2 rounded-lg text-sm bg-rust text-paper font-medium hover:bg-rust/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
