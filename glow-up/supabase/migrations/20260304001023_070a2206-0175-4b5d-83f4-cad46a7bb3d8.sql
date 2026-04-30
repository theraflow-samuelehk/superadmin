
ALTER TABLE profiles ADD COLUMN trial_ends_at timestamptz 
  DEFAULT (now() + interval '15 days');

-- Popola per profili esistenti
UPDATE profiles SET trial_ends_at = created_at + interval '15 days' 
  WHERE trial_ends_at IS NULL;
