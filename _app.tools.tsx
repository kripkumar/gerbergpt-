import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MessageSquare, CircuitBoard, Zap, Sparkles, ArrowRight, FileSearch, FileCog } from "lucide-react";

export const Route = createFileRoute("/_app/tools")({
  head: () => ({ meta: [{ title: "AI Tools — GerberGPT" }] }),
  component: ToolsPage,
});

const tools = [
  { to: "/chat", label: "AI Chat", desc: "General-purpose assistant for ideas, explanations, and quick answers.", icon: MessageSquare, tag: "Chatbot" },
  { to: "/pcb", label: "PCB Generation", desc: "Describe a circuit and get a BOM, schematic and board layout plan.", icon: CircuitBoard, tag: "Design" },
  { to: "/electronics", label: "Electronics Helper", desc: "Formulas, component picking, circuit debugging with code blocks.", icon: Zap, tag: "Helper" },
  { to: "/analyser", label: "Gerber Analyser", desc: "Upload a Gerber/KiCad file — AI inspects layers, components, and DRC.", icon: FileSearch, tag: "Analyse" },
  { to: "/generator", label: "Gerber Generator", desc: "Describe a PCB. Download as JSON, PDF, Gerber, or KiCad.", icon: FileCog, tag: "Generate" },
] as const;

function ToolsPage() {
  return (
    <div className="px-6 md:px-10 py-10 max-w-6xl mx-auto">
      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground glass rounded-full px-3 py-1">
        <Sparkles className="h-3 w-3 text-primary" /> AI TOOLKIT
      </div>
      <h1 className="mt-3 text-3xl md:text-4xl font-bold">All AI Tools</h1>
      <p className="mt-2 text-muted-foreground">Every GerberGPT assistant in one place.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((t, i) => {
          const Icon = t.icon;
          return (
            <motion.div
              key={t.to}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                to={t.to}
                className="group block glass rounded-2xl p-6 border border-border/40 hover:border-primary/40 transition h-full"
              >
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.tag}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{t.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm text-primary group-hover:gap-2 transition-all">
                  Open <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
