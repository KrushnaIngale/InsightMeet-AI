/**
 * Waveform — the app's signature visual motif.
 *
 * Static mode: bars are deterministically derived from `seed` (usually a
 * document_id or title), so every document gets its own stable "fingerprint"
 * wherever it appears (cards, lists, detail headers) — never random on
 * re-render, always the same shape for the same document.
 *
 * Animated mode (`animated`): used as the processing/loading indicator
 * while a document is being transcribed, echoing an audio meter.
 */

function seededBars(seed, count) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const bars = [];
  for (let i = 0; i < count; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const pct = 22 + (h % 1000) / 1000 * 78; // 22%–100%
    bars.push(pct);
  }
  return bars;
}

export default function Waveform({
  seed = "insightmeet",
  bars = 28,
  className = "",
  color = "amber",
  animated = false,
}) {
  const heights = seededBars(seed, bars);
  const colorClass = {
    amber: "bg-amber",
    teal: "bg-teal",
    muted: "bg-muted",
    paper: "bg-paper",
  }[color] || "bg-amber";

  return (
    <div className={`flex items-end gap-[3px] h-full ${className}`} aria-hidden="true">
      {heights.map((h, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full ${colorClass} ${animated ? "animate-pulse" : ""}`}
          style={{
            height: `${h}%`,
            opacity: animated ? undefined : 0.55 + (h / 100) * 0.45,
            animationDelay: animated ? `${(i % 7) * 90}ms` : undefined,
            animationDuration: animated ? "900ms" : undefined,
          }}
        />
      ))}
    </div>
  );
}
