import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { chatComplete } from "@/lib/ai.functions";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

export function ChatUI({ mode, title, subtitle, placeholder }: { mode: "chat" | "pcb" | "electronics"; title: string; subtitle: string; placeholder: string }) {
  const ai = useServerFn(chatComplete);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: input.trim() }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { reply } = await ai({ data: { messages: next, mode } });
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e: any) {
      toast.error(e.message ?? "AI failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] md:h-screen">
      <div className="px-6 md:px-10 py-6 border-b border-border/40">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground glass rounded-full px-3 py-1">
          <Sparkles className="h-3 w-3 text-primary" /> {mode.toUpperCase()} MODE
        </div>
        <h1 className="mt-2 text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground mt-20">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent glow-primary mx-auto">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <p className="mt-4">Start the conversation.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-3xl ${m.role === "user" ? "ml-auto" : ""}`}
          >
            <div className={`rounded-2xl px-4 py-3 ${
              m.role === "user"
                ? "bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/30"
                : "glass"
            }`}>
              <div className="text-xs text-muted-foreground mb-1">{m.role === "user" ? "You" : "GerberGPT"}</div>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="max-w-3xl glass rounded-2xl px-4 py-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="px-4 md:px-10 py-4 border-t border-border/40">
        <div className="max-w-3xl mx-auto glass-strong rounded-2xl p-2 flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1}
            placeholder={placeholder}
            className="flex-1 bg-transparent resize-none outline-none px-3 py-2 text-sm max-h-40"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground glow-primary disabled:opacity-50"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">⚠️ GerberGPT can make mistakes. Verify critical info.</p>
      </div>
    </div>
  );
}
