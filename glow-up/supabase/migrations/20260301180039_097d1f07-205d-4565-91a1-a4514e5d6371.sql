CREATE POLICY "Users can delete own announcements"
ON public.announcements
FOR DELETE
USING (auth.uid() = user_id);