import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Menu, X, Cpu } from "lucide-react";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const links = [
    { to: "/", label: "Home" },
    { to: "/pricing", label: "Pricing" },
    { to: "/about", label: "About" },
  ] as const;
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full"
    >
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="glass-strong rounded-2xl px-5 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary blur-lg opacity-60 group-hover:opacity-100 transition" />
              <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Cpu className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <span className="font-display text-lg font-bold tracking-tight">
              Gerber<span className="gradient-text">GPT</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition rounded-full hover:bg-white/5">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Link to="/login" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition">
              Sign in
            </Link>
            <Link to="/login" className="px-4 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground glow-primary hover:opacity-90 transition">
              Get started
            </Link>
          </div>

          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>

        {open && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden mt-2 glass-strong rounded-2xl p-4 flex flex-col gap-2">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg hover:bg-white/5">
                {l.label}
              </Link>
            ))}
            <Link to="/login" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground text-center font-semibold">
              Get started
            </Link>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
