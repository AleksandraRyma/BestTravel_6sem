import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiHome, FiMap, FiPlus, FiSearch, FiStar, FiUsers, FiCalendar,
  FiHeart, FiBell, FiUser, FiLogOut, FiMenu, FiX,
  FiMapPin, FiClock, FiTruck, FiDollarSign, FiRefreshCw,
  FiCheck, FiBookmark, FiZap, FiFilter,
} from "react-icons/fi";
import "../../styles/traveler/TravelerRecommendedPage.css";

const NAV = [
  { path: "/traveler",               icon: <FiHome />,     label: "Главная"         },
  { path: "/traveler/my-routes",     icon: <FiMap />,      label: "Мои маршруты"    },
  { path: "/traveler/create-route",  icon: <FiPlus />,     label: "Создать маршрут" },
  { path: "/traveler/search",        icon: <FiSearch />,   label: "Найти маршруты"  },
  { path: "/traveler/recommended",   icon: <FiStar />,     label: "Рекомендации"    },
  { path: "/traveler/calendar",      icon: <FiCalendar />, label: "Календарь"       },
  { path: "/traveler/favorites",     icon: <FiHeart />,    label: "Избранное"       },
  { path: "/traveler/notifications", icon: <FiBell />,     label: "Уведомления"     },
  { path: "/traveler/profile",       icon: <FiUser />,     label: "Профиль"         },
];

const ALL_CATEGORIES = [
  { id: "Музеи",                 emoji: "🏛",  color: "#6366f1" },
  { id: "Природа",               emoji: "🌿",  color: "#16a34a" },
  { id: "Гастрономия",           emoji: "🍽",  color: "#f59e0b" },
  { id: "История",               emoji: "🏰",  color: "#b45309" },
  { id: "Шопинг",                emoji: "🛍",  color: "#ec4899" },
  { id: "Приключения",           emoji: "🧗",  color: "#ef4444" },
  { id: "Пляжный отдых",         emoji: "🏖",  color: "#0ea5e9" },
  { id: "Горы",                  emoji: "⛰",   color: "#64748b" },
  { id: "Архитектура",           emoji: "🏗",  color: "#7c3aed" },
  { id: "Ночная жизнь",          emoji: "🌙",  color: "#1d4ed8" },
  { id: "Семейный отдых",        emoji: "👨‍👩‍👧",color: "#15803d" },
  { id: "Экстремальный туризм",  emoji: "🪂",  color: "#dc2626" },
  { id: "Культурные мероприятия",emoji: "🎭",  color: "#9333ea" },
  { id: "Фестивали",             emoji: "🎪",  color: "#f97316" },
  { id: "Религиозные места",     emoji: "⛪",   color: "#92400e" },
  { id: "Фототуризм",            emoji: "📸",  color: "#0891b2" },
  { id: "Экотуризм",             emoji: "🌱",  color: "#15803d" },
  { id: "Активный отдых",        emoji: "🚵",  color: "#b91c1c" },
  { id: "Оздоровительный отдых", emoji: "🧘",  color: "#0d9488" },
  { id: "Обзорные экскурсии",    emoji: "🔭",  color: "#4f46e5" },
];

const TRANSPORT_LABELS = {
  WALK: "🚶 Пешком", BIKE: "🚴 Велосипед", CAR: "🚗 Авто",
  TRANSIT: "🚌 Транспорт", PLANE: "✈️ Самолёт",
};

function toDateStr(val) {
  if (!val) return "—";
  if (Array.isArray(val)) {
    const [y, m, d] = val;
    return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  }
  return String(val).slice(0, 10);
}

// const MOCK_RECS = [
//   { id:10, title:"Горная Грузия", matchScore:96, startLocation:"Тбилиси", endLocation:"Казбеги", startDate:"2026-05-15", endDate:"2026-05-22", durationDays:8, transportType:"CAR", totalPrice:280, matchedCategories:["Природа","Горы","Активный отдых"], description:"Живописные горные тропы, старинные башни и монастыри Грузии." },
//   { id:11, title:"Токио — гастрономический тур", matchScore:91, startLocation:"Токио", endLocation:"Осака", startDate:"2026-06-01", endDate:"2026-06-10", durationDays:10, transportType:"TRANSIT", totalPrice:1800, matchedCategories:["Гастрономия","Культурные мероприятия","Архитектура"], description:"Мишленовские рестораны, уличная еда и храмы — всё в одном маршруте." },
//   { id:12, title:"Амальфитанское побережье", matchScore:88, startLocation:"Неаполь", endLocation:"Позитано", startDate:"2026-07-10", endDate:"2026-07-17", durationDays:8, transportType:"CAR", totalPrice:950, matchedCategories:["Пляжный отдых","Гастрономия","Архитектура"], description:"Лазурное море, лимонные рощи и средневековые городки Италии." },
//   { id:13, title:"Исландия: северное сияние", matchScore:85, startLocation:"Рейкьявик", endLocation:"Акюрейри", startDate:"2026-02-01", endDate:"2026-02-08", durationDays:8, transportType:"CAR", totalPrice:2200, matchedCategories:["Природа","Фототуризм","Экотуризм"], description:"Ледники, гейзеры и лучшие места для наблюдения за северным сиянием." },
//   { id:14, title:"Марокко: пустыня Сахара", matchScore:82, startLocation:"Марракеш", endLocation:"Мерзуга", startDate:"2026-03-20", endDate:"2026-03-28", durationDays:9, transportType:"CAR", totalPrice:680, matchedCategories:["Приключения","История","Фототуризм"], description:"Лабиринты медины, берберские деревни и ночёвка в пустыне." },
//   { id:15, title:"Балтийские столицы", matchScore:79, startLocation:"Таллин", endLocation:"Вильнюс", startDate:"2026-05-01", endDate:"2026-05-07", durationDays:7, transportType:"TRANSIT", totalPrice:380, matchedCategories:["История","Архитектура","Обзорные экскурсии"], description:"Три средневековых столицы — Таллин, Рига и Вильнюс за одну поездку." },
// ];

export default function TravelerRecommendedPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebar,           setSidebar]           = useState(false);
  const [loading,           setLoading]            = useState(true);
  const [recommendations,   setRecommendations]    = useState([]);
  const [userInterests,     setUserInterests]      = useState([]);
  const [selectedCats,      setSelectedCats]       = useState([]);
  const [showPanel,         setShowPanel]          = useState(false);
  const [savingInterests,   setSavingInterests]    = useState(false);
  const [favorites,         setFavorites]          = useState(new Set());
  const [savedRoutes,       setSavedRoutes]        = useState(new Set());
  const [toast,             setToast]              = useState("");
  const [refreshKey,        setRefreshKey]         = useState(0);

  // ── Load ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const doLoad = async () => {
      try {
        const { default: axiosClient } = await import("../../api/axiosClient");

        // 1. Get user interests
        try {
          const res = await axiosClient.get("/traveler/interests");
          const data = res.data || [];
          if (!cancelled) {
            setUserInterests(data);
            setSelectedCats(data.map(i => (typeof i === "string" ? i : i.name)));
          }
        } catch {}

        // 2. Get recommendations
        try {
          const res = await axiosClient.get("/traveler/recommendations");
          if (!cancelled) setRecommendations(res.data || []);
        } catch {
          if (!cancelled) setRecommendations(MOCK_RECS);
        }
      } catch {
        if (!cancelled) setRecommendations(MOCK_RECS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    doLoad();
    return () => { cancelled = true; };
  }, [refreshKey]);

  // ── Save interests to backend ─────────────────────────────────
  const saveInterests = async () => {
    setSavingInterests(true);
    try {
      const { default: axiosClient } = await import("../../api/axiosClient");
      await axiosClient.put("/traveler/interests", { categories: selectedCats });
    } catch {}
    setUserInterests(selectedCats.map(c => ({ name: c })));
    setShowPanel(false);
    showToast("Интересы сохранены — обновляем рекомендации...");
    setSavingInterests(false);
    setTimeout(() => setRefreshKey(k => k + 1), 600);
  };

  const toggleCat = (id) =>
    setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  // ── Favorite ──────────────────────────────────────────────────
  const toggleFav = async (routeId) => {
    const next = new Set(favorites);
    if (next.has(routeId)) {
      next.delete(routeId);
      showToast("Убрано из избранного");
    } else {
      next.add(routeId);
      showToast("Добавлено в избранное ❤️");
      try {
        const { default: axiosClient } = await import("../../api/axiosClient");
        await axiosClient.post(`/traveler/favorites/${routeId}`);
      } catch {}
    }
    setFavorites(next);
  };

  // ── Save to my routes ─────────────────────────────────────────
  const saveRoute = async (route) => {
    if (savedRoutes.has(route.id)) {
      navigate(`/traveler/routes/${route.id}`);
      return;
    }
    try {
      const { default: axiosClient } = await import("../../api/axiosClient");
      await axiosClient.post(`/traveler/recommendations/${route.id}/save`);
    } catch {}
    setSavedRoutes(prev => new Set([...prev, route.id]));
    showToast(`"${route.title}" сохранён в Мои маршруты ✅`);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const scoreColor = (s) =>
    s >= 90 ? "#16a34a" : s >= 75 ? "#0ea5e9" : "#f59e0b";

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="trec-root">

      {/* SIDEBAR */}
      <aside className={`trec-sidebar ${sidebar ? "trec-sidebar--open" : ""}`}>
        <div className="trec-sidebar__brand">
          <span>✈️</span>
          <span className="trec-sidebar__brand-text">Travel</span>
          <button className="trec-sidebar__close" onClick={() => setSidebar(false)}><FiX /></button>
        </div>
        <nav className="trec-sidebar__nav">
          {NAV.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <button key={item.path}
                className={`trec-nav-item ${isActive ? "trec-nav-item--active" : ""}`}
                onClick={() => { navigate(item.path); setSidebar(false); }}>
                <span className="trec-nav-item__icon">{item.icon}</span>
                <span>{item.label}</span>
                {isActive && <span className="trec-nav-item__bar" />}
              </button>
            );
          })}
        </nav>
        <button className="trec-sidebar__logout"
          onClick={() => { localStorage.clear(); navigate("/login"); }}>
          <FiLogOut /> Выйти
        </button>
      </aside>
      {sidebar && <div className="trec-overlay" onClick={() => setSidebar(false)} />}

      {/* MAIN */}
      <main className="trec-main">

        {/* Topbar */}
        <header className="trec-topbar">
          <button className="trec-burger" onClick={() => setSidebar(true)}><FiMenu /></button>
          <div className="trec-topbar__title">
            <FiZap className="trec-topbar__zap" />
            <h1>Рекомендации</h1>
          </div>
          <div className="trec-topbar__actions">
            <button className="trec-icon-btn" onClick={() => setRefreshKey(k => k+1)} title="Обновить">
              <FiRefreshCw />
            </button>
            <button
              className={`trec-interests-btn ${showPanel ? "active" : ""}`}
              onClick={() => setShowPanel(v => !v)}
            >
              <FiFilter />
              Мои интересы
              {userInterests.length > 0 && (
                <span className="trec-interests-btn__badge">{userInterests.length}</span>
              )}
            </button>
          </div>
        </header>

        {/* Interest selection panel */}
        {showPanel && (
          <div className="trec-panel">
            <div className="trec-panel__head">
              <div className="trec-panel__head-text">
                <h3>Выберите ваши интересы</h3>
                <p>Мы подберём маршруты специально для вас</p>
              </div>
              <button className="trec-icon-btn" onClick={() => setShowPanel(false)}><FiX /></button>
            </div>

            <div className="trec-cats-grid">
              {ALL_CATEGORIES.map(cat => {
                const active = selectedCats.includes(cat.id);
                return (
                  <button key={cat.id}
                    className={`trec-cat ${active ? "trec-cat--active" : ""}`}
                    style={active ? { borderColor: cat.color, color: cat.color, background: cat.color + "12" } : {}}
                    onClick={() => toggleCat(cat.id)}
                  >
                    <span className="trec-cat__emoji">{cat.emoji}</span>
                    <span className="trec-cat__name">{cat.id}</span>
                    {active && <FiCheck className="trec-cat__check" style={{ color: cat.color }} />}
                  </button>
                );
              })}
            </div>

            <div className="trec-panel__footer">
              <span className="trec-panel__count">
                Выбрано <strong>{selectedCats.length}</strong> из {ALL_CATEGORIES.length}
              </span>
              <button className="trec-btn trec-btn--ghost" onClick={() => setSelectedCats([])}>
                Сбросить
              </button>
              <button className="trec-btn trec-btn--primary"
                onClick={saveInterests} disabled={savingInterests}>
                {savingInterests ? "Сохраняем..." : "Сохранить и обновить"}
              </button>
            </div>
          </div>
        )}

        {/* Current interests chips */}
        {!showPanel && userInterests.length > 0 && (
          <div className="trec-chips">
            <span className="trec-chips__label">Ваши интересы:</span>
            <div className="trec-chips__list">
              {userInterests.slice(0, 7).map((item, i) => {
                const name = typeof item === "string" ? item : item.name;
                const cat  = ALL_CATEGORIES.find(c => c.id === name);
                return (
                  <span key={i} className="trec-chip"
                    style={{ borderColor: (cat?.color || "#64748b") + "50", color: cat?.color || "#64748b" }}>
                    {cat?.emoji} {name}
                  </span>
                );
              })}
              {userInterests.length > 7 && (
                <span className="trec-chip">+{userInterests.length - 7}</span>
              )}
            </div>
            <button className="trec-chips__edit" onClick={() => setShowPanel(true)}>Изменить</button>
          </div>
        )}

        {/* Section label */}
        <div className="trec-section-head">
          <div>
            <h2>Подобрано для вас</h2>
            <p>На основе ваших интересов и истории маршрутов</p>
          </div>
          {!loading && recommendations.length > 0 && (
            <span className="trec-total">{recommendations.length} маршрутов</span>
          )}
        </div>

        {/* States */}
        {loading ? (
          <div className="trec-loading">
            <div className="trec-loading__dots"><span/><span/><span/></div>
            <p>Подбираем маршруты...</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="trec-empty">
            <div className="trec-empty__icon">🧭</div>
            <h3>Нет рекомендаций</h3>
            <p>Укажите интересы — мы подберём маршруты специально для вас</p>
            <button className="trec-btn trec-btn--primary" onClick={() => setShowPanel(true)}>
              <FiFilter /> Выбрать интересы
            </button>
          </div>
        ) : (
          /* Cards grid */
          <div className="trec-grid">
            {recommendations.map((r, idx) => {
              const isFav   = favorites.has(r.id);
              const isSaved = savedRoutes.has(r.id);
              const score   = r.matchScore ?? 80;
              const cats    = r.matchedCategories || [];

              return (
                <article key={r.id} className="trec-card"
                  style={{ animationDelay: `${idx * 55}ms` }}>

                  {/* Score */}
                  <div className="trec-card__score-wrap">
                    <span className="trec-card__score"
                      style={{ color: scoreColor(score), borderColor: scoreColor(score) + "35" }}>
                      <FiZap style={{ color: scoreColor(score), fontSize: 11 }} />
                      {score}%
                    </span>
                  </div>

                  {/* Content */}
                  <div className="trec-card__content">
                    <h3 className="trec-card__title">{r.title}</h3>

                    <div className="trec-card__route">
                      <FiMapPin className="trec-card__route-icon" />
                      <span className="trec-card__from">{r.startLocation}</span>
                      <span className="trec-card__sep">→</span>
                      <span className="trec-card__to">{r.endLocation}</span>
                    </div>

                    {r.description && (
                      <p className="trec-card__desc">{r.description}</p>
                    )}

                    {cats.length > 0 && (
                      <div className="trec-card__cats">
                        {cats.slice(0, 3).map(c => {
                          const cat = ALL_CATEGORIES.find(a => a.id === c);
                          return (
                            <span key={c} className="trec-card__cat"
                              style={{ color: cat?.color, background: (cat?.color || "#64748b") + "14" }}>
                              {cat?.emoji} {c}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <div className="trec-card__meta">
                      <span><FiClock /> {r.durationDays} дн.</span>
                      {r.transportType && (
                        <span><FiTruck /> {TRANSPORT_LABELS[r.transportType]?.split(" ")[0] ?? r.transportType}</span>
                      )}
                      {r.totalPrice != null && (
                        <span><FiDollarSign />
                          {r.totalPrice > 0
                            ? `${Number(r.totalPrice).toLocaleString("ru-RU")} €`
                            : "Бесплатно"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="trec-card__actions">
                    <button className="trec-card__view-btn"
                      onClick={() => navigate(`/traveler/routes/${r.id}`)}>
                      Открыть маршрут
                    </button>
                    <div className="trec-card__icon-actions">
                      <button
                        className={`trec-card__icon-btn ${isFav ? "trec-card__icon-btn--fav-active" : ""}`}
                        onClick={() => toggleFav(r.id)}
                        title={isFav ? "Убрать из избранного" : "В избранное"}
                      >
                        <FiHeart />
                      </button>
                      <button
                        className={`trec-card__icon-btn ${isSaved ? "trec-card__icon-btn--saved" : ""}`}
                        onClick={() => saveRoute(r)}
                        title={isSaved ? "Перейти к маршруту" : "Сохранить в Мои маршруты"}
                      >
                        {isSaved ? <FiCheck /> : <FiBookmark />}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && <div className="trec-toast">{toast}</div>}
    </div>
  );
}