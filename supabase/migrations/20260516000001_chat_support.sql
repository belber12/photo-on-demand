-- leads: add source column with channel enum
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'form'
    CHECK (source IN ('form','chat_widget','telegram','whatsapp','avito','max'));

-- leads: dedupe_key for idempotent lead inserts
-- md5(session_id + ':' + phone + ':' + shoot_type) — allows second order of different type
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS dedupe_key text;
ALTER TABLE leads
  ADD CONSTRAINT IF NOT EXISTS leads_dedupe_key_unique UNIQUE (dedupe_key);

-- chat_sessions: store conversation transcripts
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  -- phone masked: +7999***4567
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  lead_id bigint REFERENCES leads(id),
  ip_hash text,
  converted boolean NOT NULL DEFAULT false,
  channel text NOT NULL DEFAULT 'web'
);

CREATE INDEX IF NOT EXISTS chat_sessions_created_at_id_idx
  ON chat_sessions (created_at DESC, id DESC);

-- RLS: only authenticated admin can read chat_sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_chat_sessions" ON chat_sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = auth.uid()
    )
  );

-- security_events: log suspicious activity
CREATE TABLE IF NOT EXISTS security_events (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  ip_hash text,
  event_type text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_security_events" ON security_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.user_id = auth.uid()
    )
  );

-- RPC: chat stats for admin panel
CREATE OR REPLACE FUNCTION get_chat_stats(days int DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  since timestamptz := now() - (days || ' days')::interval;
  dialogs bigint;
  leads_count bigint;
  conversion_pct numeric;
BEGIN
  SELECT COUNT(*) INTO dialogs
    FROM chat_sessions WHERE created_at >= since;

  SELECT COUNT(*) INTO leads_count
    FROM chat_sessions WHERE created_at >= since AND converted = true;

  conversion_pct := CASE WHEN dialogs = 0 THEN 0
    ELSE round(leads_count::numeric / dialogs * 100, 1)
  END;

  RETURN json_build_object(
    'dialogs', dialogs,
    'leads', leads_count,
    'conversion_pct', conversion_pct
  );
END;
$$;

-- pg_cron: purge chat_sessions older than 90 days (requires pg_cron extension)
-- Run manually in Supabase SQL editor if pg_cron not available:
-- SELECT cron.schedule('cleanup-chat-sessions', '0 3 * * *',
--   'DELETE FROM chat_sessions WHERE created_at < now() - interval ''90 days''');
