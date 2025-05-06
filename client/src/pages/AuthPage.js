

import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SessionContext } from "../contexts/SessionContext";
import Login from "../components/Login";
import Signup from "../components/Signup";

function AuthPage() {
  const { sessionData } = useContext(SessionContext);
  const user = sessionData.user;
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const [isLogin, setIsLogin] = useState(true);
  const toggleForm = () => setIsLogin(!isLogin);

  return (
    <div>
      <button onClick={toggleForm}>
        {isLogin ? "Switch to Sign Up" : "Switch to Login"}
      </button>
      {isLogin ? <Login /> : <Signup />}
    </div>
  );
}

export default AuthPage;