-- DB-level constraints to prevent spam and invalid data in leads
ALTER TABLE public.leads
  ADD CONSTRAINT leads_name_length    CHECK (length(name) >= 2 AND length(name) <= 100),
  ADD CONSTRAINT leads_phone_format   CHECK (phone ~ '^\+?[1-9]\d{6,14}$'),
  ADD CONSTRAINT leads_email_format   CHECK (email IS NULL OR email LIKE '%@%'),
  ADD CONSTRAINT leads_message_length CHECK (message IS NULL OR length(message) <= 2000);

-- Rate limit: max 3 leads from same phone in 24 hours
CREATE OR REPLACE FUNCTION check_lead_phone_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM public.leads
  WHERE phone = NEW.phone
    AND created_at > NOW() - INTERVAL '24 hours';

  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'rate_limit: too many leads from this phone number';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER leads_phone_rate_limit
  BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION check_lead_phone_rate_limit();
