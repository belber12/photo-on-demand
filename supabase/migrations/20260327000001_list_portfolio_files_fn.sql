-- Функция для получения всех файлов портфолио за один запрос.
-- Заменяет рекурсивный обход storage.list() (N запросов) одним SQL-запросом.
CREATE OR REPLACE FUNCTION list_portfolio_files()
RETURNS TABLE(name text)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT name
  FROM storage.objects
  WHERE bucket_id = 'portfolio'
    AND name NOT LIKE '%/.emptyFolderPlaceholder'
    AND name NOT LIKE '%.emptyFolderPlaceholder'
    AND right(name, 1) != '/'
  ORDER BY name;
$$;

-- Разрешаем вызов анонимным пользователям (публичный портфолио)
GRANT EXECUTE ON FUNCTION list_portfolio_files() TO anon, authenticated;
