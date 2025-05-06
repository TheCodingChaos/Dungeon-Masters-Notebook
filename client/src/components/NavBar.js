

import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SessionContext } from "../contexts/SessionContext";

function NavBar() {
  const { sessionData, setSessionData } = useContext(SessionContext);
  const user = sessionData.user;
  const navigate = useNavigate();

  const handleLogout = () => {
    fetch("/logout", { method: "DELETE", credentials: "include" })
      .then((r) => {
        if (r.ok) {
          setSessionData(prev => ({...prev, user:null }));
          navigate("/");
        }
      });
  };

  return (
    <nav>
      {user ? (
        <>
          <span>Welcome, {user.username}</span>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/signup">Sign Up</Link>
        </>
      )}
    </nav>
  );
}

export default NavBar;