import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles, Plus, Loader2 } from "lucide-react";
import { createThread } from "@/lib/chat.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/chat/")({
  component: ChatIndex,
});

function ChatIndex() {
  const create = useServerFn(createThread);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const newChat = async () => {
    try {
      const { thread } = await create({ data: {} });
      await qc.invalidateQueries({ queryKey: ["chat-threads"] });
      navigate({ to: "/chat/$threadId", params: { threadId: thread!.id } });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  useEffect(() => {
    // auto-create a new thread on first visit
    newChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full flex items-center justify-center text-center px-6">
      <div>
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent glow-primary mx-auto">
          <Sparkles className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">AI Chat</h1>
        <p className="text-sm text-muted-foreground mt-1 inline-flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" /> Starting a new conversation…
        </p>
        <button onClick={newChat} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground px-4 py-2 text-sm glow-primary">
          <Plus className="h-4 w-4" /> New chat
        </button>
      </div>
    </div>
  );
}
