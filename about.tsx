import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Sparkles, Rocket, Accessibility, Brain, Zap, Cpu, Shield, RefreshCw,
  MessageSquare, Clock, Settings, User, Github, Linkedin, ChevronDown,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — GerberGPT" },
      { name: "description", content: "GerberGPT is an AI-powered platform making learning, productivity, and smart assistance easier for everyone." },
    ],
  }),
  component: AboutPage,
});

const missionItems = [
  { icon: Rocket, title: "Innovation", desc: "Pushing what AI can do for electronics." },
  { icon: Accessibility, title: "Accessibility", desc: "AI that anyone can pick up and use." },
  { icon: Zap, title: "Productivity", desc: "Ship circuits faster than ever." },
  { icon: Brain, title: "Intelligence", desc: "Smart assistance that learns with you." },
];

const visionFeatures = [
  { icon: MessageSquare, title: "AI Assistance" },
  { icon: Clock, title: "Fast Responses" },
  { icon: Settings, title: "Smart Automation" },
  { icon: User, title: "Personalized Experience" },
  { icon: Shield, title: "Secure & Reliable" },
  { icon: Sparkles, title: "Future AI Integrations" },
];

const whyItems = [
  "Fast and lightweight",
  "Clean user experience",
  "Modern AI technology",
  "Student-friendly",
  "Mobile optimized",
  "Constant updates",
];

const stats = [
  { label: "AI Responses Generated", value: 120000 },
  { label: "Active Users", value: 4200 },
  { label: "Projects Built", value: 980 },
  { label: "Daily Conversations", value: 15000 },
];

const testimonials = [
  { name: "Aarav S.", role: "EE Student", quote: "GerberGPT is the only AI that actually understands my projects." },
  { name: "Priya K.", role: "Maker", quote: "From idea to PCB in minutes. It feels like magic." },
  { name: "Devansh R.", role: "Hardware Engineer", quote: "Cleanest AI workspace for electronics I've used." },
];

const faqs = [
  { q: "What is GerberGPT?", a: "GerberGPT is a futuristic AI assistant for electronics, PCB design, and circuit help — built for makers, students, and engineers." },
  { q: "Is it free to use?", a: "Yes! You can start free. Paid plans (Starter, Pro, Pro Plus) unlock more messages, generations, and premium models." },
  { q: "Who can use it?", a: "Anyone from beginners learning Ohm's law to professionals shipping production boards." },
  { q: "What makes it different?", a: "A dedicated workspace for electronics, beautiful UI, and AI tuned for circuits — not a generic chatbot." },
];

function Counter({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const dur = 1600;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.floor(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <span>{n.toLocaleString()}</span>;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="font-semibold">{q}</span>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-5 text-sm text-muted-foreground">{a}</div>}
    </div>
  );
}

function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-24">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-20 left-1/3 h-96 w-96 rounded-full bg-primary/25 blur-[120px] float" />
        <div className="absolute top-40 right-1/4 h-80 w-80 rounded-full bg-accent/25 blur-[120px] float" style={{ animationDelay: "1.5s" }} />

        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs">
            <Sparkles className="h-3 w-3 text-primary" /> Our story
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4 text-5xl md:text-7xl font-bold tracking-tight">
            About <span className="gradient-text">GerberGPT</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            GerberGPT is an AI-powered platform designed to make learning, productivity, and smart assistance easier for everyone — from students to seasoned engineers.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8">
            <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-6 py-3 font-semibold text-primary-foreground glow-primary hover:scale-105 transition">
              Try GerberGPT
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold">Our <span className="gradient-text">mission</span></h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">Simplify AI for students, creators, and everyday users — with accessibility, speed, creativity, and innovation at the core.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {missionItems.map((m, i) => (
              <motion.div key={m.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="glass rounded-2xl p-6 hover:glow-primary transition">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
                  <m.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-bold">{m.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{m.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-4xl font-bold text-center">Our <span className="gradient-text">story</span></h2>
          <div className="mt-10 space-y-4">
            {[
              { y: "Day 0", t: "A passion project", d: "GerberGPT started as a side project to build a smarter, friendlier AI assistant for makers." },
              { y: "Today", t: "A growing toolkit", d: "Chat, PCB generation, and electronics help — all in one polished workspace." },
              { y: "Soon", t: "Expanding horizons", d: "Component libraries, schematic import, and team collaboration features are on the roadmap." },
            ].map((s, i) => (
              <motion.div key={s.t} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass-strong rounded-2xl p-6 flex gap-4">
                <div className="w-20 text-xs font-mono text-primary uppercase">{s.y}</div>
                <div>
                  <h3 className="font-bold">{s.t}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{s.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features & vision */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-4xl font-bold text-center">Features & <span className="gradient-text">vision</span></h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visionFeatures.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="group glass rounded-2xl p-6 hover:glow-accent transition hover:-translate-y-1">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent/30 to-primary/20 border border-accent/30">
                  <f.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mt-4 font-bold">{f.title}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-4xl font-bold text-center">Why choose <span className="gradient-text">GerberGPT</span></h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {whyItems.map((w, i) => (
              <motion.div key={w} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} className="glass rounded-xl p-4 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary glow-primary" />
                <span className="font-medium">{w}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Creator */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4">
          <div className="glass-strong rounded-3xl p-10 text-center glow-primary">
            <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
              <Cpu className="h-12 w-12 text-primary-foreground" />
            </div>
            <h3 className="mt-6 text-2xl font-bold">Built with passion for the future of AI</h3>
            <p className="mt-2 text-muted-foreground">By the GerberGPT team</p>
            <div className="mt-6 flex justify-center gap-3">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="glass rounded-full p-3 hover:glow-primary transition"><Github className="h-5 w-5" /></a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="glass rounded-full p-3 hover:glow-primary transition"><Linkedin className="h-5 w-5" /></a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="glass-strong rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold gradient-text"><Counter to={s.value} />+</div>
              <div className="mt-2 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-4xl font-bold text-center">Loved by <span className="gradient-text">creators</span></h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="glass rounded-2xl p-6 hover:glow-primary transition hover:-translate-y-1">
                <p className="text-sm">"{t.quote}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent" />
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-4xl font-bold text-center">Frequently asked</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((f) => <FaqItem key={f.q} {...f} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="relative overflow-hidden rounded-3xl glass-strong p-12 md:p-16 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-accent/30" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold">Experience the Future of AI<br />with <span className="gradient-text">GerberGPT</span></h2>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/login" className="rounded-full bg-gradient-to-r from-primary to-accent px-6 py-3 font-semibold text-primary-foreground glow-primary">Get Started</Link>
                <Link to="/pricing" className="rounded-full glass px-6 py-3 font-semibold">Learn More</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
