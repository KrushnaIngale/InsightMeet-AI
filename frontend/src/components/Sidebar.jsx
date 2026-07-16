import { NavLink } from "react-router-dom";
import { LayoutGrid, UploadCloud, MessageSquare, FolderOpen } from "lucide-react";
import Waveform from "./Waveform";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/upload", label: "Upload", icon: UploadCloud },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/documents", label: "Documents", icon: FolderOpen },
];

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col bg-panel border-r border-line">
      <div className="px-6 pt-7 pb-6 border-b border-line">
        <div className="h-8 mb-3">
          <Waveform seed="insightmeet-ai" bars={22} color="amber" />
        </div>
        <h1 className="font-display text-xl text-paper leading-none">
          InsightMeet
        </h1>
        <p className="font-mono text-[11px] text-muted mt-1 tracking-wide">
          AI MEETING INTELLIGENCE
        </p>
      </div>

      <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-raised text-amber"
                  : "text-muted hover:text-paper hover:bg-raised/60"
              }`
            }
          >
            <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-5 border-t border-line">
        <p className="font-mono text-[11px] text-muted leading-relaxed">
          Groq · Sarvam · Mistral
          <br />
          ChromaDB + LangChain
        </p>
      </div>
    </aside>
  );
}
