import { useState } from 'react';
import Modal from './Modal';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import callApi from '../utils/CallApi';
import FormField from './FormField';
import { useContext } from "react";
import NavSelect from "./NavSelect";
import { Link, useNavigate } from "react-router-dom";
import { SessionContext } from "../contexts/SessionContext";
import useSessionOptions from "../hooks/UseSessionOptions";
import "./NavBar.css";

const NewPlayerSchema = Yup.object({
  name: Yup.string().required('Player name is required'),
  summary: Yup.string(),
});

function NavBar() {
  // Access session data and navigation
  const { sessionData, setSessionData } = useContext(SessionContext);
  const user = sessionData.user;
  const navigate = useNavigate();

  // Retrieve dropdown options from session
  const { gameOptions, playerOptions } = useSessionOptions();

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

  const [showNewPlayer, setShowNewPlayer] = useState(false);
  const handleNewPlayerSuccess = newPlayer => {
    // Update top-level players array (ensure it exists)
    setSessionData(prev => {
      const user = prev.user || {};
      const players = user.players || [];
      return {
        ...prev,
        user: { ...user, players: [...players, newPlayer] },
      };
    });
    setShowNewPlayer(false);
  };

  // Handlers for New Player modal
  const handleShowNewPlayer = () => setShowNewPlayer(true);
  const handleCloseNewPlayer = () => setShowNewPlayer(false);

  // Navigation item components
  const dashboardLink = <Link to="/dashboard">Dashboard</Link>;
  const allCharactersLink = <Link to="/characters">All Characters</Link>;
  const gameSelect = <NavSelect label="Game" options={gameOptions} toPrefix="/games" />;
  const playerSelect = <NavSelect label="Player" options={playerOptions} toPrefix="/players" />;
  const newPlayerButton = <button onClick={handleShowNewPlayer}>+ New Player</button>;
  const divider = <span className="nav-divider" />;
  const welcomeMessage = <span className="navbar-welcome">Welcome, {user?.username}</span>;
  const logoutButton = <button onClick={handleLogout}>Logout</button>;

  const userNavItems = [
    dashboardLink,
    allCharactersLink,
    gameSelect,
    playerSelect,
    newPlayerButton,
    divider,
    welcomeMessage,
    logoutButton,
  ];
  const guestNavItems = [<Link to="/login">Login</Link>, <Link to="/signup">Sign Up</Link>];

  const navItems = user ? userNavItems : guestNavItems;

  return (
    <>
      <nav>{navItems}</nav>
      {showNewPlayer && (
        <Modal isOpen onClose={handleCloseNewPlayer}>
          <div className="form-wrapper">
            <h3>New Player</h3>
            <Formik
              initialValues={{ name: '', summary: '' }}
              validationSchema={NewPlayerSchema}
              onSubmit={async (values, { setSubmitting, setErrors, resetForm }) => {
                try {
                  const created = await callApi('/players', {
                    method: 'POST',
                    body: JSON.stringify(values),
                  });
                  resetForm();
                  handleNewPlayerSuccess(created);
                } catch (e) {
                  setErrors(e.errors || { server: e.message });
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting, errors }) => (
                <Form>
                  {errors.server && <div className="error">{errors.server}</div>}
                  <FormField label="Name" name="name" />
                  <FormField label="Summary" name="summary" as="textarea" />
                  <button type="submit" disabled={isSubmitting}>Create</button>
                  <button type="button" onClick={handleCloseNewPlayer}>Cancel</button>
                </Form>
              )}
            </Formik>
          </div>
        </Modal>
      )}
    </>
  );
}

export default NavBar;