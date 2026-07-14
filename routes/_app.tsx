import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, UserPlus, X } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    const guest = window.localStorage.getItem("gerbergpt_guest") === "1";
    if (!data.session && !guest) throw redirect({ to: "/login" });
  },
});

function AppLayout() {
  const [open, setOpen] = useState(false);
  const [guest, setGuest] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    setOpen(false);
    supabase.auth.getSession().then(({ data }) => {
      setGuest(!data.session && window.localStorage.getItem("gerbergpt_guest") === "1");
    });
  }, []);

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <AppSidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-40 glass-strong border-b border-border/40 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></button>
          <Link to="/" className="font-display font-bold">Gerber<span className="gradient-text">GPT</span></Link>
          <div className="w-6" />
        </header>

        {guest && showBanner && (
          <div className="relative bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-pink-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs sm:text-sm flex items-center gap-3">
            <UserPlus className="h-4 w-4 text-amber-300 shrink-0" />
            <div className="flex-1">
              <span className="font-semibold text-amber-200">Guest Mode:</span>{" "}
              <span className="text-muted-foreground">Projects are temporary. </span>
              <Link to="/login" className="underline gradient-text font-semibold">Sign in</Link>
              <span className="text-muted-foreground"> to save projects, chat history, AI memory & cloud backups.</span>
            </div>
            <button onClick={() => setShowBanner(false)} className="opacity-70 hover:opacity-100" aria-label="Dismiss"><X className="h-4 w-4" /></button>
          </div>
        )}

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
