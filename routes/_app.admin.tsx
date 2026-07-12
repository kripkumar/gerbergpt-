import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, Check, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Admin — GerberGPT" }] }),
  component: AdminPage,
});

type Sub = {
  id: string;
  user_id: string;
  email: string | null;
  plan: string;
  activated_at: string | null;
  expires_at: string | null;
  generations_used: number;
  generations_remaining: number;
  payment_status: string;
  transaction_id: string | null;
};

const PLAN_PRESETS: Record<string, { gens: number; days: number }> = {
  starter: { gens: 20, days: 30 },
  pro: { gens: 100, days: 30 },
  ultra: { gens: 9999, days: 30 },
};

function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setIsAdmin(false); return; }
    const { data: r } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" as never });
    setIsAdmin(!!r);
    if (!r) return;
    const { data, error } = await (supabase.from as any)("user_subscriptions").select("*").order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    else setSubs((data as Sub[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const activate = async (s: Sub, plan: keyof typeof PLAN_PRESETS) => {
    const preset = PLAN_PRESETS[plan];
    const tx = window.prompt(`Transaction ID for ${s.email} → ${plan.toUpperCase()}?`) ?? "";
    if (!tx) return;
    setBusy(s.id);
    const { error } = await supabase.rpc("admin_activate_plan" as never, {
      _user_id: s.user_id, _plan: plan, _generations: preset.gens, _days: preset.days, _tx: tx,
    } as never);
    setBusy(null);
    if (error) toast.error(error.message);
    else { toast.success(`Activated ${plan} for ${s.email}`); load(); }
  };

  if (isAdmin === null) return <div className="p-10">Loading…</div>;
  if (!isAdmin) return (
    <div className="p-10 max-w-2xl mx-auto">
      <div className="glass-strong rounded-2xl p-8 text-center">
        <Shield className="h-10 w-10 mx-auto text-amber-400 mb-3" />
        <h1 className="text-xl font-bold">Admin access required</h1>
        <p className="text-sm text-muted-foreground mt-2">Your account does not have admin role. Contact GerberGPT support.</p>
      </div>
    </div>
  );

  const filtered = subs.filter(s => !filter || (s.email ?? "").toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs"><Shield className="h-3 w-3 text-primary" /> Admin</div>
          <h1 className="text-3xl font-bold mt-2">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">Verify payment, then activate the user's plan. Users switch instantly.</p>
        </div>
        <button onClick={load} className="glass rounded-lg px-3 py-2 text-sm inline-flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </div>

      <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter by email…" className="w-full bg-transparent glass-strong rounded-xl px-4 py-2 text-sm mb-4 outline-none" />

      <div className="glass-strong rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Plan</th>
              <th className="text-left p-3">Used / Left</th>
              <th className="text-left p-3">Expires</th>
              <th className="text-left p-3">Tx</th>
              <th className="text-right p-3">Activate</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-t border-border/30">
                <td className="p-3">
                  <div className="font-mono text-xs">{s.email ?? s.user_id.slice(0,8)}</div>
                  <div className="text-[10px] text-muted-foreground">{s.user_id.slice(0,8)}…</div>
                </td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${s.plan==='free'?'bg-white/10':'bg-primary/20 text-primary'}`}>{s.plan.toUpperCase()}</span></td>
                <td className="p-3 text-xs">{s.generations_used} / <span className="text-primary font-semibold">{s.generations_remaining}</span></td>
                <td className="p-3 text-xs">{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : "—"}</td>
                <td className="p-3 text-xs font-mono">{s.transaction_id ?? "—"}</td>
                <td className="p-3 text-right space-x-1">
                  {(["starter","pro","ultra"] as const).map(p => (
                    <button key={p} onClick={() => activate(s, p)} disabled={busy === s.id}
                      className="px-2 py-1 rounded-md text-xs glass hover:border-primary/50 border border-border/40 disabled:opacity-40">
                      {busy === s.id ? <Loader2 className="h-3 w-3 animate-spin inline" /> : <><Check className="h-3 w-3 inline mr-1" />{p}</>}
                    </button>
                  ))}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No subscriptions found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
