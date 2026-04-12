import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiHome, FiMap, FiPlus, FiSearch, FiStar, FiUsers, FiCalendar,
  FiHeart, FiBell, FiUser, FiLogOut, FiMenu, FiX, FiMessageSquare,
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
  { path: "/traveler/reviews",       icon: <FiMessageSquare />, label: "Оставить отзыв" },
  { path: "/traveler/notifications", icon: <FiBell />,     label: "Уведомления"     },
  { path: "/traveler/profile",       icon: <FiUser />,     label: "Профиль"         },
];



const ALL_CATEGORIES = [
  { id: "Музеи", icon: "https://img.icons8.com/ios/50/000000/museum.png", color: "#6366f1" },
  { id: "Природа", icon: "https://img.icons8.com/ios/50/000000/nature.png", color: "#16a34a" },
  { id: "Гастрономия", icon: "https://img.icons8.com/ios/50/000000/restaurant.png", color: "#f59e0b" },
  { id: "Шопинг", icon: "https://img.icons8.com/ios/50/000000/shopping-bag.png", color: "#ec4899" },
  { id: "Приключения", icon: "https://img.icons8.com/ios/50/000000/adventure.png", color: "#ef4444" },
  { id: "Пляжный отдых", icon: "https://img.icons8.com/ios/50/000000/beach.png", color: "#0ea5e9" },
  { id: "Горы", icon: "https://img.icons8.com/?size=100&id=25055&format=png&color=000000", color: "#64748b" },
  { id: "Архитектура", icon: "https://img.icons8.com/?size=100&id=9XlNNA5gCHns&format=png&color=000000", color: "#7c3aed" },
  { id: "Семейный отдых", icon: "https://img.icons8.com/ios/50/000000/family.png", color: "#15803d" },
  { id: "Фестивали", icon: "https://img.icons8.com/ios/50/000000/festival.png", color: "#f97316" },
  { id: "Фототуризм", icon: "https://img.icons8.com/ios/50/000000/camera.png", color: "#0891b2" },
  { id: "Экотуризм", icon: "https://img.icons8.com/?size=100&id=26111&format=png&color=000000", color: "#15803d" },
  { id: "Активный отдых", icon: "https://img.icons8.com/?size=100&id=11736&format=png&color=000000", color: "#b91c1c" },
  { id: "Оздоровительный отдых", icon: "https://img.icons8.com/ios/50/000000/spa.png", color: "#0d9488" },
];


const TRANSPORT_LABELS = [
  { value: "WALK", label: "Пешком", icon: "https://img.icons8.com/ios/50/000000/walking.png" },
  { value: "BIKE", label: "Велосипед", icon: "https://img.icons8.com/ios/50/000000/bicycle.png" },
  { value: "CAR", label: "Авто", icon: "https://img.icons8.com/ios/50/000000/car.png" },
  { value: "TRANSIT", label: "Транспорт", icon: "https://img.icons8.com/ios/50/000000/bus.png" },
  { value: "PLANE", label: "Самолёт", icon: "https://img.icons8.com/ios/50/000000/airplane-take-off.png" },
];

function toDateStr(val) {
  if (!val) return "—";
  if (Array.isArray(val)) {
    const [y, m, d] = val;
    return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  }
  return String(val).slice(0, 10);
}

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

 
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const doLoad = async () => {
      try {
        const { default: axiosClient } = await import("../../api/axiosClient");


        try {
          const res = await axiosClient.get("/traveler/interests");
          const data = res.data || [];
          if (!cancelled) {
            setUserInterests(data);
            setSelectedCats(data.map(i => (typeof i === "string" ? i : i.name)));
          }
        } catch {}


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

const getTransport = (type) =>
  TRANSPORT_LABELS.find(t => t.value === type);



  return (
    <div className="trec-root">

      {}
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

      {}
      <main className="trec-main">

        {}
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

            <div className="trec-card__cats">
  {ALL_CATEGORIES.map(cat => {
    const active = selectedCats.includes(cat.id);

    return (
      <button
        key={cat.id}
        className={`trec-cat ${active ? "trec-cat--active" : ""}`}
        onClick={() => toggleCat(cat.id)}
        type="button"
      >
        <img src={cat.icon} alt="" className="trec-cat__icon" />
        <span>{cat.id}</span>
      </button>
    );
  })}
</div>


        {}

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
                      {
                      
                      r.transportType && (() => {
  const t = getTransport(r.transportType);
  return (
    <span>
      <FiTruck /> {t?.label || r.transportType}
    </span>
  );
})()

                      }
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
