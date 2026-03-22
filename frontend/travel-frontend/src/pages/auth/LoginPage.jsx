import LoginForm from "../../components/auth/LoginForm";
import LogisticsParticles from "../../components/particles/LogisticsParticles";
import { useEffect } from "react";

export default function LoginPage() {
  useEffect(() => {
    // Чистим старый токен при открытии страницы входа
    localStorage.removeItem("token");
  }, []);

  return (
    <>
      {/* <LogisticsParticles /> */}

      <div className="auth-page">
        <div className="auth-container">
          <LoginForm />
        </div>
      </div>
    </>
  );
}
