import React, { useContext } from "react";
import NavSelect from "./NavSelect";
import { Link, useNavigate } from "react-router-dom";
import { SessionContext } from "../contexts/SessionContext";
import useSessionOptions from "../hooks/UseSessionOptions";

function NavBar() {
  const { sessionData, setSessionData } = useContext(SessionContext);
  const user = sessionData.user;
  const navigate = useNavigate();


  const { gameOptions, playerOptions, characterOptions } = useSessionOptions();

  const handleLogout = () => {
    fetch("/logout", { method: "DELETE", credentials: "include" })
      .then((r) => {
        if (r.ok) {
          setSessionData(prev => ({ ...prev, user: null }));
          navigate("/");
        }
      });
  };

  const userNav = (
    <>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/characters">All Characters</Link>
      <NavSelect label="Game" options={gameOptions} toPrefix="/games" />
      <NavSelect label="Player" options={playerOptions} toPrefix="/players" />
      <NavSelect label="Character" options={characterOptions} toPrefix="/characters" />

      <span style={{ margin: "0 1rem" }}>Welcome, {user?.username}</span>
      <button onClick={handleLogout}>Logout</button>
    </>
  );

  const guestNav = (
    <>
      <Link to="/login">Login</Link>
      <Link to="/signup">Sign Up</Link>
    </>
  );

  const navItems = user ? userNav : guestNav;

  return <nav>{navItems}</nav>;
}

export default NavBar;