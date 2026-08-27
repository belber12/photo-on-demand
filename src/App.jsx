import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, fetchPortfolioItems } from "./lib/supabase.js";
import { ChatWidget } from "./components/chat/ChatWidget.jsx";
import SEO from "./components/SEO.jsx";
import {
  ArrowRight,
  Briefcase,
  Camera,
  Check,
  ChevronDown,
  Image as ImageIcon,
  MessageCircle,
  Package,
  Sparkles,
  Users,
} from "lucide-react";

const TELEGRAM_URL = "https://t.me/olegpmi";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function usePortfolio() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchPortfolioItems().then((data) => {
      if (!alive) return;
      setItems(data || []);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  return { items, loaded };
}

function getCategoryLabel(path) {
  const p = (path || "").toLowerCase();
  if (/portrety|portrait/.test(p)) return "Портреты";
  if (/svadby|wedding/.test(p)) return "Свадьбы";
  if (/predmety|catalog|ea888|stek/.test(p)) return "Предметка";
  if (/post/.test(p)) return "Ретушь";
  return "Фотосъёмка";
}

const CATEGORIES = ["Все", "Портреты", "Свадьбы", "Предметка", "Ретушь"];

const SERVICES = [
  {
    icon: Camera,
    title: "Портрет и beauty",
    text: "Съёмка для профиля, портфолио и соцсетей. Помогаем с позой и настроением, обрабатываем естественно — без «пластика».",
  },
  {
    icon: Briefcase,
    title: "Бизнес и корпоратив",
    text: "Фото для сайта, презентаций и соцсетей компании. Сотрудники, руководители, офис и продукт в едином стиле.",
  },
  {
    icon: Users,
    title: "Семейная съёмка",
    text: "Семейные и детские съёмки без постановочной скованности. Снимаем живые кадры, которые приятно пересматривать.",
  },
  {
    icon: Package,
    title: "Предметка и каталог",
    text: "Фото товаров для маркетплейсов и каталогов: белый фон, студийный свет, мягкая тень. Готово к загрузке на площадку.",
  },
  {
    icon: Sparkles,
    title: "Ретушь фото",
    text: "Чистка кожи, цвет, светотень, детали. Аккуратная обработка с естественным результатом для печати и соцсетей.",
  },
  {
    icon: ImageIcon,
    title: "Реставрация старых фото",
    text: "Убираем царапины и заломы, восстанавливаем лица, раскрашиваем чёрно-белые снимки.",
  },
];

const STEPS = [
  {
    num: "1",
    title: "Бриф",
    text: "Рассказываете, для чего нужны фото: задача, стиль, сроки. Присылаем план съёмки и расчёт стоимости.",
  },
  {
    num: "2",
    title: "Съёмка",
    text: "Согласуем время и место. На месте помогаем с позами, светом и деталями. Превью — в течение 24 часов.",
  },
  {
    num: "3",
    title: "Ретушь и выдача",
    text: "Обрабатываем выбранные кадры и отдаём в нужных форматах — для соцсетей, сайта или печати.",
  },
];

const FAQ = [
  {
    q: "Сколько длится съёмка?",
    a: "Обычно 60–90 минут. Предметная и корпоративная съёмка — по объёму задачи.",
  },
  {
    q: "Где проходит съёмка?",
    a: "В студии, у вас в офисе или на выбранной локации. Обсуждаем заранее.",
  },
  {
    q: "Что входит в ретушь?",
    a: "Цвет, тон кожи, светотень, удаление лишних деталей и подготовка файлов под нужные форматы.",
  },
  {
    q: "Сколько стоят услуги?",
    a: "Стоимость зависит от формата и объёма. Напишите нам, что нужно, — пришлём расчёт в течение дня.",
  },
  {
    q: "Работаете по договору?",
    a: "Да. Фиксируем объём, сроки и условия, чтобы обе стороны были спокойны.",
  },
];

const LEAD_TYPES = ["Портрет", "Бизнес", "Семейная", "Предметка", "Ретушь", "Реставрация", "Другое"];

function Section({ id, children, className }) {
  return (
    <section id={id} className={cn("mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20", className)}>
      {children}
    </section>
  );
}

function SectionTitle({ kicker, title, text }) {
  return (
    <div className="max-w-2xl">
      {kicker && (
        <p className="text-xs font-semibold uppercase tracking-widest text-brand">{kicker}</p>
      )}
      <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">{title}</h2>
      {text && <p className="mt-3 text-ink-soft">{text}</p>}
    </div>
  );
}

export default function App() {
  const { items, loaded } = usePortfolio();
  const [category, setCategory] = useState("Все");
  const [leadStatus, setLeadStatus] = useState("idle");
  const [lead, setLead] = useState({
    name: "",
    phone: "",
    email: "",
    shootType: "Портрет",
    message: "",
  });

  const portfolioByCategory = useMemo(() => {
    if (category === "Все") return items;
    return items.filter((it) => getCategoryLabel(it.path) === category);
  }, [items, category]);

  const submitLead = useCallback(
    async (e) => {
      e.preventDefault();
      if (leadStatus === "sending") return;
      const email = lead.email.trim();
      if (!email) return;
      setLeadStatus("sending");
      try {
        const { error } = await supabase.from("leads").insert({
          name: lead.name.trim(),
          email,
          phone: lead.phone.trim(),
          shoot_type: lead.shootType,
          message: lead.message.trim(),
        });
        if (error) throw error;
        setLeadStatus("success");
        setLead({ name: "", phone: "", email: "", shootType: "Портрет", message: "" });
      } catch {
        setLeadStatus("error");
      }
    },
    [lead, leadStatus],
  );

  const setField = (field) => (e) =>
    setLead((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-paper text-ink">
      <SEO
        title="Фото на заказ — съёмка и ретушь"
        description="Съёмка и ретушь под вашу задачу: портрет, бизнес, семейная, предметка. Превью в течение 24 часов. Напишите нам — пришлём расчёт."
      />

      {/* Шапка */}
      <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white">
              <Camera className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              ФотоНаЗаказ
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-medium text-ink-soft md:flex">
            <a href="#services" className="hover:text-ink">Услуги</a>
            <a href="#portfolio" className="hover:text-ink">Портфолио</a>
            <a href="#how" className="hover:text-ink">Как работаем</a>
            <a href="#pricing" className="hover:text-ink">Стоимость</a>
            <a href="#contacts" className="hover:text-ink">Контакты</a>
          </nav>
          <a
            href="#contacts"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Заказать съёмку
          </a>
        </div>
      </header>

      {/* Первый экран */}
      <section id="top" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-10">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-dark">
              <Camera className="h-3.5 w-3.5" />
              Студия фотосъёмки и ретуши
            </p>
            <h1 className="mt-5 text-3xl sm:text-5xl font-extrabold leading-tight tracking-tight">
              Снимаем и обрабатываем фото под вашу задачу
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-soft">
              Портрет, бизнес, семейные и предметные съёмки. Понятный процесс,
              превью в течение 24 часов, естественная ретушь без «пластика».
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#contacts"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                Обсудить съёмку
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#portfolio"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-stone-300 bg-white px-6 text-sm font-semibold text-ink transition-colors hover:border-stone-400"
              >
                Смотреть портфолио
              </a>
            </div>
            <p className="mt-6 text-sm text-ink-muted">
              Отвечаем в течение дня. Съёмка — по предварительной записи.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {!loaded ? (
              <div className="col-span-2 grid h-72 place-items-center rounded-3xl border border-stone-200 bg-white text-sm text-ink-muted">
                Загружаем работы…
              </div>
            ) : (
              items.slice(0, 4).map((it) => (
                <img
                  key={it.path}
                  src={it.urlThumb}
                  alt=""
                  loading="lazy"
                  className="h-40 w-full rounded-2xl object-cover sm:h-52"
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Услуги */}
      <Section id="services">
        <SectionTitle
          kicker="Услуги"
          title="Что мы делаем"
          text="Подбираем формат съёмки под вашу цель — от портрета до каталога товаров."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="rounded-3xl border border-stone-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{s.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Портфолио */}
      <Section id="portfolio" className="bg-paper-warm">
        <SectionTitle
          kicker="Портфолио"
          title="Примеры работ"
          text="Реальные съёмки из наших проектов: портреты, свадьбы, предметка и ретушь."
        />
        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                category === c
                  ? "bg-brand text-white"
                  : "border border-stone-300 bg-white text-ink-soft hover:border-stone-400",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        {!loaded ? (
          <div className="mt-6 grid h-64 place-items-center rounded-3xl border border-stone-200 bg-white text-sm text-ink-muted">
            Загружаем работы…
          </div>
        ) : portfolioByCategory.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-stone-200 bg-white p-10 text-center text-sm text-ink-muted">
            В этой категории пока нет работ.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {portfolioByCategory.slice(0, 16).map((it) => (
              <img
                key={it.path}
                src={it.urlThumb}
                alt={getCategoryLabel(it.path)}
                loading="lazy"
                className="h-40 w-full rounded-2xl object-cover sm:h-48"
              />
            ))}
          </div>
        )}
      </Section>

      {/* Как работаем */}
      <Section id="how">
        <SectionTitle
          kicker="Как работаем"
          title="Три шага до готовых фото"
          text="Понятный процесс без сюрпризов: от брифа до выдачи файлов."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((st) => (
            <div key={st.num} className="rounded-3xl border border-stone-200 bg-white p-6">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-base font-bold text-white">
                {st.num}
              </span>
              <h3 className="mt-4 text-lg font-bold">{st.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{st.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Стоимость */}
      <Section id="pricing" className="bg-paper-warm">
        <SectionTitle
          kicker="Стоимость"
          title="Цена зависит от задачи"
          text="Стоимость считаем под конкретный проект: формат, объём, сроки. Без скрытых доплат."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-stone-200 bg-white p-6">
            <h3 className="text-base font-bold">Разовая съёмка</h3>
            <p className="mt-2 text-sm text-ink-soft">
              Портрет, семейная, бизнес или предметка. Расчёт — после короткого брифа.
            </p>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark"
            >
              Узнать стоимость <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-white p-6">
            <h3 className="text-base font-bold">Ретушь и реставрация</h3>
            <p className="mt-2 text-sm text-ink-soft">
              Обработка одного фото или целого каталога. Оценка — по примерам работ.
            </p>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark"
            >
              Показать примеры <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-white p-6">
            <h3 className="text-base font-bold">Контент на месяц</h3>
            <p className="mt-2 text-sm text-ink-soft">
              Серии кадров для соцсетей и сайта в едином стиле. Состав подбираем под задачи.
            </p>
            <a
              href="#contacts"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark"
            >
              Обсудить <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
        <p className="mt-6 text-sm text-ink-muted">
          Точную стоимость называем после брифа — обычно в течение дня.
        </p>
      </Section>

      {/* Вопросы */}
      <Section id="faq">
        <SectionTitle kicker="Вопросы" title="Частые вопросы" />
        <div className="mt-8 max-w-3xl space-y-3">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-stone-200 bg-white px-5 py-4"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold">
                {f.q}
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* Контакты и заявка */}
      <Section id="contacts" className="bg-paper-warm">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionTitle
              kicker="Контакты"
              title="Оставьте заявку"
              text="Расскажите, что нужно, — пришлём бриф и расчёт. Или напишите сразу в Telegram."
            />
            <div className="mt-6 space-y-3">
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 transition-colors hover:border-stone-400"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#229ed9]/10 text-[#1d7fb0]">
                  <MessageCircle className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">Telegram</span>
                  <span className="block text-sm text-ink-soft">@olegpmi — отвечаем в течение дня</span>
                </span>
              </a>
            </div>
          </div>

          <form
            onSubmit={submitLead}
            name="lead"
            data-netlify="true"
            netlify-honeypot="bot-field"
            className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8"
          >
            <input type="hidden" name="form-name" value="lead" />
            <p className="hidden">
              <label>
                Не заполняйте это поле: <input name="bot-field" />
              </label>
            </p>
            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Имя"
                  aria-label="Имя"
                  value={lead.name}
                  onChange={setField("name")}
                  className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="Телефон"
                  aria-label="Телефон"
                  value={lead.phone}
                  onChange={setField("phone")}
                  className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <input
                type="email"
                required
                placeholder="Email"
                aria-label="Email"
                value={lead.email}
                onChange={setField("email")}
                className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <select
                aria-label="Тип съёмки"
                value={lead.shootType}
                onChange={setField("shootType")}
                className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                {LEAD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Комментарий: что нужно, сроки, примеры"
                aria-label="Комментарий"
                value={lead.message}
                onChange={setField("message")}
                rows={4}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="submit"
                disabled={leadStatus === "sending"}
                className={cn(
                  "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-dark",
                  leadStatus === "sending" && "cursor-not-allowed opacity-70",
                )}
              >
                {leadStatus === "sending"
                  ? "Отправляем…"
                  : leadStatus === "success"
                    ? "Заявка отправлена"
                    : "Отправить заявку"}
              </button>
              {leadStatus === "success" && (
                <p className="flex items-center gap-2 text-sm font-medium text-green-700">
                  <Check className="h-4 w-4" /> Спасибо! Свяжемся с вами в течение дня.
                </p>
              )}
              {leadStatus === "error" && (
                <p className="text-sm font-medium text-red-700">
                  Не получилось отправить. Напишите нам в Telegram — @olegpmi.
                </p>
              )}
            </div>
          </form>
        </div>
      </Section>

      {/* Подвал */}
      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white">
                  <Camera className="h-5 w-5" />
                </span>
                <span className="text-lg font-extrabold tracking-tight">ФотоНаЗаказ</span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-ink-soft">
                Съёмка и ретушь под вашу задачу: портрет, бизнес, семейная, предметка.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">Навигация</p>
              <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                <li><a href="#services" className="hover:text-ink">Услуги</a></li>
                <li><a href="#portfolio" className="hover:text-ink">Портфолио</a></li>
                <li><a href="#pricing" className="hover:text-ink">Стоимость</a></li>
                <li><a href="#contacts" className="hover:text-ink">Контакты</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">Контакты</p>
              <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                <li>
                  <a href={TELEGRAM_URL} target="_blank" rel="noreferrer" className="hover:text-ink">
                    Telegram: @olegpmi
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-2 border-t border-stone-200 pt-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 ФотоНаЗаказ</p>
            <div className="flex gap-4">
              <Link to="/privacy" className="hover:text-ink">Политика конфиденциальности</Link>
              <Link to="/terms" className="hover:text-ink">Условия использования</Link>
            </div>
          </div>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}
