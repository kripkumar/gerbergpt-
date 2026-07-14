import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, CircuitBoard, Zap, Sparkles, ArrowRight, FileSearch, FileCog, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — GerberGPT" }] }),
  component: Dashboard,
});

const tools = [
  { to: "/chat", icon: MessageSquare, title: "AI Chat", desc: "Ask anything about electronics.", color: "from-primary/20 to-cyan-500/10" },
  { to: "/pcb", icon: CircuitBoard, title: "PCB Mode", desc: "Generate board layouts from prompts.", color: "from-accent/20 to-pink-500/10" },
  { to: "/electronics", icon: Zap, title: "Electronics Helper", desc: "Components, formulas, debugging.", color: "from-yellow-500/20 to-amber-500/10" },
  { to: "/analyser", icon: FileSearch, title: "Gerber Analyser", desc: "Upload a Gerber/KiCad file for AI review.", color: "from-emerald-500/20 to-cyan-500/10" },
  { to: "/generator", icon: FileCog, title: "Gerber Generator", desc: "Describe a PCB, download real Gerber ZIP.", color: "from-fuchsia-500/20 to-violet-500/10" },
] as const;

type Sub = { plan: string; generations_used: number; generations_remaining: number; expires_at: string | null; payment_status: string };

function Dashboard() {
  const [sub, setSub] = useState<Sub | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { setIsGuest(true); return; }
      const { data: s } = await (supabase.from as any)("user_subscriptions").select("plan,generations_used,generations_remaining,expires_at,payment_status").maybeSingle();
      if (s) setSub(s as Sub);
    })();
  }, []);

  const stats = isGuest
    ? [
        { label: "Mode", value: "Guest" },
        { label: "Session PCBs", value: "∞" },
        { label: "Plan", value: "Free" },
        { label: "Saved", value: "Temporary" },
      ]
    : [
        { label: "Plan", value: (sub?.plan ?? "free").toUpperCase() },
        { label: "PCBs used", value: String(sub?.generations_used ?? 0) },
        { label: "Remaining", value: String(sub?.generations_remaining ?? 0) },
        { label: "Renews", value: sub?.expires_at ? new Date(sub.expires_at).toLocaleDateString() : "—" },
      ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" /> Welcome to GerberGPT
        </div>
        <h1 className="mt-3 text-4xl font-bold">Your <span className="gradient-text">workspace</span></h1>
        <p className="mt-2 text-muted-foreground">Pick a tool to get started.</p>
      </motion.div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-2xl p-5">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
            <div className="mt-1 text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {sub && sub.plan === "free" && !isGuest && (
        <Link to="/pricing" className="mt-6 block glass-strong rounded-2xl p-5 border border-primary/30 hover:border-primary/60 transition">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-amber-400" />
            <div className="flex-1">
              <div className="font-semibold">Upgrade for more PCB generations</div>
              <div className="text-xs text-muted-foreground">Starter ₹200 · Pro ₹600 · Ultra ₹800 — unlock unlimited AI memory, cloud storage & advanced repair.</div>
            </div>
            <ArrowRight className="h-5 w-5 text-primary" />
          </div>
        </Link>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {tools.map((t, i) => (
          <motion.div key={t.to} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={t.to} className="block group">
              <div className={`glass-strong rounded-2xl p-6 h-full hover:glow-primary transition-all hover:-translate-y-1 bg-gradient-to-br ${t.color}`}>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
                  <t.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="mt-4 text-xl font-bold">{t.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm text-primary font-semibold">
                  Open <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
