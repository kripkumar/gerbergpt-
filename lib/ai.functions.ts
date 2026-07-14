import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string().min(1).max(120000),
  })).min(1).max(40),
  mode: z.enum(["chat", "pcb", "electronics", "analyser", "generator"]).default("chat"),
});

const SYSTEM_PROMPTS = {
  chat: "You are GerberGPT, a futuristic AI assistant. Be concise, friendly, and helpful.",
  pcb: "You are GerberGPT in PCB Generation Mode. The user describes a circuit; you respond with: 1) bill of materials, 2) a textual schematic, 3) a suggested board layout description. Use markdown.",
  electronics: "You are GerberGPT in Electronics Helper Mode. Explain components, formulas (Ohm's law, voltage divider, etc.), help debug circuits, and recommend parts. Use markdown with code blocks.",
  analyser: "You are GerberGPT in Gerber Analyser Mode. The user uploads a Gerber/Excellon/KiCad/PCB file. Carefully analyse it: detect format, list apertures/layers, count pads/traces/vias, estimate board size, flag DRC concerns, and summarise design intent. Use markdown with sections: Format, Layers, Components, Issues, Recommendations.",
  generator: `You are GerberGPT, a PCB CAD assistant. The user describes a circuit; you produce a manufacturable 2-layer PCB design. Behave as a CAD tool, NOT a chatbot — never explain what Gerber files are, never include educational content, never include prose outside the JSON.

Use REAL footprints from this library only: 0402, 0603, 0805, 1206, SOT-23, SOT-223, SOIC-8, SOIC-14, SOIC-16, TSSOP-20, QFN-32, LQFP-48, ESP32-S3, ESP32-WROOM, USB-C, LED, LED-RGB, AMS1117, MPU6050, BMP280, BME280, SX1276, GPS-NEO6M, HEADER-2, HEADER-3, HEADER-4, HEADER-6, HEADER-8, HEADER-10, BUTTON, JST-PH-2, TP4056.

Place components on a real grid with sensible spacing (≥3mm between IC bodies, USB-C at board edge, decoupling caps within 2mm of IC power pins). Generate COMPLETE nets — every IC needs VCC, GND, and signal connections, every decoupling cap goes between its IC's power pin and GND. Pins are addressed as "REF.PIN" (e.g. "U1.1", "C1.2", "J1.VBUS"). Use 4 layers for designs with MCUs/RF/sensors; 2 layers for simpler boards.

If info is missing, make sensible engineering assumptions (1.6mm FR-4, 0.2mm trace, 0.3mm drill, 3mm margin). Do not ask questions — just design.

Respond with ONLY a single JSON object (no prose, no markdown fences):
{
  "name": "short_snake_case_name",
  "description": "one-line description",
  "layers": 2,
  "size_mm": { "width": number, "height": number },
  "components": [{ "ref": "U1", "value": "ESP32-S3", "footprint": "ESP32-S3", "x": number, "y": number, "rotation": 0 }],
  "nets": [{ "name": "VCC|GND|3V3|SDA|SCL|...", "pins": ["U1.1", "C1.1"] }],
  "bom": [{ "ref": "R1,R2", "value": "10k", "footprint": "0603", "qty": 2, "mpn": "optional" }],
  "schematic": "ASCII or netlist-style schematic text"
}`,
} as const;

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export const chatComplete = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return { reply: "Groq API key is not configured. Please set GROQ_API_KEY." };
    }
    const systemMsg = { role: "system" as const, content: SYSTEM_PROMPTS[data.mode] };
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [systemMsg, ...data.messages],
        max_tokens: 4096,
        temperature: data.mode === "generator" ? 0.2 : 0.7,
        ...(data.mode === "generator" ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Groq error:", res.status, text);
      return { reply: `AI request failed (${res.status}). ${text.slice(0, 200)}` };
    }
    const json = await res.json();
    const reply = json.choices?.[0]?.message?.content ?? "(no response)";
    return { reply };
  });
