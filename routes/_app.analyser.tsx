import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { Upload, Sparkles, Loader2, FileText, Send } from "lucide-react";
import { chatComplete } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/analyser")({
  head: () => ({ meta: [{ title: "Gerber Analyser — GerberGPT" }] }),
  component: AnalyserPage,
});

function AnalyserPage() {
  const ai = useServerFn(chatComplete);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileText, setFileText] = useState<string>("");
  const [question, setQuestion] = useState("Analyse this file end-to-end.");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = async (f: File | null) => {
    if (!f) return;
    if (f.size > 2_000_000) { toast.error("File too large (max 2MB)"); return; }
    const text = await f.text();
    setFileName(f.name);
    setFileText(text.slice(0, 100_000));
  };

  const analyse = async () => {
    if (!fileText) { toast.error("Upload a Gerber/PCB file first"); return; }
    setLoading(true); setResult("");
    try {
      const { reply } = await ai({ data: {
        mode: "analyser",
        messages: [{ role: "user", content: `Filename: ${fileName}\n\nUser request: ${question}\n\n--- FILE START ---\n${fileText}\n--- FILE END ---` }],
      }});
      setResult(reply);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="px-6 md:px-10 py-8 max-w-5xl mx-auto">
      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground glass rounded-full px-3 py-1">
        <Sparkles className="h-3 w-3 text-primary" /> ANALYSER MODE
      </div>
      <h1 className="mt-2 text-2xl md:text-3xl font-bold">Gerber Analyser</h1>
      <p className="text-sm text-muted-foreground">Upload a Gerber, Excellon, or KiCad PCB file. The AI inspects it and reports findings.</p>

      <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="mt-6 glass-strong rounded-2xl p-6 border border-border/40">
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-border/60 rounded-xl py-10 flex flex-col items-center gap-2 hover:border-primary/50 transition"
        >
          <Upload className="h-8 w-8 text-primary" />
          <span className="text-sm">{fileName ?? "Click to upload .gbr / .drl / .kicad_pcb / .zip-extracted file"}</span>
          {fileName && <span className="text-xs text-muted-foreground">{(fileText.length/1024).toFixed(1)} KB loaded</span>}
        </button>
        <input ref={inputRef} type="file" hidden onChange={(e) => onFile(e.target.files?.[0] ?? null)} accept=".gbr,.ger,.gtl,.gbl,.gto,.gbo,.gts,.gbs,.drl,.xln,.kicad_pcb,.txt,.json" />

        <div className="mt-4 glass rounded-xl p-2 flex items-end gap-2">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            placeholder="What should the AI look for?"
            className="flex-1 bg-transparent resize-none outline-none px-3 py-2 text-sm"
          />
          <button onClick={analyse} disabled={loading || !fileText} className="h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground glow-primary disabled:opacity-50 text-sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Analyse
          </button>
        </div>
      </motion.div>

      {result && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="mt-6 glass rounded-2xl p-6 border border-border/40">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3"><FileText className="h-4 w-4" /> Analysis</div>
          <div className="text-sm whitespace-pre-wrap leading-relaxed">{result}</div>
        </motion.div>
      )}

      <p className="mt-6 text-xs text-muted-foreground text-center">⚠️ AI can make mistakes. Always verify generated and analysed designs before manufacture.</p>
    </div>
  );
}
