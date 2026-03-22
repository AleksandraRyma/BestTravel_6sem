import React, { useState, useEffect } from "react";
import { registerUser } from "../../api/authApi";
import OAuthButtons from "./OAuthButtons";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/authPage.css";

const RegisterForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    password: "",
    roleName: "TRAVELER",
  });

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    password: "",
  });

  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // ───────────── Валидация в реальном времени ─────────────
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Обновляем форму
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Проверка ФИО (только буквы)
    if (["firstName", "lastName", "middleName"].includes(name)) {
      setErrors((prev) => ({
        ...prev,
        [name]:
          value && !/^[а-яА-Яa-zA-Z]+$/.test(value)
            ? "ФИО должно содержать только буквы"
            : "",
      }));
    }

    // Проверка пароля
    if (name === "password") {
      setErrors((prev) => ({
        ...prev,
        password:
          value &&
          !/^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d]{8,}$/.test(value)
            ? "Пароль должен содержать минимум 8 символов, буквы и цифры"
            : "",
      }));
    }

    // Email валидируем простым regex
    if (name === "email") {
      setErrors((prev) => ({
        ...prev,
        email:
          value && !/^\S+@\S/.test(value)
            ? "Некорректный email"
            : "",
      }));
    }
  };

  // ───────────── Отправка формы ─────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Проверка на ошибки перед отправкой
    if (Object.values(errors).some((err) => err) || !formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      alert("Исправьте ошибки перед отправкой");
      return;
    }

const fullName = [formData.lastName, formData.firstName, formData.middleName]
  .filter(Boolean)
  .join(" ");

const dataToSend = {
  email: formData.email,
  password: formData.password,
  fullName: fullName,
  roleName: formData.roleName
};

try {
  const res = await registerUser(dataToSend);
  if (res === "Регистрация прошла успешно") {
    setSuccess(true);
  } else {
    setErrors((prev) => ({ ...prev, email: res }));
  }
} catch (err) {
  // err.response.data содержит сообщение от Spring
  const message = err.response?.data || "Ошибка сервера";
  setErrors((prev) => ({ ...prev, email: message }));
}


  };

  // ───────────── Обратный отсчёт после успешной регистрации ─────────────
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      navigate("/login"); // редирект на страницу авторизации
    }
  }, [success, countdown, navigate]);

  return (
    <div className="auth-card">
      <h1>Регистрация</h1>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="text"
            name="lastName"
            placeholder="Фамилия"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
          {errors.lastName && <small className="error-text">{errors.lastName}</small>}
        </div>

        <div className="input-group">
          <input
            type="text"
            name="firstName"
            placeholder="Имя"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          {errors.firstName && <small className="error-text">{errors.firstName}</small>}
        </div>

        <div className="input-group">
          <input
            type="text"
            name="middleName"
            placeholder="Отчество"
            value={formData.middleName}
            onChange={handleChange}
          />
          {errors.middleName && <small className="error-text">{errors.middleName}</small>}
        </div>

        <div className="input-group">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          {errors.email && <small className="error-text">{errors.email}</small>}
        </div>

        <div className="input-group">
          <input
            type="password"
            name="password"
            placeholder="Пароль"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {errors.password && <small className="error-text">{errors.password}</small>}
        </div>

        <button type="submit" className="btn-primary">
          Зарегистрироваться
        </button>
      </form>

      <OAuthButtons />

      <p className="auth-footer">
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>

      {/* Модальное окно успешной регистрации */}
      {success && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h2>Регистрация прошла успешно!</h2>
            <p>Перенаправление на страницу авторизации через {countdown}...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterForm;
