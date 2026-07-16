const STYLES = {
  ready: "text-teal border-teal/40 bg-teal/10",
  processing: "text-amber border-amber/40 bg-amber/10",
  failed: "text-rust border-rust/40 bg-rust/10",
};

const LABELS = {
  ready: "Ready",
  processing: "Processing",
  failed: "Failed",
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || STYLES.processing;
  const label = LABELS[status] || status;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono uppercase tracking-wide ${style}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
