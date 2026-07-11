import { createFileRoute } from "@tanstack/react-router";
import { ChatUI } from "@/components/ChatUI";

export const Route = createFileRoute("/_app/electronics")({
  head: () => ({ meta: [{ title: "Electronics Helper — GerberGPT" }] }),
  component: () => (
    <ChatUI
      mode="electronics"
      title="Electronics Helper"
      subtitle="Components, formulas, debugging, part recommendations."
      placeholder="e.g. Design a voltage divider for 12V → 3.3V"
    />
  ),
});
