import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
  
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      
      localStorage.setItem("token", token);
      
      navigate("/admin/users");
    } else {
      
      navigate("/login");
    }
  }, []);

  return <p>Redirecting...</p>;
}
