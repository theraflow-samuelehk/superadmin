
-- Enum per sender_type
CREATE TYPE public.chat_sender_type AS ENUM ('salon', 'client');

-- Enum per message_type
CREATE TYPE public.chat_message_type AS ENUM ('text', 'image', 'audio', 'file');

-- Tabella conversazioni
CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, client_id)
);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Owner può tutto sulle proprie conversazioni
CREATE POLICY "Salon owner can select own conversations"
  ON public.chat_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Salon owner can insert own conversations"
  ON public.chat_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Salon owner can update own conversations"
  ON public.chat_conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- Cliente può vedere le conversazioni dove è il client
CREATE POLICY "Client can select own conversations"
  ON public.chat_conversations FOR SELECT
  USING (client_id IN (
    SELECT id FROM public.clients WHERE auth_user_id = auth.uid()
  ));

-- Tabella messaggi
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_type public.chat_sender_type NOT NULL,
  sender_id uuid NOT NULL,
  content text,
  message_type public.chat_message_type NOT NULL DEFAULT 'text',
  file_url text,
  file_name text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper function per verificare accesso a una conversazione
CREATE OR REPLACE FUNCTION public.can_access_conversation(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_conversations cc
    WHERE cc.id = _conversation_id
      AND (
        cc.user_id = _user_id
        OR cc.client_id IN (SELECT id FROM public.clients WHERE auth_user_id = _user_id)
      )
  )
$$;

-- Messaggi: SELECT
CREATE POLICY "Users can view messages of own conversations"
  ON public.chat_messages FOR SELECT
  USING (public.can_access_conversation(auth.uid(), conversation_id));

-- Messaggi: INSERT
CREATE POLICY "Users can insert messages in own conversations"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    public.can_access_conversation(auth.uid(), conversation_id)
    AND sender_id = auth.uid()
  );

-- Messaggi: UPDATE (per is_read)
CREATE POLICY "Users can update messages in own conversations"
  ON public.chat_messages FOR UPDATE
  USING (public.can_access_conversation(auth.uid(), conversation_id));

-- Indici
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at);
CREATE INDEX idx_chat_conversations_user ON public.chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_client ON public.chat_conversations(client_id);

-- Storage bucket per allegati chat
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', false);

-- Storage RLS: SELECT
CREATE POLICY "Chat attachments select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-attachments' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.chat_conversations cc
      WHERE cc.id::text = (storage.foldername(name))[2]
        AND (cc.user_id = auth.uid() OR cc.client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid()))
    )
  ));

-- Storage RLS: INSERT
CREATE POLICY "Chat attachments insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-attachments' AND EXISTS (
    SELECT 1 FROM public.chat_conversations cc
    WHERE cc.id::text = (storage.foldername(name))[1]
      AND (cc.user_id = auth.uid() OR cc.client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid()))
  ));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
