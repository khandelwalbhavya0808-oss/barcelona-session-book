CREATE TABLE site_settings (
  id integer PRIMARY KEY DEFAULT 1,
  maintenance_mode boolean NOT NULL DEFAULT false,
  cancellation_grace_period_hours integer NOT NULL DEFAULT 24,
  contact_email text NOT NULL DEFAULT 'hello@example.com',
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to site_settings" 
  ON site_settings 
  FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Allow admins to update site_settings" 
  ON site_settings 
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Insert initial row
INSERT INTO site_settings (id, maintenance_mode, cancellation_grace_period_hours, contact_email) 
VALUES (1, false, 24, 'hello@barcelonasessions.com');

-- Add function to update updated_at
CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_site_settings_timestamp
BEFORE UPDATE ON site_settings
FOR EACH ROW
EXECUTE FUNCTION update_site_settings_updated_at();
