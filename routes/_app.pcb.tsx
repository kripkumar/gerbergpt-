import { createFileRoute } from "@tanstack/react-router";
import { ChatUI } from "@/components/ChatUI";

export const Route = createFileRoute("/_app/pcb")({
  head: () => ({ meta: [{ title: "PCB Generation Mode — GerberGPT" }] }),
  component: () => (
    <ChatUI
      mode="pcb"
      title="PCB Generation Mode"
      subtitle="Describe a circuit and get a BOM, schematic, and layout plan."
      placeholder="e.g. 555 timer astable, 1Hz blink LED…"
    />
  ),
});
