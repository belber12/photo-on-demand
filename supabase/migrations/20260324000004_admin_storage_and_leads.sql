-- Политики Storage: админ может загружать и удалять фото портфолио
CREATE POLICY "Admin upload portfolio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'portfolio'
    AND EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin delete portfolio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'portfolio'
    AND EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid())
  );

-- Политика на чтение лидов для админа
CREATE POLICY "Admin read leads"
  ON leads FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid()));
