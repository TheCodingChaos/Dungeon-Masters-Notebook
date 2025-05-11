import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SessionContext } from "../contexts/SessionContext";
import Login from "../components/Login";
import Signup from "../components/Signup";
import "../styles/pages.css";

function AuthPage() {
  // Access user session data
  const { sessionData } = useContext(SessionContext);
  const user = sessionData.user;

  // Used to redirect if the user is already logged in
  const navigate = useNavigate();

  // If the user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Tracks whether the login or signup form is displayed
  const [isLogin, setIsLogin] = useState(true);

  // Switch between login and signup form
  const handleToggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="auth-page">
      {/* Toggle button to switch between login and signup */}
      <button onClick={handleToggleForm}>
        {isLogin ? "Switch to Sign Up" : "Switch to Login"}
      </button>

      {/* Render the appropriate form */}
      {isLogin ? <Login /> : <Signup />}
    </div>
  );
}

export default AuthPage;