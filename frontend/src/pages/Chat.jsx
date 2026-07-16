import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Send } from "lucide-react";
import { listDocuments, askQuestion } from "../services/api";
import Waveform from "../components/Waveform";

export default function Chat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const preselected = searchParams.get("doc");

  const [documents, setDocuments] = useState([]);
  const [documentId, setDocumentId] = useState(preselected || "");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]); // {role, content}
  const [asking, setAsking] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    listDocuments().then((res) => {
      const ready = res.data.documents.filter((d) => d.status === "ready");
      setDocuments(ready);
      if (!documentId && ready.length > 0) setDocumentId(ready[0].document_id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, asking]);

  function selectDocument(id) {
    setDocumentId(id);
    setMessages([]);
    setSearchParams(id ? { doc: id } : {});
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!question.trim() || !documentId) return;
    const q = question.trim();
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setQuestion("");
    setAsking(true);
    try {
      const res = await askQuestion(documentId, q);
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.answer }]);
    } catch (err) {
      const detail = err.response?.data?.detail || "Something went wrong answering that.";
      setMessages((prev) => [...prev, { role: "assistant", content: detail, isError: true }]);
    } finally {
      setAsking(false);
    }
  }

  const activeDoc = documents.find((d) => d.document_id === documentId);

  return (
    <div className="max-w-3xl mx-auto px-10 py-10 flex flex-col h-[calc(100vh-2.5rem)]">
      <div className="mb-6">
        <h2 className="font-display text-3xl text-paper mb-4">Chat</h2>

        {documents.length === 0 ? (
          <p className="text-muted font-mono text-sm">
            No documents are ready to chat with yet. Upload one first.
          </p>
        ) : (
          <select
            value={documentId}
            onChange={(e) => selectDocument(e.target.value)}
            className="w-full bg-panel border border-line rounded-lg px-4 py-2.5 text-paper font-mono text-sm focus:border-amber outline-none"
          >
            {documents.map((d) => (
              <option key={d.document_id} value={d.document_id}>
                {d.original_filename} · {d.document_id}
              </option>
            ))}
          </select>
        )}
      </div>

      {activeDoc && (
        <>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {messages.length === 0 && (
              <div className="border border-dashed border-line rounded-xl p-6 text-center">
                <div className="h-8 mb-3 max-w-[200px] mx-auto">
                  <Waveform seed={activeDoc.document_id} bars={30} color="muted" />
                </div>
                <p className="text-muted text-sm">
                  Ask anything about <span className="text-paper">{activeDoc.original_filename}</span>.
                  Answers are grounded only in this document's transcript.
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-amber/15 border border-amber/30 text-paper"
                      : m.isError
                      ? "bg-rust/10 border border-rust/30 text-rust"
                      : "bg-panel border border-line text-paper"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {asking && (
              <div className="flex justify-start">
                <div className="bg-panel border border-line rounded-xl px-4 py-3">
                  <div className="h-4 w-16">
                    <Waveform seed="thinking" bars={8} animated color="amber" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 pt-4">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What did we decide about the budget?"
              className="flex-1 bg-panel border border-line rounded-lg px-4 py-3 text-paper placeholder:text-muted text-sm focus:border-amber outline-none"
            />
            <button
              type="submit"
              disabled={!question.trim() || asking}
              className="bg-amber text-ink px-4 rounded-lg hover:bg-amber/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" strokeWidth={2} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
