import { Link } from "react-router-dom";
import SEO from "../components/SEO.jsx";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SEO
        title="Условия использования"
        description="Условия использования сайта ФотоНаЗаказ."
        canonical="/terms"
      />
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-lg font-extrabold tracking-tight">ФотоНаЗаказ</Link>
          <Link to="/" className="text-sm font-medium text-ink-soft hover:text-ink">На главную</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight">Условия использования</h1>
        <p className="mt-2 text-sm text-ink-muted">Дата последнего обновления: 27 августа 2026 года</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink-soft">
          <section>
            <h2 className="text-lg font-bold text-ink">1. Общие положения</h2>
            <p className="mt-2">
              Используя сайт «ФотоНаЗаказ», вы соглашаетесь с условиями, описанными на этой странице.
              Если вы не согласны с условиями, пожалуйста, не используйте сайт.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-ink">2. Услуги</h2>
            <p className="mt-2">
              На сайте представлена информация об услугах фотосъёмки и ретуши. Конкретный состав
              услуг, сроки и стоимость согласовываются индивидуально после заявки.
              Публикация заявки не является автоматическим заключением договора.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-ink">3. Стоимость и оплата</h2>
            <p className="mt-2">
              Стоимость услуг зависит от формата и объёма работ и подтверждается в расчёте,
              который мы присылаем после обсуждения задачи. Условия оплаты согласовываются
              индивидуально.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-ink">4. Материалы заказчика</h2>
            <p className="mt-2">
              Вы подтверждаете, что имеете право использовать фотографии и материалы, которые
              передаёте для обработки. Мы не используем ваши материалы в портфолио без вашего
              разрешения.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-ink">5. Авторские права на работы</h2>
            <p className="mt-2">
              Авторские права на отснятые и обработанные работы принадлежат исполнителю.
              Заказчик получает право использования работ для своих целей после полной оплаты,
              если иное не согласовано отдельно.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-ink">6. Ограничение ответственности</h2>
            <p className="mt-2">
              Мы стремимся выполнять работы в согласованные сроки и с оговорённым качеством.
              Ответственность сторон определяется действующим законодательством.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-ink">7. Контакты</h2>
            <p className="mt-2">
              Вопросы по условиям: Telegram @olegpmi.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
