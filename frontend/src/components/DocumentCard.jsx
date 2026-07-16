import { Link } from "react-router-dom";
import Waveform from "./Waveform";
import StatusBadge from "./StatusBadge";
import FileTypeIcon, { fileTypeLabel } from "./FileTypeIcon";

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function DocumentCard({ doc, onDelete }) {
  const title = doc.original_filename || doc.document_id;

  return (
    <div className="group relative bg-panel border border-line rounded-xl p-5 hover:border-amber/40 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-muted">
          <FileTypeIcon type={doc.file_type} />
          <span className="font-mono text-xs uppercase tracking-wide">
            {fileTypeLabel(doc.file_type)}
          </span>
        </div>
        <StatusBadge status={doc.status} />
      </div>

      <h3 className="font-display text-lg text-paper mb-1 truncate" title={title}>
        {title}
      </h3>
      <p className="font-mono text-xs text-muted mb-4">
        {doc.document_id} · {formatDate(doc.created_at)}
      </p>

      <div className="h-10 mb-4">
        <Waveform seed={doc.document_id} bars={36} color={doc.status === "ready" ? "amber" : "muted"} />
      </div>

      <div className="flex items-center gap-3 text-sm font-medium">
        <Link
          to={`/documents/${doc.document_id}`}
          className="text-paper hover:text-amber transition-colors"
        >
          View summary
        </Link>
        <span className="text-line">/</span>
        <Link
          to={`/chat?doc=${doc.document_id}`}
          className={`transition-colors ${
            doc.status === "ready" ? "text-paper hover:text-amber" : "text-muted pointer-events-none"
          }`}
        >
          Chat
        </Link>
        {onDelete && (
          <button
            onClick={() => onDelete(doc.document_id)}
            className="ml-auto text-muted hover:text-rust transition-colors text-xs font-mono"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
