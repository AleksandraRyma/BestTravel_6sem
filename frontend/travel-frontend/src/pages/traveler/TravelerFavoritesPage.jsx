import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiHome, FiMap, FiPlus, FiSearch, FiStar, FiCalendar,
  FiHeart, FiBell, FiUser, FiLogOut, FiMenu, FiX,
  FiMapPin, FiClock, FiTruck, FiDollarSign, FiFilter,
  FiArrowUp, FiArrowDown, FiTrash2, FiEye, FiChevronDown,
  FiSliders,
} from "react-icons/fi";
import "../../styles/traveler/TravelerFavoritesPage.css";

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

const TRANSPORT = {
  WALK:    { label: "Пешком",    icon: "🚶" },
  BIKE:    { label: "Велосипед", icon: "🚴" },
  CAR:     { label: "Авто",      icon: "🚗" },
  TRANSIT: { label: "Транспорт", icon: "🚌" },
  PLANE:   { label: "Самолёт",   icon: "✈️" },
};

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

function routeStatus(start, end) {
  const now = new Date(), s = new Date(toDateStr(start)), e = new Date(toDateStr(end));
  if (now < s) return { label: "Предстоит", cls: "upcoming" };
  if (now > e) return { label: "Завершён",  cls: "past"     };
  return             { label: "В пути",    cls: "ongoing"   };
}


const SORT_OPTIONS = [
  { value: "savedAt_desc",   label: "Дата добавления (новые)" },
  { value: "savedAt_asc",    label: "Дата добавления (старые)" },
  { value: "rating_desc",    label: "Рейтинг ↓" },
  { value: "rating_asc",     label: "Рейтинг ↑" },
  { value: "price_asc",      label: "Цена: дешевле" },
  { value: "price_desc",     label: "Цена: дороже" },
  { value: "startDate_asc",  label: "Дата начала (ближайшие)" },
  { value: "startDate_desc", label: "Дата начала (дальние)" },
  { value: "duration_asc",   label: "Длительность ↑" },
  { value: "duration_desc",  label: "Длительность ↓" },
];

export default function TravelerFavoritesPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [favorites,    setFavorites]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [sidebar,      setSidebar]      = useState(false);
  const [filtersOpen,  setFiltersOpen]  = useState(false);
  const [removeId,     setRemoveId]     = useState(null);
  const [removing,     setRemoving]     = useState(false);
  const [viewMode,     setViewMode]     = useState("grid"); // grid | list

  // ── Filters ───────────────────────────────────────────────────
  const [search,       setSearch]       = useState("");
  const [fTransport,   setFTransport]   = useState("");
  const [fPriceMin,    setFPriceMin]    = useState("");
  const [fPriceMax,    setFPriceMax]    = useState("");
  const [fDurMin,      setFDurMin]      = useState("");
  const [fDurMax,      setFDurMax]      = useState("");
  const [fRatingMin,   setFRatingMin]   = useState("");
  const [fDateFrom,    setFDateFrom]    = useState("");
  const [fDateTo,      setFDateTo]      = useState("");
  const [sortBy,       setSortBy]       = useState("savedAt_desc");

  // ── Load ──────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const { default: axiosClient } = await import("../../api/axiosClient");
        const res = await axiosClient.get("/traveler/favorites");
        setFavorites(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || "";
        if (e?.code === "ERR_NETWORK" || e?.response?.status >= 500) {
          setError("Не удалось подключиться к серверу. Проверьте что бэкенд запущен.");
        } else {
          setError(msg || "Ошибка загрузки избранного");
        }
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Remove from favorites ─────────────────────────────────────
  const confirmRemove = async () => {
    if (!removeId) return;
    setRemoving(true);
    try {
      const { default: axiosClient } = await import("../../api/axiosClient");
      await axiosClient.delete(`/traveler/favorites/${removeId}`);
    } catch {}
    setFavorites(prev => prev.filter(r => r.id !== removeId));
    setRemoveId(null);
    setRemoving(false);
  };

  // ── Filter + sort ─────────────────────────────────────────────
  const processed = favorites
    .filter(r => {
      const q = search.trim().toLowerCase();
      if (q) {
        const hay = [r.title, r.startLocation, r.endLocation].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (fTransport && r.transportType !== fTransport) return false;
      const price = r.totalPrice ?? 0;
      if (fPriceMin && price < Number(fPriceMin)) return false;
      if (fPriceMax && price > Number(fPriceMax)) return false;
      const dur = r.durationDays ?? 0;
      if (fDurMin && dur < Number(fDurMin)) return false;
      if (fDurMax && dur > Number(fDurMax)) return false;
      const rating = r.averageRating ?? 0;
      if (fRatingMin && rating < Number(fRatingMin)) return false;
      if (fDateFrom && toDateStr(r.startDate) < fDateFrom) return false;
      if (fDateTo   && toDateStr(r.startDate) > fDateTo)   return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "savedAt_desc":   return new Date(b.savedAt||0) - new Date(a.savedAt||0);
        case "savedAt_asc":    return new Date(a.savedAt||0) - new Date(b.savedAt||0);
        case "rating_desc":    return (b.averageRating||0) - (a.averageRating||0);
        case "rating_asc":     return (a.averageRating||0) - (b.averageRating||0);
        case "price_asc":      return (a.totalPrice||0) - (b.totalPrice||0);
        case "price_desc":     return (b.totalPrice||0) - (a.totalPrice||0);
        case "startDate_asc":  return new Date(toDateStr(a.startDate)) - new Date(toDateStr(b.startDate));
        case "startDate_desc": return new Date(toDateStr(b.startDate)) - new Date(toDateStr(a.startDate));
        case "duration_asc":   return (a.durationDays||0) - (b.durationDays||0);
        case "duration_desc":  return (b.durationDays||0) - (a.durationDays||0);
        default: return 0;
      }
    });

  const activeFilters = [fTransport,fPriceMin,fPriceMax,fDurMin,fDurMax,fRatingMin,fDateFrom,fDateTo]
    .filter(Boolean).length;

  const resetFilters = () => {
    setFTransport(""); setFPriceMin(""); setFPriceMax("");
    setFDurMin(""); setFDurMax(""); setFRatingMin("");
    setFDateFrom(""); setFDateTo("");
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="tfp-root">

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className={`tfp-sidebar ${sidebar ? "tfp-sidebar--open" : ""}`}>
        <div className="tfp-sidebar__brand">
          <span>✈️</span>
          <span className="tfp-sidebar__brand-text">Travel</span>
          <button className="tfp-sidebar__close" onClick={() => setSidebar(false)}><FiX /></button>
        </div>
        <nav className="tfp-sidebar__nav">
          {NAV.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <button key={item.path}
                className={`tfp-nav-item ${isActive ? "tfp-nav-item--active" : ""}`}
                onClick={() => { navigate(item.path); setSidebar(false); }}>
                <span className="tfp-nav-item__icon">{item.icon}</span>
                <span>{item.label}</span>
                {isActive && <span className="tfp-nav-item__bar" />}
              </button>
            );
          })}
        </nav>
        <button className="tfp-sidebar__logout"
          onClick={() => { localStorage.clear(); navigate("/login"); }}>
          <FiLogOut /> Выйти
        </button>
      </aside>
      {sidebar && <div className="tfp-overlay" onClick={() => setSidebar(false)} />}

      {/* ── MAIN ─────────────────────────────────────────────── */}
      <main className="tfp-main">

        {/* Topbar */}
        <header className="tfp-topbar">
          <button className="tfp-burger" onClick={() => setSidebar(true)}><FiMenu /></button>
          <div className="tfp-topbar__title">
            <FiHeart className="tfp-topbar__icon" />
            <h1>Избранное</h1>
            {!loading && (
              <span className="tfp-topbar__count">{processed.length}</span>
            )}
          </div>
          <div className="tfp-topbar__right">
            {/* View mode toggle */}
            <div className="tfp-view-toggle">
              <button className={`tfp-view-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")} title="Сетка">
                ⊞
              </button>
              <button className={`tfp-view-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")} title="Список">
                ≡
              </button>
            </div>
          </div>
        </header>

        {/* Toolbar */}
        <div className="tfp-toolbar">
          {/* Search */}
          <div className="tfp-search-wrap">
            <FiSearch className="tfp-search-icon" />
            <input
              className="tfp-search"
              placeholder="Поиск по названию, откуда, куда..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="tfp-search-clear" onClick={() => setSearch("")}><FiX /></button>
            )}
          </div>

          {/* Sort */}
          <div className="tfp-sort-wrap">
            <FiArrowDown className="tfp-sort-icon" />
            <select className="tfp-sort" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Filters toggle */}
          <button
            className={`tfp-filter-btn ${filtersOpen ? "active" : ""}`}
            onClick={() => setFiltersOpen(v => !v)}
          >
            <FiSliders />
            Фильтры
            {activeFilters > 0 && <span className="tfp-filter-btn__badge">{activeFilters}</span>}
            <FiChevronDown className={`tfp-filter-btn__chevron ${filtersOpen ? "rotated" : ""}`} />
          </button>
        </div>

        {/* Filter panel */}
        {filtersOpen && (
          <div className="tfp-filters">

            {/* Transport */}
            <div className="tfp-filter-group">
              <label>Транспорт</label>
              <div className="tfp-filter-btns">
                <button className={`tfp-fbtn ${!fTransport ? "active" : ""}`}
                  onClick={() => setFTransport("")}>Все</button>
                {Object.entries(TRANSPORT).map(([k, v]) => (
                  <button key={k}
                    className={`tfp-fbtn ${fTransport === k ? "active" : ""}`}
                    onClick={() => setFTransport(fTransport === k ? "" : k)}>
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div className="tfp-filter-group">
              <label><FiDollarSign /> Цена (€)</label>
              <div className="tfp-range-row">
                <input type="number" placeholder="от" min="0"
                  value={fPriceMin} onChange={e => setFPriceMin(e.target.value)} />
                <span className="tfp-range-sep">—</span>
                <input type="number" placeholder="до" min="0"
                  value={fPriceMax} onChange={e => setFPriceMax(e.target.value)} />
              </div>
            </div>

            {/* Duration range */}
            <div className="tfp-filter-group">
              <label><FiClock /> Длительность (дней)</label>
              <div className="tfp-range-row">
                <input type="number" placeholder="от" min="1"
                  value={fDurMin} onChange={e => setFDurMin(e.target.value)} />
                <span className="tfp-range-sep">—</span>
                <input type="number" placeholder="до" min="1"
                  value={fDurMax} onChange={e => setFDurMax(e.target.value)} />
              </div>
            </div>

            {/* Min rating */}
            <div className="tfp-filter-group">
              <label>⭐ Мин. рейтинг</label>
              <div className="tfp-rating-btns">
                {["", "3", "3.5", "4", "4.5"].map(v => (
                  <button key={v}
                    className={`tfp-fbtn ${fRatingMin === v ? "active" : ""}`}
                    onClick={() => setFRatingMin(fRatingMin === v ? "" : v)}>
                    {v ? `${v}+` : "Любой"}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range */}
            <div className="tfp-filter-group">
              <label><FiCalendar /> Дата начала маршрута</label>
              <div className="tfp-range-row">
                <input type="date" value={fDateFrom} onChange={e => setFDateFrom(e.target.value)} />
                <span className="tfp-range-sep">—</span>
                <input type="date" value={fDateTo}   onChange={e => setFDateTo(e.target.value)} />
              </div>
            </div>

            {activeFilters > 0 && (
              <button className="tfp-reset-btn" onClick={resetFilters}>
                <FiX /> Сбросить все фильтры
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {error ? (
          <div className="tfp-state">
            <div className="tfp-state__icon">⚠️</div>
            <h3>Ошибка загрузки</h3>
            <p>{error}</p>
            <button className="tfp-btn tfp-btn--primary"
              onClick={() => { setError(""); window.location.reload(); }}>
              Попробовать снова
            </button>
          </div>
        ) : loading ? (
          <div className="tfp-state">
            <div className="tfp-spinner" />
            <p>Загружаем избранное...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="tfp-state tfp-state--empty">
            <div className="tfp-state__icon">💔</div>
            <h3>Избранное пусто</h3>
            <p>Добавляйте понравившиеся маршруты в избранное со страницы рекомендаций</p>
            <button className="tfp-btn tfp-btn--primary"
              onClick={() => navigate("/traveler/recommended")}>
              <FiStar /> Смотреть рекомендации
            </button>
          </div>
        ) : processed.length === 0 ? (
          <div className="tfp-state">
            <div className="tfp-state__icon">🔍</div>
            <h3>Ничего не найдено</h3>
            <p>Попробуйте изменить параметры поиска или фильтры</p>
            <button className="tfp-btn" onClick={() => { setSearch(""); resetFilters(); }}>
              Сбросить всё
            </button>
          </div>
        ) : (
          <div className={`tfp-content ${viewMode === "list" ? "tfp-content--list" : "tfp-content--grid"}`}>
            {processed.map((r, idx) => {
              const tr     = TRANSPORT[r.transportType];
              const status = routeStatus(r.startDate, r.endDate);
              const rating = r.averageRating;

              return viewMode === "grid" ? (
                /* ── GRID CARD ── */
                <article key={r.id} className="tfp-card"
                  style={{ animationDelay: `${idx * 45}ms` }}>

                  <div className="tfp-card__header">
                    <span className={`tfp-card__status tfp-card__status--${status.cls}`}>
                      {status.label}
                    </span>
                    {rating != null && (
                      <span className="tfp-card__rating">
                        ⭐ {Number(rating).toFixed(1)}
                      </span>
                    )}
                  </div>

                  <div className="tfp-card__body">
                    <h3 className="tfp-card__title">{r.title}</h3>
                    <div className="tfp-card__route">
                      <FiMapPin />
                      <span className="from">{r.startLocation}</span>
                      <span className="sep">→</span>
                      <span className="to">{r.endLocation}</span>
                    </div>
                    <div className="tfp-card__meta">
                      <span><FiCalendar /> {fmtDate(r.startDate)}</span>
                      <span><FiClock /> {r.durationDays} дн.</span>
                      {tr && <span>{tr.icon} {tr.label}</span>}
                      <span className={r.totalPrice > 0 ? "price" : "free"}>
                        <FiDollarSign />
                        {r.totalPrice > 0
                          ? `${Number(r.totalPrice).toLocaleString("ru-RU")} €`
                          : "Бесплатно"}
                      </span>
                    </div>
                    {r.savedAt && (
                      <div className="tfp-card__saved">
                        Добавлено {new Date(r.savedAt).toLocaleDateString("ru-RU", { day:"numeric", month:"long" })}
                      </div>
                    )}
                  </div>

                  <div className="tfp-card__actions">
                    <button className="tfp-card__view-btn"
                      onClick={() => navigate(`/traveler/routes/${r.id}`)}>
                      <FiEye /> Открыть
                    </button>
                    <button className="tfp-card__del-btn"
                      onClick={() => setRemoveId(r.id)} title="Убрать из избранного">
                      <FiHeart />
                    </button>
                  </div>
                </article>
              ) : (
                /* ── LIST ROW ── */
                <div key={r.id} className="tfp-row"
                  style={{ animationDelay: `${idx * 35}ms` }}>
                  <div className="tfp-row__main">
                    <div className="tfp-row__top">
                      <h3 className="tfp-row__title"
                        onClick={() => navigate(`/traveler/routes/${r.id}`)}>
                        {r.title}
                      </h3>
                      <span className={`tfp-card__status tfp-card__status--${status.cls}`}>
                        {status.label}
                      </span>
                      {rating != null && (
                        <span className="tfp-row__rating">⭐ {Number(rating).toFixed(1)}</span>
                      )}
                    </div>
                    <div className="tfp-row__meta">
                      <span><FiMapPin />{r.startLocation} → {r.endLocation}</span>
                      <span><FiCalendar />{fmtDate(r.startDate)} — {fmtDate(r.endDate)}</span>
                      <span><FiClock />{r.durationDays} дн.</span>
                      {tr && <span>{tr.icon} {tr.label}</span>}
                      <span className={r.totalPrice > 0 ? "price" : "free"}>
                        <FiDollarSign />
                        {r.totalPrice > 0
                          ? `${Number(r.totalPrice).toLocaleString("ru-RU")} €`
                          : "Бесплатно"}
                      </span>
                    </div>
                  </div>
                  <div className="tfp-row__actions">
                    <button className="tfp-icon-btn tfp-icon-btn--view"
                      onClick={() => navigate(`/traveler/routes/${r.id}`)} title="Открыть">
                      <FiEye />
                    </button>
                    <button className="tfp-icon-btn tfp-icon-btn--del"
                      onClick={() => setRemoveId(r.id)} title="Убрать из избранного">
                      <FiHeart />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats footer */}
        {!loading && favorites.length > 0 && (
          <div className="tfp-footer">
            <div className="tfp-fstat">
              <span>Всего</span><strong>{favorites.length}</strong>
            </div>
            <div className="tfp-fstat">
              <span>Показано</span><strong>{processed.length}</strong>
            </div>
            <div className="tfp-fstat">
              <span>Ср. цена</span>
              <strong>
                {(() => {
                  const priced = processed.filter(r => r.totalPrice > 0);
                  if (!priced.length) return "—";
                  const avg = priced.reduce((s,r) => s + r.totalPrice, 0) / priced.length;
                  return `${Math.round(avg).toLocaleString("ru-RU")} €`;
                })()}
              </strong>
            </div>
            <div className="tfp-fstat">
              <span>Ср. рейтинг</span>
              <strong>
                {(() => {
                  const rated = processed.filter(r => r.averageRating > 0);
                  if (!rated.length) return "—";
                  const avg = rated.reduce((s,r) => s + r.averageRating, 0) / rated.length;
                  return `⭐ ${avg.toFixed(1)}`;
                })()}
              </strong>
            </div>
            <div className="tfp-fstat">
              <span>Общая стоимость</span>
              <strong>{processed.reduce((s,r) => s + (r.totalPrice||0), 0).toLocaleString("ru-RU")} €</strong>
            </div>
          </div>
        )}
      </main>

      {/* Remove confirm modal */}
      {removeId && (
        <div className="tfp-modal-back" onClick={() => setRemoveId(null)}>
          <div className="tfp-modal" onClick={e => e.stopPropagation()}>
            <div className="tfp-modal__icon">💔</div>
            <h3>Убрать из избранного?</h3>
            <p>«{favorites.find(r => r.id === removeId)?.title}»</p>
            <div className="tfp-modal__actions">
              <button className="tfp-btn" onClick={() => setRemoveId(null)}>Отмена</button>
              <button className="tfp-btn tfp-btn--danger"
                disabled={removing} onClick={confirmRemove}>
                {removing ? "Удаляем..." : "Убрать"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}