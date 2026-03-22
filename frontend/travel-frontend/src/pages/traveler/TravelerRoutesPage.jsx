import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiMap, FiPlus, FiSearch, FiStar, FiUsers, FiCalendar,
  FiBell, FiUser, FiMenu, FiX, FiFilter,
  FiTrash2, FiEdit2, FiLogOut, FiHome, FiHeart,
  FiArrowUp, FiArrowDown, FiChevronDown,
} from "react-icons/fi";
import { getMyRoutes, deleteRoute } from "../../api/travelerApi";
import "../../styles/traveler/TravelerRoutesPage.css";

// ─── Sidebar nav ──────────────────────────────────────────────────
const NAV = [
  { path: "/traveler",               icon: <FiHome />,     label: "Главная" },
  { path: "/traveler/my-routes",     icon: <FiMap />,      label: "Мои маршруты" },
  { path: "/traveler/create-route",  icon: <FiPlus />,     label: "Создать маршрут" },
  { path: "/traveler/search",        icon: <FiSearch />,   label: "Найти маршруты" },
  { path: "/traveler/recommended",   icon: <FiStar />,     label: "Рекомендации" },
  { path: "/traveler/calendar",      icon: <FiCalendar />, label: "Календарь" },
  { path: "/traveler/favorites",     icon: <FiHeart />,    label: "Избранное" },
  { path: "/traveler/notifications", icon: <FiBell />,     label: "Уведомления" },
  { path: "/traveler/profile",       icon: <FiUser />,     label: "Профиль" },
];

const TRANSPORT = {
  WALK:    { label: "Пешком",    icon: "🚶" },
  BIKE:    { label: "Велосипед", icon: "🚴" },
  CAR:     { label: "Авто",      icon: "🚗" },
  TRANSIT: { label: "Транспорт", icon: "🚌" },
  PLANE:   { label: "Самолёт",   icon: "✈️" },
};

function routeStatus(startDate, endDate) {
  const now   = new Date();
  const start = new Date(startDate);
  const end   = new Date(endDate);
  if (now < start) return "upcoming";
  if (now > end)   return "past";
  return "ongoing";
}

const STATUS_META = {
  upcoming: { label: "Предстоит",  color: "#0ea5e9", bg: "#eff6ff" },
  ongoing:  { label: "В пути",     color: "#16a34a", bg: "#f0fdf4" },
  past:     { label: "Завершён",   color: "#94a3b8", bg: "#f8fafc" },
};

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

const MOCK = [
  { id:1, title:"Тур по Европе",         startLocation:"Москва",   endLocation:"Париж",     startDate:"2026-04-10", endDate:"2026-04-20", durationDays:11, transportType:"PLANE",   totalPrice:1200, budgetLimit:1500, participantsCount:3 },
  { id:2, title:"Золотое кольцо",        startLocation:"Москва",   endLocation:"Суздаль",   startDate:"2026-03-25", endDate:"2026-03-28", durationDays:4,  transportType:"CAR",     totalPrice:180,  budgetLimit:200,  participantsCount:2 },
  { id:3, title:"Байкал зимой",          startLocation:"Иркутск",  endLocation:"Листвянка", startDate:"2025-12-01", endDate:"2025-12-07", durationDays:7,  transportType:"CAR",     totalPrice:320,  budgetLimit:400,  participantsCount:1 },
  { id:4, title:"Велотур Прага–Вена",    startLocation:"Прага",    endLocation:"Вена",      startDate:"2026-05-01", endDate:"2026-05-10", durationDays:10, transportType:"BIKE",    totalPrice:90,   budgetLimit:150,  participantsCount:4 },
  { id:5, title:"Камино де Сантьяго",    startLocation:"Сен-Жан",  endLocation:"Сантьяго",  startDate:"2026-06-15", endDate:"2026-07-15", durationDays:31, transportType:"WALK",    totalPrice:0,    budgetLimit:500,  participantsCount:1 },
  { id:6, title:"Стамбул за 3 дня",      startLocation:"Москва",   endLocation:"Стамбул",   startDate:"2026-04-22", endDate:"2026-04-24", durationDays:3,  transportType:"PLANE",   totalPrice:450,  budgetLimit:600,  participantsCount:2 },
  { id:7, title:"Транссибирская",        startLocation:"Москва",   endLocation:"Владивосток",startDate:"2026-07-01", endDate:"2026-07-15", durationDays:15, transportType:"TRANSIT", totalPrice:280,  budgetLimit:350,  participantsCount:5 },
];

// ─── Columns definition ───────────────────────────────────────────
const COLS = [
  { key: "title",            label: "Маршрут",         sortable: true,  w: "22%" },
  { key: "startLocation",    label: "Откуда",          sortable: true,  w: "11%" },
  { key: "endLocation",      label: "Куда",            sortable: true,  w: "11%" },
  { key: "startDate",        label: "Дата начала",     sortable: true,  w: "11%" },
  { key: "endDate",          label: "Дата конца",      sortable: true,  w: "11%" },
  { key: "durationDays",     label: "Дней",            sortable: true,  w: "6%" },
  { key: "transportType",    label: "Транспорт",       sortable: true,  w: "10%" },
  { key: "totalPrice",       label: "Стоимость",       sortable: true,  w: "9%" },
  { key: "participantsCount",label: "Участники",       sortable: true,  w: "7%" },
  { key: "status",           label: "Статус",          sortable: false, w: "10%" },
  { key: "_actions",         label: "",                sortable: false, w: "5%" },
];

export default function TravelerRoutesPage() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [routes, setRoutes]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [sidebarOpen, setSidebar]   = useState(false);

  // Filters
  const [search, setSearch]         = useState("");
  const [fTransport, setFTransport] = useState("");
  const [fStatus, setFStatus]       = useState("");
  const [fCollab, setFCollab]       = useState(false); // только совместные
  const [fDateFrom, setFDateFrom]   = useState("");
  const [fDateTo, setFDateTo]       = useState("");
  const [filtersOpen, setFilters]   = useState(false);

  // Sort — default: startDate asc (самые ближайшие первыми)
  const [sortKey, setSortKey]       = useState("startDate");
  const [sortDir, setSortDir]       = useState("asc");

  // Row interaction
  const [selected, setSelected]     = useState(null);
  const [deleteId, setDeleteId]     = useState(null);
  const [deleting, setDeleting]     = useState(false);
  const clickTimer                  = useRef(null);

  // ─── Load ───────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getMyRoutes({ sortBy: "startDate" });
        setRoutes(Array.isArray(data) ? data : []);
      } catch {
        setRoutes(MOCK);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ─── Filter + sort ───────────────────────────────────────────────
  const processed = routes
    .filter(r => {
      const q = search.trim().toLowerCase();
      if (q) {
        const hay = [r.title, r.startLocation, r.endLocation]
          .map(v => (v || "").toLowerCase()).join(" ");
        if (!hay.includes(q)) return false;
      }
      if (fTransport && r.transportType !== fTransport) return false;
      const st = routeStatus(r.startDate, r.endDate);
      if (fStatus && st !== fStatus) return false;
      if (fDateFrom && r.startDate < fDateFrom) return false;
      if (fDateTo   && r.startDate > fDateTo)   return false;
      // Совместные = маршруты где участников > 1 (есть другие участники)
      if (fCollab && (r.participantsCount ?? 0) < 1) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortKey === "status") {
        const order = { ongoing: 0, upcoming: 1, past: 2 };
        return sortDir === "asc"
          ? order[routeStatus(a.startDate, a.endDate)] - order[routeStatus(b.startDate, b.endDate)]
          : order[routeStatus(b.startDate, b.endDate)] - order[routeStatus(a.startDate, a.endDate)];
      }
      let av = a[sortKey] ?? "";
      let bv = b[sortKey] ?? "";
      if (sortKey === "startDate" || sortKey === "endDate") {
        av = new Date(av); bv = new Date(bv);
      }
      if (typeof av === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv), "ru")
        : String(bv).localeCompare(String(av), "ru");
    });

  // ─── Sort toggle ─────────────────────────────────────────────────
  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  // ─── Row click ───────────────────────────────────────────────────
  const handleRowClick = (id) => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      navigate(`/traveler/routes/${id}`);
    } else {
      setSelected(id);
      clickTimer.current = setTimeout(() => { clickTimer.current = null; }, 280);
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteRoute(deleteId);
    } catch {}
    setRoutes(prev => prev.filter(r => r.id !== deleteId));
    setSelected(null);
    setDeleteId(null);
    setDeleting(false);
  };

  const activeFilters = [fTransport, fStatus, fDateFrom, fDateTo, fCollab || ""].filter(Boolean).length;

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="trp-root">

      {/* ══ SIDEBAR ══════════════════════════════════════════════ */}
      <aside className={`trp-sidebar ${sidebarOpen ? "trp-sidebar--open" : ""}`}>
        <div className="trp-sidebar__brand">
          <span className="trp-sidebar__brand-icon">✈️</span>
          <span className="trp-sidebar__brand-text">Travel</span>
          <button className="trp-sidebar__close" onClick={() => setSidebar(false)}>
            <FiX />
          </button>
        </div>

        <nav className="trp-sidebar__nav">
          {NAV.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={`trp-nav-item ${isActive ? "trp-nav-item--active" : ""}`}
                onClick={() => { navigate(item.path); setSidebar(false); }}
              >
                <span className="trp-nav-item__icon">{item.icon}</span>
                <span className="trp-nav-item__label">{item.label}</span>
                {isActive && <span className="trp-nav-item__bar" />}
              </button>
            );
          })}
        </nav>

        <button className="trp-sidebar__logout"
          onClick={() => { localStorage.clear(); navigate("/login"); }}>
          <FiLogOut /> Выйти
        </button>
      </aside>

      {sidebarOpen && (
        <div className="trp-overlay" onClick={() => setSidebar(false)} />
      )}

      {/* ══ MAIN ═════════════════════════════════════════════════ */}
      <main className="trp-main">

        {/* ── Topbar ─────────────────────────────────────────── */}
        <header className="trp-topbar">
          <button className="trp-burger" onClick={() => setSidebar(true)}>
            <FiMenu />
          </button>
          <div className="trp-topbar__title">
            <h1>Мои маршруты</h1>
            <span className="trp-topbar__count">{processed.length}</span>
          </div>
          <button
            className="trp-btn trp-btn--primary"
            onClick={() => navigate("/traveler/create-route")}
          >
            <FiPlus /> Создать
          </button>
        </header>

        {/* ── Toolbar ────────────────────────────────────────── */}
        <div className="trp-toolbar">
          <div className="trp-search-wrap">
            <FiSearch className="trp-search-wrap__icon" />
            <input
              className="trp-search"
              placeholder="Поиск по названию, откуда, куда..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="trp-search-wrap__clear" onClick={() => setSearch("")}>
                <FiX />
              </button>
            )}
          </div>

          <button
            className={`trp-btn trp-btn--filter ${filtersOpen ? "active" : ""}`}
            onClick={() => setFilters(v => !v)}
          >
            <FiFilter />
            Фильтры
            {activeFilters > 0 && (
              <span className="trp-btn__badge">{activeFilters}</span>
            )}
            <FiChevronDown className={`trp-btn__chevron ${filtersOpen ? "rotated" : ""}`} />
          </button>
        </div>

        {/* ── Filter panel ───────────────────────────────────── */}
        {filtersOpen && (
          <div className="trp-filters">
            <div className="trp-filters__group">
              <label>Транспорт</label>
              <div className="trp-transport-btns">
                <button
                  className={`trp-tbtn ${fTransport === "" ? "active" : ""}`}
                  onClick={() => setFTransport("")}
                >Все</button>
                {Object.entries(TRANSPORT).map(([k, v]) => (
                  <button
                    key={k}
                    className={`trp-tbtn ${fTransport === k ? "active" : ""}`}
                    onClick={() => setFTransport(fTransport === k ? "" : k)}
                  >
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="trp-filters__group">
              <label>Статус</label>
              <div className="trp-transport-btns">
                {[["", "Все"], ["upcoming","Предстоящие"], ["ongoing","В пути"], ["past","Завершённые"]].map(([k, l]) => (
                  <button
                    key={k}
                    className={`trp-tbtn ${fStatus === k ? "active" : ""}`}
                    onClick={() => setFStatus(fStatus === k ? "" : k)}
                  >{l}</button>
                ))}
              </div>
            </div>

            <div className="trp-filters__group">
              <label>Участие</label>
              <div className="trp-transport-btns">
                <button className={`trp-tbtn ${!fCollab ? "active" : ""}`}
                  onClick={() => setFCollab(false)}>Все маршруты</button>
                <button className={`trp-tbtn ${fCollab ? "active" : ""}`}
                  onClick={() => setFCollab(!fCollab)}>
                  👥 Совместные
                </button>
              </div>
            </div>

            <div className="trp-filters__group trp-filters__group--dates">
              <div>
                <label>Дата начала — от</label>
                <input type="date" value={fDateFrom} onChange={e => setFDateFrom(e.target.value)} />
              </div>
              <div>
                <label>Дата начала — до</label>
                <input type="date" value={fDateTo} onChange={e => setFDateTo(e.target.value)} />
              </div>
            </div>

            {activeFilters > 0 && (
              <button className="trp-filters__reset" onClick={() => {
                setFTransport(""); setFStatus(""); setFDateFrom(""); setFDateTo(""); setFCollab(false);
              }}>
                <FiX /> Сбросить фильтры
              </button>
            )}
          </div>
        )}

        {/* ── Hint ───────────────────────────────────────────── */}
        <p className="trp-hint">
          Двойной клик по строке — открыть детали маршрута
        </p>

        {/* ── Table ──────────────────────────────────────────── */}
        <div className="trp-table-wrap">
          {loading ? (
            <div className="trp-state">
              <div className="trp-spinner" />
              <p>Загружаем маршруты...</p>
            </div>
          ) : processed.length === 0 ? (
            <div className="trp-state">
              <div className="trp-state__emoji">🗺️</div>
              <p className="trp-state__title">Маршруты не найдены</p>
              <p className="trp-state__sub">
                {routes.length === 0
                  ? "У вас ещё нет маршрутов. Создайте первый!"
                  : "Попробуйте изменить параметры поиска"}
              </p>
              {routes.length === 0 && (
                <button className="trp-btn trp-btn--primary"
                  onClick={() => navigate("/traveler/create-route")}>
                  <FiPlus /> Создать маршрут
                </button>
              )}
            </div>
          ) : (
            <table className="trp-table">
              <thead>
                <tr>
                  {COLS.map(col => (
                    <th
                      key={col.key}
                      style={{ width: col.w }}
                      className={col.sortable ? "sortable" : ""}
                      onClick={() => col.sortable && toggleSort(col.key)}
                    >
                      {col.label}
                      {col.sortable && (
                        <span className="th-sort">
                          {sortKey === col.key
                            ? (sortDir === "asc" ? <FiArrowUp /> : <FiArrowDown />)
                            : <span className="th-sort--idle">↕</span>}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processed.map((r, idx) => {
                  const st  = routeStatus(r.startDate, r.endDate);
                  const stm = STATUS_META[st];
                  const tr  = TRANSPORT[r.transportType];
                  const isSelected = selected === r.id;
                  return (
                    <tr
                      key={r.id}
                      className={`trp-row ${isSelected ? "trp-row--selected" : ""} ${st === "past" ? "trp-row--muted" : ""}`}
                      onClick={() => handleRowClick(r.id)}
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      {/* Маршрут */}
                      <td>
                        <div className="trp-cell-title">
                          <span className="trp-cell-title__text">{r.title}</span>
                          {r.participantsCount > 1 && (
                            <span className="trp-cell-title__collab" title="Совместный маршрут">
                              <FiUsers />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Откуда */}
                      <td>
                        <span className="trp-loc trp-loc--from">{r.startLocation}</span>
                      </td>

                      {/* Куда */}
                      <td>
                        <span className="trp-loc trp-loc--to">{r.endLocation}</span>
                      </td>

                      {/* Дата начала */}
                      <td>
                        <span className="trp-date">{fmt(r.startDate)}</span>
                      </td>

                      {/* Дата конца */}
                      <td>
                        <span className="trp-date">{fmt(r.endDate)}</span>
                      </td>

                      {/* Дней */}
                      <td>
                        <span className="trp-days">{r.durationDays ?? "—"}</span>
                      </td>

                      {/* Транспорт */}
                      <td>
                        {tr ? (
                          <span className="trp-transport">
                            <span className="trp-transport__icon">{tr.icon}</span>
                            <span className="trp-transport__label">{tr.label}</span>
                          </span>
                        ) : "—"}
                      </td>

                      {/* Стоимость */}
                      <td>
                        <span className={`trp-price ${r.totalPrice > 0 ? "" : "trp-price--free"}`}>
                          {r.totalPrice > 0 ? `${Number(r.totalPrice).toLocaleString("ru-RU")} €` : "Бесплатно"}
                        </span>
                      </td>

                      {/* Участники */}
                      <td>
                        <span className="trp-participants">
                          <FiUsers />
                          {r.participantsCount ?? 1}
                        </span>
                      </td>

                      {/* Статус */}
                      <td>
                        <span
                          className="trp-status"
                          style={{ color: stm.color, background: stm.bg }}
                        >
                          {stm.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td onClick={e => e.stopPropagation()}>
                        <div className="trp-actions">
                          <button
                            className="trp-actions__btn trp-actions__btn--edit"
                            title="Редактировать"
                            onClick={() => navigate(`/traveler/routes/${r.id}/edit`)}
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            className="trp-actions__btn trp-actions__btn--del"
                            title="Удалить"
                            onClick={() => setDeleteId(r.id)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Footer stats ───────────────────────────────────── */}
        {!loading && routes.length > 0 && (
          <div className="trp-footer-stats">
            <div className="trp-fstat">
              <span>Всего маршрутов</span>
              <strong>{routes.length}</strong>
            </div>
            <div className="trp-fstat">
              <span>Предстоящих</span>
              <strong style={{ color: "#0ea5e9" }}>
                {routes.filter(r => routeStatus(r.startDate, r.endDate) === "upcoming").length}
              </strong>
            </div>
            <div className="trp-fstat">
              <span>В пути</span>
              <strong style={{ color: "#16a34a" }}>
                {routes.filter(r => routeStatus(r.startDate, r.endDate) === "ongoing").length}
              </strong>
            </div>
            <div className="trp-fstat">
              <span>Завершённых</span>
              <strong style={{ color: "#94a3b8" }}>
                {routes.filter(r => routeStatus(r.startDate, r.endDate) === "past").length}
              </strong>
            </div>
            <div className="trp-fstat">
              <span>Общая стоимость</span>
              <strong>
                {routes.reduce((s, r) => s + (r.totalPrice || 0), 0).toLocaleString("ru-RU")} €
              </strong>
            </div>
          </div>
        )}
      </main>

      {/* ══ DELETE CONFIRM MODAL ══════════════════════════════════ */}
      {deleteId && (
        <div className="trp-modal-backdrop" onClick={() => setDeleteId(null)}>
          <div className="trp-modal" onClick={e => e.stopPropagation()}>
            <div className="trp-modal__icon">🗑️</div>
            <h3>Удалить маршрут?</h3>
            <p>
              «{routes.find(r => r.id === deleteId)?.title}»<br />
              Это действие нельзя отменить.
            </p>
            <div className="trp-modal__actions">
              <button className="trp-btn" onClick={() => setDeleteId(null)}>Отмена</button>
              <button
                className="trp-btn trp-btn--danger"
                disabled={deleting}
                onClick={confirmDelete}
              >
                {deleting ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}