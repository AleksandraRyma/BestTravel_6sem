import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FiHome, FiMap, FiPlus, FiSearch, FiStar, FiCalendar,
  FiHeart, FiBell, FiUser, FiLogOut, FiMenu, FiX,
  FiMessageSquare, FiArrowUp, FiArrowDown, FiCheckCircle,
} from "react-icons/fi";
import { getReviewableRoutes, saveRouteReviews } from "../../api/travelerApi";
import "../../styles/traveler/TravelerReviewPage.css";

const NAV = [
  { path: "/traveler",               icon: <FiHome />,          label: "Главная" },
  { path: "/traveler/my-routes",     icon: <FiMap />,           label: "Мои маршруты" },
  { path: "/traveler/create-route",  icon: <FiPlus />,          label: "Создать маршрут" },
  { path: "/traveler/search",        icon: <FiSearch />,        label: "Найти маршруты" },
  { path: "/traveler/recommended",   icon: <FiStar />,          label: "Рекомендации" },
  { path: "/traveler/calendar",      icon: <FiCalendar />,      label: "Календарь" },
  { path: "/traveler/favorites",     icon: <FiHeart />,         label: "Избранное" },
  { path: "/traveler/reviews",       icon: <FiMessageSquare />, label: "Оставить отзыв" },
  { path: "/traveler/notifications", icon: <FiBell />,          label: "Уведомления" },
  { path: "/traveler/profile",       icon: <FiUser />,          label: "Профиль" },
];

const TRANSPORT = {
  WALK: "Пешком",
  BIKE: "Велосипед",
  CAR: "Авто",
  TRANSIT: "Транспорт",
  PLANE: "Самолёт",
};

const STATUS_META = {
  PENDING: { label: "Нет отзыва", className: "pending" },
  PARTIAL: { label: "Частично", className: "partial" },
  DONE: { label: "Готово", className: "done" },
};

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  const value = Array.isArray(dateStr)
    ? new Date(dateStr[0], dateStr[1] - 1, dateStr[2])
    : new Date(dateStr);
  return value.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

function StarInput({ value, onChange }) {
  return (
    <div className="rrp-stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`rrp-star ${star <= value ? "active" : ""}`}
          onClick={() => onChange(star)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function TravelerReviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { routeId } = useParams();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(false);
  const [sortKey, setSortKey] = useState("endDate");
  const [sortDir, setSortDir] = useState("desc");
  const clickTimer = useRef(null);

  useEffect(() => {
    loadRoutes();
  }, []);

  useEffect(() => {
    if (!routeId || routes.length === 0) return;
    const target = routes.find((route) => String(route.routeId) === String(routeId));
    if (target) {
      openRouteModal(target);
    }
  }, [routeId, routes]);

  const loadRoutes = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getReviewableRoutes();
      setRoutes(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Не удалось загрузить маршруты для отзывов");
    } finally {
      setLoading(false);
    }
  };

  const processedRoutes = useMemo(() => {
    const copy = [...routes];
    copy.sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];

      if (sortKey === "endDate") {
        av = new Date(av);
        bv = new Date(bv);
        return sortDir === "asc" ? av - bv : bv - av;
      }

      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }

      return sortDir === "asc"
        ? String(av ?? "").localeCompare(String(bv ?? ""), "ru")
        : String(bv ?? "").localeCompare(String(av ?? ""), "ru");
    });
    return copy;
  }, [routes, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "endDate" ? "desc" : "asc");
  };

  const handleRowClick = (route) => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      openRouteModal(route);
    } else {
      setSelectedRouteId(route.routeId);
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null;
      }, 260);
    }
  };

  const openRouteModal = (route) => {
    setActiveRoute(route);
    setSelectedRouteId(route.routeId);
    setDrafts(
      Object.fromEntries(
        (route.points || []).map((point) => [
          point.pointOfInterestId,
          {
            rating: point.myRating ?? 0,
            comment: point.myComment ?? "",
          },
        ])
      )
    );
  };

  const closeModal = () => {
    setActiveRoute(null);
    if (routeId) {
      navigate("/traveler/reviews", { replace: true });
    }
  };

  const updateDraft = (pointId, patch) => {
    setDrafts((prev) => ({
      ...prev,
      [pointId]: {
        rating: prev[pointId]?.rating ?? 0,
        comment: prev[pointId]?.comment ?? "",
        ...patch,
      },
    }));
  };

  const handleSave = async () => {
    if (!activeRoute) return;

    const reviews = Object.entries(drafts)
      .filter(([, value]) => Number(value.rating) > 0)
      .map(([pointOfInterestId, value]) => ({
        pointOfInterestId: Number(pointOfInterestId),
        rating: Number(value.rating),
        comment: value.comment?.trim() || null,
      }));

    if (reviews.length === 0) {
      setError("Поставьте хотя бы одну оценку перед сохранением");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const updatedRoute = await saveRouteReviews(activeRoute.routeId, { reviews });
      setRoutes((prev) =>
        prev.map((route) => (route.routeId === updatedRoute.routeId ? updatedRoute : route))
      );
      setActiveRoute(updatedRoute);
      setDrafts(
        Object.fromEntries(
          (updatedRoute.points || []).map((point) => [
            point.pointOfInterestId,
            {
              rating: point.myRating ?? 0,
              comment: point.myComment ?? "",
            },
          ])
        )
      );
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Не удалось сохранить отзыв");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rrp-root">
      <aside className={`rrp-sidebar ${sidebarOpen ? "rrp-sidebar--open" : ""}`}>
        <div className="rrp-sidebar__brand">
          <span className="rrp-sidebar__brand-icon">✈</span>
          <span className="rrp-sidebar__brand-text">Travel</span>
          <button className="rrp-sidebar__close" onClick={() => setSidebarOpen(false)}>
            <FiX />
          </button>
        </div>

        <nav className="rrp-sidebar__nav">
          {NAV.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={`rrp-nav-item ${isActive ? "rrp-nav-item--active" : ""}`}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
              >
                <span className="rrp-nav-item__icon">{item.icon}</span>
                <span className="rrp-nav-item__label">{item.label}</span>
                {isActive && <span className="rrp-nav-item__bar" />}
              </button>
            );
          })}
        </nav>

        <button
          className="rrp-sidebar__logout"
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
        >
          <FiLogOut /> Выйти
        </button>
      </aside>

      {sidebarOpen && <div className="rrp-overlay" onClick={() => setSidebarOpen(false)} />}

      <main className="rrp-main">
        <header className="rrp-topbar">
          <button className="rrp-burger" onClick={() => setSidebarOpen(true)}>
            <FiMenu />
          </button>
          <div className="rrp-topbar__title">
            <h1>Оставить отзыв</h1>
            <span className="rrp-topbar__count">{processedRoutes.length}</span>
          </div>
          <button
            className="rrp-btn rrp-btn--primary"
            disabled={!activeRoute}
            onClick={() => activeRoute && handleSave()}
          >
            <FiCheckCircle /> Сохранить
          </button>
        </header>

        <p className="rrp-hint">
          Двойной клик по строке открывает модальное окно с точками маршрута и формой отзыва.
        </p>

        {error && <div className="rrp-error">{error}</div>}

        <div className="rrp-table-wrap">
          {loading ? (
            <div className="rrp-state">
              <div className="rrp-spinner" />
              <p>Загружаем завершённые маршруты...</p>
            </div>
          ) : processedRoutes.length === 0 ? (
            <div className="rrp-state">
              <div className="rrp-state__emoji">📝</div>
              <p className="rrp-state__title">Пока нет маршрутов для отзыва</p>
              <p className="rrp-state__sub">Отзывы появятся здесь после завершения ваших поездок.</p>
            </div>
          ) : (
            <table className="rrp-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort("title")} className="sortable">
                    Маршрут {sortKey === "title" && (sortDir === "asc" ? <FiArrowUp /> : <FiArrowDown />)}
                  </th>
                  <th>Откуда</th>
                  <th>Куда</th>
                  <th onClick={() => toggleSort("endDate")} className="sortable">
                    Завершён {sortKey === "endDate" && (sortDir === "asc" ? <FiArrowUp /> : <FiArrowDown />)}
                  </th>
                  <th>Транспорт</th>
                  <th onClick={() => toggleSort("pointsCount")} className="sortable">
                    Точек {sortKey === "pointsCount" && (sortDir === "asc" ? <FiArrowUp /> : <FiArrowDown />)}
                  </th>
                  <th>Отзывов</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {processedRoutes.map((route) => {
                  const meta = STATUS_META[route.reviewStatus] || STATUS_META.PENDING;
                  return (
                    <tr
                      key={route.routeId}
                      className={selectedRouteId === route.routeId ? "selected" : ""}
                      onClick={() => handleRowClick(route)}
                    >
                      <td className="rrp-title">{route.title}</td>
                      <td>{route.startLocation}</td>
                      <td>{route.endLocation}</td>
                      <td>{fmtDate(route.endDate)}</td>
                      <td>{TRANSPORT[route.transportType] || route.transportType || "—"}</td>
                      <td>{route.pointsCount ?? 0}</td>
                      <td>{route.reviewedPointsCount ?? 0}/{route.pointsCount ?? 0}</td>
                      <td>
                        <span className={`rrp-status ${meta.className}`}>{meta.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {activeRoute && (
        <div className="rrp-modal-backdrop" onClick={closeModal}>
          <div className="rrp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rrp-modal__topbar">
              <div>
                <h2>{activeRoute.title}</h2>
                <p>
                  {activeRoute.startLocation} → {activeRoute.endLocation} • {fmtDate(activeRoute.startDate)} - {fmtDate(activeRoute.endDate)}
                </p>
              </div>
              <button className="rrp-icon-btn" onClick={closeModal}>
                <FiX />
              </button>
            </div>

            <div className="rrp-modal__body">
              {(activeRoute.points || []).map((point) => {
                const draft = drafts[point.pointOfInterestId] || { rating: 0, comment: "" };
                return (
                  <div key={point.pointOfInterestId} className="rrp-point-card">
                    <div className="rrp-point-card__head">
                      <div>
                        <span className="rrp-point-card__order">Точка {point.visitOrder}</span>
                        <h3>{point.name}</h3>
                        <p>{point.category || "Без категории"}</p>
                      </div>
                      <div className="rrp-point-card__rating">
                        <span>Средний рейтинг</span>
                        <strong>{point.averageRating ? point.averageRating.toFixed(1) : "0.0"}</strong>
                      </div>
                    </div>

                    <StarInput
                      value={draft.rating}
                      onChange={(rating) => updateDraft(point.pointOfInterestId, { rating })}
                    />

                    <textarea
                      value={draft.comment}
                      onChange={(e) => updateDraft(point.pointOfInterestId, { comment: e.target.value })}
                      placeholder="Поделитесь впечатлениями об этой точке"
                    />

                    {point.reviewedAt && (
                      <div className="rrp-point-card__meta">
                        Последний отзыв: {new Date(point.reviewedAt).toLocaleString("ru-RU")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="rrp-modal__actions">
              <button className="rrp-btn" onClick={closeModal}>Закрыть</button>
              <button className="rrp-btn rrp-btn--primary" disabled={saving} onClick={handleSave}>
                {saving ? "Сохранение..." : "Сохранить отзывы"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
