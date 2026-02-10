-- Waitlist signups from the public landing page
CREATE TABLE IF NOT EXISTS waitlist_signups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  company text,
  role text,
  created_at timestamptz DEFAULT now()
);

-- Unique constraint on email to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_signups_email_unique ON waitlist_signups (lower(email));

-- Allow anonymous inserts (public landing page, no auth)
ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on waitlist_signups"
  ON waitlist_signups
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only authenticated admins can read waitlist entries
CREATE POLICY "Admins can read waitlist_signups"
  ON waitlist_signups
  FOR SELECT
  TO authenticated
  USING (true);
