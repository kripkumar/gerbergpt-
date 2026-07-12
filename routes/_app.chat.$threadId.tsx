import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getMessages, sendThreadMessage } from "@/lib/chat.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/chat/$threadId")({
  component: ThreadPage,
});

type LocalMsg = { role: "user" | "assistant"; content: string; pending?: boolean };

function ThreadPage() {
  const { threadId } = Route.useParams();
  const fetchMessages = useServerFn(getMessages);
  const sendFn = useServerFn(sendThreadMessage);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["chat-messages", threadId],
    queryFn: () => fetchMessages({ data: { threadId } }),
  });

  const [pending, setPending] = useState<LocalMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // reset local pending when thread changes
  useEffect(() => { setPending([]); }, [threadId]);

  const merged: LocalMsg[] = [
    ...((data?.messages ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))),
    ...pending,
  ];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [merged.length, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setPending([{ role: "user", content: text }]);
    try {
      await sendFn({ data: { threadId, content: text } });
      setPending([]);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["chat-messages", threadId] }),
        qc.invalidateQueries({ queryKey: ["chat-threads"] }),
      ]);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
      setPending([]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="px-6 md:px-10 py-5 border-b border-border/40">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground glass rounded-full px-3 py-1">
          <Sparkles className="h-3 w-3 text-primary" /> CHAT
        </div>
        <h1 className="mt-2 text-xl font-bold">GerberGPT</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 space-y-4">
        {isLoading && (
          <div className="text-center text-muted-foreground text-sm inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading conversation…
          </div>
        )}
        {!isLoading && merged.length === 0 && (
          <div className="text-center text-muted-foreground mt-20">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent glow-primary mx-auto">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <p className="mt-4">Ask anything about PCBs, electronics, or Gerber files.</p>
          </div>
        )}
        {merged.map((m, i) => (
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
              <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none prose-pre:bg-black/40 prose-pre:border prose-pre:border-border/40">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
        {sending && (
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
            placeholder="Ask GerberGPT anything…"
            className="flex-1 bg-transparent resize-none outline-none px-3 py-2 text-sm max-h-40"
          />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
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
