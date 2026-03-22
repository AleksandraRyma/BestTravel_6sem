import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { getGuideHome } from "../../api/tourGuideApi";
import "../../styles/home/homePage.css";

export default function TourGuigeHomePage() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getGuideHome();
        if (!alive) return;
        setData(res);
      } catch (e) {
        if (!alive) return;
        setError("Не удалось загрузить данные");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => (alive = false);
  }, []);

  const tasks = useMemo(() => data?.tasks ?? [], [data]);
  const stats = data?.stats ?? { activeTours: 0, requests: 0, rating: 0 };

  const onLogout = () => {
    logout?.();
    navigate("/login");
  };

  // 🔥 НАВИГАЦИЯ (юзкейсы)
  const goToCreateTour = () => navigate("/guide/create-tour");
  const goToRequests = () => navigate("/guide/requests");
  const goToSchedule = () => navigate("/guide/schedule");
  const goToMessages = () => navigate("/guide/messages");
  const goToStats = () => navigate("/guide/stats");
  const goToReport = () => navigate("/guide/report");

  return (
    <div className="home-page">
      <div className="home-shell">

        {/* TOPBAR */}
        <header className="home-topbar">
          <button className="icon-btn" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>

          <div className="home-brand">Guide</div>

          <button className="home-btn" onClick={onLogout}>
            Выйти
          </button>
        </header>

        {/* SIDEBAR */}
        <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-header">
            <strong>Меню</strong>
            <button onClick={() => setSidebarOpen(false)}>✕</button>
          </div>

          <nav className="sidebar-nav">
            <button onClick={goToCreateTour}>Создать маршрут</button>
            <button onClick={goToRequests}>Заявки</button>
            <button onClick={goToSchedule}>Расписание</button>
            <button onClick={goToMessages}>Сообщения</button>
            <button onClick={goToStats}>Статистика</button>
            <button onClick={goToReport}>Отчеты</button>
          </nav>
        </div>

        {sidebarOpen && (
          <div className="overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* HERO */}
        <section className="hero">
          <h1>Управляйте турами легко</h1>
          <p>Создавайте маршруты, работайте с заявками и анализируйте статистику</p>

          {/* 🔎 Поиск как level.travel */}
          <div className="hero-search">
            <input placeholder="Куда тур?" />
            <button onClick={goToCreateTour}>Создать</button>
          </div>
        </section>

        {/* СТАТИСТИКА */}
        <section className="section">
          <h2>Статистика</h2>
          <div className="home-stats">
            <div className="home-stat">
              <span>Активные туры</span>
              <strong>{stats.activeTours}</strong>
            </div>
            <div className="home-stat">
              <span>Заявки</span>
              <strong>{stats.requests}</strong>
            </div>
            <div className="home-stat">
              <span>Рейтинг</span>
              <strong>{stats.rating}</strong>
            </div>
          </div>
        </section>

        {/* БЫСТРЫЕ ДЕЙСТВИЯ */}
        <section className="section">
          <h2>Быстрые действия</h2>

          <div className="horizontal-scroll">
            <div className="card big" onClick={goToCreateTour}>
              <div className="card-overlay">
                <h3>Создать маршрут</h3>
                <span>Добавьте новый тур</span>
              </div>
            </div>

            <div className="card" onClick={goToRequests}>
              <h3>Заявки</h3>
              <span>Обработать клиентов</span>
            </div>

            <div className="card" onClick={goToSchedule}>
              <h3>Расписание</h3>
              <span>Планирование туров</span>
            </div>

            <div className="card" onClick={goToMessages}>
              <h3>Сообщения</h3>
              <span>Чат с туристами</span>
            </div>

            <div className="card" onClick={goToStats}>
              <h3>Статистика</h3>
              <span>Аналитика</span>
            </div>

            <div className="card" onClick={goToReport}>
              <h3>Отчеты</h3>
              <span>Сформировать отчет</span>
            </div>
          </div>
        </section>

        {/* ЗАДАЧИ */}
        {!loading && !error && (
          <section className="section">
            <h2>Задачи на сегодня</h2>

            <div className="home-list">
              {tasks.map((t, idx) => (
                <div key={idx} className="home-item">
                  <div className="home-item-title">{t.title}</div>
                  <div className="home-item-sub">{t.subtitle}</div>
                  <div className="home-item-priority">{t.priority}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* STATES */}
        {loading && <div className="home-state">Загрузка…</div>}
        {error && <div className="home-state">{error}</div>}

        {/* FOOTER */}
        <footer className="footer">
          © 2026 Guide Platform
        </footer>

      </div>
    </div>
  );
}
