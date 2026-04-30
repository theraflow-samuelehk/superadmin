
-- Allow salon owners to delete their own chat conversations
CREATE POLICY "Users can delete own conversations"
ON public.chat_conversations
FOR DELETE
USING (auth.uid() = user_id);

-- Allow salon owners to delete messages in their own conversations
CREATE POLICY "Users can delete messages in own conversations"
ON public.chat_messages
FOR DELETE
USING (conversation_id IN (
  SELECT id FROM public.chat_conversations WHERE user_id = auth.uid()
));
