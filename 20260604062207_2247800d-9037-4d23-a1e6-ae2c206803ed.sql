
CREATE TABLE public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New chat',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_threads TO authenticated;
GRANT ALL ON public.chat_threads TO service_role;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own threads select" ON public.chat_threads FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own threads insert" ON public.chat_threads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own threads update" ON public.chat_threads FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own threads delete" ON public.chat_threads FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX chat_threads_user_updated_idx ON public.chat_threads(user_id, updated_at DESC);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages select" ON public.chat_messages FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own messages insert" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own messages delete" ON public.chat_messages FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX chat_messages_thread_created_idx ON public.chat_messages(thread_id, created_at);
