import { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/admin/AdminDashboard.css";
import { getAdminStats } from "../../api/adminApi";

export default function AdminDashboard() {
  const [showLogout, setShowLogout] = useState(false);
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const openLogoutModal = () => setShowLogout(true);
  const closeLogoutModal = () => setShowLogout(false);

  const handleConfirmLogout = () => {
    logout && logout();
    setShowLogout(false);
    navigate("/login");
  };


    const [stats, setStats] = useState({
    activeUsers: 0,
    blockedUsers: 0,
    totalRoles: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getAdminStats();
        setStats(res);
      } catch (err) {
        console.error("Не удалось получить статистику", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="admin-dashboard">
      <header className="admin-main">
        <div className="admin-shell">
          <nav aria-label="Основная навигация">
            <div className="admin-actions-header">
              <h2>Панель администратора</h2>
              <button className="admin-btn outline" onClick={openLogoutModal}>
                Выход
              </button>
            </div>
          </nav>

          <section className="admin-hero" aria-labelledby="admin-hero-title">
            <div className="admin-hero-text">
              <div className="admin-hero-badge">
                Управление платформой · сегодня
              </div>
              <h1 id="admin-hero-title">Добро пожаловать в центр управления</h1>
              <p></p>
              <div className="admin-hero-stats">
                <div className="admin-hero-stat">
                  <span>Активные пользователи</span>
                  <strong>{stats.activeUsers}</strong>
                </div>
                <div className="admin-hero-stat">
                  <span>Заблокировано</span>
                  <strong>{stats.blockedUsers}</strong>
                </div>
                <div className="admin-hero-stat">
                  <span>Ролей в системе</span>
                  <strong>3</strong>
                </div>
              </div>
            </div>

          </section>

          <main>
            <section
              className="admin-actions-section"
              aria-labelledby="admin-actions-title"
            >
              <div className="admin-actions-header">
                <h2 id="admin-actions-title">Работа с пользователями</h2>
              </div>

              <div className="admin-actions-grid">
                <article className="admin-action-card">
                  <h3>CRUD операции</h3>
                  <p>
                    Создание, просмотр, редактирование и удаление пользователей
                    в системе.
                  </p>
                  <p className="admin-action-meta">
                    Полный контроль над пользовательской базой.
                  </p>
                  <div className="admin-action-buttons">
                    <Link to="/admin/users" className="admin-btn primary">
                      Открыть список пользователей
                    </Link>
                  </div>
                </article>

                <article className="admin-action-card">
                  <span className="admin-action-chip">Роли и доступ</span>
                  <h3>Назначить роль</h3>
                  <p>
                    Переключайте роли (админ, гид, путешественник) и управляйте
                    правами доступа.
                  </p>
                  <p className="admin-action-meta">
                    Гибкая конфигурация прав под задачи бизнеса.
                  </p>
                  <div className="admin-action-buttons">
                    <Link to="/admin/users" className="admin-btn outline">
                      <span className="icon">🛡</span>
                      Управление ролями
                    </Link>
                  </div>
                </article>

                <article className="admin-action-card">
                  <span className="admin-action-chip">Безопасность</span>
                  <h3>Управление доступом</h3>
                  <p>
                    Временно ограничивайте доступ нарушителей, сохраняя историю
                    их действий.
                  </p>
                  <p className="admin-action-meta">
                    Помогает поддерживать безопасную среду внутри сервиса.
                  </p>
                  <div className="admin-action-buttons">
                    <Link to="/admin/users" className="admin-btn danger">
                      Перейти к блокировкам
                    </Link>
                  </div>
                </article>
              </div>
            </section>

            <section className="admin-secondary" aria-label="Сводки и помощь">

</section>
          </main>
        </div>
      </header>

      <footer className="admin-footer">
        <div className="admin-footer-inner">
          <span>© {new Date().getFullYear()} Travel Admin. Все права защищены.</span>
          <nav className="admin-footer-nav" aria-label="Нижняя навигация">
            <Link to="/admin/users">Пользователи</Link>
            <a href="#roles">Роли</a>
            <a href="#security">Безопасность</a>
          </nav>
        </div>
      </footer>

      {showLogout && (
        <div className="logout-backdrop" role="dialog" aria-modal="true">
          <div className="logout-modal">
            <h2>Выйти из системы?</h2>
            <p>
              Вы действительно хотите завершить сессию администратора?
            </p>
            <div className="logout-modal-actions">
              <button
                type="button"
                className="logout-modal-btn cancel"
                onClick={closeLogoutModal}
              >
                Отмена
              </button>
              <button
                type="button"
                className="logout-modal-btn confirm"
                onClick={handleConfirmLogout}
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}