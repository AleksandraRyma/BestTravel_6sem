import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getTravelerProfile, updateTravelerProfile } from "../../api/travelerApi";
import { FiHome } from "react-icons/fi"; 
import {
  FiMenu, FiUser, FiMap, FiPlus, FiBell,
  FiCalendar, FiSearch, FiStar, FiUsers,
} from "react-icons/fi";

import "../../styles/home/homePage.css";
import "../../styles/traveler/TravelerHomePage.css";

export default function TravelerProfilePage() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getTravelerProfile();
        setProfile(res);
      } catch {
        console.log("Ошибка загрузки профиля");
      }
    })();
  }, []);

  const handleSave = async () => {
    await updateTravelerProfile({
      fullName: profile.fullName,
      email: profile.email,
    });
    setEditMode(false);
  };

  const onLogout = () => {
    logout?.();
    navigate("/login");
  };

  if (!profile) return <div>Загрузка...</div>;

  return (
    <div className="home-page">
      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <h3 className="sidebar-title">Travel</h3>
        <nav className="sidebar-nav">
            <button onClick={() => navigate("/traveler")}><FiHome /> Главная</button> 
          <button onClick={() => navigate("/traveler/my-routes")}><FiMap /> Мои маршруты</button>
          <button onClick={() => navigate("/traveler/create-route")}><FiPlus /> Создать маршрут</button>
          <button onClick={() => navigate("/traveler/search")}><FiSearch /> Найти маршруты</button>
          <button onClick={() => navigate("/traveler/recommended")}><FiStar /> Рекомендации</button>
          <button onClick={() => navigate("/traveler/calendar")}><FiCalendar /> Календарь</button>
          <button onClick={() => navigate("/traveler/notifications")}><FiBell /> Уведомления</button>
          <button onClick={() => navigate("/traveler/profile")}><FiUser /> Профиль</button>
        </nav>
      </aside>

      {sidebarOpen && (
        <div className="overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="home-shell">
        {/* TOPBAR */}
        <header className="home-topbar">
          <button className="icon-btn" onClick={() => setSidebarOpen(true)}>
            <FiMenu />
          </button>
          <div className="home-brand">Travel</div>
          <button className="home-btn" onClick={onLogout}>Выйти</button>
        </header>

        {/* HERO */}
        <section className="hero">
          <h1>Профиль</h1>
          <p>{profile.fullName}</p>
        </section>

        {/* CONTENT */}
        <section className="section">
          <div className="home-grid">
            {/* Личные данные */}
            <div className="home-section">
              <h2>Личные данные</h2>
              <div className="home-list">
                <div className="home-item">
                  <span className="home-item-title">Имя</span>
                  {editMode ? (
                    <input
                      value={profile.fullName}
                      onChange={(e) =>
                        setProfile({ ...profile, fullName: e.target.value })
                      }
                    />
                  ) : (
                    <div className="home-item-sub">{profile.fullName}</div>
                  )}
                </div>

                <div className="home-item">
                  <span className="home-item-title">Email</span>
                  {editMode ? (
                    <input
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                    />
                  ) : (
                    <div className="home-item-sub">{profile.email}</div>
                  )}
                </div>

                <div className="home-item">
                  <span className="home-item-title">Дата регистрации:  </span>
              {profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—"}
                </div>
              </div>

              {editMode ? (
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button className="home-btn primary" onClick={handleSave}>
                    Сохранить
                  </button>
                  <button className="home-btn" onClick={() => setEditMode(false)}>
                    Отмена
                  </button>
                </div>
              ) : (
                <button
                  className="home-btn"
                  style={{ marginTop: "12px" }}
                  onClick={() => setEditMode(true)}
                >
                  Редактировать
                </button>
              )}
            </div>

            {/* Статистика */}
            <div className="home-section">
              <h2>Статистика</h2>
              <div className="home-stats">
                <div className="home-stat">
                  <span>Создано маршрутов</span>
                  <strong>{profile.routesCreated}</strong>
                </div>
                <div className="home-stat">
                  <span>Избранные маршруты</span>
                  <strong>{profile.favoritesCount}</strong>
                </div>
                <div className="home-stat">
                  <span>Совместные поездки</span>
                  <strong>{profile.collaborationsCount}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="footer">© Travel 2026</footer>
      </div>
    </div>
  );
}