CREATE TABLE leads (
  id         bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz NOT NULL DEFAULT now(),
  name       text,
  email      text,
  phone      text,
  shoot_type text,
  message    text,
  plan       text
);

-- Allow anyone to submit a lead (insert only — no read/update/delete for anon)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon insert leads"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);
