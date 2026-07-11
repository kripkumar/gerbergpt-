import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2, Download, Send, CircuitBoard, FileJson, FileText, Cpu, Package, ShieldCheck, FileSpreadsheet, Wrench, Zap, Thermometer } from "lucide-react";
import { chatComplete } from "@/lib/ai.functions";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { buildGerberZip, buildBomCsv, validateDesign, planLayout, buildKicadPcb, buildKicadProject, buildEasyEdaJson, autoRepair, type GSpec, type RepairAction } from "@/lib/gerber";
import { analyzeSI, analyzeThermal } from "@/lib/pcb-analysis";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/generator")({
  head: () => ({ meta: [{ title: "Gerber Generator — GerberGPT" }] }),
  component: GeneratorPage,
});

type Design = {
  name: string;
  description: string;
  layers?: 2 | 4;
  size_mm?: { width: number; height: number };
  components?: { ref: string; value: string; footprint: string; x: number; y: number; rotation?: number }[];
  nets?: { name: string; pins: string[] }[];
  bom?: { ref: string; value: string; footprint: string; qty: number; mpn?: string }[];
  schematic?: string;
  gerber?: string;
  kicad_pcb?: string;
};

function extractJson(text: string): Design | null {
  const fence = text.match(/```json\s*([\s\S]*?)```/i) ?? text.match(/```\s*([\s\S]*?)```/);
  const raw = fence ? fence[1] : text;
  try { return JSON.parse(raw); } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch { return null; } }
    return null;
  }
}

function download(filename: string, content: BlobPart, mime = "text/plain") {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function makePdf(d: Design) {
  const doc = new jsPDF();
  doc.setFontSize(18); doc.text(`PCB: ${d.name}`, 14, 18);
  doc.setFontSize(11); doc.text(doc.splitTextToSize(d.description ?? "", 180), 14, 28);
  let y = 48;
  if (d.size_mm) { doc.text(`Board: ${d.size_mm.width} x ${d.size_mm.height} mm`, 14, y); y += 8; }
  doc.setFontSize(13); doc.text("Components", 14, y); y += 6; doc.setFontSize(10);
  for (const c of d.components ?? []) {
    if (y > 280) { doc.addPage(); y = 20; }
    doc.text(`${c.ref}  ${c.value}  [${c.footprint}]  (${c.x}, ${c.y})`, 14, y); y += 5;
  }
  y += 4; doc.setFontSize(13); doc.text("Nets", 14, y); y += 6; doc.setFontSize(10);
  for (const n of d.nets ?? []) {
    if (y > 280) { doc.addPage(); y = 20; }
    doc.text(`${n.name}: ${n.pins.join(", ")}`, 14, y); y += 5;
  }
  doc.save(`${d.name || "pcb"}.pdf`);
}

function toSpec(d: Design): GSpec {
  const safeName = (d.name || "pcb").replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 32) || "pcb";
  const w = d.size_mm?.width ?? 40;
  const h = d.size_mm?.height ?? 40;
  const comps = (d.components ?? []).map((c) => ({
    ref: c.ref, value: c.value, footprint: c.footprint, rotation: c.rotation ?? 0,
    x: Math.max(1, Math.min(w - 1, c.x)),
    y: Math.max(1, Math.min(h - 1, c.y)),
  }));
  return { name: safeName, description: d.description, layers: (d.layers === 4 ? 4 : 2), width: w, height: h, components: comps, nets: d.nets, bom: d.bom, schematic: d.schematic };
}

type LayerKey = "top" | "bottom" | "silk" | "mask" | "gnd" | "pwr" | "drill" | "outline";
const LAYER_DEFS: { key: LayerKey; label: string; color: string }[] = [
  { key: "outline", label: "Outline", color: "#fbbf24" },
  { key: "gnd", label: "GND Plane", color: "#0ea5e9" },
  { key: "pwr", label: "Power Plane", color: "#f43f5e" },
  { key: "top", label: "Top Copper", color: "#ef4444" },
  { key: "bottom", label: "Bottom Copper", color: "#3b82f6" },
  { key: "mask", label: "Solder Mask", color: "#10b981" },
  { key: "silk", label: "Silkscreen", color: "#f5f5f5" },
  { key: "drill", label: "Drills", color: "#facc15" },
];

function PcbPreview({ spec }: { spec: GSpec }) {
  const [visible, setVisible] = useState<Record<LayerKey, boolean>>({
    outline: true, gnd: false, pwr: false, top: true, bottom: true, mask: true, silk: true, drill: true,
  });
  const layout = useMemo(() => planLayout(spec), [spec]);
  const pad = 12;
  const scale = Math.min(600 / spec.width, 380 / spec.height);
  const W = spec.width * scale + pad * 2;
  const H = spec.height * scale + pad * 2;
  // mm → svg coords (flip Y)
  const sx = (x: number) => pad + x * scale;
  const sy = (y: number) => H - pad - y * scale;
  const has4 = spec.layers === 4;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {LAYER_DEFS.filter(l => has4 || (l.key !== "gnd" && l.key !== "pwr")).map(l => (
          <button
            key={l.key}
            onClick={() => setVisible(v => ({ ...v, [l.key]: !v[l.key] }))}
            className={`text-[10px] px-2 py-1 rounded-md border transition ${visible[l.key] ? "border-primary/60 bg-primary/10" : "border-border/40 opacity-50"}`}
            style={{ color: l.color }}
          >
            ● {l.label}
          </button>
        ))}
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="rounded-xl border border-border/40 bg-[#02110a]">
        {/* substrate */}
        {visible.outline && (
          <rect x={sx(0)} y={sy(spec.height)} width={spec.width * scale} height={spec.height * scale}
                fill="#052e1a" stroke="#fbbf24" strokeWidth={1.5} />
        )}
        {/* planes */}
        {has4 && visible.gnd && (
          <rect x={sx(0.5)} y={sy(spec.height - 0.5)} width={(spec.width - 1) * scale} height={(spec.height - 1) * scale}
                fill="#0ea5e9" opacity={0.12} />
        )}
        {has4 && visible.pwr && (
          <rect x={sx(0.5)} y={sy(spec.height - 0.5)} width={(spec.width - 1) * scale} height={(spec.height - 1) * scale}
                fill="#f43f5e" opacity={0.08} />
        )}
        {/* traces */}
        {layout.traces.map((t, i) => {
          const on = t.layer === "top" ? visible.top : visible.bottom;
          if (!on) return null;
          return (
            <line key={`t${i}`}
              x1={sx(t.x1)} y1={sy(t.y1)} x2={sx(t.x2)} y2={sy(t.y2)}
              stroke={t.layer === "top" ? "#ef4444" : "#3b82f6"}
              strokeWidth={Math.max(1, t.width * scale)}
              strokeLinecap="round" opacity={0.85}
            />
          );
        })}
        {/* pads */}
        {layout.pads.map((p, i) => {
          const isTH = !!p.drill;
          const showCopper = visible.top || visible.bottom;
          if (!showCopper && !isTH) return null;
          const cx = sx(p.ax);
          const cy = sy(p.ay);
          const w = p.w * scale;
          const h = p.h * scale;
          const isCirc = p.shape === "circle" || isTH;
          const fill = visible.mask ? "#fbbf24" : "#ef4444";
          return (
            <g key={`p${i}`}>
              {isCirc ? (
                <circle cx={cx} cy={cy} r={Math.max(w, h) / 2} fill={fill} opacity={0.95} />
              ) : (
                <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h}
                      rx={p.shape === "oval" ? Math.min(w, h) / 2 : 0.5}
                      fill={fill} opacity={0.95} />
              )}
              {visible.drill && isTH && (
                <circle cx={cx} cy={cy} r={(p.drill! / 2) * scale} fill="#02110a" />
              )}
            </g>
          );
        })}
        {/* vias */}
        {layout.vias.map((v, i) => (
          <g key={`v${i}`}>
            {(visible.top || visible.bottom) && (
              <circle cx={sx(v.x)} cy={sy(v.y)} r={Math.max(2, 0.6 * scale / 2)} fill="#a3e635" />
            )}
            {visible.drill && (
              <circle cx={sx(v.x)} cy={sy(v.y)} r={Math.max(1, 0.3 * scale / 2)} fill="#02110a" />
            )}
          </g>
        ))}
        {/* silk: outlines + refs */}
        {visible.silk && spec.components.map((c, i) => {
          const cx = sx(c.x);
          const cy = sy(c.y);
          return (
            <g key={`s${i}`}>
              <text x={cx} y={cy - 6} fontSize={9} fill="#f5f5f5" textAnchor="middle" opacity={0.85}>{c.ref}</text>
              <text x={cx} y={cy + 12} fontSize={7} fill="#a7f3d0" textAnchor="middle" opacity={0.7}>{c.value}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="glass rounded-lg px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}


function GeneratorPage() {
  const ai = useServerFn(chatComplete);
  const [prompt, setPrompt] = useState("");
  const [design, setDesign] = useState<Design | null>(null);
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [repairActions, setRepairActions] = useState<RepairAction[]>([]);
  const [repairing, setRepairing] = useState(false);
  const [quotaMsg, setQuotaMsg] = useState<string | null>(null);

  const spec = useMemo(() => (design ? toSpec(design) : null), [design]);
  const report = useMemo(() => (spec ? validateDesign(spec) : null), [spec]);
  const si = useMemo(() => (spec ? analyzeSI(spec) : null), [spec]);
  const thermal = useMemo(() => (spec ? analyzeThermal(spec) : null), [spec]);
  const issues = report?.errors ?? [];

  const runRepair = (d: Design) => {
    setRepairing(true);
    try {
      const s = toSpec(d);
      const { spec: fixed, actions, report: r } = autoRepair(s, 5);
      setRepairActions(actions);
      if (actions.length) {
        // Merge fixed spec back into design shape
        setDesign({
          ...d,
          layers: fixed.layers,
          size_mm: { width: fixed.width, height: fixed.height },
          components: fixed.components.map(c => ({ ref: c.ref, value: c.value ?? "", footprint: c.footprint ?? "0603", x: c.x, y: c.y, rotation: c.rotation ?? 0 })),
          nets: fixed.nets,
        });
        toast.success(`AI Repair fixed ${actions.length} issue(s) · ${r.errors.length} error(s) remain`);
      }
    } finally { setRepairing(false); }
  };

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setDesign(null); setRaw(""); setRepairActions([]); setQuotaMsg(null);

    // Deduct 1 generation for signed-in users (guest = unlimited during session)
    const { data: sess } = await supabase.auth.getSession();
    if (sess.session) {
      const { data: q, error } = await supabase.rpc("consume_generation" as never);
      if (error) { toast.error(error.message); setLoading(false); return; }
      const res = q as unknown as { ok: boolean; reason?: string; remaining?: number; plan?: string };
      if (!res?.ok) {
        setQuotaMsg(`You've hit your ${res?.plan ?? "free"} plan generation limit. Upgrade at /pricing.`);
        toast.error("Generation limit reached — please upgrade.");
        setLoading(false); return;
      }
      setQuotaMsg(`${res.remaining} generation(s) remaining on ${(res.plan ?? "free").toUpperCase()} plan.`);
    }

    try {
      const { reply } = await ai({ data: { mode: "generator", messages: [{ role: "user", content: prompt }] } });
      setRaw(reply);
      const d = extractJson(reply);
      if (!d) { toast.error("AI returned unparseable output"); return; }
      setDesign(d);
      // AI Repair: run automatically after generation to fix common issues
      setTimeout(() => runRepair(d), 100);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally { setLoading(false); }
  };


  const downloadZip = async () => {
    if (!spec) return;
    if (issues.length) {
      toast.error(`Validation failed: ${issues[0]}`);
      return;
    }
    setZipping(true);
    try {
      const blob = await buildGerberZip(spec);
      download(`${spec.name}_gerber.zip`, blob, "application/zip");
      toast.success("Gerber package ready — compatible with JLCPCB, PCBWay, OSH Park");
    } catch (e: any) {
      toast.error(e.message ?? "ZIP failed");
    } finally { setZipping(false); }
  };

  return (
    <div className="px-6 md:px-10 py-8 max-w-5xl mx-auto">
      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground glass rounded-full px-3 py-1">
        <Sparkles className="h-3 w-3 text-primary" /> GENERATOR MODE
      </div>
      <h1 className="mt-2 text-2xl md:text-3xl font-bold">Gerber Generator</h1>
      <p className="text-sm text-muted-foreground">Describe a PCB. Get a real RS-274X Gerber + Excellon drill ZIP ready for JLCPCB, PCBWay or OSH Park.</p>

      <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="mt-6 glass-strong rounded-2xl p-2 flex items-end gap-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="e.g. ESP32-S3 dev board with USB-C, 3.3V LDO, status LED, reset and boot buttons, 40x60mm"
          className="flex-1 bg-transparent resize-none outline-none px-3 py-2 text-sm"
        />
        <button onClick={generate} disabled={loading || !prompt.trim()} className="h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground glow-primary disabled:opacity-50 text-sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Generate
        </button>
      </motion.div>

      {design && spec && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="mt-6 glass rounded-2xl p-6 border border-border/40 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
              <CircuitBoard className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold">{design.name}</h2>
              <p className="text-xs text-muted-foreground">{spec.width} × {spec.height} mm · {spec.layers ?? 2}-layer · {spec.components.length} components · {design.nets?.length ?? 0} nets</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{design.description}</p>

          <PcbPreview spec={spec} />

          {report && (
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 text-xs">
              <Stat label="Size mm" value={`${spec.width}×${spec.height}`} />
              <Stat label="Layers" value={spec.layers ?? 2} />
              <Stat label="Components" value={report.stats.components} />
              <Stat label="Nets" value={report.stats.nets} />
              <Stat label="Traces" value={report.stats.traces} />
              <Stat label="Vias" value={report.stats.vias} />
              <Stat label="Trace mm" value={report.stats.traceLength} />
            </div>
          )}

          <div className={`flex items-start gap-2 text-xs rounded-xl px-3 py-2 border ${issues.length ? "border-red-500/40 text-red-300" : "border-emerald-500/40 text-emerald-300"}`}>
            <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="flex-1 font-semibold">
              {issues.length ? `✖ DRC FAIL · ${issues.length} error(s)` : "✓ DRC PASSED — manufacturing-ready"}
              {report?.warnings.length ? ` · ${report.warnings.length} warning(s)` : ""}
            </div>
          </div>

          {quotaMsg && (
            <div className="text-xs text-muted-foreground glass rounded-lg px-3 py-2 border border-border/40">{quotaMsg}</div>
          )}

          {(repairActions.length > 0 || repairing) && (
            <div className="glass-strong rounded-xl p-3 border border-cyan-500/30">
              <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
                <Wrench className={`h-4 w-4 ${repairing ? "animate-pulse" : ""}`} />
                AI Repair Log · {repairActions.length} auto-fix{repairActions.length === 1 ? "" : "es"} applied
                {issues.length > 0 && <span className="ml-auto text-amber-300 text-xs">{issues.length} issue(s) still need manual review</span>}
              </div>
              {repairActions.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground max-h-32 overflow-auto">
                  {repairActions.slice(0, 12).map((a, i) => (
                    <li key={i}><span className="text-cyan-400 font-mono">[{a.type}]</span> {a.message}</li>
                  ))}
                  {repairActions.length > 12 && <li className="opacity-60">…+{repairActions.length - 12} more</li>}
                </ul>
              )}
              {issues.length > 0 && (
                <button onClick={() => design && runRepair(design)} disabled={repairing}
                  className="mt-2 text-xs px-3 py-1.5 rounded-md bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30 inline-flex items-center gap-1 disabled:opacity-50">
                  {repairing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wrench className="h-3 w-3" />} Run AI Repair again
                </button>
              )}
            </div>
          )}

          {report && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
              {([
                ["Errors", report.errors, "text-red-300 border-red-500/30"],
                ["Warnings", report.warnings, "text-amber-300 border-amber-500/30"],
                ["Unconnected Nets", report.categories.unconnected, "text-orange-300 border-orange-500/30"],
                ["Clearance", report.categories.clearance, "text-pink-300 border-pink-500/30"],
                ["Drill", report.categories.drill, "text-cyan-300 border-cyan-500/30"],
                ["Overlap", report.categories.overlap, "text-fuchsia-300 border-fuchsia-500/30"],
              ] as const).map(([label, list, cls]) => (
                <div key={label} className={`glass rounded-xl p-3 border ${cls}`}>
                  <div className="font-semibold mb-1">{label} ({list.length})</div>
                  {list.length === 0 && <div className="opacity-60">— none —</div>}
                  <ul className="space-y-0.5 max-h-28 overflow-auto opacity-90">
                    {list.slice(0, 8).map((m, i) => <li key={i}>• {m}</li>)}
                    {list.length > 8 && <li className="opacity-60">…+{list.length - 8} more</li>}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {si && thermal && (
            <div className="grid lg:grid-cols-2 gap-3">
              <div className="glass-strong rounded-xl p-3 border border-emerald-500/30">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300 mb-2">
                  <Zap className="h-4 w-4" /> Signal Integrity
                  <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${si.summary.worstCrosstalk === "high" ? "bg-red-500/20 text-red-300" : si.summary.worstCrosstalk === "medium" ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                    crosstalk: {si.summary.worstCrosstalk}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="glass rounded-lg p-2"><div className="opacity-60 text-[10px]">Total routing</div><div className="font-mono">{si.summary.totalLength_mm} mm</div></div>
                  <div className="glass rounded-lg p-2"><div className="opacity-60 text-[10px]">Avg Z₀ (microstrip)</div><div className="font-mono">{si.summary.avgImpedance_ohm} Ω</div></div>
                  <div className="glass rounded-lg p-2"><div className="opacity-60 text-[10px]">Signal length</div><div className="font-mono">{si.summary.signalLength_mm} mm</div></div>
                  <div className="glass rounded-lg p-2"><div className="opacity-60 text-[10px]">Power length</div><div className="font-mono">{si.summary.powerLength_mm} mm</div></div>
                </div>
                {si.differentialPairs.length > 0 && (
                  <div className="mt-2 text-xs">
                    <div className="font-semibold opacity-80 mb-1">Differential pairs</div>
                    <ul className="space-y-0.5 max-h-24 overflow-auto">
                      {si.differentialPairs.map((d, i) => (
                        <li key={i} className={`font-mono ${d.mismatch_mm > 5 ? "text-amber-300" : "text-emerald-300"}`}>
                          {d.net_p}/{d.net_n} · Δ{d.mismatch_mm}mm
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {si.crosstalk.length > 0 && (
                  <div className="mt-2 text-xs">
                    <div className="font-semibold opacity-80 mb-1">Coupled segments ({si.crosstalk.length})</div>
                    <ul className="space-y-0.5 max-h-24 overflow-auto opacity-90">
                      {si.crosstalk.slice(0, 5).map((c, i) => (
                        <li key={i} className={c.severity === "high" ? "text-red-300" : c.severity === "medium" ? "text-amber-300" : "opacity-70"}>
                          {c.net_a} ‖ {c.net_b} · {c.parallel_mm}mm @ {c.gap_mm}mm gap
                        </li>
                      ))}
                      {si.crosstalk.length > 5 && <li className="opacity-60">…+{si.crosstalk.length - 5} more</li>}
                    </ul>
                  </div>
                )}
              </div>

              <div className="glass-strong rounded-xl p-3 border border-orange-500/30">
                <div className="flex items-center gap-2 text-sm font-semibold text-orange-300 mb-2">
                  <Thermometer className="h-4 w-4" /> Thermal Analysis
                  <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${thermal.powerDensity_W_per_cm2 > 0.5 ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                    {thermal.powerDensity_W_per_cm2} W/cm²
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="glass rounded-lg p-2"><div className="opacity-60 text-[10px]">Total dissipation</div><div className="font-mono">{thermal.totalDissipation_W} W</div></div>
                  <div className="glass rounded-lg p-2"><div className="opacity-60 text-[10px]">Board area</div><div className="font-mono">{thermal.boardArea_cm2} cm²</div></div>
                </div>
                <div className="mt-2 text-xs">
                  <div className="font-semibold opacity-80 mb-1">Hotspots</div>
                  <ul className="space-y-0.5 max-h-32 overflow-auto">
                    {thermal.components.filter(c => c.status !== "ok").slice(0, 6).map((c, i) => (
                      <li key={i} className={`font-mono ${c.status === "hot" ? "text-red-300" : "text-amber-300"}`}>
                        {c.ref} [{c.footprint}] · ΔT≈{c.junction_rise_C}°C · {c.thermal_vias} vias
                      </li>
                    ))}
                    {thermal.components.every(c => c.status === "ok") && <li className="opacity-60">— all components within safe range —</li>}
                  </ul>
                </div>
                {thermal.warnings.length > 0 && (
                  <ul className="mt-2 text-[11px] space-y-0.5 opacity-80 max-h-20 overflow-auto">
                    {thermal.warnings.slice(0, 4).map((w, i) => <li key={i}>⚠ {w}</li>)}
                  </ul>
                )}
              </div>
            </div>
          )}






          <button
            onClick={downloadZip}
            disabled={zipping || !!issues.length}
            className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold disabled:opacity-40"
          >
            {zipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
            Download Gerber ZIP (GTL · GBL · GTS · GBS · GTO · GBO · GKO · TXT)
          </button>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <button onClick={() => download(`${spec.name}_BOM.csv`, buildBomCsv(spec), "text/csv")} className="glass rounded-xl p-3 text-sm flex items-center gap-2 hover:border-primary/40 border border-border/40 transition">
              <FileSpreadsheet className="h-4 w-4 text-primary" /> BOM CSV <Download className="h-3 w-3 ml-auto" />
            </button>
            <button onClick={() => download(`${spec.name}.json`, JSON.stringify(design, null, 2), "application/json")} className="glass rounded-xl p-3 text-sm flex items-center gap-2 hover:border-primary/40 border border-border/40 transition">
              <FileJson className="h-4 w-4 text-primary" /> JSON <Download className="h-3 w-3 ml-auto" />
            </button>
            <button onClick={() => makePdf(design)} className="glass rounded-xl p-3 text-sm flex items-center gap-2 hover:border-primary/40 border border-border/40 transition">
              <FileText className="h-4 w-4 text-primary" /> PDF <Download className="h-3 w-3 ml-auto" />
            </button>
            <button onClick={() => { download(`${spec.name}.kicad_pcb`, buildKicadPcb(spec)); download(`${spec.name}.kicad_pro`, buildKicadProject(spec)); toast.success("Open the .kicad_pro in KiCad 7/8 to edit"); }} className="glass rounded-xl p-3 text-sm flex items-center gap-2 hover:border-primary/40 border border-border/40 transition">
              <Cpu className="h-4 w-4 text-primary" /> KiCad (editable) <Download className="h-3 w-3 ml-auto" />
            </button>
            <button onClick={() => { download(`${spec.name}_easyeda.json`, buildEasyEdaJson(spec), "application/json"); toast.success("Import in EasyEDA: File → Open → EasyEDA → Local source"); }} className="glass rounded-xl p-3 text-sm flex items-center gap-2 hover:border-primary/40 border border-border/40 transition">
              <CircuitBoard className="h-4 w-4 text-primary" /> EasyEDA (editable) <Download className="h-3 w-3 ml-auto" />
            </button>
          </div>

          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer">View raw AI output</summary>
            <pre className="mt-2 p-3 glass rounded-xl overflow-x-auto whitespace-pre-wrap">{raw}</pre>
          </details>
        </motion.div>
      )}

      <p className="mt-6 text-xs text-muted-foreground text-center">⚠️ AI can make mistakes. Always open the Gerber ZIP in a viewer (e.g. JLCPCB online viewer or KiCad's GerbView) before manufacturing.</p>
    </div>
  );
}
