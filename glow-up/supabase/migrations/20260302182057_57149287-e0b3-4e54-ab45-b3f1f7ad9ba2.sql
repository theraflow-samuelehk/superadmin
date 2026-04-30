-- Enable realtime for affiliate_commissions so dashboards update in real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_commissions;