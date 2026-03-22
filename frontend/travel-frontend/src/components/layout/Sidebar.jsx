
import { Link } from "react-router-dom";

export default function Sidebar({ open, toggle }) {
  return (
    <>
      <div className={`sidebar ${open ? "open" : ""}`}>
        <h2 className="logo">Delivery AI</h2>
        <nav>
          <Link to="/admin" onClick={toggle}>📊 Dashboard</Link>
          <Link to="/admin/users" onClick={toggle}>👥 Пользователи</Link>
          <Link to="/admin/routes" onClick={toggle}>🛣 Маршруты</Link>
          <Link to="/admin/weather" onClick={toggle}>🌦 Погода</Link>
          <Link to="/admin/traffic" onClick={toggle}>🚗 Пробки</Link>
        </nav>
      </div>
      <button className="sidebar-toggle" onClick={toggle}>
        {open ? "❌" : "☰"}
      </button>
    </>
  );
}