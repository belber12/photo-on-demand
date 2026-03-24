-- Таблица администраторов: только строки с user_id из auth.users
CREATE TABLE IF NOT EXISTS admin_roles (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Аутентифицированный пользователь может проверить свою роль
CREATE POLICY "Users can read own admin role"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Чтобы добавить первого админа — выполни в SQL-редакторе Supabase:
-- INSERT INTO admin_roles (user_id) VALUES ('<твой-uuid-из-Auth-Users>');
