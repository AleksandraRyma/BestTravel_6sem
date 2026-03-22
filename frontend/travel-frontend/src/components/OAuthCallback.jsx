import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Получаем token из URL, который Spring добавляет после успешного входа
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      // Сохраняем токен в localStorage
      localStorage.setItem("token", token);
      // Редирект на страницу пользователей
      navigate("/admin/users");
    } else {
      // Если токена нет, отправляем на страницу логина
      navigate("/login");
    }
  }, []);

  return <p>Redirecting...</p>;
}
