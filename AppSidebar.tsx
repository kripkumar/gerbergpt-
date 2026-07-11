import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, MessageSquare, CircuitBoard, Zap, CreditCard, LogOut, Cpu, Sparkles, ChevronDown, Wrench, FileSearch, FileCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const mainItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pricing", label: "Plans", icon: CreditCard },
] as const;

const aiTools = [
  { to: "/tools", label: "All AI Tools", icon: Sparkles },
  { to: "/chat", label: "AI Chat", icon: MessageSquare },
  { to: "/pcb", label: "PCB Mode", icon: CircuitBoard },
  { to: "/electronics", label: "Electronics Helper", icon: Zap },
  { to: "/analyser", label: "Gerber Analyser", icon: FileSearch },
  { to: "/generator", label: "Gerber Generator", icon: FileCog },
] as const;

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const toolsActive = aiTools.some((t) => pathname === t.to);
  const [toolsOpen, setToolsOpen] = useState(toolsActive);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
      active
        ? "bg-gradient-to-r from-primary/20 to-accent/20 text-foreground border border-primary/30"
        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
    }`;

  return (
    <aside className="flex h-full w-64 flex-col glass-strong border-r border-sidebar-border p-4">
      <Link to="/" className="flex items-center gap-2 px-2 py-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
          <Cpu className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-display text-lg font-bold">Gerber<span className="gradient-text">GPT</span></span>
      </Link>

      <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
        {mainItems.slice(0, 1).map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} onClick={onNavigate} className={linkClass(active)}>
              <Icon className="h-4 w-4" />
              {item.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary glow-primary" />}
            </Link>
          );
        })}

        {/* AI Tools group */}
        <button
          type="button"
          onClick={() => setToolsOpen((o) => !o)}
          className={linkClass(toolsActive && !toolsOpen) + " w-full"}
          aria-expanded={toolsOpen}
        >
          <Wrench className="h-4 w-4" />
          <span>AI Tools</span>
          <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${toolsOpen ? "rotate-180" : ""}`} />
        </button>

        {toolsOpen && (
          <div className="ml-3 mt-1 space-y-1 border-l border-border/40 pl-3">
            {aiTools.map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to} onClick={onNavigate} className={linkClass(active)}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary glow-primary" />}
                </Link>
              );
            })}
          </div>
        )}

        {mainItems.slice(1).map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} onClick={onNavigate} className={linkClass(active)}>
              <Icon className="h-4 w-4" />
              {item.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary glow-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-border/40 pt-4">
        <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition">
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
