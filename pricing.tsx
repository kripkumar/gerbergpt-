import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — GerberGPT" },
      { name: "description", content: "GerberGPT plans: Starter ₹200, Pro ₹600, Ultra ₹800." },
    ],
  }),
  component: PricingPage,
});

const plans = [
  {
    name: "Starter",
    price: "₹200",
    period: "/month",
    desc: "Perfect for hobbyists exploring AI PCB design.",
    features: [
      "20 PCB generations / month",
      "AI Repair Mode",
      "Gerber + KiCad + EasyEDA export",
      "Chat history + saved projects",
      "Email support",
    ],
    cta: "Get Starter",
    highlight: false,
  },
  {
    name: "Pro",
    price: "₹600",
    period: "/month",
    desc: "For serious makers and small teams.",
    features: [
      "100 PCB generations / month",
      "AI Repair + Physics-aware routing",
      "Priority AI responses",
      "Cloud project storage + revision history",
      "AI project memory",
      "Priority email support",
    ],
    cta: "Get Pro",
    highlight: true,
  },
  {
    name: "Ultra",
    price: "₹800",
    period: "/month",
    desc: "Unlimited power for professionals.",
    features: [
      "Unlimited PCB generations",
      "Full AI engineering engine",
      "Signal integrity + thermal analysis",
      "All premium exports",
      "Dedicated support",
    ],
    cta: "Get Ultra",
    highlight: false,
  },
];

function PricingPage() {
  const mailto = (plan: string, price: string) =>
    `mailto:gerbergpt143@gmail.com?subject=${encodeURIComponent(`Subscribe to ${plan} plan (${price})`)}&body=${encodeURIComponent(`Hi,\n\nI would like to subscribe to the GerberGPT ${plan} plan (${price}/month).\n\nMy account email: \nUPI / Payment reference: \n\nThanks!`)}`;

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative pt-16 pb-12">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs">
            <Sparkles className="h-3 w-3 text-primary" /> Simple pricing
          </div>
          <h1 className="mt-4 text-5xl md:text-6xl font-bold">Plans for every <span className="gradient-text">maker</span></h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Guests get 3 free PCB generations per session. Upgrade for permanent storage, chat history & AI memory.
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 grid gap-6 md:grid-cols-3">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`relative rounded-3xl p-8 ${p.highlight ? "glass-strong glow-primary border-primary/40" : "glass"}`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-accent px-3 py-1 text-xs font-bold text-primary-foreground">
                  Most popular
                </div>
              )}
              <h3 className="text-2xl font-bold">{p.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-bold gradient-text">{p.price}</span>
                <span className="text-muted-foreground">{p.period}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={mailto(p.name, p.price)}
                className={`mt-8 block text-center rounded-full py-3 font-semibold transition ${p.highlight ? "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:scale-[1.02]" : "glass-strong hover:bg-white/5"}`}
              >
                {p.cta}
              </a>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground max-w-2xl mx-auto space-y-2">
          <p>
            <strong className="text-foreground">How to pay:</strong> Send payment via UPI / bank transfer, then click your chosen plan
            above to email us the transaction ID. We manually verify & activate your plan — your account switches instantly.
          </p>
          <p>
            Questions? Email <a href="mailto:gerbergpt143@gmail.com" className="gradient-text font-semibold">gerbergpt143@gmail.com</a>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
