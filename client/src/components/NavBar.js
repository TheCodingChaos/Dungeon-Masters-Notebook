import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import Modal from './Modal';
import NavSelect from './NavSelect';
import callApi from '../utils/CallApi';
import FormField from './FormField';
import { SessionContext } from '../contexts/SessionContext';
import useSessionOptions from '../hooks/UseSessionOptions';
import './NavBar.css';

const NewPlayerSchema = Yup.object({
  name: Yup.string().required('Player name is required'),
  summary: Yup.string(),
});

export default function NavBar() {
  const { sessionData, setSessionData } = useContext(SessionContext);
  const user = sessionData.user;
  const navigate = useNavigate();
  const { gameOptions, playerOptions } = useSessionOptions();

  // Logout handler using callApi
  const handleLogout = async () => {
    try {
      await callApi('/logout', { method: 'DELETE' });
      setSessionData(prev => ({ ...prev, user: null }));
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // New Player modal state & callbacks
  const [showNewPlayer, setShowNewPlayer] = useState(false);
  const openNewPlayerModal = () => setShowNewPlayer(true);
  const closeNewPlayerModal = () => setShowNewPlayer(false);

  const handleNewPlayerSuccess = newPlayer => {
    setSessionData(prev => ({
      ...prev,
      user: { 
        ...prev.user, 
        players: [...(prev.user.players || []), newPlayer] 
      },
    }));
    setShowNewPlayer(false);
  };

  const handleNewPlayerSubmit = async (values, { setSubmitting, setErrors, resetForm }) => {
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
  };

  // Build nav items
  const navItems = user
    ? [
        <Link to="/dashboard">Dashboard</Link>,
        <Link to="/characters">All Characters</Link>,
        <NavSelect label="Game" options={gameOptions} toPrefix="/games" />,
        <NavSelect label="Player" options={playerOptions} toPrefix="/players" />,
        <button onClick={openNewPlayerModal} aria-label="Create new player">+ New Player</button>,
        <span className="nav-divider" />,
        <span className="navbar-welcome">Welcome, {user.username}</span>,
        <button onClick={handleLogout}>Logout</button>,
      ]
    : [
        <Link to="/login">Login</Link>,
        <Link to="/signup">Sign Up</Link>,
      ];

  return (
    <>
      <nav>
        {navItems.map((item, idx) => React.cloneElement(item, { key: idx }))}
      </nav>

      {showNewPlayer && (
        <Modal isOpen onClose={closeNewPlayerModal}>
          <div className="form-wrapper">
            <h3>New Player</h3>
            <Formik
              initialValues={{ name: '', summary: '' }}
              validationSchema={NewPlayerSchema}
              onSubmit={handleNewPlayerSubmit}
            >
              {({ isSubmitting, errors }) => (
                <Form>
                  {errors.server && <div className="error">{errors.server}</div>}
                  <FormField label="Player Name" name="name" />
                  <FormField label="Summary" name="summary" as="textarea" />
                  <button type="submit" disabled={isSubmitting}>
                    Create
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        </Modal>
      )}
    </>
  );
}