import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Cpu, MessageSquare, CircuitBoard, Zap, Sparkles, Shield, Rocket, Check, ArrowRight, X, User, UserPlus } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GerberGPT — AI Electronics & PCB Assistant" },
      { name: "description", content: "Design PCBs, debug circuits, and learn electronics with a futuristic AI assistant. Try GerberGPT today." },
    ],
  }),
  component: IndexPage,
});

const features = [
  { icon: MessageSquare, title: "AI Chatbot", desc: "Conversational electronics expert at your fingertips, 24/7." },
  { icon: CircuitBoard, title: "PCB Generation", desc: "Describe a circuit, get a board layout sketch in seconds." },
  { icon: Zap, title: "Electronics Helper", desc: "Component picks, Ohm's law, datasheet lookups, debugging." },
  { icon: Sparkles, title: "Smart Suggestions", desc: "AI proposes optimizations for power, routing, and BOM." },
  { icon: Shield, title: "Secure & Private", desc: "Your projects are encrypted and never shared." },
  { icon: Rocket, title: "Built for Makers", desc: "From hobbyists to startups — scale with confidence." },
];

function IndexPage() {
  const [startOpen, setStartOpen] = useState(false);
  const navigate = useNavigate();
  const continueAsGuest = () => {
    if (typeof window !== "undefined") window.localStorage.setItem("gerbergpt_guest", "1");
    setStartOpen(false);
    navigate({ to: "/dashboard" });
  };
  return (
    <div className="min-h-screen">
      <Navbar />

      <AnimatePresence>
        {startOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center px-4">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="glass-strong rounded-3xl p-8 max-w-lg w-full relative">
              <button onClick={() => setStartOpen(false)} className="absolute top-4 right-4 opacity-70 hover:opacity-100"><X /></button>
              <h2 className="text-2xl font-bold text-center">Get started with <span className="gradient-text">GerberGPT</span></h2>
              <p className="text-sm text-muted-foreground text-center mt-2">Choose how you want to design PCBs today.</p>

              <div className="mt-6 space-y-3">
                <button onClick={() => { setStartOpen(false); navigate({ to: "/login" }); }}
                  className="w-full glass rounded-2xl p-5 text-left hover:border-primary/60 border border-border/40 transition group">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center"><UserPlus className="h-5 w-5 text-primary-foreground" /></div>
                    <div className="flex-1">
                      <div className="font-semibold flex items-center gap-2">Sign in / Create Account <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" /></div>
                      <div className="text-xs text-muted-foreground mt-1">Unlock saved projects, chat history, AI memory, cloud storage, revision history & subscription plans.</div>
                    </div>
                  </div>
                </button>

                <button onClick={continueAsGuest}
                  className="w-full glass rounded-2xl p-5 text-left hover:border-primary/40 border border-border/40 transition group">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl glass-strong flex items-center justify-center"><User className="h-5 w-5 text-primary" /></div>
                    <div className="flex-1">
                      <div className="font-semibold flex items-center gap-2">Continue as Guest <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" /></div>
                      <div className="text-xs text-muted-foreground mt-1">Full PCB generation, AI Repair & all exports. Projects are temporary — no chat history, no cloud sync.</div>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-32">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-primary/30 blur-[120px]" />
        <div className="absolute top-40 right-10 h-72 w-72 rounded-full bg-accent/30 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs"
          >
            <span className="h-2 w-2 rounded-full bg-primary pulse-glow" />
            <span className="text-muted-foreground">Now live — AI for electronics</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-5xl md:text-7xl font-bold tracking-tight"
          >
            Design circuits<br />
            <span className="gradient-text">at the speed of thought.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground"
          >
            GerberGPT is the futuristic AI assistant for PCB generation, electronics help, and circuit debugging — all in one beautiful workspace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex flex-wrap gap-3 justify-center"
          >
            <button onClick={() => setStartOpen(true)} className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-8 py-4 text-lg font-semibold text-primary-foreground glow-primary hover:scale-105 transition">
              Get Started <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition" />
            </button>
            <Link to="/pricing" className="rounded-full glass-strong px-6 py-4 font-semibold hover:bg-white/5 transition">
              View pricing
            </Link>
          </motion.div>

          {/* Floating preview card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-20 mx-auto max-w-4xl"
          >
            <div className="glass-strong rounded-3xl p-2 glow-primary">
              <div className="rounded-2xl bg-background/80 p-6 md:p-10 text-left">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-3 w-3 rounded-full bg-red-500/70" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                  <div className="h-3 w-3 rounded-full bg-green-500/70" />
                  <span className="ml-auto text-xs text-muted-foreground font-mono">gerbergpt.ai/chat</span>
                </div>
                <div className="space-y-4 font-mono text-sm">
                  <div className="text-muted-foreground">→ Design a 555 timer astable for 1 Hz blink</div>
                  <div className="glass rounded-xl p-4 text-foreground">
                    <span className="gradient-text font-bold">GerberGPT:</span> Using R1=10kΩ, R2=68kΩ, C=10µF gives ~1 Hz. Generating PCB layout… <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">Everything you need to <span className="gradient-text">build smarter</span></h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">A complete toolkit for the modern electronics designer.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group glass rounded-2xl p-6 hover:glow-primary transition-all hover:-translate-y-1"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-xl font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-4">
          <div className="relative overflow-hidden rounded-3xl glass-strong p-12 md:p-16 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold">Ready to ship faster?</h2>
              <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Join makers and engineers using GerberGPT to design, debug, and document electronics.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/login" className="rounded-full bg-gradient-to-r from-primary to-accent px-6 py-3 font-semibold text-primary-foreground glow-primary">
                  Start free
                </Link>
                <Link to="/pricing" className="rounded-full glass px-6 py-3 font-semibold">See plans</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
