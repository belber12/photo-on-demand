import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, fetchPortfolioItems } from "./lib/supabase.js";
import {
  BadgeCheck,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Github,
  Image as ImageIcon,
  Instagram,
  Layers,
  Linkedin,
  Menu,
  Package,
  ShieldCheck,
  Sparkles,
  Star,
  Send,
  ChevronLeft,
  Terminal,
  Twitter,
  Wand2,
  X,
  Zap,
} from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function useInView({ threshold = 0.15, rootMargin = "0px 0px -10% 0px", once = true } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) obs.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, inView };
}

function useCountUp({ startWhen, target, durationMs = 2000, decimals = 0 }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!startWhen) return;

    const steps = 60;
    const tickMs = Math.max(16, Math.round(durationMs / steps));
    const totalTicks = Math.max(1, Math.round(durationMs / tickMs));
    const increment = target / totalTicks;
    let current = 0;
    let tick = 0;

    setValue(0);
    const id = setInterval(() => {
      tick += 1;
      current = Math.min(target, current + increment);
      const next = decimals > 0 ? Number(current.toFixed(decimals)) : Math.round(current);
      setValue(next);
      if (tick >= totalTicks || current >= target) clearInterval(id);
    }, tickMs);

    return () => clearInterval(id);
  }, [startWhen, target, durationMs, decimals]);

  return value;
}

function formatCompactK(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
}

function getUrlFromGlobMod(mod) {
  if (!mod) return null;
  if (typeof mod === "string") return mod;
  if (typeof mod === "object" && mod.default) return mod.default;
  return null;
}

function pickBeforeAfter(portfolio) {
  const norm = (s) => (s || "").toLowerCase();
  const isBefore = (p) => /(^|\/)(before|до)(\/|_|-|\.|\s)/i.test(p) || /before|до/i.test(p);
  const isAfter = (p) => /(^|\/)(after|после)(\/|_|-|\.|\s)/i.test(p) || /after|после/i.test(p);

  const before = portfolio.find((p) => isBefore(norm(p.path)));
  const after = portfolio.find((p) => isAfter(norm(p.path)));
  if (before?.url && after?.url) return { beforeUrl: before.url, afterUrl: after.url };

  // Fallback: try pair from first two images (but keep mock if none)
  if (portfolio.length >= 2) return { beforeUrl: portfolio[0].url, afterUrl: portfolio[1].url };
  return { beforeUrl: null, afterUrl: null };
}

const BEFORE_AFTER_CATEGORIES = [
  { id: "portraits", label: "Портреты", match: /портрет|portrait|portrety/i },
  { id: "weddings", label: "Свадьбы", match: /свадьб|wedding|svadby/i },
  { id: "products", label: "Предметы", match: /предмет|ea888|стэк|product|predmety|stek/i },
];

function BeforeAfterSlider({ beforeUrl, afterUrl, size = "compact", fit = "cover" }) {
  const wrapRef = useRef(null);
  const [pos, setPos] = useState(0.52); // 0..1
  const [dragging, setDragging] = useState(false);
  const isLarge = size === "large";
  const bgSize = fit === "contain" ? "contain" : "cover";
  const demoDoneRef = useRef(false);
  const rafRef = useRef(0);
  const { ref: inViewRef, inView: sliderInView } = useInView({ threshold: 0.65, rootMargin: "0px", once: true });

  const clamp = (v) => Math.min(0.92, Math.max(0.08, v));

  const setFromClientX = useCallback((clientX) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (clientX - r.left) / Math.max(1, r.width);
    setPos(clamp(x));
  }, []);

  const setRefs = useCallback(
    (node) => {
      wrapRef.current = node;
      inViewRef.current = node;
    },
    [inViewRef],
  );

  const cancelRaf = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }, []);

  const tweenTo = useCallback(
    (from, to, ms) =>
      new Promise((resolve) => {
        const start = performance.now();
        const step = (t) => {
          const p = Math.min(1, (t - start) / Math.max(1, ms));
          // easeOutCubic
          const eased = 1 - Math.pow(1 - p, 3);
          setPos(clamp(from + (to - from) * eased));
          if (p >= 1) {
            rafRef.current = 0;
            resolve();
            return;
          }
          rafRef.current = requestAnimationFrame(step);
        };
        rafRef.current = requestAnimationFrame(step);
      }),
    [clamp],
  );

  useEffect(() => {
    if (!sliderInView) return;
    if (demoDoneRef.current) return;
    if (dragging) return;
    demoDoneRef.current = true;

    let alive = true;
    (async () => {
      await new Promise((r) => setTimeout(r, 380));
      if (!alive) return;
      cancelRaf();
      const start = pos;
      await tweenTo(start, 0.68, 620);
      if (!alive) return;
      await tweenTo(0.68, 0.52, 460);
    })();

    return () => {
      alive = false;
      cancelRaf();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliderInView]);

  const onPointerDown = useCallback(
    (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      cancelRaf();
      setDragging(true);
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(8);
      }
      try {
        e.currentTarget.setPointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
      setFromClientX(e.clientX);
    },
    [setFromClientX, cancelRaf],
  );

  const onPointerMove = useCallback(
    (e) => {
      if (!dragging) return;
      setFromClientX(e.clientX);
    },
    [dragging, setFromClientX],
  );

  const onPointerUp = useCallback(() => {
    setDragging(false);
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(5);
    }
  }, []);

  return (
    <div
      ref={setRefs}
      className={cn(
        "relative rounded-2xl overflow-hidden border border-[color:var(--border)] bg-black/80 select-none touch-none",
        isLarge ? "aspect-[3/4] min-h-[220px] sm:min-h-[280px]" : "h-40 sm:h-48",
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="group"
      aria-label="Слайдер до и после"
    >
      {/* BEFORE layer */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage: `url("${beforeUrl}")`,
          backgroundSize: bgSize,
          backgroundPosition: "50% 50%",
          filter: "saturate(1.14) contrast(1.08) brightness(1.04)",
          transform: "translateZ(0)",
        }}
      />

      {/* AFTER layer (same size, clipped) */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage: `url("${afterUrl}")`,
          backgroundSize: bgSize,
          backgroundPosition: "50% 50%",
          filter: "saturate(1.14) contrast(1.08) brightness(1.04)",
          transform: "translateZ(0)",
          clipPath: `inset(0 ${(1 - pos) * 100}% 0 0)`,
          WebkitClipPath: `inset(0 ${(1 - pos) * 100}% 0 0)`,
          willChange: "clip-path",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/0" aria-hidden="true" />

      <div
        className="absolute top-0 bottom-0 w-px bg-white/60"
        style={{ left: `${pos * 100}%` }}
        aria-hidden="true"
      />

      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
        style={{ left: `${pos * 100}%` }}
      >
        <div
          className={cn(
            "h-12 w-12 rounded-2xl grid place-items-center",
            "border border-white/25 bg-[#0b0b12]/55 backdrop-blur-xl",
            "shadow-[0_18px_80px_rgba(0,0,0,0.65)]",
            dragging ? "scale-[1.03]" : "scale-100",
            dragging ? "handle-pulse" : "",
            "transition-transform",
          )}
          style={{
            background:
              "radial-gradient(120px circle at 30% 30%, rgba(255,79,216,0.28), transparent 45%), radial-gradient(120px circle at 70% 70%, rgba(34,211,238,0.22), transparent 46%), rgba(11,11,18,0.55)",
          }}
        >
          <div className="flex items-center gap-1 text-white/90">
            <ChevronLeft className="h-4 w-4" />
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="absolute left-3 top-3 text-[11px] sm:text-xs text-white/85">
        <span className="rounded-full px-3 py-1.5 border border-white/15 bg-black/25">После</span>
      </div>
      <div className="absolute right-3 top-3 text-[11px] sm:text-xs text-white/85">
        <span className="rounded-full px-3 py-1.5 border border-white/15 bg-black/25">До</span>
      </div>

      <div className="absolute right-3 bottom-3 text-[10px] text-white/70 rounded-full px-3 py-1.5 border border-white/10 bg-black/25">
        Потяните ползунок
      </div>
    </div>
  );
}

function InitialsAvatar({ name, seed = 0 }) {
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase()).join("");
  }, [name]);

  const palette = [
    ["#22d3ee", "#a78bfa"],
    ["#fb7185", "#22d3ee"],
    ["#34d399", "#60a5fa"],
    ["#f59e0b", "#fb7185"],
    ["#a78bfa", "#34d399"],
  ];
  const [c1, c2] = palette[seed % palette.length];

  return (
    <div
      className="h-12 w-12 shrink-0 rounded-full grid place-items-center text-white/90 font-semibold"
      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

function Section({ id, children, className, innerClassName }) {
  const { ref, inView } = useInView();

  return (
    <section
      id={id}
      ref={ref}
      className={cn(
        "relative scroll-mt-24",
        "transition-all duration-700 ease-out",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className,
      )}
    >
      <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-12 xl:px-16", innerClassName)}>{children}</div>
    </section>
  );
}

function BlogPreview() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("blog_articles")
      .select("id, slug, title, excerpt, cover_url, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => { setArticles(data || []); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="grid sm:grid-cols-3 gap-5">
        {[1,2,3].map(i => <div key={i} className="h-56 bg-white/5 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-10 text-white/30 text-sm">Статьи скоро появятся</div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {articles.map(art => (
        <Link
          key={art.id}
          to={`/blog/${art.slug}`}
          className="group flex flex-col bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden transition-all"
        >
          {art.cover_url ? (
            <img src={art.cover_url} alt={art.title} className="w-full h-44 object-cover" />
          ) : (
            <div className="w-full h-44 bg-white/5 flex items-center justify-center text-white/20 text-4xl">📷</div>
          )}
          <div className="p-5 flex-1 flex flex-col">
            <p className="text-xs text-white/35 mb-2">
              {new Date(art.created_at).toLocaleDateString("ru", { day: "numeric", month: "long" })}
            </p>
            <h3 className="font-semibold text-sm leading-snug group-hover:text-white/90 transition-colors line-clamp-3">
              {art.title}
            </h3>
            {art.excerpt && (
              <p className="mt-2 text-xs text-white/50 line-clamp-2">{art.excerpt}</p>
            )}
            <div className="mt-auto pt-4 text-xs text-white/35 group-hover:text-white/60 transition-colors">
              Читать →
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function PhotoOnDemandLanding() {
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [billing, setBilling] = useState("month"); // month | year
  const { ref: featuresRef, inView: featuresInView } = useInView({ threshold: 0.2 });
  const { ref: footerRef, inView: footerInView } = useInView({ threshold: 0.1, rootMargin: "0px 0px -5% 0px" });
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [stickyDismissed, setStickyDismissed] = useState(false);
  const { ref: ctaPeekRef, inView: ctaPeekInView } = useInView({ threshold: 0.12, rootMargin: "0px 0px -35% 0px", once: false });
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadShootType, setLeadShootType] = useState("Портрет");
  const [leadMessage, setLeadMessage] = useState("");
  const [leadStatus, setLeadStatus] = useState("idle"); // idle | sending | success | error
  const [selectedPlan, setSelectedPlan] = useState("Про");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [licenseAccepted, setLicenseAccepted] = useState(false);
  const [toolTab, setToolTab] = useState("generation");

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      setScrollY(y);
      setScrolled(y > 50);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  const scrollToId = useCallback((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const navItems = useMemo(
    () => [
      { id: "features", label: "Преимущества" },
      { id: "before-after", label: "До и после" },
      { id: "portfolio", label: "Работы" },
      { id: "tools", label: "Инструменты" },
      { id: "audience", label: "Для кого" },
      { id: "services", label: "Услуги" },
      { id: "stats", label: "Цифры" },
      { id: "how", label: "Как это работает" },
      { id: "testimonials", label: "Отзывы" },
      { id: "pricing", label: "Цены" },
      { id: "faq", label: "FAQ" },
      { id: "blog", label: "Блог" },
    ],
    [],
  );

  const [allPortfolio, setAllPortfolio] = useState([]);
  const [portfolioLoading, setPortfolioLoading] = useState(true);

  useEffect(() => {
    fetchPortfolioItems()
      .then(setAllPortfolio)
      .catch((err) => console.error("Failed to load portfolio:", err))
      .finally(() => setPortfolioLoading(false));
  }, []);

  const effectivePortfolio = useMemo(() => {
    // Исключаем пары до/после из основного списка (поддержка кириллицы и транслита)
    const withoutBeforeAfter = allPortfolio.filter(
      (p) =>
        !/\/(до|before)\.(jpg|jpeg|png|webp)$/i.test(p.path) &&
        !/\/(после|after)\.(jpg|jpeg|png|webp)$/i.test(p.path),
    );
    return withoutBeforeAfter;
  }, [allPortfolio]);

  const ribbonPortfolio = useMemo(() => effectivePortfolio.slice(0, 12), [effectivePortfolio]);
  const gridPortfolio = useMemo(() => effectivePortfolio.slice(0, 6), [effectivePortfolio]);

  const { beforeUrl, afterUrl } = useMemo(() => {
    const postBefore = allPortfolio.find((p) => p.path.endsWith("/post/before.jpg"));
    const postAfter = allPortfolio.find((p) => p.path.endsWith("/post/after.jpg"));
    if (postBefore?.url && postAfter?.url) return { beforeUrl: postBefore.url, afterUrl: postAfter.url };
    return pickBeforeAfter(effectivePortfolio);
  }, [allPortfolio, effectivePortfolio]);

  const beforeAfterByCategory = useMemo(() => {
    return BEFORE_AFTER_CATEGORIES.map((cat) => {
      const subset = allPortfolio.filter((p) => cat.match.test(p.path));
      return { ...cat, ...pickBeforeAfter(subset) };
    });
  }, [allPortfolio]);

  const [portfolioFilter, setPortfolioFilter] = useState("all");
  const portfolioCategories = useMemo(
    () => [
      { id: "all", label: "Все", test: () => true },
      { id: "portraits", label: "Портреты", test: (path) => /портрет|portrait|portrety/i.test(path) },
      { id: "weddings", label: "Свадьбы", test: (path) => /свадьб|wedding|svadby/i.test(path) },
      { id: "products", label: "Предметы", test: (path) => /предмет|ea888|стэк|product|catalog|predmety|stek/i.test(path) },
    ],
    [],
  );
  const filteredPortfolio = useMemo(() => {
    const cat = portfolioCategories.find((c) => c.id === portfolioFilter);
    if (!cat) return effectivePortfolio;
    return effectivePortfolio.filter((p) => cat.test(p.path));
  }, [effectivePortfolio, portfolioFilter, portfolioCategories]);

  // Для режима "все" — перемежаем по категориям чтобы показать разнообразие
  const interleavedPortfolio = useMemo(() => {
    const groups = [
      effectivePortfolio.filter((p) => /portrety|portrait/i.test(p.path)),
      effectivePortfolio.filter((p) => /svadby|wedding/i.test(p.path)),
      effectivePortfolio.filter((p) => /predmety|catalog/i.test(p.path)),
      effectivePortfolio.filter((p) => /post/i.test(p.path)),
      effectivePortfolio.filter((p) => /ea888/i.test(p.path)),
    ].filter((g) => g.length > 0);
    const result = [];
    let i = 0;
    while (result.length < effectivePortfolio.length) {
      let added = false;
      for (const group of groups) {
        if (i < group.length) { result.push(group[i]); added = true; }
      }
      if (!added) break;
      i++;
    }
    return result;
  }, [effectivePortfolio]);

  const filteredRibbon = useMemo(
    () => (portfolioFilter === "all" ? interleavedPortfolio : filteredPortfolio).slice(0, 12),
    [filteredPortfolio, portfolioFilter, interleavedPortfolio],
  );
  const filteredGrid = useMemo(
    () => (portfolioFilter === "all" ? interleavedPortfolio : filteredPortfolio).slice(0, 6),
    [filteredPortfolio, portfolioFilter, interleavedPortfolio],
  );

  const imageBoostClass = "saturate-[1.14] contrast-[1.08] brightness-[1.04]";

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i === null ? null : (i - 1 + effectivePortfolio.length) % effectivePortfolio.length));
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i === null ? null : (i + 1) % effectivePortfolio.length));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, effectivePortfolio.length]);

  const features = useMemo(
    () => [
      {
        icon: Sparkles,
        title: "Ретушь “как в журнале”",
        desc: "Чистая кожа и цвет без эффекта пластика.",
      },
      {
        icon: Camera,
        title: "Съёмка под задачу",
        desc: "Портрет, бизнес, семейная, предметка. Подбираем кадр под цель.",
      },
      {
        icon: Wand2,
        title: "Концепт + референсы",
        desc: "Собираем стиль, свет и локацию заранее.",
      },
      {
        icon: Zap,
        title: "Быстрый turnaround",
        desc: "Превью за 24 часа, финал — по тарифу.",
      },
      {
        icon: ShieldCheck,
        title: "Безопасно и конфиденциально",
        desc: "Фиксируем условия. Приватность по умолчанию.",
      },
      {
        icon: Layers,
        title: "Форматы для любых площадок",
        desc: "Готовим форматы для соцсетей, сайта и маркетплейсов.",
      },
    ],
    [],
  );

  const { ref: statsRef, inView: statsInView } = useInView({ threshold: 0.25 });
  const shoots = useCountUp({ startWhen: statsInView, target: 3200, durationMs: 2000, decimals: 0 });
  const satisfaction = useCountUp({ startWhen: statsInView, target: 98, durationMs: 2000, decimals: 0 });
  const delivery = useCountUp({ startWhen: statsInView, target: 24, durationMs: 2000, decimals: 0 });
  const rating = useCountUp({ startWhen: statsInView, target: 4.9, durationMs: 2000, decimals: 1 });

  const testimonials = useMemo(
    () => [
      {
        name: "Анна К.",
        role: "Маркетолог",
        quote: "Фото выглядят дорого и естественно. Очень аккуратная ретушь.",
        rating: 5,
      },
      {
        name: "Олег С.",
        role: "Предприниматель",
        quote: "За час закрыли контент для сайта и соцсетей. Быстро и качественно.",
        rating: 5,
      },
      {
        name: "Екатерина М.",
        role: "Владелица бренда",
        quote: "Предметка вышла как в премиум-каталоге. Продажи выросли.",
        rating: 5,
      },
    ],
    [],
  );

  const audienceGroups = useMemo(
    () => [
      {
        icon: Camera,
        title: "Фотографы",
        desc: "Ускоряют отдачу материалов и закрывают больше заказов без потери качества.",
      },
      {
        icon: Wand2,
        title: "Ретушёры",
        desc: "Делают сложную предметную и портретную обработку быстрее и стабильнее.",
      },
      {
        icon: Sparkles,
        title: "Дизайнеры и SMM",
        desc: "Быстро получают визуалы под соцсети, сайт, рекламу и маркетплейсы.",
      },
      {
        icon: Layers,
        title: "Бренды и бизнес",
        desc: "Собирают единую визуальную систему для каталога, карточек и кампаний.",
      },
    ],
    [],
  );

  const serviceModels = useMemo(
    () => [
      {
        badge: "Ретушь",
        title: "Портрет и beauty",
        desc: "Точная ретушь кожи, света и цвета с естественным результатом.",
      },
      {
        badge: "Каталог",
        title: "Предметка и e-commerce",
        desc: "Чистый коммерческий стиль для карточек товара и витрин.",
      },
      {
        badge: "Контент",
        title: "Бренд и соцсети",
        desc: "Серии кадров в едином стиле под публикации и рекламные креативы.",
      },
      {
        badge: "Премиум",
        title: "Campaign-ready",
        desc: "Полный цикл: идея, съёмка, ретушь и выдача в нужных форматах.",
      },
    ],
    [],
  );

  const toolTabs = useMemo(
    () => [
      { id: "generation", label: "Генерация" },
      { id: "retouch", label: "Ретушь" },
      { id: "upscale", label: "Апскейл" },
      { id: "restore", label: "Восстановление" },
    ],
    [],
  );

  const toolHintCards = useMemo(
    () => ({
      generation: [
        { title: "Промпт", text: "Опишите идею кадра: свет, стиль, настроение, детали." },
        { title: "Референс", text: "Добавьте пример изображения, чтобы повторить подачу и композицию." },
        { title: "Варианты", text: "Сгенерируйте 2-4 версии и выберите лучший результат." },
      ],
      retouch: [
        { title: "Кожа и фактура", text: "Чистая, аккуратная ретушь без эффекта пластика." },
        { title: "Цвет", text: "Выравнивание тона и контраста под единый стиль бренда." },
        { title: "Детали", text: "Точечная правка мелочей: пыль, заломы, дефекты." },
      ],
      upscale: [
        { title: "2x / 4x", text: "Увеличение разрешения для печати, витрин и баннеров." },
        { title: "Шум-контроль", text: "Сохраняем резкость, убираем артефакты и шум." },
        { title: "Экспорт", text: "Готовые размеры под сайт, соцсети и рекламу." },
      ],
      restore: [
        { title: "Старые фото", text: "Восстановление цвета, контраста и утерянных деталей." },
        { title: "Повреждения", text: "Убираем царапины, трещины, пятна и дефекты скана." },
        { title: "Финальная версия", text: "Получаете кадры в цифровом архивном качестве." },
      ],
    }),
    [],
  );

  const faq = useMemo(
    () => [
      {
        q: "Сколько времени занимает съёмка?",
        a: "Обычно 60–90 минут. Для предметки и командных съёмок — по объёму.",
      },
      {
        q: "Можно ли выбрать стиль и референсы?",
        a: "Да. Делаем moodboard по вашим примерам или собираем его вместе.",
      },
      {
        q: "Что входит в ретушь?",
        a: "Цвет, кожа, детали, светотень и экспорт под нужные форматы.",
      },
      {
        q: "Есть ли срочная обработка?",
        a: "Да, если есть слот. Срок зависит от объёма и тарифа.",
      },
      {
        q: "Работаете по договору?",
        a: "Да. Фиксируем объём, сроки и условия.",
      },
      {
        q: "Где проходит съёмка?",
        a: "Студия, город, офис или шоурум. Локацию подбираем под задачу.",
      },
      {
        q: "Что такое превью?",
        a: "Первые отобранные кадры после съёмки — вы смотрите, выбираете лучшие, мы доводим их до финала.",
      },
    ],
    [],
  );

  const plans = useMemo(() => {
    const yearlyDiscount = 0.2;
    const isYear = billing === "year";
    const mul = isYear ? 12 * (1 - yearlyDiscount) : 1;

    const price = (p) => {
      const v = Math.round(p * mul);
      return v;
    };

    return [
      {
        name: "Базовый",
        desc: "Идеально для личного профиля и первых портфолио-кадров.",
        priceMonthly: 7900,
        highlight: false,
        features: ["Съёмка 60 минут", "10 фото в ретуши", "Превью за 24 часа", "Форматы под соцсети"],
      },
      {
        name: "Про",
        desc: "Максимум wow-эффекта для бренда, сайта и рекламных креативов.",
        priceMonthly: 14900,
        highlight: true,
        badge: "Популярный",
        features: [
          "Съёмка 90 минут",
          "25 фото в ретуши",
          "Расширенный moodboard",
          "Приоритетная обработка",
          "Форматы под сайт/рекламу",
        ],
      },
      {
        name: "Энтерпрайз",
        desc: "Командные, каталожные и масштабные съёмки под процессы бизнеса.",
        priceMonthly: 29900,
        highlight: false,
        features: ["Съёмка 2–3 часа", "60+ фото в ретуши", "Съёмка в нескольких сценах", "SLA по срокам", "Документы/договор"],
      },
    ].map((p) => ({
      ...p,
      priceNow: price(p.priceMonthly),
      priceLabel: isYear ? "в год" : "в месяц",
      footnote: isYear ? "С учётом скидки 20% на год" : "Можно перейти на год и сэкономить 20%",
    }));
  }, [billing]);
  const selectedPlanData = useMemo(
    () => plans.find((p) => p.name === selectedPlan) || plans[0],
    [plans, selectedPlan],
  );
  const accessDays = billing === "year" ? 365 : 30;

  const [openFaq, setOpenFaq] = useState(0);

  const heroClasses = useMemo(
    () => ({
      h1: mounted ? "animate-fadeInUp" : "opacity-0 translate-y-6",
      p: mounted ? "animate-fadeInUp delay-1" : "opacity-0 translate-y-6",
      ctas: mounted ? "animate-fadeInUp delay-2" : "opacity-0 translate-y-6",
      chips: mounted ? "animate-fadeInUp delay-3" : "opacity-0 translate-y-6",
    }),
    [mounted],
  );

  const showStickyCta = useMemo(() => {
    if (stickyDismissed) return false;
    if (mobileOpen) return false;
    if (footerInView) return false;
    if (ctaPeekInView) return false;
    return scrollY > 420;
  }, [stickyDismissed, mobileOpen, footerInView, ctaPeekInView, scrollY]);
  const telegramUrl = "https://t.me/olegpmi";

  const submitLead = useCallback(
    async ({ name, email, phone, shootType, message, plan }) => {
      setLeadStatus("sending");
      try {
        const { error } = await supabase.from("leads").insert({
          name,
          email,
          phone,
          shoot_type: shootType,
          message,
          plan: plan || null,
        });
        if (error) throw error;
        setLeadStatus("success");
        setLeadName("");
        setLeadEmail("");
        setLeadPhone("");
        setLeadShootType("Портрет");
        setLeadMessage("");
      } catch {
        setLeadStatus("error");
      }
    },
    [],
  );

  return (
    <div className="min-h-screen bg-[color:var(--bg-primary)] text-white selection:bg-white/20 selection:text-white pb-24 md:pb-0" role="main">
      <style>{`
        :root{
          --bg-primary: #08080f;
          --accent-from: #ff4fd8;
          --accent-to: #22d3ee;
          --card-bg: rgba(255,255,255,0.06);
          --border: rgba(255,255,255,0.12);
        }
        body{
          background: var(--bg-primary);
          color: rgba(255,255,255,0.92);
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(18px); filter: blur(6px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .animate-fadeInUp{
          animation: fadeInUp 900ms cubic-bezier(.2,.8,.2,1) both;
        }
        .delay-1{ animation-delay: 120ms; }
        .delay-2{ animation-delay: 240ms; }
        .delay-3{ animation-delay: 360ms; }

        @keyframes blobFloat {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          25% { transform: translate3d(18px,-22px,0) scale(1.05); }
          50% { transform: translate3d(-10px,16px,0) scale(0.98); }
          75% { transform: translate3d(-22px,-10px,0) scale(1.06); }
        }
        @keyframes gridDrift{
          from { background-position: 0px 0px, 0px 0px; }
          to { background-position: 0px 140px, 140px 0px; }
        }
        .bg-grid{
          background-image:
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 70px 70px, 70px 70px;
          animation: gridDrift 18s linear infinite;
          mask-image: radial-gradient(ellipse at center, black 40%, transparent 72%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 40%, transparent 72%);
        }

        .btn-glow{
          box-shadow: 0 0 0 rgba(0,0,0,0);
        }
        .btn-glow:hover{
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.14),
            0 18px 60px rgba(34,211,238,0.22),
            0 18px 60px rgba(255,79,216,0.18);
        }
        .card-hover{
          box-shadow: 0 0 0 rgba(0,0,0,0);
        }
        .card-hover:hover{
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.18),
            0 20px 80px rgba(34,211,238,0.14),
            0 20px 80px rgba(255,79,216,0.10);
        }
        @keyframes marqueeLeft {
          from { transform: translate3d(0,0,0); }
          to { transform: translate3d(-50%,0,0); }
        }
        .marquee{
          display: flex;
          width: max-content;
          animation: marqueeLeft 22s linear infinite;
          will-change: transform;
        }
        .marquee:hover{ animation-play-state: paused; }

        @keyframes slideUpFade {
          from { opacity: 0; transform: translate3d(0, 18px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        .sticky-enter{
          animation: slideUpFade 420ms cubic-bezier(.2,.8,.2,1) both;
        }

        .no-scrollbar::-webkit-scrollbar{ display:none; }
        .no-scrollbar{ -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes handlePulse {
          0%, 100% {
            box-shadow:
              0 0 0 1px rgba(255,255,255,0.18),
              0 18px 60px rgba(34,211,238,0.18),
              0 18px 60px rgba(255,79,216,0.14);
          }
          50% {
            box-shadow:
              0 0 0 1px rgba(255,255,255,0.26),
              0 22px 80px rgba(34,211,238,0.26),
              0 22px 80px rgba(255,79,216,0.20);
          }
        }
        .handle-pulse{
          animation: handlePulse 900ms ease-in-out infinite;
        }
      `}</style>

      {/* Lightbox */}
      {lightboxIndex !== null && effectivePortfolio[lightboxIndex]?.url && (
        <div className="fixed inset-0 z-[80]">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setLightboxIndex(null)}
            aria-hidden="true"
          />
          <div className="absolute inset-0 p-4 sm:p-8 grid place-items-center">
            <div className="relative w-full max-w-5xl">
              <div className="absolute -top-14 right-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  className="h-11 w-11 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card-bg)] grid place-items-center transition-transform hover:scale-[1.05]"
                  aria-label="Закрыть"
                >
                  <X className="h-5 w-5 text-white/90" />
                </button>
              </div>

              <div className="relative rounded-3xl border border-[color:var(--border)] bg-black/40 backdrop-blur-xl overflow-hidden">
                <img
                  src={effectivePortfolio[lightboxIndex].urlFull || effectivePortfolio[lightboxIndex].url}
                  alt="Фото из портфолио"
                  className={cn("w-full max-h-[78vh] object-contain bg-black/30", imageBoostClass)}
                />

                {effectivePortfolio.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxIndex((i) =>
                          i === null ? null : (i - 1 + effectivePortfolio.length) % effectivePortfolio.length,
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card-bg)] grid place-items-center transition-transform hover:scale-[1.05]"
                      aria-label="Предыдущее фото"
                    >
                      <ChevronLeft className="h-5 w-5 text-white/90" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxIndex((i) => (i === null ? null : (i + 1) % effectivePortfolio.length))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card-bg)] grid place-items-center transition-transform hover:scale-[1.05]"
                      aria-label="Следующее фото"
                    >
                      <ChevronRight className="h-5 w-5 text-white/90" />
                    </button>
                  </>
                )}
              </div>
              <div className="mt-3 text-xs text-white/55">
                Используйте клавиши ← → для переключения, Esc для закрытия.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <div
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled ? "bg-white/5 backdrop-blur-xl border-b border-[color:var(--border)]" : "bg-transparent",
        )}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-12 xl:px-16">
          <div className="h-16 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => scrollToId("top")}
              className="group flex items-center gap-2 rounded-xl px-2 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
              aria-label="На главную"
            >
              <span
                className="h-9 w-9 rounded-xl grid place-items-center border border-[color:var(--border)] bg-[color:var(--card-bg)]"
                aria-hidden="true"
              >
                <Camera className="h-5 w-5 text-white/90" />
              </span>
              <span className="text-sm sm:text-base font-semibold tracking-tight">
                Фото<span className="text-white/70">на</span>Заказ
              </span>
              <span className="hidden sm:inline text-xs text-white/55 ml-2">Premium Photo Studio</span>
            </button>

            <nav className="hidden lg:flex items-center gap-1 text-sm text-white/70">
              {navItems.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => scrollToId(it.id)}
                  className="px-3 py-2 rounded-lg hover:text-white hover:bg-white/5 transition-colors"
                >
                  {it.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <a
                href={telegramUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "inline-flex items-center justify-center h-11 w-11 rounded-xl",
                  "border border-[#229ED9]/50 bg-[#229ED9]/18 text-[#7dd3fc]",
                  "transition-transform hover:scale-[1.05] active:scale-[1.01]",
                )}
                aria-label="Telegram"
                title="Написать в Telegram"
              >
                <Send className="h-5 w-5" />
              </a>

              <button
                type="button"
                onClick={() => scrollToId("pricing")}
                className={cn(
                  "hidden sm:inline-flex items-center justify-center h-11 px-4 rounded-xl text-sm font-semibold",
                  "bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] text-black",
                  "transition-transform btn-glow hover:scale-[1.05] active:scale-[1.01]",
                )}
              >
                Заказать съёмку
              </button>

              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className={cn(
                  "lg:hidden inline-flex items-center justify-center h-11 w-11 rounded-xl",
                  "border border-[color:var(--border)] bg-[color:var(--card-bg)]",
                  "transition-transform hover:scale-[1.05] active:scale-[1.01]",
                )}
                aria-label="Открыть меню"
              >
                <Menu className="h-5 w-5 text-white/90" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-[60] transition-all duration-300",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "absolute right-0 top-0 h-full w-[86%] max-w-sm",
            "border-l border-[color:var(--border)] bg-[#0b0b12]/80 backdrop-blur-xl",
            "transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="h-16 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="h-9 w-9 rounded-xl grid place-items-center border border-[color:var(--border)] bg-[color:var(--card-bg)]"
                aria-hidden="true"
              >
                <Camera className="h-5 w-5 text-white/90" />
              </div>
              <div className="text-sm font-semibold">ФотоНаЗаказ</div>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="h-11 w-11 rounded-xl border border-[color:var(--border)] bg-[color:var(--card-bg)] grid place-items-center"
              aria-label="Закрыть меню"
            >
              <X className="h-5 w-5 text-white/90" />
            </button>
          </div>
          <div className="px-4 pb-6">
            <div className="grid gap-1">
              {navItems.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    scrollToId(it.id);
                  }}
                  className="text-left px-3 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/85"
                >
                  {it.label}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-2">
              <a
                href={telegramUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "h-12 rounded-xl font-semibold text-sm grid place-items-center",
                  "border border-[#229ED9]/50 bg-[#229ED9]/18 text-[#7dd3fc]",
                  "transition-transform hover:scale-[1.03] active:scale-[1.01]",
                )}
              >
                Написать в Telegram
              </a>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  scrollToId("pricing");
                }}
                className={cn(
                  "h-12 rounded-xl font-semibold text-sm text-black",
                  "bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)]",
                  "transition-transform btn-glow hover:scale-[1.03] active:scale-[1.01]",
                )}
              >
                Заказать съёмку
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  scrollToId("cta");
                }}
                className={cn(
                  "h-12 rounded-xl font-semibold text-sm",
                  "border border-[color:var(--border)] bg-[color:var(--card-bg)] text-white/90",
                  "transition-transform hover:scale-[1.03] active:scale-[1.01]",
                )}
              >
                Получить консультацию
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* HERO */}
      <div id="top" className="relative overflow-hidden">
        <div className="absolute inset-0" aria-hidden="true" style={{
          background: "linear-gradient(135deg, rgba(8,8,15,1) 0%, rgba(18,18,35,1) 50%, rgba(8,8,15,1) 100%)",
        }} />

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 pt-20 sm:pt-28 pb-20 sm:pb-28 text-center">
          <div className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 border border-[color:var(--border)] bg-[color:var(--card-bg)]", heroClasses.chips)}>
            <BadgeCheck className="h-4 w-4 text-white/70" />
            <span className="text-xs text-white/65">Съёмка и ретушь в одном процессе</span>
          </div>

          <h1 className={cn("mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]", heroClasses.h1)}>
            Фото на заказ,{" "}
            <span className="bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
              которые работают
            </span>
          </h1>

          <p className={cn("mt-5 text-base sm:text-lg text-white/60 max-w-xl mx-auto", heroClasses.p)}>
            Концепт, съёмка и ретушь под вашу задачу.
          </p>

          <div className={cn("mt-8 flex flex-col sm:flex-row gap-3 justify-center", heroClasses.ctas)}>
            <button
              type="button"
              onClick={() => scrollToId("pricing")}
              className={cn(
                "h-12 px-7 rounded-2xl font-semibold text-sm text-black",
                "bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)]",
                "transition-transform btn-glow hover:scale-[1.04] active:scale-[1.01]",
              )}
            >
              Выбрать тариф
            </button>
            <button
              type="button"
              onClick={() => scrollToId("portfolio")}
              className={cn(
                "h-12 px-7 rounded-2xl font-semibold text-sm text-white/85",
                "border border-[color:var(--border)] hover:bg-white/5",
                "transition-transform hover:scale-[1.04] active:scale-[1.01]",
              )}
            >
              Смотреть портфолио
            </button>
          </div>

          <div className={cn("mt-8 flex flex-wrap gap-2 justify-center", heroClasses.chips)}>
            {[
              { icon: Clock, text: "Превью за 24 ч" },
              { icon: ShieldCheck, text: "Конфиденциально" },
              { icon: Sparkles, text: "Премиум ретушь" },
              { icon: Star, text: `${rating.toFixed(1)} / 5` },
            ].map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={i} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white/60 border border-[color:var(--border)] bg-[color:var(--card-bg)]">
                  <Icon className="h-3.5 w-3.5" />
                  <span>{c.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ДО И ПОСЛЕ по категориям */}
      <Section id="before-after" className="py-20 sm:py-24">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="text-xs sm:text-sm text-white/60">Образцы</div>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              До и после{" "}
              <span className="bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
                по категориям
              </span>
              .
            </h2>
            <p className="mt-3 text-white/70 max-w-2xl">
              Портреты, свадьбы, предметы. Добавьте пары до/после в папки{" "}
              <span className="text-white/85 font-semibold">Портреты</span>,{" "}
              <span className="text-white/85 font-semibold">Свадьбы</span>,{" "}
              <span className="text-white/85 font-semibold">Предметы</span>.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {beforeAfterByCategory.map((cat) => (
            <div
              key={cat.id}
              className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--card-bg)] backdrop-blur-xl overflow-hidden"
            >
              <div className="px-4 py-3 text-sm font-semibold text-white/90 border-b border-[color:var(--border)]">
                {cat.label}
              </div>
              <div className="p-4">
                {cat.beforeUrl && cat.afterUrl ? (
                  <BeforeAfterSlider
                    beforeUrl={cat.beforeUrl}
                    afterUrl={cat.afterUrl}
                    size="large"
                    fit="cover"
                  />
                ) : (
                  <div className="aspect-[4/3] rounded-2xl border border-dashed border-white/20 flex items-center justify-center text-sm text-white/50">
                    Добавьте до.jpg и после.jpg в папку {cat.label}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* PORTFOLIO */}
      <Section id="portfolio" className="py-20 sm:py-24">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="text-xs sm:text-sm text-white/60">Портфолио</div>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Немного{" "}
              <span className="bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
                живых кадров
              </span>{" "}
              из реальных съёмок.
            </h2>
            <p className="mt-3 text-white/70 max-w-2xl">
              Нажмите на фото для просмотра. Фильтр по категориям.
            </p>
          </div>
          <button
            type="button"
            onClick={() => scrollToId("cta")}
            className={cn(
              "h-12 min-h-[44px] px-5 rounded-2xl text-sm font-semibold",
              "border border-[color:var(--border)] bg-[color:var(--card-bg)] text-white/90",
              "transition-transform hover:scale-[1.05] active:scale-[1.01] card-hover",
            )}
          >
            Хочу такой стиль
          </button>
        </div>

        {!portfolioLoading && effectivePortfolio.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {portfolioCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setPortfolioFilter(c.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-sm font-medium transition-colors",
                  portfolioFilter === c.id
                    ? "bg-white/15 text-white border border-white/25"
                    : "text-white/70 hover:text-white border border-[color:var(--border)] hover:border-white/20",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {portfolioLoading ? (
          <>
            <div className="mt-10 overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--card-bg)] backdrop-blur-xl">
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="h-4 w-12 rounded-lg bg-white/10 animate-pulse" />
                <div className="h-3 w-44 rounded-lg bg-white/10 animate-pulse" />
              </div>
              <div className="flex gap-3 px-5 pb-5 overflow-hidden">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-28 w-44 sm:h-32 sm:w-52 rounded-2xl bg-white/8 animate-pulse shrink-0" style={{ animationDelay: `${i * 80}ms` }} />
                ))}
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--card-bg)] backdrop-blur-xl">
                  <div className="aspect-[4/3] bg-white/8 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
                </div>
              ))}
            </div>
          </>
        ) : effectivePortfolio.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-[color:var(--border)] bg-[color:var(--card-bg)] backdrop-blur-xl p-6 text-white/70">
            <div className="text-sm font-semibold text-white/90">Фото пока не подключены.</div>
            <div className="mt-2 text-sm leading-relaxed">
              Переместите вашу папку с фото сюда: <span className="text-white/90 font-semibold">`src/assets/portfolio/`</span>.
              Можно как угодно называть файлы и подпапки — сайт подхватит автоматически.
            </div>
          </div>
        ) : filteredPortfolio.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-[color:var(--border)] bg-[color:var(--card-bg)] backdrop-blur-xl p-6 text-white/70">
            <div className="text-sm font-semibold text-white/90">В этой категории пока нет фото.</div>
            <div className="mt-2 text-sm">Выберите другую категорию или добавьте фото в соответствующую папку.</div>
          </div>
        ) : (
          <>
            <div className="mt-10 overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--card-bg)] backdrop-blur-xl">
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="text-sm font-semibold text-white/85">Лента</div>
                <div className="text-xs text-white/55">Наведи — пауза. Клик — просмотр.</div>
              </div>
              <div className="relative">
                <div className="marquee gap-3 px-5 pb-5">
                  {[...filteredRibbon, ...filteredRibbon]
                    .slice(0, Math.min(24, filteredRibbon.length * 2))
                    .map((p, idx) => (
                    <button
                      key={`${p.path}-${idx}`}
                      type="button"
                      onClick={() => setLightboxIndex(Math.max(0, effectivePortfolio.findIndex((x) => x.path === p.path)))}
                      className="relative h-28 w-44 sm:h-32 sm:w-52 rounded-2xl overflow-hidden border border-white/10 bg-black/20 shrink-0 transition-transform hover:scale-[1.03]"
                      aria-label="Открыть фото"
                    >
                      <img src={p.url} alt="" loading="lazy" className={cn("absolute inset-0 w-full h-full object-cover", imageBoostClass)} aria-hidden="true" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" aria-hidden="true" />
                    </button>
                  ))}
                </div>
                <div className="pointer-events-none absolute inset-0" aria-hidden="true" style={{
                  background:
                    "linear-gradient(90deg, rgba(8,8,15,0.95) 0%, rgba(8,8,15,0) 18%, rgba(8,8,15,0) 82%, rgba(8,8,15,0.95) 100%)",
                }} />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredGrid.map((p, idx) => (
                <button
                  key={p.path}
                  type="button"
                  onClick={() => setLightboxIndex(Math.max(0, effectivePortfolio.findIndex((x) => x.path === p.path)))}
                  className={cn(
                    "relative overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--card-bg)] backdrop-blur-xl",
                    "transition-transform card-hover hover:scale-[1.02] hover:-translate-y-1",
                  )}
                  aria-label="Открыть фото"
                >
                  <div className="aspect-[4/3] bg-black/25">
                    <img src={p.url} alt="" loading="lazy" className={cn("w-full h-full object-cover", imageBoostClass)} aria-hidden="true" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent" aria-hidden="true" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white/75">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1">
                      <ImageIcon className="h-4 w-4" />
                      Кадр #{idx + 1}
                    </span>
                    <span className="text-white/55">клик</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </Section>

      {/* TOOL */}
      <Section id="tool" className="py-20 sm:py-24">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="text-xs sm:text-sm text-white/60">Инструмент</div>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Интуитивный{" "}
              <span className="bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
                интерфейс
              </span>{" "}
              как в pro-сервисах.
            </h2>
            <p className="mt-3 text-white/70 max-w-2xl">
              Выберите режим работы и посмотрите, как выглядит процесс внутри.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_1.4fr_1fr]">
          <div className="grid gap-4">
            {toolHintCards[toolTab].slice(0, 2).map((card) => (
              <div
                key={card.title}
                className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--card-bg)] backdrop-blur-xl p-5"
              >
                <div className="text-base font-semibold text-white/90">{card.title}</div>
                <p className="mt-2 text-sm text-white/70 leading-relaxed">{card.text}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-[color:var(--border)] bg-[#11131c]/90 backdrop-blur-xl overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-white/10">
              <div className="text-[11px] tracking-[0.16em] uppercase text-white/50">PHOTO TOOL</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {toolTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setToolTab(tab.id)}
                    className={cn(
                      "h-9 px-3 rounded-xl text-xs sm:text-sm font-semibold border transition-all",
                      toolTab === tab.id
                        ? "border-[var(--accent-to)] bg-white/10 text-white"
                        : "border-white/10 bg-white/[0.03] text-white/70 hover:text-white hover:bg-white/[0.06]",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 sm:p-5 grid gap-4">
              <div>
                <div className="text-xs text-white/55 mb-2">Введите задачу</div>
                <textarea
                  aria-label="Введите задачу"
                  value={
                    toolTab === "generation"
                      ? "Портрет в стиле lifestyle, мягкий дневной свет, чистый фон, натуральная ретушь."
                      : toolTab === "retouch"
                        ? "Убрать дефекты кожи, выровнять тон, сохранить естественную текстуру."
                        : toolTab === "upscale"
                          ? "Увеличить до 4x для печати, сохранить чёткость и микродетали."
                          : "Восстановить старое фото: вернуть цвет, убрать царапины и шум."
                  }
                  readOnly
                  className="min-h-[96px] w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs text-white/50">Режим</div>
                  <div className="mt-1 text-sm font-semibold text-white/90">
                    {toolTabs.find((x) => x.id === toolTab)?.label}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs text-white/50">Время выполнения</div>
                  <div className="mt-1 text-sm font-semibold text-white/90">
                    {toolTab === "generation" ? "≈ 20-40 сек" : toolTab === "retouch" ? "≈ 1-3 мин" : "≈ 30-90 сек"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => scrollToId("pricing")}
                className={cn(
                  "h-12 rounded-2xl font-semibold text-black",
                  "bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)]",
                  "transition-transform btn-glow hover:scale-[1.02] active:scale-[1.01]",
                )}
              >
                Запустить в выбранном тарифе
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--card-bg)] backdrop-blur-xl p-5">
              <div className="text-base font-semibold text-white/90">{toolHintCards[toolTab][2].title}</div>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">{toolHintCards[toolTab][2].text}</p>
            </div>
            <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--card-bg)] backdrop-blur-xl p-5">
              <div className="text-base font-semibold text-white/90">Поддержка 24/7</div>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">
                Если не уверены в настройках, поможем выбрать режим и подготовим референсы.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* FEATURES */}
      <section
        id="features"
        ref={featuresRef}
        className={cn(
          "relative py-20 sm:py-24 scroll-mt-24",
          "transition-all duration-700 ease-out",
          featuresInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        )}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-12 xl:px-16">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="text-xs sm:text-sm text-white/60">Преимущества</div>
              <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                Сервис, который ощущается как{" "}
                <span className="bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
                  премиум
                </span>
                .
              </h2>
              <p className="mt-3 text-white/70 max-w-2xl">
                От идеи до готовых форматов. Всё в одном процессе.
              </p>
            </div>
            <button
              type="button"
              onClick={() => scrollToId("cta")}
              className={cn(
                "h-12 min-h-[44px] px-5 rounded-2xl text-sm font-semibold",
                "border border-[color:var(--border)] bg-[color:var(--card-bg)] text-white/90",
                "transition-transform hover:scale-[1.05] active:scale-[1.01] card-hover",
              )}
            >
              Получить подбор концепта
            </button>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={cn(
                    "group rounded-3xl border border-[color:var(--border)] bg-[color:var(--card-bg)] backdrop-blur-xl",
                    "p-6 transition-all duration-700 ease-out card-hover",
                    featuresInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
                    "hover:scale-[1.03] hover:-translate-y-1",
                  )}
                  style={{ transitionDelay: `${i * 90}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-11 w-11 rounded-2xl grid place-items-center",
                        "border border-[color:var(--border)] bg-white/5",
                        "group-hover:border-white/25 transition-colors",
                      )}
                      aria-hidden="true"
                    >
                      <Icon className="h-5 w-5 text-white/90" />
                    </div>
                    <div className="text-sm font-semibold text-white/90">{f.title}</div>
                  </div>
                  <p className="mt-3 text-sm text-white/70 leading-relaxed">{f.desc}</p>
                  <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden="true" />
                  <div className="mt-4 flex items-center gap-2 text-xs text-white/55">
                    <Check className="h-4 w-4 text-white/70" />
                    <span>Проверено на реальных задачах</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TOOLS — плагин + product_retouch */}
      <Section id="tools" className="py-20 sm:py-24">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="text-xs sm:text-sm text-white/60">Инструменты</div>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Плагин и скрипты для{" "}
              <span className="bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
                вашего рабочего процесса
              </span>
              .
            </h2>
            <p className="mt-3 text-white/70 max-w-2xl">
              AI-ретушь в Photoshop и автоматическая предметная ретушь — в одном репозитории.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <a
            href="https://github.com/belber12/photo-on-demand/tree/main/plugin"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "group block rounded-3xl border border-[color:var(--border)] bg-[color:var(--card-bg)] backdrop-blur-xl",
              "p-6 transition-all duration-300 card-hover hover:scale-[1.02] hover:-translate-y-1",
            )}
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl grid place-items-center border border-[color:var(--border)] bg-white/5 group-hover:border-white/25 transition-colors">
                <Package className="h-6 w-6 text-white/90" />
              </div>
              <div>
                <div className="text-base font-semibold text-white/90">Плагин Photoshop</div>
                <div className="text-xs text-white/55">AI Ретушь</div>
              </div>
            </div>
            <p className="mt-4 text-sm text-white/70 leading-relaxed">
              Удаление фона, генерация, восстановление старых фото, раскраска ч/б — прямо в Photoshop.
            </p>
            <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-[var(--accent-to)]">
              <span>Скачать плагин</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </a>

          <a
            href="https://github.com/belber12/photo-on-demand/tree/main/product_retouch"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "group block rounded-3xl border border-[color:var(--border)] bg-[color:var(--card-bg)] backdrop-blur-xl",
              "p-6 transition-all duration-300 card-hover hover:scale-[1.02] hover:-translate-y-1",
            )}
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl grid place-items-center border border-[color:var(--border)] bg-white/5 group-hover:border-white/25 transition-colors">
                <Terminal className="h-6 w-6 text-white/90" />
              </div>
              <div>
                <div className="text-base font-semibold text-white/90">Предметная ретушь</div>
                <div className="text-xs text-white/55">Python CLI</div>
              </div>
            </div>
            <p className="mt-4 text-sm text-white/70 leading-relaxed">
              Удаление фона, студийный фон, мягкая тень — для e-commerce и каталогов.
            </p>
            <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-[var(--accent-to)]">
              <span>Скрипт и инструкция</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </a>
        </div>
      </Section>

      {/* AUDIENCE */}
      <Section id="audience" className="py-20 sm:py-24">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="text-xs sm:text-sm text-white/60">Для кого</div>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Подходит специалистам, которым нужен{" "}
              <span className="bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
                быстрый и дорогой
              </span>{" "}
              визуал.
            </h2>
            <p className="mt-3 text-white/70 max-w-2xl">
              Съёмка и обработка под реальную бизнес-задачу, а не просто красивые кадры.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {audienceGroups.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={cn(
                  "rounded-3xl border border-[color:var(--border)] bg-[color:var(--card-bg)] backdrop-blur-xl p-6",
                  "transition-transform card-hover hover:scale-[1.03] hover:-translate-y-1",
                )}
              >
                <div className="h-10 w-10 rounded-2xl border border-[color:var(--border)] bg-white/5 grid place-items-center">
                  <Icon className="h-5 w-5 text-white/90" />
                </div>
                <div className="mt-4 text-base font-semibold text-white/90">{item.title}</div>
                <p className="mt-2 text-sm text-white/70 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* STATS */}
      <section
        id="stats"
        ref={statsRef}
        className={cn(
          "relative py-20 sm:py-24 scroll-mt-24",
          "transition-all duration-700 ease-out",
          statsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        )}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-12 xl:px-16">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--accent-to)] to-transparent opacity-60" />
          <div className="mt-10 flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="text-xs sm:text-sm text-white/60">Цифры</div>
              <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Результат в метриках.</h2>
              <p className="mt-3 text-white/70 max-w-2xl">
                Коротко о результатах: скорость, качество, повторные заказы.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Съёмок", value: `${formatCompactK(shoots)}+`, sub: "от портретов до каталога" },
              { label: "Удовлетворённость", value: `${satisfaction}%`, sub: "по итогам проектов" },
              { label: "Превью", value: `${delivery}ч`, sub: "первые кадры быстро" },
              { label: "Средняя оценка", value: `${rating.toFixed(1)}`, sub: "качество + сервис" },
            ].map((s) => (
              <div
                key={s.label}
                className={cn(
                  "rounded-3xl border border-[color:var(--border)] bg-[color:var(--card-bg)] backdrop-blur-xl p-6",
                  "transition-transform card-hover hover:scale-[1.03] hover:-translate-y-1",
                )}
              >
                <div className="text-sm text-white/65">{s.label}</div>
                <div className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight">
                  <span className="bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
                    {s.value}
                  </span>
                </div>
                <div className="mt-3 text-xs text-white/55">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <Section id="how" className="py-20 sm:py-24">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="text-xs sm:text-sm text-white/60">Как это работает</div>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Три шага до{" "}
              <span className="bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
                кадра мечты
              </span>
              .
            </h2>
            <p className="mt-3 text-white/70 max-w-2xl">
              Простой процесс в 3 шага: бриф, съёмка, финал.
            </p>
          </div>
        </div>

        <div className="mt-10 relative">
          <div
            className="hidden md:block absolute left-10 right-10 top-8 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
            aria-hidden="true"
          />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                n: "01",
                icon: Sparkles,
                title: "Концепт",
                desc: "Короткий бриф, референсы и план съёмки.",
              },
              {
                n: "02",
                icon: Camera,
                title: "Съёмка",
                desc: "Ставим свет, помогаем с позингом, снимаем под цель.",
              },
              {
                n: "03",
                icon: Wand2,
                title: "Ретушь + выдача",
                desc: "Ретушь и экспорт под площадки. Отдаём в срок.",
              },
            ].map((st) => {
              const Icon = st.icon;
              return (
                <div
                  key={st.n}
                  className={cn(
                    "relative rounded-3xl border border-[color:var(--border)] bg-[color:var(--card-bg)] backdrop-blur-xl p-6",
                    "transition-transform card-hover hover:scale-[1.03] hover:-translate-y-1",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-2xl grid place-items-center text-xs font-bold text-black"
                      style={{ background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))" }}
                      aria-hidden="true"
                    >
                      {st.n}
                    </div>
                    <div className="h-10 w-10 rounded-2xl grid place-items-center border border-[color:var(--border)] bg-white/5">
                      <Icon className="h-5 w-5 text-white/90" />
                    </div>
                  </div>
                  <div className="mt-4 text-base font-semibold text-white/90">{st.title}</div>
                  <p className="mt-2 text-sm text-white/70 leading-relaxed">{st.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* SERVICES */}
      <Section id="services" className="py-20 sm:py-24">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="text-xs sm:text-sm text-white/60">Услуги</div>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Форматы съёмки и ретуши{" "}
              <span className="bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
                для любых задач
              </span>
              .
            </h2>
            <p className="mt-3 text-white/70 max-w-2xl">
              Выбирайте направление, а мы подберём точный сетап по срокам, стилю и целям.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {serviceModels.map((item) => (
            <div
              key={item.title}
              className={cn(
                "rounded-3xl border border-[color:var(--border)] bg-[color:var(--card-bg)] backdrop-blur-xl p-6",
                "transition-transform card-hover hover:scale-[1.02] hover:-translate-y-1",
              )}
            >
              <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-white/70">
                {item.badge}
              </div>
              <div className="mt-4 text-lg font-semibold text-white/90">{item.title}</div>
              <p className="mt-2 text-sm text-white/70">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* TESTIMONIALS */}
      <Section id="testimonials" className="py-20 sm:py-24">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="text-xs sm:text-sm text-white/60">Отзывы</div>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Люди говорят лучше любых{" "}
              <span className="bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
                промо-слов
              </span>
              .
            </h2>
            <p className="mt-3 text-white/70 max-w-2xl">Коротко о том, что говорят клиенты.</p>
          </div>
        </div>

        <div className="mt-10">
          <TestimonialsCarousel items={testimonials} />
          <div className="mt-3 text-xs text-white/45 lg:hidden">Свайпайте или нажимайте точки ниже →</div>
        </div>
      </Section>

      {/* PRICING — в стиле nanomix.ai */}
      <Section id="pricing" className="py-20 sm:py-24">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="text-xs sm:text-sm text-white/60">Цены</div>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Тарифы, которые{" "}
              <span className="bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
                закрывают задачу
              </span>
              .
            </h2>
            <p className="mt-3 text-white/70 max-w-2xl">
              Выберите тариф: месяц или год (скидка 20%).
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card-bg)] p-1">
            <button
              type="button"
              onClick={() => setBilling("month")}
              className={cn(
                "h-10 px-4 rounded-xl text-sm font-semibold transition-colors",
                billing === "month" ? "bg-white/10 text-white" : "text-white/70 hover:text-white",
              )}
            >
              Месяц
            </button>
            <button
              type="button"
              onClick={() => setBilling("year")}
              className={cn(
                "h-10 px-4 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2",
                billing === "year" ? "bg-white/10 text-white" : "text-white/70 hover:text-white",
              )}
            >
              Год <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] text-black">-20%</span>
            </button>
          </div>
        </div>

        {/* Единый блок в стиле nanomix — карточки тарифов */}
        <div className="mt-10 rounded-[2rem] border border-white/15 bg-[#0b0b12]/90 backdrop-blur-xl overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_24px_80px_rgba(0,0,0,0.4)]">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="grid gap-4 lg:grid-cols-3">
              {plans.map((p) => {
                const isSelected = selectedPlan === p.name;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setSelectedPlan(p.name)}
                    className={cn(
                      "relative rounded-2xl border backdrop-blur-xl p-6 text-left transition-all",
                      isSelected
                        ? "border-[var(--accent-to)] ring-2 ring-[var(--accent-to)]/30 bg-white/[0.08]"
                        : "border-[color:var(--border)] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20",
                      "card-hover",
                    )}
                  >
                    {p.highlight && (
                      <div className="absolute -top-2.5 left-5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-black bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)]">
                          {p.badge}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-base font-semibold text-white/90">{p.name}</div>
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full border-2 border-[var(--accent-to)] bg-[var(--accent-to)] grid place-items-center">
                          <Check className="h-3 w-3 text-black" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-white/60">{p.desc}</div>
                    <div className="mt-5 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
                        {p.priceNow.toLocaleString("ru-RU")}
                      </span>
                      <span className="text-sm text-white/55">₽ {p.priceLabel}</span>
                    </div>
                    <div className="mt-1 text-xs text-white/45">{p.footnote}</div>
                    <div className="mt-5 grid gap-2">
                      {p.features.map((f) => (
                        <div key={f} className="flex items-start gap-2 text-sm text-white/70">
                          <Check className="h-4 w-4 mt-0.5 shrink-0 text-white/60" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Чекбоксы и CTA в стиле nanomix */}
            <div className="mt-8 sm:mt-10 pt-8 border-t border-white/10">
              <div className="mb-6 sm:mb-7 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 sm:px-5 sm:py-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">Доступ</div>
                  <div className="mt-1 text-lg sm:text-2xl font-extrabold text-white">
                    {accessDays} <span className="text-white/65 font-semibold">дней доступа</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-white/45">Тариф</div>
                  <div className="mt-1 text-sm sm:text-base font-semibold text-white/90">{selectedPlanData?.name}</div>
                  <div className="text-xs text-white/55">
                    {selectedPlanData?.priceNow?.toLocaleString("ru-RU")} ₽ {selectedPlanData?.priceLabel}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-white/30 bg-white/5 text-[var(--accent-to)] focus:ring-[var(--accent-to)]/50"
                  />
                  <span className="text-sm text-white/70 group-hover:text-white/85">
                    Я принимаю публичный договор (договор оферты).
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-white/30 bg-white/5 text-[var(--accent-to)] focus:ring-[var(--accent-to)]/50"
                  />
                  <span className="text-sm text-white/70 group-hover:text-white/85">
                    Я даю согласие на обработку моих персональных данных.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group sm:col-span-2 lg:col-span-1">
                  <input
                    type="checkbox"
                    checked={licenseAccepted}
                    onChange={(e) => setLicenseAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-white/30 bg-white/5 text-[var(--accent-to)] focus:ring-[var(--accent-to)]/50"
                  />
                  <span className="text-sm text-white/70 group-hover:text-white/85">
                    Я подтверждаю, что ознакомился с лицензией и техническими требованиями.
                  </span>
                </label>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (termsAccepted && privacyAccepted && licenseAccepted) scrollToId("cta");
                  }}
                  disabled={!termsAccepted || !privacyAccepted || !licenseAccepted}
                  className={cn(
                    "h-14 px-8 rounded-2xl font-semibold text-base",
                    "bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] text-black",
                    "transition-all btn-glow",
                    termsAccepted && privacyAccepted && licenseAccepted
                      ? "hover:scale-[1.02] active:scale-[1.01] cursor-pointer"
                      : "opacity-50 cursor-not-allowed",
                  )}
                >
                  Перейти к оплате
                </button>
                <p className="text-xs text-white/50 sm:self-center">
                  {termsAccepted && privacyAccepted && licenseAccepted
                    ? "Выбран тариф: " + selectedPlan + ". Нажмите кнопку для оформления заявки."
                    : "Чтобы продолжить, отметьте все согласия ниже."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" className="py-20 sm:py-24">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="text-xs sm:text-sm text-white/60">FAQ</div>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Ответы, чтобы{" "}
              <span className="bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
                стартовать
              </span>{" "}
              без сомнений.
            </h2>
            <p className="mt-3 text-white/70 max-w-2xl">Если не нашли ответ — просто напишите нам.</p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {faq.map((item, idx) => (
            <FaqItem
              key={item.q}
              q={item.q}
              a={item.a}
              open={openFaq === idx}
              onToggle={() => setOpenFaq((prev) => (prev === idx ? -1 : idx))}
            />
          ))}
        </div>
      </Section>

      {/* БЛОГ */}
      <Section id="blog" className="py-20 sm:py-24">
        <div className="flex items-end justify-between gap-6 flex-wrap mb-10">
          <div>
            <div className="text-xs sm:text-sm text-white/60">Блог</div>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Полезные материалы
            </h2>
            <p className="mt-3 text-white/70 max-w-xl">Советы по подготовке к съёмке, выбору образа, работе с референсами и ретуши.</p>
          </div>
          <a
            href="/blog"
            className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1"
          >
            Все статьи →
          </a>
        </div>
        <BlogPreview />
      </Section>

      {/* CTA BANNER */}
      <Section id="cta" className="py-14 sm:py-16">
        <div ref={ctaPeekRef} className="h-px w-full" aria-hidden="true" />
        <div
          className={cn(
            "relative overflow-hidden rounded-[2.25rem] border border-white/15",
            "bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] text-black",
            "px-6 sm:px-10 py-10 sm:py-12",
          )}
        >
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 h-72 w-72 rounded-full blur-3xl opacity-35" aria-hidden="true" style={{
            background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.7), transparent 60%)",
            animation: "blobFloat 14s ease-in-out infinite",
          }} />
          <div className="absolute -right-24 top-10 h-80 w-80 rounded-full blur-3xl opacity-25" aria-hidden="true" style={{
            background: "radial-gradient(circle at 30% 30%, rgba(0,0,0,0.35), transparent 60%)",
            animation: "blobFloat 16s ease-in-out infinite",
          }} />

          <div className="relative grid gap-6 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-black/20 px-3 py-1.5 text-xs font-semibold">
                  <Sparkles className="h-4 w-4" />
                  <span>Подберём формат под задачу</span>
                </div>
                {selectedPlan && (
                  <span className="rounded-full border border-black/20 bg-black/15 px-3 py-1.5 text-xs font-medium">
                    Выбран тариф: {selectedPlan}
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                Нужны кадры, которые продают?
              </h3>
              <p className="mt-3 text-black/80 max-w-xl">
                Оставьте контакты — пришлём бриф и предложим концепт.
              </p>
            </div>

            <div className="lg:col-span-5">
              <form
                className="grid gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (leadStatus === "sending") return;
                  const email = leadEmail.trim();
                  if (!email) return;
                  submitLead({
                    name: leadName.trim(),
                    email,
                    phone: leadPhone.trim(),
                    shootType: leadShootType,
                    message: leadMessage.trim(),
                    plan: selectedPlan,
                  });
                }}
                name="lead"
                data-netlify="true"
                netlify-honeypot="bot-field"
              >
                <input type="hidden" name="form-name" value="lead" />
                <input type="hidden" name="plan" value={selectedPlan} />
                <p className="hidden">
                  <label>
                    Don’t fill this out: <input name="bot-field" />
                  </label>
                </p>
                <div className="grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Имя"
                      aria-label="Имя"
                      name="name"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      className={cn(
                        "h-12 min-h-[44px] w-full rounded-2xl px-4",
                        "bg-white/80 text-black placeholder:text-black/50",
                        "outline-none focus:ring-2 focus:ring-black/20",
                      )}
                    />
                    <input
                      type="tel"
                      inputMode="tel"
                      placeholder="Телефон"
                      aria-label="Телефон"
                      name="phone"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      className={cn(
                        "h-12 min-h-[44px] w-full rounded-2xl px-4",
                        "bg-white/80 text-black placeholder:text-black/50",
                        "outline-none focus:ring-2 focus:ring-black/20",
                      )}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <input
                      type="email"
                      required
                      placeholder="Ваш email"
                      aria-label="Email"
                      name="email"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      className={cn(
                        "h-12 min-h-[44px] w-full rounded-2xl px-4",
                        "bg-white/80 text-black placeholder:text-black/50",
                        "outline-none focus:ring-2 focus:ring-black/20",
                      )}
                    />
                    <button
                      type="submit"
                      disabled={leadStatus === "sending"}
                      className={cn(
                        "h-12 min-h-[44px] rounded-2xl px-5 font-semibold",
                        "bg-black text-white",
                        "transition-transform hover:scale-[1.03] active:scale-[1.01]",
                        leadStatus === "sending" ? "opacity-70 cursor-not-allowed" : "",
                      )}
                    >
                      {leadStatus === "sending" ? "Отправляем..." : leadStatus === "success" ? "Готово" : "Отправить"}
                    </button>
                  </div>

                  <select
                    name="shootType"
                    aria-label="Тип съёмки"
                    value={leadShootType}
                    onChange={(e) => setLeadShootType(e.target.value)}
                    className={cn(
                      "h-12 min-h-[44px] w-full rounded-2xl px-4",
                      "bg-white/80 text-black",
                      "outline-none focus:ring-2 focus:ring-black/20",
                    )}
                  >
                    <option value="Портрет">Тип съёмки: Портрет</option>
                    <option value="Бизнес">Тип съёмки: Бизнес</option>
                    <option value="Семейная">Тип съёмки: Семейная</option>
                    <option value="Предметка">Тип съёмки: Предметка</option>
                    <option value="Другое">Тип съёмки: Другое</option>
                  </select>

                  <textarea
                    name="message"
                    aria-label="Комментарий"
                    value={leadMessage}
                    onChange={(e) => setLeadMessage(e.target.value)}
                    rows={3}
                    placeholder="Комментарий (дата, город, задача)"
                    className={cn(
                      "min-h-[96px] w-full rounded-2xl px-4 py-3",
                      "bg-white/80 text-black placeholder:text-black/50",
                      "outline-none focus:ring-2 focus:ring-black/20",
                      "resize-none",
                    )}
                  />
                </div>
                <div className="text-xs">
                  {leadStatus === "success" ? (
                    <span className="text-black/80 font-semibold">Заявка отправлена. Скоро напишем.</span>
                  ) : leadStatus === "error" ? (
                    <span className="text-black/80 font-semibold">
                      Не удалось отправить. Попробуйте ещё раз (или обновите страницу).
                    </span>
                  ) : (
                    <span className="text-black/70">Без спама. Только по вашей заявке.</span>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </Section>

      {/* FOOTER */}
      <footer
        ref={footerRef}
        className={cn(
          "relative py-14 border-t border-[color:var(--border)]",
          "transition-all duration-700 ease-out",
          footerInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        )}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-12 xl:px-16">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="flex items-center gap-2">
                <div
                  className="h-10 w-10 rounded-2xl grid place-items-center border border-[color:var(--border)] bg-[color:var(--card-bg)]"
                  aria-hidden="true"
                >
                  <Camera className="h-5 w-5 text-white/90" />
                </div>
                <div className="font-semibold tracking-tight">ФотоНаЗаказ</div>
              </div>
              <p className="mt-4 text-sm text-white/65 max-w-sm">
                Премиальные съёмки и ретушь. Всё в одном сервисе.
              </p>
              <div className="mt-5 flex items-center gap-2 text-white/70">
                {[
                  { icon: Github, label: "GitHub" },
                  { icon: Twitter, label: "Twitter" },
                  { icon: Linkedin, label: "LinkedIn" },
                  { icon: Instagram, label: "Instagram" },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.label}
                      type="button"
                      className={cn(
                        "h-11 w-11 rounded-2xl grid place-items-center",
                        "border border-[color:var(--border)] bg-[color:var(--card-bg)]",
                        "transition-transform hover:scale-[1.05] active:scale-[1.01]",
                      )}
                      aria-label={s.label}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Продукт",
                  links: ["Преимущества", "Работы", "Как это работает", "Цены", "FAQ"],
                },
                {
                  title: "Съёмки",
                  links: ["Портрет", "Бизнес", "Семейная", "Предметка"],
                },
                {
                  title: "Материалы",
                  links: ["Гайд по позингу", "Подбор образа", "Референсы", "Подготовка к съёмке"],
                },
                {
                  title: "Контакты",
                  links: ["Написать", "Бриф", "Слоты", "Сотрудничество"],
                },
              ].map((col) => (
                <div key={col.title}>
                  <div className="text-sm font-semibold text-white/85">{col.title}</div>
                  <div className="mt-4 grid gap-2 text-sm text-white/60">
                    {col.links.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => {
                          const map = {
                            "Преимущества": "features",
                            "Работы": "portfolio",
                            "Как это работает": "how",
                            "Цены": "pricing",
                            "FAQ": "faq",
                          };
                          const id = map[l];
                          if (id) scrollToId(id);
                          else scrollToId("cta");
                        }}
                        className="text-left hover:text-white transition-colors"
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-white/45">
            <div>© {new Date().getFullYear()} ФотоНаЗаказ. Все права защищены.</div>
            <div className="flex items-center gap-3">
              <button type="button" className="hover:text-white transition-colors">
                Политика
              </button>
              <span className="h-1 w-1 rounded-full bg-white/20" aria-hidden="true" />
              <button type="button" className="hover:text-white transition-colors">
                Условия
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile CTA */}
      <div
        className={cn(
          "md:hidden fixed inset-x-0 bottom-0 z-[55] transition-all duration-300",
          showStickyCta ? "opacity-100 translate-y-0 pointer-events-auto sticky-enter" : "opacity-0 translate-y-3 pointer-events-none",
        )}
        aria-hidden={!showStickyCta}
      >
        <div
          className="mx-auto max-w-6xl px-4 sm:px-6"
          style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}
        >
          <div className="rounded-2xl border border-[color:var(--border)] bg-[#0b0b12]/72 backdrop-blur-xl p-3 shadow-[0_18px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-white/65">
                Готовы к съёмке? <span className="text-white/85 font-semibold">Выберите формат</span>
              </div>
              <button
                type="button"
                onClick={() => setStickyDismissed(true)}
                className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 grid place-items-center"
                aria-label="Скрыть"
              >
                <X className="h-4 w-4 text-white/80" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => scrollToId("pricing")}
                className={cn(
                  "h-12 min-h-[44px] rounded-2xl font-semibold text-sm text-black",
                  "bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)]",
                  "transition-transform btn-glow hover:scale-[1.03] active:scale-[1.01]",
                )}
              >
                Выбрать тариф
              </button>
              <button
                type="button"
                onClick={() => scrollToId("cta")}
                className={cn(
                  "h-12 min-h-[44px] rounded-2xl font-semibold text-sm",
                  "border border-[color:var(--border)] bg-white/0 text-white/90 hover:bg-white/5",
                  "transition-transform hover:scale-[1.03] active:scale-[1.01]",
                )}
              >
                Консультация
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqItem({ q, a, open, onToggle }) {
  const contentRef = useRef(null);
  const [maxH, setMaxH] = useState(0);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    setMaxH(open ? el.scrollHeight : 0);
  }, [open, a]);

  return (
    <div
      className={cn(
        "rounded-3xl border border-[color:var(--border)] bg-[color:var(--card-bg)] backdrop-blur-xl",
        "transition-transform card-hover hover:scale-[1.01]",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left"
        aria-expanded={open}
      >
        <div className="text-sm font-semibold text-white/90">{q}</div>
        <ChevronDown className={cn("h-5 w-5 text-white/75 transition-transform duration-300", open ? "rotate-180" : "rotate-0")} />
      </button>
      <div
        className="px-5 overflow-hidden transition-[max-height] duration-300 ease-out"
        style={{ maxHeight: `${maxH}px` }}
      >
        <div ref={contentRef} className="pb-4 text-sm text-white/70 leading-relaxed">
          {a}
        </div>
      </div>
    </div>
  );
}

function TestimonialsCarousel({ items }) {
  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const els = itemRefs.current.filter(Boolean);
    if (els.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];
        if (!best) return;
        const idx = Number(best.target.getAttribute("data-idx") || "0");
        if (!Number.isNaN(idx)) setActive(idx);
      },
      { root, threshold: [0.55, 0.65, 0.75] },
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [items.length]);

  return (
    <>
      {/* Mobile carousel */}
      <div className="lg:hidden">
        <div
          ref={containerRef}
          className={cn(
            "flex gap-4 overflow-x-auto pb-3",
            "snap-x snap-mandatory scroll-smooth",
            "scroll-px-4",
            "no-scrollbar",
          )}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {items.map((t, idx) => (
            <div
              key={t.name}
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
              data-idx={idx}
              className={cn(
                "min-w-[86%] sm:min-w-[62%] snap-center",
                "rounded-3xl border border-[color:var(--border)] bg-[color:var(--card-bg)] backdrop-blur-xl p-6",
                "transition-transform card-hover hover:scale-[1.02] hover:-translate-y-1",
              )}
              style={{ scrollSnapStop: "always" }}
            >
              <div className="flex items-center gap-3">
                <InitialsAvatar name={t.name} seed={idx} />
                <div>
                  <div className="text-sm font-semibold text-white/90">{t.name}</div>
                  <div className="text-xs text-white/55">{t.role}</div>
                </div>
                <div className="ml-auto flex items-center gap-1 text-white/80" aria-label={`Рейтинг ${t.rating} из 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("h-4 w-4", i < t.rating ? "text-white/90" : "text-white/20")} />
                  ))}
                </div>
              </div>
              <p className="mt-4 text-sm text-white/75 leading-relaxed">“{t.quote}”</p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-center gap-2">
          {items.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() =>
                itemRefs.current[idx]?.scrollIntoView?.({
                  behavior: "smooth",
                  block: "nearest",
                  inline: "center",
                })
              }
              className={cn(
                "h-2.5 rounded-full transition-all",
                idx === active ? "w-8 bg-white/70" : "w-2.5 bg-white/20 hover:bg-white/35",
              )}
              aria-label={`Отзыв ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Desktop grid */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-4">
        {items.map((t, idx) => (
          <div
            key={t.name}
            className={cn(
              "rounded-3xl border border-[color:var(--border)] bg-[color:var(--card-bg)] backdrop-blur-xl p-6",
              "transition-transform card-hover hover:scale-[1.03] hover:-translate-y-1",
            )}
          >
            <div className="flex items-center gap-3">
              <InitialsAvatar name={t.name} seed={idx} />
              <div>
                <div className="text-sm font-semibold text-white/90">{t.name}</div>
                <div className="text-xs text-white/55">{t.role}</div>
              </div>
              <div className="ml-auto flex items-center gap-1 text-white/80" aria-label={`Рейтинг ${t.rating} из 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn("h-4 w-4", i < t.rating ? "text-white/90" : "text-white/20")} />
                ))}
              </div>
            </div>
            <p className="mt-4 text-sm text-white/75 leading-relaxed">“{t.quote}”</p>
          </div>
        ))}
      </div>
    </>
  );
}
