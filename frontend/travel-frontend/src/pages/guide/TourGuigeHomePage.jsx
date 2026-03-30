import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import GuideNotesPanel from "./GuideNotesPanel";
import "../../styles/home/homePage.css";
import "../../styles/tour_guide/TourGuigeHomePage.css";

export default function TourGuigeHomePage() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(true);

  // ── Load guide stats from backend ────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { default: axiosClient } = await import("../../api/axiosClient");
        const res = await axiosClient.get("/guide/home");
        setStats(res.data);
      } catch {
        // backend not available — show empty stats
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onLogout = () => { logout?.(); navigate("/login"); };

  return (
    <div className="guide-page">

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className={`guide-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="guide-sidebar__brand">
          <span>🗺️</span>
          <span>BestTravel</span>
        </div>
        <nav className="guide-sidebar__nav">
          <button
  className="guide-nav-item guide-nav-item--active"
  onClick={() => { navigate("/guide"); setSidebarOpen(false); }}
>
  <img 
    src="https://img.icons8.com/ios-filled/50/000000/home.png" 
    alt="Главная" 
    style={{ width: "24px", height: "24px", marginRight: "8px" }} 
  />
  Главная
</button>
          <button
            className="guide-nav-item"
            onClick={() => { navigate("/guide/create-tour"); setSidebarOpen(false); }}
          >
            <span>➕</span> Создать маршрут
          </button>
          <button
      className="guide-nav-item"
      onClick={() => { navigate("/guide/stats"); setSidebarOpen(false); }}
    >
      <img 
        src="https://img.icons8.com/?size=100&id=R9JRk80Gstb8&format=png&color=000000" 
        alt="Статистика" 
        style={{ width: "24px", height: "24px", marginRight: "8px" }} 
      />
      Статистика
    </button>
    <button
      className="guide-nav-item"
      onClick={() => { navigate("/guide/report"); setSidebarOpen(false); }}
    >
      <img 
        src="https://img.icons8.com/?size=100&id=sWZInDBCyeeC&format=png&color=000000" 
        alt="Отчёты" 
        style={{ width: "24px", height: "24px", marginRight: "8px" }} 
      />
      Отчёты
    </button>
  </nav>
        <button className="guide-sidebar__logout" onClick={onLogout}>
          Выйти
        </button>
      </aside>
      {sidebarOpen && <div className="guide-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ── MAIN ─────────────────────────────────────────────── */}
      <main className="guide-main">

        {/* Topbar */}
        <header className="guide-topbar">
          <button className="guide-burger" onClick={() => setSidebarOpen(true)}>☰</button>
          <div className="guide-topbar__title">
            <h1>Панель гида</h1>
            <span className="guide-topbar__sub">BestTravel</span>
          </div>
          <button className="guide-topbar__logout" onClick={onLogout}>Выйти</button>
        </header>

        {/* ── HERO / WELCOME ───────────────────────────────── */}
        <section className="guide-hero">
          <div className="guide-hero__text">
            <h2>Добро пожаловать</h2>
            <p>Создавайте маршруты, смотрите статистику и формируйте отчёты</p>
          </div>
          {!loading && stats && (
            <div className="guide-hero__stats">
              <div className="guide-stat">
                <span className="guide-stat__num">{stats.totalRoutes ?? 0}</span>
                <span className="guide-stat__label">маршрутов</span>
              </div>
              <div className="guide-stat">
                <span className="guide-stat__num">{stats.totalParticipants ?? 0}</span>
                <span className="guide-stat__label">участников</span>
              </div>
              <div className="guide-stat">
                <span className="guide-stat__num">{stats.rating ?? "—"}</span>
                <span className="guide-stat__label">рейтинг</span>
              </div>
            </div>
          )}
        </section>

        {/* ── USE CASES ────────────────────────────────────── */}
        <section className="guide-actions-section">
          <h3 className="guide-section-title">Что вы хотите сделать?</h3>
          <div className="guide-actions">

            {/* Create route */}
            <div className="guide-action-card" onClick={() => navigate("/guide/create-tour")}>
              <div className="guide-action-card__icon guide-action-card__icon--green">➕</div>
              <div className="guide-action-card__content">
                <h4>Создать маршрут</h4>
                <p>Составьте новый туристический маршрут с точками интереса, транспортом и расписанием</p>
              </div>
              <div className="guide-action-card__arrow">→</div>
            </div>

            {/* Statistics */}
            <div className="guide-action-card" onClick={() => navigate("/guide/stats")}>

              <div className="guide-action-card__icon guide-action-card__icon--blue">
  <img 
    src="https://img.icons8.com/?size=100&id=R9JRk80Gstb8&format=png&color=000000" 
    alt="Статистика" 
    style={{ width: "24px", height: "24px" }} 
  />
</div>

              <div className="guide-action-card__content">
                <h4>Просмотреть статистику</h4>
                <p>Аналитика ваших маршрутов: количество участников, популярность, рейтинги</p>
              </div>
              <div className="guide-action-card__arrow">→</div>
            </div>

            {/* Report */}
            <div className="guide-action-card" onClick={() => navigate("/guide/report")}>
           
              <div className="guide-action-card__icon guide-action-card__icon--orange">
    <img 
      src="https://img.icons8.com/?size=100&id=sWZInDBCyeeC&format=png&color=000000" 
      alt="Отчёт" 
      style={{ width: "24px", height: "24px" }} 
    />
  </div>
              <div className="guide-action-card__content">
                <h4>Сформировать отчёт</h4>
                <p>Выгрузите отчёт по маршрутам и участникам за любой период</p>
              </div>
              <div className="guide-action-card__arrow">→</div>
            </div>

          </div>
        </section>

        <footer className="guide-footer">© 2026 BestTravel</footer>
      </main>

      {/* ── FLOATING NOTES ───────────────────────────────────── */}
      <GuideNotesPanel />
    </div>
  );
}