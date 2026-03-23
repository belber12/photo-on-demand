-- Allow anonymous users to list and read files in the portfolio bucket
CREATE POLICY "Public list portfolio"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'portfolio');
