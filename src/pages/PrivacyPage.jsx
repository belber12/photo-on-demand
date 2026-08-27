import { Link } from "react-router-dom";
import SEO from "../components/SEO.jsx";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SEO
        title="Политика конфиденциальности"
        description="Политика конфиденциальности сайта ФотоНаЗаказ."
        canonical="/privacy"
      />
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-lg font-extrabold tracking-tight">ФотоНаЗаказ</Link>
          <Link to="/" className="text-sm font-medium text-ink-soft hover:text-ink">На главную</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight">Политика конфиденциальности</h1>
        <p className="mt-2 text-sm text-ink-muted">Дата последнего обновления: 27 августа 2026 года</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink-soft">
          <section>
            <h2 className="text-lg font-bold text-ink">1. Какие данные мы собираем</h2>
            <p className="mt-2">
              Когда вы оставляете заявку на сайте, мы получаем имя, телефон, адрес электронной почты,
              выбранный тип съёмки и текст комментария. Эти данные нужны, чтобы связаться с вами
              и подготовить расчёт.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-ink">2. Зачем мы используем данные</h2>
            <p className="mt-2">
              Данные используются только для связи по вашей заявке: ответить на вопросы,
              уточнить задачу, прислать расчёт стоимости. Мы не передаём данные третьим лицам
              и не используем их для рассылок без вашего согласия.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-ink">3. Где хранятся данные</h2>
            <p className="mt-2">
              Заявки хранятся в защищённой базе данных. Доступ к ним есть только у сотрудников,
              которые работают с заявками.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-ink">4. Ваши права</h2>
            <p className="mt-2">
              Вы можете в любой момент попросить удалить ваши данные или уточнить, какие данные
              о вас хранятся. Для этого напишите нам в Telegram: @olegpmi.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-ink">5. Файлы cookie</h2>
            <p className="mt-2">
              Сайт не использует рекламные cookie и не отслеживает вас по сторонним сайтам.
              Технические cookie могут использоваться для корректной работы страниц.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-ink">6. Изменения политики</h2>
            <p className="mt-2">
              Если политика изменится, мы обновим эту страницу и укажем новую дату обновления.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-ink">7. Контакты</h2>
            <p className="mt-2">
              Вопросы о данных: Telegram @olegpmi.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
