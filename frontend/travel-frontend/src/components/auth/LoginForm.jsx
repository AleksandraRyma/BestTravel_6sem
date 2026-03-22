import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import OAuthButtons from "./OAuthButtons";
import { Link } from "react-router-dom";
import { loginUser } from "../../api/authApi";
import '../../styles/authPage.css';





const LoginForm = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser(email, password);
      if (data.token) {
        login({ fullName: data.fullName, email: data.email, role: data.role }, data.token);

        if (data.role === "ADMIN") navigate("/admin");
        else if (data.role === "TOUR_GUIDE") navigate("/guide");
        else navigate("/traveler");

      } else {
        setError(data);
      }
    } catch (err) {
  if (err.response?.data) {
    setError(err.response.data);
  } else {
    setError("Ошибка сервера");
  }
}

  };

  return (
  <div className="auth-card">
    <h1>Вход</h1>

    {error && <div className="error-message">{error}</div>}

    <form onSubmit={handleSubmit}>

      <div className="input-group">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="input-group">
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="btn-primary">
        Войти
      </button>

    </form>

    <OAuthButtons />

    <p className="auth-footer">
      Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
    </p>
  </div>
);

};

export default LoginForm;
