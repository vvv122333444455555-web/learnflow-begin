CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_user_created ON public.ai_chat_messages(user_id, created_at);

ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.ai_chat_messages TO authenticated;

-- A student can only see and add their own messages. Inserts happen from the
-- ai-chat edge function using the student's own JWT, so this is enough.
DROP POLICY IF EXISTS "Users manage own chat messages" ON public.ai_chat_messages;
CREATE POLICY "Users manage own chat messages" ON public.ai_chat_messages
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can review chat history platform-wide (child-safety oversight).
DROP POLICY IF EXISTS "Admins view all chat messages" ON public.ai_chat_messages;
CREATE POLICY "Admins view all chat messages" ON public.ai_chat_messages
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

NOTIFY pgrst, 'reload schema';
