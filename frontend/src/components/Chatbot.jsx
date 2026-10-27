import { MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api, { getErrorMessage } from "../services/api";

export default function Chatbot({ project }) {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const scrollRef = useRef(null);

  // reset the visible thread (not server history) when navigating to a new project
  useEffect(() => {
    setMessages([]);
    setConversationId(null);
  }, [location.pathname]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  if (!user) return null;

  async function sendMessage(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setSending(true);

    try {
      const res = await api.post("/chat", {
        message: text,
        project_id: project?.id || null,
        conversation_id: conversationId,
      });
      setConversationId(res.data.conversation_id);
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, I ran into an issue: ${getErrorMessage(err)}` },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-[340px] sm:w-[380px] h-[480px] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-fade-up">
          <div className="bg-gradient-brand text-white px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-display font-semibold text-sm">ProjectMentor Assistant</p>
              <p className="text-xs text-white/80">
                {project ? `Talking about: ${project.title}` : "Ask me anything about your projects"}
              </p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat">
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50">
            {messages.length === 0 && (
              <p className="text-sm text-slate-400 text-center mt-8">
                Ask about requirements, tech alternatives, datasets, research papers, or if you're stuck.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] text-sm rounded-2xl px-3.5 py-2 whitespace-pre-wrap ${
                    m.role === "user" ? "bg-indigo-600 text-white rounded-br-sm" : "bg-white border border-slate-100 text-slate-700 rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="p-3 border-t border-slate-100 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 text-sm px-3.5 py-2.5 rounded-full border border-slate-200 focus:border-indigo-400 outline-none"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="w-10 h-10 rounded-full bg-gradient-brand text-white flex items-center justify-center disabled:opacity-40 shrink-0"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="w-14 h-14 rounded-full bg-gradient-brand text-white shadow-soft flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Open chat assistant"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
