import { Video, AudioLines, FileText } from "lucide-react";

const CONFIG = {
  video: { Icon: Video, label: "Video" },
  audio: { Icon: AudioLines, label: "Audio" },
  pdf: { Icon: FileText, label: "PDF" },
};

export default function FileTypeIcon({ type, className = "w-4 h-4" }) {
  const { Icon } = CONFIG[type] || CONFIG.audio;
  return <Icon className={className} strokeWidth={1.75} />;
}

export function fileTypeLabel(type) {
  return (CONFIG[type] || CONFIG.audio).label;
}
