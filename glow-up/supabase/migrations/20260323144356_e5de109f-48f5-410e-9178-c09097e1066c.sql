ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS booking_blocked_from date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS booking_blocked_until date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS booking_blocked_message text DEFAULT NULL;