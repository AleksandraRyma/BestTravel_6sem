import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiHome, FiMap, FiPlus, FiSearch, FiStar, FiCalendar,
  FiHeart, FiBell, FiUser, FiLogOut, FiMenu, FiX,
  FiMapPin, FiClock, FiTruck, FiDollarSign,
  FiFilter, FiChevronDown, FiArrowUp, FiArrowDown,
  FiBookmark, FiCheck, FiEye, FiRefreshCw, FiSliders,
} from "react-icons/fi";
import "../../styles/traveler/TravelerSearchPage.css";

// ─── Sidebar nav ──────────────────────────────────────────────────
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

const TRANSPORT_OPTIONS = [
  { value: "WALK",    label: "Пешком",    icon: "🚶" },
  { value: "BIKE",    label: "Велосипед", icon: "🚴" },
  { value: "CAR",     label: "Авто",      icon: "🚗" },
  { value: "TRANSIT", label: "Транспорт", icon: "🚌" },
  { value: "PLANE",   label: "Самолёт",   icon: "✈️" },
];

const CATEGORIES = [
  { id: "Музеи",                 emoji: "🏛"  },
  { id: "Природа",               emoji: "🌿"  },
  { id: "Гастрономия",           emoji: "🍽"  },
  { id: "История",               emoji: "🏰"  },
  { id: "Шопинг",                emoji: "🛍"  },
  { id: "Приключения",           emoji: "🧗"  },
  { id: "Пляжный отдых",         emoji: "🏖"  },
  { id: "Горы",                  emoji: "⛰"   },
  { id: "Архитектура",           emoji: "🏗"  },
  { id: "Ночная жизнь",          emoji: "🌙"  },
  { id: "Семейный отдых",        emoji: "👨‍👩‍👧" },
  { id: "Экстремальный туризм",  emoji: "🪂"  },
  { id: "Культурные мероприятия",emoji: "🎭"  },
  { id: "Фестивали",             emoji: "🎪"  },
  { id: "Фототуризм",            emoji: "📸"  },
  { id: "Экотуризм",             emoji: "🌱"  },
  { id: "Активный отдых",        emoji: "🚵"  },
  { id: "Оздоровительный отдых", emoji: "🧘"  },
  { id: "Обзорные экскурсии",    emoji: "🔭"  },
];

const SORT_OPTIONS = [
  { value: "startDate_asc",  label: "Ближайшие сначала"  },
  { value: "startDate_desc", label: "Дальние сначала"    },
  { value: "price_asc",      label: "Дешевле"            },
  { value: "price_desc",     label: "Дороже"             },
  { value: "duration_asc",   label: "Короче"             },
  { value: "duration_desc",  label: "Длиннее"            },
  { value: "title_asc",      label: "Название А→Я"       },
];

function toDateStr(val) {
  if (!val) return "—";
  if (Array.isArray(val)) {
    const [y, m, d] = val;
    return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  }
  return String(val).slice(0, 10);
}

function fmtDate(val) {
  const s = toDateStr(val);
  if (s === "—") return "—";
  return new Date(s).toLocaleDateString("ru-RU", { day:"numeric", month:"short", year:"numeric" });
}

export default function TravelerSearchPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // ── UI state ──────────────────────────────────────────────────
  const [sidebar,      setSidebar]      = useState(false);
  const [filtersOpen,  setFiltersOpen]  = useState(false);

  // ── Data state ────────────────────────────────────────────────
  const [routes,    setRoutes]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [total,     setTotal]     = useState(0);

  // ── Filter state ──────────────────────────────────────────────
  const [search,       setSearch]       = useState("");
  const [transports,   setTransports]   = useState([]);   // checkboxes — массив
  const [categories,   setCategories]   = useState([]);   // checkboxes — массив
  const [priceMin,     setPriceMin]     = useState("");
  const [priceMax,     setPriceMax]     = useState("");
  const [durMin,       setDurMin]       = useState("");
  const [durMax,       setDurMax]       = useState("");
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState("");
  const [sortBy,       setSortBy]       = useState("startDate_asc");

  // ── Favorites state (local) ───────────────────────────────────
  const [favorites, setFavorites] = useState(new Set());
  const [saved,     setSaved]     = useState(new Set());
  const [toast,     setToast]     = useState("");

  // ── Fetch from backend ────────────────────────────────────────
  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { default: axiosClient } = await import("../../api/axiosClient");

      const params = new URLSearchParams();
      if (search.trim())         params.append("search",    search.trim());
      transports.forEach(t =>    params.append("transport", t));
      categories.forEach(c =>    params.append("category",  c));
      if (priceMin)              params.append("priceMin",  priceMin);
      if (priceMax)              params.append("priceMax",  priceMax);
      if (durMin)                params.append("durMin",    durMin);
      if (durMax)                params.append("durMax",    durMax);
      if (dateFrom)              params.append("dateFrom",  dateFrom);
      if (dateTo)                params.append("dateTo",    dateTo);

      const [sortField, sortDir] = sortBy.split("_");
      params.append("sortBy",  sortField);
      params.append("sortDir", sortDir);

      const res = await axiosClient.get(`/traveler/search?${params.toString()}`);
      const data = res.data;
      setRoutes(Array.isArray(data.content ?? data) ? (data.content ?? data) : []);
      setTotal(data.totalElements ?? (data.length ?? 0));
    } catch (e) {
      setError("Не удалось загрузить маршруты. Проверьте что бэкенд запущен.");
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }, [search, transports, categories, priceMin, priceMax, durMin, durMax, dateFrom, dateTo, sortBy]);

  // Загружаем при изменении фильтров (debounce для поиска)
  useEffect(() => {
    const timer = setTimeout(fetchRoutes, search ? 500 : 0);
    return () => clearTimeout(timer);
  }, [fetchRoutes]);

  // ── Toggle helpers ────────────────────────────────────────────
  const toggleTransport = (v) =>
    setTransports(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  const toggleCategory  = (v) =>
    setCategories(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  const resetFilters = () => {
    setTransports([]); setCategories([]);
    setPriceMin(""); setPriceMax("");
    setDurMin(""); setDurMax("");
    setDateFrom(""); setDateTo("");
    setSortBy("startDate_asc");
  };

  const activeFilterCount = transports.length + categories.length +
    [priceMin,priceMax,durMin,durMax,dateFrom,dateTo].filter(Boolean).length;

  // ── Favorites ─────────────────────────────────────────────────
  const toggleFav = async (routeId) => {
    const next = new Set(favorites);
    if (next.has(routeId)) {
      next.delete(routeId);
      showToast("Убрано из избранного");
      try {
        const { default: ax } = await import("../../api/axiosClient");
        await ax.delete(`/traveler/favorites/${routeId}`);
      } catch {}
    } else {
      next.add(routeId);
      showToast("Добавлено в избранное ❤️");
      try {
        const { default: ax } = await import("../../api/axiosClient");
        await ax.post(`/traveler/favorites/${routeId}`);
      } catch {}
    }
    setFavorites(next);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="tsp-root">

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className={`tsp-sidebar ${sidebar ? "tsp-sidebar--open" : ""}`}>
        <div className="tsp-sidebar__brand">
          <span>✈️</span>
          <span className="tsp-sidebar__brand-text">Travel</span>
          <button className="tsp-sidebar__close" onClick={() => setSidebar(false)}><FiX /></button>
        </div>
        <nav className="tsp-sidebar__nav">
          {NAV.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <button key={item.path}
                className={`tsp-nav-item ${isActive ? "tsp-nav-item--active" : ""}`}
                onClick={() => { navigate(item.path); setSidebar(false); }}>
                <span className="tsp-nav-item__icon">{item.icon}</span>
                <span>{item.label}</span>
                {isActive && <span className="tsp-nav-item__bar" />}
              </button>
            );
          })}
        </nav>
        <button className="tsp-sidebar__logout"
          onClick={() => { localStorage.clear(); navigate("/login"); }}>
          <FiLogOut /> Выйти
        </button>
      </aside>
      {sidebar && <div className="tsp-overlay" onClick={() => setSidebar(false)} />}

      {/* ── MAIN ─────────────────────────────────────────────── */}
      <main className="tsp-main">

        {/* Topbar */}
        <header className="tsp-topbar">
          <button className="tsp-burger" onClick={() => setSidebar(true)}><FiMenu /></button>
          <div className="tsp-topbar__title">
            <FiSearch className="tsp-topbar__icon" />
            <div>
              <h1>Поиск маршрутов</h1>
              <p className="tsp-topbar__sub">Маршруты от профессиональных гидов</p>
            </div>
          </div>
          <button className="tsp-refresh-btn" onClick={fetchRoutes} title="Обновить">
            <FiRefreshCw />
          </button>
        </header>

        {/* Search bar */}
        <div className="tsp-search-bar">
          <div className="tsp-search-wrap">
            <FiSearch className="tsp-search-wrap__icon" />
            <input
              className="tsp-search"
              placeholder="Название маршрута, город отправления или прибытия..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="tsp-search-wrap__clear" onClick={() => setSearch("")}>
                <FiX />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="tsp-sort-wrap">
            <FiArrowDown className="tsp-sort-icon" />
            <select className="tsp-sort" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Filter toggle */}
          <button
            className={`tsp-filter-btn ${filtersOpen ? "active" : ""}`}
            onClick={() => setFiltersOpen(v => !v)}
          >
            <FiSliders />
            Фильтры
            {activeFilterCount > 0 && (
              <span className="tsp-filter-btn__badge">{activeFilterCount}</span>
            )}
            <FiChevronDown className={`tsp-filter-btn__arrow ${filtersOpen ? "up" : ""}`} />
          </button>
        </div>

        {/* ── Filter panel ────────────────────────────────── */}
        {filtersOpen && (
          <div className="tsp-filters">

            {/* Transport — checkboxes */}
            <div className="tsp-filter-section">
              <h4 className="tsp-filter-section__title">
                <FiTruck /> Транспорт
              </h4>
              <div className="tsp-checkboxes">
                {TRANSPORT_OPTIONS.map(t => (
                  <label key={t.value} className={`tsp-checkbox ${transports.includes(t.value) ? "checked" : ""}`}>
                    <input
                      type="checkbox"
                      checked={transports.includes(t.value)}
                      onChange={() => toggleTransport(t.value)}
                    />
                    <span className="tsp-checkbox__box">
                      {transports.includes(t.value) && <FiCheck />}
                    </span>
                    <span className="tsp-checkbox__icon">{t.icon}</span>
                    <span className="tsp-checkbox__label">{t.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Categories — checkboxes */}
            <div className="tsp-filter-section">
              <h4 className="tsp-filter-section__title">
                🗂 Категории
                {categories.length > 0 && (
                  <button className="tsp-clear-link" onClick={() => setCategories([])}>
                    Сбросить ({categories.length})
                  </button>
                )}
              </h4>
              <div className="tsp-checkboxes tsp-checkboxes--wrap">
                {CATEGORIES.map(cat => (
                  <label key={cat.id} className={`tsp-checkbox ${categories.includes(cat.id) ? "checked" : ""}`}>
                    <input
                      type="checkbox"
                      checked={categories.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                    />
                    <span className="tsp-checkbox__box">
                      {categories.includes(cat.id) && <FiCheck />}
                    </span>
                    <span className="tsp-checkbox__icon">{cat.emoji}</span>
                    <span className="tsp-checkbox__label">{cat.id}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div className="tsp-filter-row">
              <div className="tsp-filter-section tsp-filter-section--sm">
                <h4 className="tsp-filter-section__title"><FiDollarSign /> Цена (€)</h4>
                <div className="tsp-range">
                  <input type="number" placeholder="от" min="0"
                    value={priceMin} onChange={e => setPriceMin(e.target.value)} />
                  <span>—</span>
                  <input type="number" placeholder="до" min="0"
                    value={priceMax} onChange={e => setPriceMax(e.target.value)} />
                </div>
              </div>

              <div className="tsp-filter-section tsp-filter-section--sm">
                <h4 className="tsp-filter-section__title"><FiClock /> Длительность (дней)</h4>
                <div className="tsp-range">
                  <input type="number" placeholder="от" min="1"
                    value={durMin} onChange={e => setDurMin(e.target.value)} />
                  <span>—</span>
                  <input type="number" placeholder="до" min="1"
                    value={durMax} onChange={e => setDurMax(e.target.value)} />
                </div>
              </div>

              <div className="tsp-filter-section tsp-filter-section--sm">
                <h4 className="tsp-filter-section__title"><FiCalendar /> Дата начала</h4>
                <div className="tsp-range">
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                  <span>—</span>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </div>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button className="tsp-reset-btn" onClick={resetFilters}>
                <FiX /> Сбросить все фильтры
              </button>
            )}
          </div>
        )}

        {/* Active filter chips */}
        {(transports.length > 0 || categories.length > 0) && (
          <div className="tsp-active-chips">
            {transports.map(t => {
              const opt = TRANSPORT_OPTIONS.find(o => o.value === t);
              return (
                <button key={t} className="tsp-chip" onClick={() => toggleTransport(t)}>
                  {opt?.icon} {opt?.label} <FiX />
                </button>
              );
            })}
            {categories.map(c => {
              const cat = CATEGORIES.find(o => o.id === c);
              return (
                <button key={c} className="tsp-chip" onClick={() => toggleCategory(c)}>
                  {cat?.emoji} {c} <FiX />
                </button>
              );
            })}
          </div>
        )}

        {/* Results header */}
        <div className="tsp-results-header">
          {!loading && !error && (
            <span className="tsp-results-count">
              {routes.length > 0
                ? `Найдено: ${routes.length} маршрутов от гидов`
                : ""}
            </span>
          )}
        </div>

        {/* ── Results ──────────────────────────────────────── */}
        {error ? (
          <div className="tsp-state">
            <div className="tsp-state__icon">⚠️</div>
            <h3>Ошибка загрузки</h3>
            <p>{error}</p>
            <button className="tsp-btn tsp-btn--primary" onClick={fetchRoutes}>
              <FiRefreshCw /> Попробовать снова
            </button>
          </div>
        ) : loading ? (
          <div className="tsp-state">
            <div className="tsp-loading-dots"><span/><span/><span/></div>
            <p>Ищем маршруты...</p>
          </div>
        ) : routes.length === 0 ? (
          <div className="tsp-state">
            <div className="tsp-state__icon">🔍</div>
            <h3>Маршруты не найдены</h3>
            <p>Попробуйте изменить параметры поиска или фильтры</p>
            {activeFilterCount > 0 && (
              <button className="tsp-btn" onClick={() => { setSearch(""); resetFilters(); }}>
                <FiX /> Сбросить фильтры
              </button>
            )}
          </div>
        ) : (
          <div className="tsp-grid">
            {routes.map((r, idx) => {
              const isFav = favorites.has(r.id);
              const tr    = TRANSPORT_OPTIONS.find(t => t.value === r.transportType);

              return (
                <article key={r.id} className="tsp-card"
                  style={{ animationDelay: `${idx * 45}ms` }}>

                  {/* Guide badge */}
                  <div className="tsp-card__guide-badge">
                    Гид: {r.guideFullName || "Профессиональный гид"}
                  </div>

                  {/* Card body */}
                  <div className="tsp-card__body">
                    <h3 className="tsp-card__title"
                      onClick={() => navigate(`/traveler/routes/${r.id}`)}>
                      {r.title}
                    </h3>

                    <div className="tsp-card__route">
                      <FiMapPin className="tsp-card__route-icon" />
                      <span className="tsp-card__from">{r.startLocation}</span>
                      <span className="tsp-card__sep">→</span>
                      <span className="tsp-card__to">{r.endLocation}</span>
                    </div>

                    {r.description && (
                      <p className="tsp-card__desc">{r.description}</p>
                    )}

                    {/* Categories chips */}
                    {r.categories && r.categories.length > 0 && (
                      <div className="tsp-card__cats">
                        {r.categories.slice(0, 3).map(c => {
                          const cat = CATEGORIES.find(o => o.id === c);
                          return (
                            <span key={c} className="tsp-card__cat">
                              {cat?.emoji} {c}
                            </span>
                          );
                        })}
                        {r.categories.length > 3 && (
                          <span className="tsp-card__cat">+{r.categories.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className="tsp-card__meta">
                      <span><FiCalendar /> {fmtDate(r.startDate)}</span>
                      <span><FiClock /> {r.durationDays} дн.</span>
                      {tr && <span>{tr.icon} {tr.label}</span>}
                      <span className={r.totalPrice > 0 ? "tsp-price" : "tsp-free"}>
                        <FiDollarSign />
                        {r.totalPrice > 0
                          ? `${Number(r.totalPrice).toLocaleString("ru-RU")} €`
                          : "Бесплатно"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="tsp-card__actions">
                    <button className="tsp-card__view-btn"
                      onClick={() => navigate(`/traveler/routes/${r.id}`)}>
                      <FiEye /> Открыть
                    </button>
                    <button
                      className={`tsp-card__fav-btn ${isFav ? "active" : ""}`}
                      onClick={() => toggleFav(r.id)}
                      title={isFav ? "Убрать из избранного" : "В избранное"}
                    >
                      <FiHeart />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && <div className="tsp-toast">{toast}</div>}
    </div>
  );
}