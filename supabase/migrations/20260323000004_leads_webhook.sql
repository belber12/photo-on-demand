CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION notify_lead_telegram()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url     := 'https://nctkkhnqtfambhamfvmi.supabase.co/functions/v1/notify-lead',
    body    := row_to_json(NEW)::jsonb,
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdGtraG5xdGZhbWJoYW1mdm1pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAzMjk0MywiZXhwIjoyMDg5NjA4OTQzfQ.ssN8k3BfjiR5Gzu1xxxzNbIk787YVrzX1UETMmx2-c4"}'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_lead_inserted
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION notify_lead_telegram();
