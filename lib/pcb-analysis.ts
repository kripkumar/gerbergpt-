// Signal-integrity + thermal analysis for GerberGPT.
// Fast, closed-form estimates suitable for pre-manufacturing sanity checks.
// - Microstrip impedance      (Wadell / IPC-2141)
// - Trace current capacity    (IPC-2221 external conductor)
// - Crosstalk warnings        (parallel-run coupling on same layer)
// - Component thermal budget  (rough dissipation vs board area)
import { classifyNet, planLayout, type GSpec } from "@/lib/gerber";

export type SIReport = {
  traces: {
    net: string;
    class: string;
    layer: "top" | "bot";
    length_mm: number;
    width_mm: number;
    impedance_ohm: number;   // characteristic Z0 estimate
    max_current_A: number;   // 10°C rise, external
    propagation_ns: number;
  }[];
  crosstalk: { net_a: string; net_b: string; layer: string; parallel_mm: number; gap_mm: number; severity: "low" | "medium" | "high" }[];
  differentialPairs: { net_p: string; net_n: string; length_p: number; length_n: number; mismatch_mm: number }[];
  summary: {
    totalLength_mm: number;
    powerLength_mm: number;
    signalLength_mm: number;
    avgImpedance_ohm: number;
    worstCrosstalk: "low" | "medium" | "high" | "none";
  };
};

export type ThermalReport = {
  components: {
    ref: string;
    footprint: string;
    est_dissipation_W: number;
    thermal_vias: number;
    junction_rise_C: number;
    status: "ok" | "warn" | "hot";
  }[];
  boardArea_cm2: number;
  totalDissipation_W: number;
  powerDensity_W_per_cm2: number;
  warnings: string[];
};

// Microstrip Z0 (IPC-2141), t = 35µm copper, εr = 4.3, h = 0.2mm outer dielectric
function microstripImpedance(widthMm: number): number {
  const h = 0.2, er = 4.3, t = 0.035;
  const w = widthMm;
  return +((87 / Math.sqrt(er + 1.41)) * Math.log((5.98 * h) / (0.8 * w + t))).toFixed(1);
}

// IPC-2221 external trace, 10°C temp rise, 1oz copper
function traceCurrent(widthMm: number): number {
  const areaMil2 = widthMm * 39.37 * 1.378; // width_mils × 1.378 mil (1oz)
  const k = 0.048, b = 0.44, c = 0.725;
  const dT = 10;
  return +(k * Math.pow(dT, b) * Math.pow(areaMil2, c)).toFixed(2);
}

// Propagation ~ 6.7 ps/mm for εr=4.3 microstrip
function propagationNs(lengthMm: number): number {
  return +((lengthMm * 6.7) / 1000).toFixed(3);
}

// Rough per-part dissipation defaults (W)
const DISSIPATION: Record<string, number> = {
  "AMS1117": 0.6, "MCP1700": 0.05, "TP4056": 0.7, "TO-220": 2.0, "DPAK": 1.2, "TO-252": 1.2, "SOT-223": 0.8,
  "ESP32-S3": 0.35, "ESP32-WROOM": 0.35, "ESP32-S3-WROOM": 0.35, "ESP32-C3": 0.25,
  "STM32F103C8": 0.15, "STM32F411": 0.20, "STM32G474": 0.25, "RP2040": 0.20, "ATMEGA328P": 0.10,
  "SX1276": 0.4, "SX1262": 0.3, "LED": 0.06, "WS2812B": 0.18,
};

function estimateDissipation(footprint: string, value: string): number {
  const F = (footprint ?? "").toUpperCase();
  const V = (value ?? "").toUpperCase();
  for (const k of Object.keys(DISSIPATION)) if (F.includes(k) || V.includes(k)) return DISSIPATION[k];
  if (F.includes("QFN") || F.includes("LQFP")) return 0.15;
  if (F.includes("SOIC")) return 0.10;
  if (F.includes("SOT")) return 0.05;
  return 0.01;
}

export function analyzeSI(spec: GSpec): SIReport {
  const { traces } = planLayout(spec);

  // Aggregate per-net length
  const perTrace = traces.map(t => {
    const length = Math.hypot(t.x2 - t.x1, t.y2 - t.y1);
    const cls = t.netClass ?? classifyNet(t.net);
    return {
      net: t.net,
      class: cls,
      layer: t.layer,
      length_mm: +length.toFixed(2),
      width_mm: t.width,
      impedance_ohm: microstripImpedance(t.width),
      max_current_A: traceCurrent(t.width),
      propagation_ns: propagationNs(length),
    };
  });

  // Crosstalk: any two same-layer segments running parallel within 3× minTrace on same axis
  const crosstalk: SIReport["crosstalk"] = [];
  for (let i = 0; i < traces.length; i++) {
    for (let j = i + 1; j < traces.length; j++) {
      const a = traces[i], b = traces[j];
      if (a.layer !== b.layer || a.net === b.net) continue;
      const aH = a.y1 === a.y2, bH = b.y1 === b.y2;
      const aV = a.x1 === a.x2, bV = b.x1 === b.x2;
      let parallel = 0, gap = Infinity;
      if (aH && bH) {
        const yGap = Math.abs(a.y1 - b.y1);
        const overlap = Math.max(0, Math.min(Math.max(a.x1,a.x2), Math.max(b.x1,b.x2)) - Math.max(Math.min(a.x1,a.x2), Math.min(b.x1,b.x2)));
        parallel = overlap; gap = yGap;
      } else if (aV && bV) {
        const xGap = Math.abs(a.x1 - b.x1);
        const overlap = Math.max(0, Math.min(Math.max(a.y1,a.y2), Math.max(b.y1,b.y2)) - Math.max(Math.min(a.y1,a.y2), Math.min(b.y1,b.y2)));
        parallel = overlap; gap = xGap;
      }
      if (parallel < 3 || gap > 1.5 || gap < 0.05) continue;
      const severity: "low" | "medium" | "high" =
        gap < 0.3 && parallel > 8 ? "high" :
        gap < 0.6 && parallel > 5 ? "medium" : "low";
      crosstalk.push({ net_a: a.net, net_b: b.net, layer: a.layer, parallel_mm: +parallel.toFixed(2), gap_mm: +gap.toFixed(2), severity });
    }
  }

  // Differential pair matching
  const diffPairs: SIReport["differentialPairs"] = [];
  const lenByNet = new Map<string, number>();
  for (const t of perTrace) lenByNet.set(t.net, (lenByNet.get(t.net) ?? 0) + t.length_mm);
  const seen = new Set<string>();
  for (const n of spec.nets ?? []) {
    if (classifyNet(n.name) !== "diffpair" || seen.has(n.name)) continue;
    const m = n.name.match(/^(.*?)([_-]?)(P|N|\+|-)$/i);
    if (!m) continue;
    const isP = m[3].toUpperCase() === "P" || m[3] === "+";
    const partner = m[1] + m[2] + (isP ? (m[3] === "+" ? "-" : "N") : (m[3] === "-" ? "+" : "P"));
    const partnerNet = (spec.nets ?? []).find(x => x.name.toUpperCase() === partner.toUpperCase());
    if (!partnerNet) continue;
    const lp = lenByNet.get(isP ? n.name : partnerNet.name) ?? 0;
    const ln = lenByNet.get(isP ? partnerNet.name : n.name) ?? 0;
    diffPairs.push({
      net_p: isP ? n.name : partnerNet.name,
      net_n: isP ? partnerNet.name : n.name,
      length_p: +lp.toFixed(2), length_n: +ln.toFixed(2),
      mismatch_mm: +Math.abs(lp - ln).toFixed(2),
    });
    seen.add(n.name); seen.add(partnerNet.name);
  }

  const total = perTrace.reduce((s, t) => s + t.length_mm, 0);
  const powerLen = perTrace.filter(t => t.class === "power").reduce((s, t) => s + t.length_mm, 0);
  const worst = crosstalk.reduce<"none" | "low" | "medium" | "high">((w, c) => {
    const order = { none: 0, low: 1, medium: 2, high: 3 } as const;
    return order[c.severity] > order[w] ? c.severity : w;
  }, "none");

  return {
    traces: perTrace,
    crosstalk,
    differentialPairs: diffPairs,
    summary: {
      totalLength_mm: +total.toFixed(1),
      powerLength_mm: +powerLen.toFixed(1),
      signalLength_mm: +(total - powerLen).toFixed(1),
      avgImpedance_ohm: perTrace.length
        ? +(perTrace.reduce((s, t) => s + t.impedance_ohm, 0) / perTrace.length).toFixed(1) : 0,
      worstCrosstalk: worst,
    },
  };
}

export function analyzeThermal(spec: GSpec): ThermalReport {
  const { vias } = planLayout(spec);
  const boardArea_cm2 = +((spec.width * spec.height) / 100).toFixed(2);

  const thermalViasByPos = new Map<string, number>();
  for (const v of vias) {
    if (v.kind !== "thermal") continue;
    // Group by nearest 2mm bucket
    const k = `${Math.round(v.x / 2)}:${Math.round(v.y / 2)}`;
    thermalViasByPos.set(k, (thermalViasByPos.get(k) ?? 0) + 1);
  }

  const components = spec.components.map(c => {
    const d = estimateDissipation(c.footprint ?? "", c.value ?? "");
    const key = `${Math.round(c.x / 2)}:${Math.round(c.y / 2)}`;
    const nearbyThermalVias = thermalViasByPos.get(key) ?? 0;
    // Rough θJA: 100°C/W with no thermal pad → 25°C/W with 9 thermal vias
    const rja = Math.max(25, 100 - nearbyThermalVias * 8);
    const rise = +(d * rja).toFixed(1);
    const status: "ok" | "warn" | "hot" =
      rise > 80 ? "hot" : rise > 40 ? "warn" : "ok";
    return {
      ref: c.ref,
      footprint: c.footprint ?? "",
      est_dissipation_W: d,
      thermal_vias: nearbyThermalVias,
      junction_rise_C: rise,
      status,
    };
  });

  const totalDissipation = +components.reduce((s, c) => s + c.est_dissipation_W, 0).toFixed(2);
  const density = boardArea_cm2 ? +(totalDissipation / boardArea_cm2).toFixed(3) : 0;

  const warnings: string[] = [];
  if (density > 0.5) warnings.push(`High power density ${density} W/cm² — add copper pours or thermal vias.`);
  for (const c of components) {
    if (c.status === "hot") warnings.push(`${c.ref} (${c.footprint}) may overheat: ΔT≈${c.junction_rise_C}°C. Add thermal pad + vias or heatsink.`);
    else if (c.status === "warn") warnings.push(`${c.ref} runs warm: ΔT≈${c.junction_rise_C}°C. Consider more copper.`);
  }

  return {
    components,
    boardArea_cm2,
    totalDissipation_W: totalDissipation,
    powerDensity_W_per_cm2: density,
    warnings,
  };
}
