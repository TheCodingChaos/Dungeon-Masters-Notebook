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

  // Navigation links for a logged-in user
  const userNav = (
    <>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/characters">All Characters</Link>
      <NavSelect label="Game" options={gameOptions} toPrefix="/games" />
      <NavSelect label="Player" options={playerOptions} toPrefix="/players" />
      <button onClick={() => setShowNewPlayer(true)}>+ New Player</button>
      <span className="nav-divider" />
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

  return (
    <>
      <nav>{navItems}</nav>
      {showNewPlayer && (
        <Modal isOpen onClose={() => setShowNewPlayer(false)}>
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
                  <button type="button" onClick={() => setShowNewPlayer(false)}>Cancel</button>
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