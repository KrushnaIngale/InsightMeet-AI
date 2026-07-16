import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Chat from "./pages/Chat";
import DocumentList from "./pages/DocumentList";
import MeetingSummary from "./pages/MeetingSummary";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-ink">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/documents" element={<DocumentList />} />
            <Route path="/documents/:documentId" element={<MeetingSummary />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
