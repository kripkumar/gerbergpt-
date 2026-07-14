import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, MessageSquare, Loader2 } from "lucide-react";
import { listThreads, createThread, deleteThread } from "@/lib/chat.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "AI Chat — GerberGPT" }] }),
  component: ChatLayout,
});

function ChatLayout() {
  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);
  const del = useServerFn(deleteThread);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data, isLoading } = useQuery({
    queryKey: ["chat-threads"],
    queryFn: () => list(),
  });

  const newChat = async () => {
    try {
      const { thread } = await create({ data: {} });
      await qc.invalidateQueries({ queryKey: ["chat-threads"] });
      navigate({ to: "/chat/$threadId", params: { threadId: thread!.id } });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create chat");
    }
  };

  const remove = async (id: string) => {
    try {
      await del({ data: { id } });
      await qc.invalidateQueries({ queryKey: ["chat-threads"] });
      if (pathname.includes(id)) navigate({ to: "/chat" });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  return (
    <div className="flex h-screen">
      <aside className="hidden md:flex w-64 flex-col border-r border-border/40 glass-strong">
        <button
          onClick={newChat}
          className="m-3 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground px-3 py-2 text-sm glow-primary"
        >
          <Plus className="h-4 w-4" /> New chat
        </button>
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
          {isLoading && <div className="text-xs text-muted-foreground p-3 inline-flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</div>}
          {data?.threads.length === 0 && (
            <div className="text-xs text-muted-foreground p-3">No conversations yet. Start a new chat.</div>
          )}
          {data?.threads.map((t) => {
            const active = pathname === `/chat/${t.id}`;
            return (
              <div key={t.id} className={`group flex items-center gap-1 rounded-lg pr-1 ${active ? "bg-primary/15 border border-primary/30" : "hover:bg-white/5"}`}>
                <Link
                  to="/chat/$threadId"
                  params={{ threadId: t.id }}
                  className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 text-sm"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{t.title}</span>
                </Link>
                <button
                  onClick={() => remove(t.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive"
                  aria-label="Delete chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
