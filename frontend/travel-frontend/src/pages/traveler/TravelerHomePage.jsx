import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

import {
  FiMenu, FiUser, FiMap, FiPlus, FiBell, FiLogOut,
  FiCalendar, FiSearch, FiStar, FiHeart,
  FiChevronLeft, FiChevronRight, FiArrowRight,
  FiRefreshCw, FiMapPin, FiTruck, FiUsers,
  FiX,
} from "react-icons/fi";

import "../../styles/home/homePage.css";
import "../../styles/traveler/TravelerHomePage2.css";


// ─── Категории → ведут на поиск ──────────────────────────────────
const CATEGORIES = [
  { label: "Музеи",          emoji: "🏛",  color: "#6366f1", bg: "#eef2ff" },
  { label: "Природа",        emoji: "🌿",  color: "#16a34a", bg: "#f0fdf4" },
  { label: "Гастрономия",    emoji: "🍽",  color: "#f59e0b", bg: "#fffbeb" },
  { label: "История",        emoji: "🏰",  color: "#b45309", bg: "#fef9c3" },
  { label: "Пляжный отдых",  emoji: "🏖",  color: "#0ea5e9", bg: "#eff6ff" },
  { label: "Горы",           emoji: "⛰",   color: "#64748b", bg: "#f8fafc" },
  { label: "Приключения",    emoji: "🧗",  color: "#ef4444", bg: "#fef2f2" },
  { label: "Архитектура",    emoji: "🏗",  color: "#7c3aed", bg: "#f5f3ff" },
  { label: "Фототуризм",     emoji: "📸",  color: "#0891b2", bg: "#ecfeff" },
  { label: "Экотуризм",      emoji: "🌱",  color: "#15803d", bg: "#f0fdf4" },
  { label: "Активный отдых", emoji: "🚵",  color: "#b91c1c", bg: "#fef2f2" },
  { label: "Фестивали",      emoji: "🎪",  color: "#f97316", bg: "#fff7ed" },
];

const TRANSPORT_OPTIONS = [
  { value: "", label: "Любой транспорт", icon: "🌍" },
  { value: "WALK",    label: "Пешком",    icon: "🚶" },
  { value: "BIKE",    label: "Велосипед", icon: "🚴" },
  { value: "CAR",     label: "Авто",      icon: "🚗" },
  { value: "TRANSIT", label: "Транспорт", icon: "🚌" },
  { value: "PLANE",   label: "Самолёт",   icon: "✈️" },
];

// ─── Цвета и эмодзи для направлений из БД ──────────────────────
const DEST_COLORS = ["#6366f1","#0ea5e9","#f59e0b","#16a34a","#ef4444","#8b5cf6",
                     "#f97316","#ec4899","#0891b2","#7c3aed","#b91c1c","#0d9488"];
const DEST_EMOJIS = ["🗺️","🏙️","⛰️","🌊","🏛","🌿","🏖","🎭","📸","🚂","🌄","🏰"];

export default function TravelerHomePage() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats,       setStats]       = useState(null);
  const [recentRoutes,setRecentRoutes]= useState([]);
  const [loadingStats,setLoadingStats]= useState(true);

  // ── Search form state ─────────────────────────────────────────
  const [searchWhere,     setSearchWhere]     = useState("");
  const [searchTransport, setSearchTransport] = useState("");
  const [searchDateFrom,  setSearchDateFrom]  = useState("");
  const [searchDateTo,    setSearchDateTo]    = useState("");

  const destRef  = useRef(null);
  const catRef   = useRef(null);
  const recentRef= useRef(null);

  // ── Load stats + destinations + recent routes ──────────────────
  useEffect(() => {
    (async () => {
      try {
        const { default: axiosClient } = await import("../../api/axiosClient");

        // 1. Данные главной страницы из /traveler/home
        try {
          const res = await axiosClient.get("/traveler/home");
          setStats(res.data);
        } catch {}

        // 2. Маршруты гидов для блока "Недавно добавлены"
        try {
          const res = await axiosClient.get("/traveler/search");
          const data = res.data;
          setRecentRoutes(
            (Array.isArray(data) ? data : data?.content ?? []).slice(0, 8)
          );
        } catch {}
      } catch {}
      finally {
        setLoadingStats(false);
      }
    })();
  }, []);

  // ── Поиск → /traveler/routes с параметрами ────────────────────
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchWhere.trim())  params.append("search",    searchWhere.trim());
    if (searchTransport)     params.append("transport", searchTransport);
    if (searchDateFrom)      params.append("dateFrom",  searchDateFrom);
    if (searchDateTo)        params.append("dateTo",    searchDateTo);
    navigate(`/traveler/search?${params.toString()}`);
  };

  const goToCity     = (city)  => navigate(`/traveler/search?search=${encodeURIComponent(city)}`);
  const goToCategory = (label) => navigate(`/traveler/search?search=${encodeURIComponent(label)}`);

  const scroll = (ref, dir) => {
    if (!ref.current) return;
    ref.current.scrollBy({
      left: dir === "left" ? -ref.current.offsetWidth * 0.75 : ref.current.offsetWidth * 0.75,
      behavior: "smooth",
    });
  };

  const onLogout = () => { logout?.(); navigate("/login"); };

  const promos = stats?.promos ?? [];
  const themes = stats?.themes ?? [];

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="home-page">

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <h3 className="sidebar-title">Travel</h3>
        <nav className="sidebar-nav">
          <button onClick={() => navigate("/traveler/my-routes")}>    <FiMap />      Мои маршруты    </button>
          <button onClick={() => navigate("/traveler/create-route")}>  <FiPlus />     Создать маршрут </button>
          <button onClick={() => navigate("/traveler/search")}>        <FiSearch />   Найти маршруты  </button>
          <button onClick={() => navigate("/traveler/recommended")}>   <FiStar />     Рекомендации    </button>
          <button onClick={() => navigate("/traveler/favorites")}>     <FiHeart />    Избранное       </button>
          <button onClick={() => navigate("/traveler/calendar")}>      <FiCalendar /> Календарь       </button>
          <button onClick={() => navigate("/traveler/notifications")}>  <FiBell />     Уведомления     </button>
          <button onClick={() => navigate("/traveler/profile")}>       <FiUser />     Профиль         </button>
        </nav>
        <button className="sidebar-logout" onClick={onLogout}><FiLogOut /> Выйти</button>
      </aside>
      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="home-shell">

        {/* ── TOPBAR ───────────────────────────────────────── */}
        <header className="home-topbar">
          <button className="icon-btn" onClick={() => setSidebarOpen(true)}><FiMenu /></button>
          <div className="home-brand">Best Travel</div>
          <div className="home-topbar__actions">
            <button className="home-topbar__nav" onClick={() => navigate("/traveler/my-routes")}>
              <FiMap /> Мои маршруты
            </button>
            <button className="home-btn" onClick={onLogout}>Выйти</button>
          </div>
        </header>

        {/* ══════════════════════════════════════════════════════
            HERO — большой поисковик
        ══════════════════════════════════════════════════════ */}
        <section className="thp-hero">
          <div className="thp-hero__content">
            <h1 className="thp-hero__title">
              Найди своё идеальное путешествие
            </h1>
            <p className="thp-hero__sub">
              Тысячи маршрутов от профессиональных гидов
            </p>

  

            {/* Быстрые теги */}
            <div className="thp-quick-tags">
              <span>Популярно:</span>
              {["Европа", "Грузия", "Горы", "Гастрономия", "Природа"].map(tag => (
                <button key={tag} className="thp-tag" onClick={() => goToCategory(tag)}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            СТАТИСТИКА
        ══════════════════════════════════════════════════════ */}
        {!loadingStats && (
          <section className="thp-stats">
            <div className="thp-stat-item">
              <span className="thp-stat-item__num">
                {recentRoutes.length > 0 ? `${recentRoutes.length}+` : "0"}
              </span>
              <span className="thp-stat-item__label">маршрутов от гидов</span>
            </div>
            <div className="thp-stat-divider" />
            <div className="thp-stat-item">
              <span className="thp-stat-item__num">
                {(stats?.destinations ?? []).length || "0"}
              </span>
              <span className="thp-stat-item__label">направлений в БД</span>
            </div>
            <div className="thp-stat-divider" />
            <div className="thp-stat-item">
              <span className="thp-stat-item__num">
                {(stats?.themes ?? []).length || "0"}
              </span>
              <span className="thp-stat-item__label">категорий интересов</span>
            </div>
            <div className="thp-stat-divider" />
            <div className="thp-stat-item">
              <span className="thp-stat-item__num">🆓</span>
              <span className="thp-stat-item__label">бесплатный сервис</span>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            НАПРАВЛЕНИЯ — карточки городов → поиск по городу
        ══════════════════════════════════════════════════════ */}
        <section className="section thp-section">
          <div className="section-header">
            <div className="section-header-left">
              <h2>✈️ Популярные направления</h2>
              <span className="thp-section__sub">Нажмите чтобы найти маршруты</span>
            </div>
            <div className="controls">
              <button onClick={() => scroll(destRef, "left")}><FiChevronLeft /></button>
              <button onClick={() => scroll(destRef, "right")}><FiChevronRight /></button>
            </div>
          </div>
          <div className="horizontal-scroll thp-dest-scroll" ref={destRef}>
            {(stats?.destinations ?? []).length === 0 ? (
              <div className="thp-empty-dest">
                <span>🗺️</span>
                <p>Маршруты ещё не добавлены</p>
              </div>
            ) : (stats?.destinations ?? []).map((d, i) => (
              <div
                key={i}
                className="thp-dest-card"
                style={{ "--card-color": DEST_COLORS[i % DEST_COLORS.length] }}
                onClick={() => goToCity(d.title)}
                title={`Найти маршруты: ${d.title}`}
              >
                <div className="thp-dest-card__emoji">{DEST_EMOJIS[i % DEST_EMOJIS.length]}</div>
                <div className="thp-dest-card__info">
                  <span className="thp-dest-card__city">{d.title}</span>
                  <span className="thp-dest-card__country">
                    {d.price || "маршруты"}
                  </span>
                </div>
                <div className="thp-dest-card__arrow"><FiArrowRight /></div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            КАТЕГОРИИ — сетка тематических подборок
        ══════════════════════════════════════════════════════ */}
        <section className="section thp-section">
          <div className="section-header">
            <h2>🗂 Подборки по интересам</h2>
            <span className="thp-section__sub">Выберите тему путешествия</span>
          </div>
          <div className="thp-cats-grid">
            {CATEGORIES.map((cat, i) => (
              <button
                key={i}
                className="thp-cat-card"
                style={{ "--cat-color": cat.color, "--cat-bg": cat.bg }}
                onClick={() => goToCategory(cat.label)}
                title={`Маршруты: ${cat.label}`}
              >
                <span className="thp-cat-card__emoji">{cat.emoji}</span>
                <span className="thp-cat-card__label">{cat.label}</span>
                <FiArrowRight className="thp-cat-card__arrow" />
              </button>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            НЕДАВНИЕ МАРШРУТЫ ГИДОВ — реальные данные из БД
        ══════════════════════════════════════════════════════ */}
        {recentRoutes.length > 0 && (
          <section className="section thp-section">
            <div className="section-header">
              <div className="section-header-left">
                <h2>🎓 Маршруты от гидов</h2>
                <span className="thp-section__sub">Профессионально составленные маршруты</span>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <div className="controls">
                  <button onClick={() => scroll(recentRef, "left")}><FiChevronLeft /></button>
                  <button onClick={() => scroll(recentRef, "right")}><FiChevronRight /></button>
                </div>
                <button className="thp-see-all" onClick={() => navigate("/traveler/search")}>
                  Все маршруты <FiArrowRight />
                </button>
              </div>
            </div>
            <div className="horizontal-scroll thp-recent-scroll" ref={recentRef}>
              {recentRoutes.map((r, i) => {
                const startDate = r.startDate
                  ? (Array.isArray(r.startDate)
                      ? `${r.startDate[0]}-${String(r.startDate[1]).padStart(2,"0")}-${String(r.startDate[2]).padStart(2,"0")}`
                      : String(r.startDate).slice(0,10))
                  : null;
                return (
                  <div
                    key={r.id || i}
                    className="thp-route-card"
                    onClick={() => navigate(`/traveler/routes/${r.id}`)}
                    title="Открыть маршрут"
                  >
                    <div className="thp-route-card__header">
                      <span className="thp-route-card__transport">
                        {{ WALK:"🚶", BIKE:"🚴", CAR:"🚗", TRANSIT:"🚌", PLANE:"✈️" }[r.transportType] || "🗺️"}
                      </span>
                      {r.totalPrice != null && (
                        <span className="thp-route-card__price">
                          {r.totalPrice > 0
                            ? `${Number(r.totalPrice).toLocaleString("ru-RU")} €`
                            : "Бесплатно"}
                        </span>
                      )}
                    </div>
                    <h4 className="thp-route-card__title">{r.title}</h4>
                    <div className="thp-route-card__route">
                      <FiMapPin size={11} />
                      <span>{r.startLocation}</span>
                      <span className="thp-route-card__sep">→</span>
                      <span>{r.endLocation}</span>
                    </div>
                    {r.guideFullName && (
                      <div className="thp-route-card__guide">
                        <FiUsers size={11} /> {r.guideFullName}
                      </div>
                    )}
                    <div className="thp-route-card__meta">
                      {startDate && (
                        <span><FiCalendar size={11} /> {new Date(startDate).toLocaleDateString("ru-RU", { day:"numeric", month:"short" })}</span>
                      )}
                      {r.durationDays && <span>{r.durationDays} дн.</span>}
                    </div>
                    <div className="thp-route-card__cta">
                      Подробнее <FiArrowRight size={12} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            КАК ЭТО РАБОТАЕТ
        ══════════════════════════════════════════════════════ */}
        <section className="section thp-section thp-how">
          <h2>Как это работает</h2>
          <div className="thp-how__steps">
            {[
              { step:"01", icon:"🔍", title:"Ищи маршруты",     desc:"Выбери направление, транспорт и даты. Найди маршрут от профессионального гида или другого путешественника." },
              { step:"02", icon:"❤️", title:"Сохраняй в избранное", desc:"Добавляй понравившиеся маршруты в избранное чтобы не потерять." },
              { step:"03", icon:"✈️", title:"Путешествуй",       desc:"Открой маршрут, изучи точки и отправляйся в путь! Или создай свой собственный маршрут." },
            ].map((s, i) => (
              <div key={i} className="thp-how__step">
                <div className="thp-how__step-num">{s.step}</div>
                <div className="thp-how__step-icon">{s.icon}</div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            CTA
        ══════════════════════════════════════════════════════ */}
        <section className="thp-cta">
          <h2>Готов к приключению?</h2>
          <p>Создай свой маршрут или найди идеальный от наших гидов</p>
          <div className="thp-cta__btns">
            <button className="thp-cta__btn thp-cta__btn--primary"
              onClick={() => navigate("/traveler/search")}>
              <FiSearch /> Найти маршрут
            </button>
            <button className="thp-cta__btn thp-cta__btn--outline"
              onClick={() => navigate("/traveler/create-route")}>
              <FiPlus /> Создать свой
            </button>
          </div>
        </section>

        <footer className="footer">© Travel 2026</footer>
      </div>
    </div>
  );
}