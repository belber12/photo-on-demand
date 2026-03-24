-- Статьи блога
CREATE TABLE IF NOT EXISTS blog_articles (
  id          bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  slug        text UNIQUE NOT NULL,
  title       text NOT NULL,
  excerpt     text NOT NULL DEFAULT '',
  body        text NOT NULL DEFAULT '',
  cover_url   text,
  cover_path  text,
  published   boolean NOT NULL DEFAULT false,
  sort_order  integer NOT NULL DEFAULT 0
);

ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;

-- Все могут читать опубликованные статьи
CREATE POLICY "Public read published articles"
  ON blog_articles FOR SELECT
  TO anon, authenticated
  USING (published = true);

-- Админы имеют полный доступ
CREATE POLICY "Admin full access articles"
  ON blog_articles FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid()));

-- Автоматически обновляем updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER blog_articles_updated_at
  BEFORE UPDATE ON blog_articles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
