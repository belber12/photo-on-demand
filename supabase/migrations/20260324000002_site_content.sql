-- Хранилище редактируемого текста сайта (ключ → значение)
CREATE TABLE IF NOT EXISTS site_content (
  key        text PRIMARY KEY,
  value      text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Все могут читать
CREATE POLICY "Public read site_content"
  ON site_content FOR SELECT
  TO anon, authenticated
  USING (true);

-- Только админы могут изменять
CREATE POLICY "Admin write site_content"
  ON site_content FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid()));

-- Начальные значения (текущий контент сайта)
INSERT INTO site_content (key, value) VALUES
  ('hero.title',              'Фото на заказ'),
  ('hero.subtitle',           'Профессиональная съёмка и ретушь под ваш проект'),
  ('hero.cta',                'Записаться на съёмку'),
  ('hero.badge1',             'Превью за 24 ч'),
  ('hero.badge2',             '3 200+ съёмок'),
  ('hero.badge3',             '98% довольных клиентов'),
  ('stats.shoots',            '3200'),
  ('stats.satisfaction',      '98'),
  ('stats.delivery',          '24'),
  ('stats.rating',            '4.9'),
  ('pricing.yearly_discount', '20'),
  ('pricing.plan1.name',      'Базовый'),
  ('pricing.plan1.desc',      'Идеально для личного профиля и первых портфолио-кадров.'),
  ('pricing.plan1.price',     '7900'),
  ('pricing.plan1.features',  'Съёмка 60 минут|10 фото в ретуши|Превью за 24 часа|Форматы под соцсети'),
  ('pricing.plan2.name',      'Про'),
  ('pricing.plan2.desc',      'Максимум wow-эффекта для бренда, сайта и рекламных креативов.'),
  ('pricing.plan2.price',     '14900'),
  ('pricing.plan2.badge',     'Популярный'),
  ('pricing.plan2.features',  'Съёмка 90 минут|25 фото в ретуши|Расширенный moodboard|Приоритетная обработка|Форматы под сайт/рекламу'),
  ('pricing.plan3.name',      'Энтерпрайз'),
  ('pricing.plan3.desc',      'Командные, каталожные и масштабные съёмки под процессы бизнеса.'),
  ('pricing.plan3.price',     '29900'),
  ('pricing.plan3.features',  'Съёмка 2–3 часа|60+ фото в ретуши|Съёмка в нескольких сценах|SLA по срокам|Документы/договор'),
  ('telegram.url',            'https://t.me/olegpmi'),
  ('faq.1.q', 'Сколько времени занимает съёмка?'),
  ('faq.1.a', 'Обычно 60–90 минут. Для предметки и командных съёмок — по объёму.'),
  ('faq.2.q', 'Можно ли выбрать стиль и референсы?'),
  ('faq.2.a', 'Да. Делаем moodboard по вашим примерам или собираем его вместе.'),
  ('faq.3.q', 'Что входит в ретушь?'),
  ('faq.3.a', 'Цвет, кожа, детали, светотень и экспорт под нужные форматы.'),
  ('faq.4.q', 'Есть ли срочная обработка?'),
  ('faq.4.a', 'Да, если есть слот. Срок зависит от объёма и тарифа.'),
  ('faq.5.q', 'Работаете по договору?'),
  ('faq.5.a', 'Да. Фиксируем объём, сроки и условия.'),
  ('faq.6.q', 'Где проходит съёмка?'),
  ('faq.6.a', 'Студия, город, офис или шоурум. Локацию подбираем под задачу.')
ON CONFLICT (key) DO NOTHING;
