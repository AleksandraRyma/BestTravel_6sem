import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FiX, FiEdit2, FiMapPin, FiCalendar, FiClock, FiTruck,
  FiDollarSign, FiUsers, FiStar, FiChevronRight,
  FiArrowLeft, FiTrash2, FiHeart, FiShare2, FiPrinter,
  FiCheck, FiLoader, FiAlertCircle,
} from "react-icons/fi";
import { getRouteById, deleteRoute, calculateOsrmRoute } from "../../api/travelerApi";
import "../../styles/traveler/TravelerRouteDetailPage.css";

// ─── Fix Leaflet icons ────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const numberedIcon = (num, color = "#0ea5e9") =>
  L.divIcon({
    html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;
      border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      color:white;font-weight:800;font-size:13px;font-family:system-ui">${num}</div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

const TRANSPORT = {
  WALK:    { label: "Пешком",    icon: "🚶", osrm: "foot",    color: "#16a34a" },
  BIKE:    { label: "Велосипед", icon: "🚴", osrm: "cycling", color: "#ca8a04" },
  CAR:     { label: "Авто",      icon: "🚗", osrm: "driving", color: "#2563eb" },
  TRANSIT: { label: "Транспорт", icon: "🚌", osrm: "driving", color: "#9333ea" },
  PLANE:   { label: "Самолёт",   icon: "✈️", osrm: "driving", color: "#ea580c" },
};

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}
function fmtShort(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}

function routeStatus(start, end) {
  const now = new Date(), s = new Date(start), e = new Date(end);
  if (now < s) return { label: "Предстоит", cls: "upcoming" };
  if (now > e) return { label: "Завершён",  cls: "past" };
  return           { label: "В пути",    cls: "ongoing" };
}

const MOCK = {
  id: 35,
  title: "Тур по Европе",
  description: "Незабываемое путешествие по главным столицам Европы — от Берлина до Лиссабона. Посещение музеев, архитектурных шедевров и дегустация местной кухни.",
  startLocation: "Берлин",
  endLocation: "Лиссабон",
  startDate: "2026-04-10",
  endDate: "2026-04-20",
  durationDays: 11,
  transportType: "CAR",
  budgetLimit: 1500,
  totalPrice: 1200,
  imageUrl: null,
  creator: { id: 1, fullName: "Алексей Иванов", email: "alex@example.com" },
  points: [
    { id:1, name:"Берлинская стена",    latitude:52.5351, longitude:13.3901, category:"История",    visitOrder:1, averageRating:4.8 },
    { id:2, name:"Прага — Карлов мост", latitude:50.0865, longitude:14.4114, category:"Архитектура",visitOrder:2, averageRating:4.9 },
    { id:3, name:"Вена — Бельведер",    latitude:48.1914, longitude:16.3808, category:"Музеи",      visitOrder:3, averageRating:4.7 },
    { id:4, name:"Зальцбург",           latitude:47.7994, longitude:13.0440, category:"Природа",    visitOrder:4, averageRating:4.6 },
    { id:5, name:"Лиссабон — Белен",    latitude:38.6972, longitude:-9.2064, category:"История",    visitOrder:5, averageRating:4.9 },
  ],
  participants: [
    { userId:2, fullName:"Мария Петрова", email:"maria@example.com", status:"ACCEPTED", joinedAt:"2026-01-15" },
    { userId:3, fullName:"Дмитрий Сидоров", email:"dima@example.com", status:"PENDING",  joinedAt:"2026-01-20" },
  ],
};

export default function TravelerRouteDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [route,    setRoute]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [geometry, setGeometry] = useState(null);
  const [activeTab, setTab]     = useState("info"); // info | points | participants
  const [deleting, setDeleting] = useState(false);
  const [showDel,  setShowDel]  = useState(false);
  const [favorite, setFavorite] = useState(false);
  const mapRef = useRef(null);

  // ─── Load route ────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getRouteById(id);
        setRoute(data);
      } catch {
        setRoute(MOCK);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ─── Load OSRM route geometry ──────────────────────────────────
  useEffect(() => {
    if (!route?.points || route.points.length < 2) return;
    const sorted = [...route.points].sort((a, b) => a.visitOrder - b.visitOrder);
    const waypoints = sorted.map(p => ({ lat: p.latitude, lon: p.longitude }));
    const profile = TRANSPORT[route.transportType]?.osrm || "driving";

    calculateOsrmRoute(waypoints, profile)
      .then(data => {
        if (data?.routes?.[0]) {
          const coords = data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]);
          setGeometry(coords);
        }
      })
      .catch(() => {});
  }, [route]);

  // ─── Fit map bounds ────────────────────────────────────────────
  useEffect(() => {
    if (!route?.points?.length || !mapRef.current) return;
    const map = mapRef.current;
    const sorted = [...route.points].sort((a, b) => a.visitOrder - b.visitOrder);
    const bounds = sorted.map(p => [p.latitude, p.longitude]);
    if (bounds.length >= 2) {
      setTimeout(() => map.fitBounds(bounds, { padding: [40, 40] }), 300);
    }
  }, [route, mapRef.current]);

  // ─── Delete ────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteRoute(id);
      navigate("/traveler/my-routes");
    } catch {
      setDeleting(false);
      setShowDel(false);
    }
  };

  // ─── Print ─────────────────────────────────────────────────────
  const handlePrint = () => window.print();

  if (loading) return (
    <div className="rdp-overlay">
      <div className="rdp-modal rdp-modal--loading">
        <div className="rdp-spinner" />
        <p>Загружаем маршрут...</p>
      </div>
    </div>
  );

  if (!route) return null;

  const tr     = TRANSPORT[route.transportType] || { label: route.transportType, icon: "📍", color: "#64748b" };
  const status = routeStatus(route.startDate, route.endDate);
  const sorted = [...(route.points || [])].sort((a, b) => a.visitOrder - b.visitOrder);
  const mapCenter = sorted.length
    ? [sorted[0].latitude, sorted[0].longitude]
    : [55.75, 37.61];

  const budgetPct = route.budgetLimit
    ? Math.min(100, Math.round((route.totalPrice / route.budgetLimit) * 100))
    : null;

  return (
    <>
      {/* ═══ BACKDROP ═══════════════════════════════════════════ */}
      <div className="rdp-overlay" onClick={() => navigate(-1)} />

      {/* ═══ MODAL ══════════════════════════════════════════════ */}
      <div className="rdp-modal" onClick={e => e.stopPropagation()}>

        {/* ── Top action bar ─────────────────────────────────── */}
        <div className="rdp-topbar">
          <button className="rdp-topbar__back" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Назад
          </button>

          <div className="rdp-topbar__actions">
            <button
              className={`rdp-icon-btn ${favorite ? "rdp-icon-btn--active" : ""}`}
              title="В избранное"
              onClick={() => setFavorite(v => !v)}
            >
              <FiHeart />
            </button>
            <button className="rdp-icon-btn" title="Поделиться" onClick={() =>
              navigator.clipboard.writeText(window.location.href)}>
              <FiShare2 />
            </button>
            <button className="rdp-icon-btn" title="Печать" onClick={handlePrint}>
              <FiPrinter />
            </button>
            <button
              className="rdp-icon-btn rdp-icon-btn--danger"
              title="Удалить"
              onClick={() => setShowDel(true)}
            >
              <FiTrash2 />
            </button>
            <button
              className="rdp-btn rdp-btn--primary"
              onClick={() => navigate(`/traveler/routes/${id}/edit`)}
            >
              <FiEdit2 /> Редактировать
            </button>
            <button className="rdp-icon-btn rdp-icon-btn--close" onClick={() => navigate(-1)}>
              <FiX />
            </button>
          </div>
        </div>

        {/* ── Main content: two columns ──────────────────────── */}
        <div className="rdp-body">

          {/* ── LEFT: Info panel ─────────────────────────────── */}
          <div className="rdp-panel">

            {/* Hero header */}
            <div className="rdp-hero">
              <div className="rdp-hero__transport" style={{ background: tr.color + "18", color: tr.color }}>
                {tr.icon} {tr.label}
              </div>
              <h1 className="rdp-hero__title">{route.title}</h1>
              <div className="rdp-hero__route">
                <span className="rdp-hero__city rdp-hero__city--from">
                  <FiMapPin /> {route.startLocation}
                </span>
                <span className="rdp-hero__arrow">
                  {"─".repeat(6)} ✈ {"─".repeat(6)}
                </span>
                <span className="rdp-hero__city rdp-hero__city--to">
                  <FiMapPin /> {route.endLocation}
                </span>
              </div>
              <div className="rdp-hero__meta">
                <span className={`rdp-status rdp-status--${status.cls}`}>{status.label}</span>
                <span className="rdp-hero__creator">Создал: {route.creator?.fullName}</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="rdp-tabs">
              {[
                { id: "info",         label: "Информация" },
                { id: "points",       label: `Точки (${sorted.length})` },
                { id: "participants", label: `Участники (${(route.participants || []).length})` },
              ].map(t => (
                <button
                  key={t.id}
                  className={`rdp-tab ${activeTab === t.id ? "active" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ─ Tab: Info ─ */}
            {activeTab === "info" && (
              <div className="rdp-tab-content">

                {/* Key stats grid */}
                <div className="rdp-stats">
                  <div className="rdp-stat">
                    <FiCalendar className="rdp-stat__icon" style={{ color: "#0ea5e9" }} />
                    <div>
                      <span className="rdp-stat__label">Начало</span>
                      <strong className="rdp-stat__val">{fmt(route.startDate)}</strong>
                    </div>
                  </div>
                  <div className="rdp-stat">
                    <FiCalendar className="rdp-stat__icon" style={{ color: "#ef4444" }} />
                    <div>
                      <span className="rdp-stat__label">Конец</span>
                      <strong className="rdp-stat__val">{fmt(route.endDate)}</strong>
                    </div>
                  </div>
                  <div className="rdp-stat">
                    <FiClock className="rdp-stat__icon" style={{ color: "#8b5cf6" }} />
                    <div>
                      <span className="rdp-stat__label">Длительность</span>
                      <strong className="rdp-stat__val">
                        {route.durationDays} {route.durationDays === 1 ? "день" : route.durationDays < 5 ? "дня" : "дней"}
                      </strong>
                    </div>
                  </div>
                  <div className="rdp-stat">
                    <FiTruck className="rdp-stat__icon" style={{ color: tr.color }} />
                    <div>
                      <span className="rdp-stat__label">Транспорт</span>
                      <strong className="rdp-stat__val">{tr.icon} {tr.label}</strong>
                    </div>
                  </div>
                  <div className="rdp-stat">
                    <FiUsers className="rdp-stat__icon" style={{ color: "#16a34a" }} />
                    <div>
                      <span className="rdp-stat__label">Участники</span>
                      <strong className="rdp-stat__val">
                        {(route.participants || []).length} чел.
                      </strong>
                    </div>
                  </div>
                  <div className="rdp-stat">
                    <FiMapPin className="rdp-stat__icon" style={{ color: "#f59e0b" }} />
                    <div>
                      <span className="rdp-stat__label">Точек</span>
                      <strong className="rdp-stat__val">{sorted.length}</strong>
                    </div>
                  </div>
                </div>

                {/* Budget card */}
                {(route.totalPrice != null || route.budgetLimit != null) && (
                  <div className="rdp-budget">
                    <div className="rdp-budget__header">
                      <FiDollarSign />
                      <span>Бюджет</span>
                    </div>
                    <div className="rdp-budget__row">
                      <div className="rdp-budget__item">
                        <span>Стоимость</span>
                        <strong style={{ color: budgetPct > 90 ? "#ef4444" : "#16a34a" }}>
                          {route.totalPrice > 0
                            ? `${Number(route.totalPrice).toLocaleString("ru-RU")} €`
                            : "Бесплатно"}
                        </strong>
                      </div>
                      {route.budgetLimit && (
                        <div className="rdp-budget__item">
                          <span>Лимит</span>
                          <strong>{Number(route.budgetLimit).toLocaleString("ru-RU")} €</strong>
                        </div>
                      )}
                    </div>
                    {budgetPct != null && (
                      <>
                        <div className="rdp-budget__bar-wrap">
                          <div
                            className="rdp-budget__bar"
                            style={{
                              width: `${budgetPct}%`,
                              background: budgetPct > 90 ? "#ef4444" : budgetPct > 70 ? "#f59e0b" : "#16a34a",
                            }}
                          />
                        </div>
                        <span className="rdp-budget__pct">{budgetPct}% от лимита</span>
                      </>
                    )}
                  </div>
                )}

                {/* Description */}
                {route.description && (
                  <div className="rdp-desc">
                    <h4>Описание</h4>
                    <p>{route.description}</p>
                  </div>
                )}

                {/* Quick point preview */}
                {sorted.length > 0 && (
                  <div className="rdp-route-preview">
                    <h4>Маршрут</h4>
                    <div className="rdp-route-line">
                      {sorted.map((pt, i) => (
                        <div key={pt.id} className="rdp-route-line__step">
                          <div className="rdp-route-line__dot"
                            style={{ background: i === 0 ? "#16a34a" : i === sorted.length - 1 ? "#ef4444" : "#0ea5e9" }}>
                            {i + 1}
                          </div>
                          <span className="rdp-route-line__name">{pt.name}</span>
                          {i < sorted.length - 1 && (
                            <FiChevronRight className="rdp-route-line__arrow" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─ Tab: Points ─ */}
            {activeTab === "points" && (
              <div className="rdp-tab-content">
                {sorted.length === 0 ? (
                  <div className="rdp-empty">Точки маршрута не добавлены</div>
                ) : (
                  <div className="rdp-points-list">
                    {sorted.map((pt, i) => (
                      <div key={pt.id} className="rdp-point-card">
                        <div className="rdp-point-card__num"
                          style={{ background: i === 0 ? "#16a34a" : i === sorted.length - 1 ? "#ef4444" : "#0ea5e9" }}>
                          {i + 1}
                        </div>
                        <div className="rdp-point-card__body">
                          <div className="rdp-point-card__name">{pt.name}</div>
                          {pt.category && (
                            <div className="rdp-point-card__cat">📌 {pt.category}</div>
                          )}
                          {pt.plannedTime && (
                            <div className="rdp-point-card__time">
                              <FiClock /> {new Date(pt.plannedTime).toLocaleString("ru-RU", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })}
                            </div>
                          )}
                          {pt.description && (
                            <div className="rdp-point-card__desc">{pt.description}</div>
                          )}
                        </div>
                        {pt.averageRating > 0 && (
                          <div className="rdp-point-card__rating">
                            <FiStar /> {pt.averageRating.toFixed(1)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─ Tab: Participants ─ */}
            {activeTab === "participants" && (
              <div className="rdp-tab-content">
                {/* Creator */}
                {route.creator && (
                  <div className="rdp-participant rdp-participant--creator">
                    <div className="rdp-participant__avatar">
                      {route.creator.fullName.charAt(0)}
                    </div>
                    <div className="rdp-participant__info">
                      <span className="rdp-participant__name">{route.creator.fullName}</span>
                      <span className="rdp-participant__email">{route.creator.email}</span>
                    </div>
                    <span className="rdp-badge rdp-badge--owner">Организатор</span>
                  </div>
                )}

                {(route.participants || []).length === 0 ? (
                  <div className="rdp-empty" style={{ marginTop: 12 }}>
                    Участники не приглашены
                  </div>
                ) : (
                  <div className="rdp-participants-list">
                    {route.participants.map(p => (
                      <div key={p.userId} className="rdp-participant">
                        <div className="rdp-participant__avatar">
                          {p.fullName.charAt(0)}
                        </div>
                        <div className="rdp-participant__info">
                          <span className="rdp-participant__name">{p.fullName}</span>
                          <span className="rdp-participant__email">{p.email}</span>
                        </div>
                        <span className={`rdp-badge rdp-badge--${p.status.toLowerCase()}`}>
                          {p.status === "ACCEPTED" ? "Принят" :
                           p.status === "PENDING"  ? "Ожидание" : "Отклонил"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT: Map ───────────────────────────────────── */}
          <div className="rdp-map-wrap">
            <MapContainer
              center={mapCenter}
              zoom={5}
              style={{ height: "100%", width: "100%" }}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Route polyline */}
              {geometry && (
                <Polyline
                  positions={geometry}
                  pathOptions={{ color: tr.color, weight: 4, opacity: 0.8 }}
                />
              )}

              {/* Markers */}
              {sorted.map((pt, i) => (
                <Marker
                  key={pt.id}
                  position={[pt.latitude, pt.longitude]}
                  icon={numberedIcon(
                    i + 1,
                    i === 0 ? "#16a34a" : i === sorted.length - 1 ? "#ef4444" : "#0ea5e9"
                  )}
                >
                  <Popup>
                    <div style={{ fontFamily: "system-ui", minWidth: 160 }}>
                      <strong style={{ fontSize: 14, display: "block", marginBottom: 4 }}>
                        {pt.name}
                      </strong>
                      {pt.category && (
                        <span style={{ fontSize: 12, color: "#64748b" }}>📌 {pt.category}</span>
                      )}
                      {pt.averageRating > 0 && (
                        <div style={{ fontSize: 12, color: "#f59e0b", marginTop: 4 }}>
                          ⭐ {pt.averageRating.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Map overlay stats */}
            <div className="rdp-map-overlay">
              <div className="rdp-map-overlay__item">
                <span>{tr.icon}</span>
                <span>{tr.label}</span>
              </div>
              <div className="rdp-map-overlay__sep" />
              <div className="rdp-map-overlay__item">
                <FiMapPin />
                <span>{sorted.length} точек</span>
              </div>
              <div className="rdp-map-overlay__sep" />
              <div className="rdp-map-overlay__item">
                <FiCalendar />
                <span>{fmtShort(route.startDate)} — {fmtShort(route.endDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ DELETE CONFIRM ══════════════════════════════════════ */}
      {showDel && (
        <div className="rdp-del-backdrop" onClick={() => setShowDel(false)}>
          <div className="rdp-del-modal" onClick={e => e.stopPropagation()}>
            <FiAlertCircle className="rdp-del-modal__icon" />
            <h3>Удалить маршрут?</h3>
            <p>«{route.title}» будет удалён безвозвратно.</p>
            <div className="rdp-del-modal__actions">
              <button className="rdp-btn" onClick={() => setShowDel(false)}>Отмена</button>
              <button
                className="rdp-btn rdp-btn--danger"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? <><FiLoader className="spin" /> Удаление...</> : <><FiTrash2 /> Удалить</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}