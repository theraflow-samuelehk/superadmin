
-- Allow clients to create conversations with their salon
CREATE POLICY "Client can insert own conversations"
  ON public.chat_conversations FOR INSERT
  WITH CHECK (
    client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
  );
