
-- Support conversations table (1 per retailer)
CREATE TABLE public.support_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_user_id uuid NOT NULL,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(retailer_user_id)
);

ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;

-- Retailer can view/insert own conversation
CREATE POLICY "Retailers can view own support conversation"
  ON public.support_conversations FOR SELECT
  USING (auth.uid() = retailer_user_id);

CREATE POLICY "Retailers can insert own support conversation"
  ON public.support_conversations FOR INSERT
  WITH CHECK (auth.uid() = retailer_user_id);

CREATE POLICY "Retailers can update own support conversation"
  ON public.support_conversations FOR UPDATE
  USING (auth.uid() = retailer_user_id);

-- Super admins can do everything
CREATE POLICY "Super admins can manage support conversations"
  ON public.support_conversations FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Support messages table
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('retailer', 'admin')),
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Security definer function to check support conversation access
CREATE OR REPLACE FUNCTION public.can_access_support_conversation(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.support_conversations sc
    WHERE sc.id = _conversation_id
      AND (
        sc.retailer_user_id = _user_id
        OR public.has_role(_user_id, 'super_admin')
      )
  )
$$;

-- Messages policies
CREATE POLICY "Users can view support messages"
  ON public.support_messages FOR SELECT
  USING (public.can_access_support_conversation(auth.uid(), conversation_id));

CREATE POLICY "Users can insert support messages"
  ON public.support_messages FOR INSERT
  WITH CHECK (public.can_access_support_conversation(auth.uid(), conversation_id) AND auth.uid() = sender_id);

CREATE POLICY "Users can update support messages"
  ON public.support_messages FOR UPDATE
  USING (public.can_access_support_conversation(auth.uid(), conversation_id));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
