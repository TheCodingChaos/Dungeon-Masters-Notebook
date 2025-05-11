import { useContext } from "react";
import NavSelect from "./NavSelect";
import { Link, useNavigate } from "react-router-dom";
import { SessionContext } from "../contexts/SessionContext";
import useSessionOptions from "../hooks/UseSessionOptions";
import "./NavBar.css";

function NavBar() {
  // Access session data and navigation
  const { sessionData, setSessionData } = useContext(SessionContext);
  const user = sessionData.user;
  const navigate = useNavigate();

  // Retrieve dropdown options from session
  const { gameOptions, playerOptions, characterOptions } = useSessionOptions();

  // Handle user logout
  const handleLogout = () => {
    fetch("/logout", { method: "DELETE", credentials: "include" })
      .then((r) => {
        if (r.ok) {
          setSessionData(prev => ({ ...prev, user: null }));
          navigate("/");
        }
      });
  };

  // Navigation links for a logged-in user
  const userNav = (
    <>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/characters">All Characters</Link>
      <NavSelect label="Game" options={gameOptions} toPrefix="/games" />
      <NavSelect label="Player" options={playerOptions} toPrefix="/players" />
      <NavSelect label="Character" options={characterOptions} toPrefix="/characters" />
      <span className="navbar-welcome">Welcome, {user?.username}</span>
      <button onClick={handleLogout}>Logout</button>
    </>
  );

  // Navigation links for a guest
  const guestNav = (
    <>
      <Link to="/login">Login</Link>
      <Link to="/signup">Sign Up</Link>
    </>
  );

  // Choose navigation items based on login status
  const navItems = user ? userNav : guestNav;

  return <nav>{navItems}</nav>;
}

export default NavBar;