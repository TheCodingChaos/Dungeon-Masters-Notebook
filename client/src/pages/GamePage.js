import React from 'react';
import { useContext, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import NewSession from "../components/NewSession";
import FormField from "../components/FormField";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { SessionContext } from "../contexts/SessionContext";
import PlayerCard from "../components/PlayerCard";
import callApi from '../utils/CallApi';
import "../styles/pages.css";
import "../components/GameCard.css"
import "../components/CharacterCard.css"

// Helper to format ISO date strings as "MMM DD, YYYY"
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  });
};

function GamePage() {
  const { gameId } = useParams();
  const { sessionData, setSessionData } = useContext(SessionContext);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const navigate = useNavigate();
  const EditGameSchema = Yup.object().shape({
    title: Yup.string().min(2, 'Title is too short').required('Title is required'),
    system: Yup.string().min(2, 'System is too short').required('System is required'),
    status: Yup.string().required('Status is required'),
    description: Yup.string().max(1000, 'Description is too long').nullable(),
    start_date: Yup.date().nullable().transform(v => (v instanceof Date && !isNaN(v) ? v : null)),
    setting: Yup.string().max(200, 'Setting is too long').nullable(),
  });
  const game = sessionData.user?.games?.find(
    (g) => g.id === parseInt(gameId, 10)
  );

  // Handler functions
  const handleOpenEditModal = () => setShowEditModal(true);
  const handleCloseEditModal = () => setShowEditModal(false);
  const handleToggleSessionForm = () => setShowSessionForm(prev => !prev);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this game?")) return;
    try {
      await callApi(`/games/${gameId}`, { method: 'DELETE' });
      // Remove game from context
      setSessionData(prev => ({
        ...prev,
        user: {
          ...prev.user,
          games: prev.user.games.filter(g => g.id !== parseInt(gameId, 10))
        }
      }));
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to delete game.');
    }
  };

  // Style constants
  const sectionSpacing = { marginTop: '1rem' };
  const sessionContainerStyle = { margin: '1rem 0' };
  const actionsContainerStyle = { display: 'flex', justifyContent: 'flex-end', gap: '1rem' };

  // If game not found
  if (!game) {
    return (
      <div>
        <p>Game not found.</p>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    );
  }

  // --- Render helpers ---
  const renderPlayerCards = () => (
    <div style={sectionSpacing} className="players-list">
      {(game.players || []).length > 0 ? (
        (game.players || []).map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            gameId={game.id}
            onCharacterAdded={(gameId, newChar) => {
              setSessionData(prev => ({
                ...prev,
                user: {
                  ...prev.user,
                  games: prev.user.games.map(g =>
                    g.id === gameId
                      ? {
                          ...g,
                          players: g.players.map(p =>
                            p.id === newChar.player_id
                              ? { ...p, characters: [...(p.characters || []), newChar] }
                              : p
                          ),
                        }
                      : g
                  ),
                },
              }));
            }}
          />
        ))
      ) : (
        <p>No players added yet.</p>
      )}
    </div>
  );

  const sessionsList = Array.isArray(game.sessions)
    ? game.sessions.filter(s => s != null)
    : [];

  const renderSessionsSection = () => (
    <div className="character-card" style={sectionSpacing}>
      <h3>Sessions</h3>
      <button onClick={handleToggleSessionForm} className="button toggle-session-form">
        {showSessionForm ? 'Cancel' : '+ New Session'}
      </button>
      {showSessionForm && (
        <div style={sessionContainerStyle}>
          <NewSession gameId={game.id} onSuccess={() => setShowSessionForm(false)} />
        </div>
      )}
      <ul>
        {sessionsList.length > 0
          ? sessionsList.map(sess => {
              const displaySummary =
                sess.summary && sess.summary.length > 30
                  ? sess.summary.slice(0, 30) + '...'
                  : sess.summary || '';
              return (
                <li key={sess.id}>
                  <Link to={`/sessions/${sess.id}`}>
                    {formatDate(sess.date)}
                    {displaySummary ? `: ${displaySummary}` : ''}
                  </Link>
                </li>
              );
            })
          : <li>No sessions yet</li>}
      </ul>
    </div>
  );

  const renderEditModal = () => (
    showEditModal && (
      <Modal isOpen onClose={handleCloseEditModal}>
        <div className="modal-edit-container">
          <h3>Edit Game</h3>
          <Formik
            initialValues={{
              title: game.title || '',
              system: game.system || '',
              status: game.status || '',
              description: game.description || '',
              start_date: game.start_date || '',
              setting: game.setting || '',
            }}
            validationSchema={EditGameSchema}
            onSubmit={async (values, { setSubmitting, setErrors }) => {
              try {
                const payload = { ...values, start_date: values.start_date || null };
                const updated = await callApi(`/games/${gameId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
                setSessionData(prev => ({
                  ...prev,
                  user: {
                    ...prev.user,
                    games: prev.user.games.map(g => (g.id === updated.id ? updated : g)),
                  },
                }));
                handleCloseEditModal();
              } catch (e) {
                setErrors({ server: e.message || 'Failed to update game.' });
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting, errors }) => (
              <Form noValidate>
                {errors.server && <div className="error-message server-error">{errors.server}</div>}
                <FormField label="Title" name="title" />
                <FormField label="System" name="system" />
                <FormField label="Status" name="status" />
                <FormField label="Description" name="description" as="textarea" />
                <FormField label="Start Date" name="start_date" type="date" />
                <FormField label="Setting" name="setting" />
                <div style={actionsContainerStyle}>
                  <button type="submit" disabled={isSubmitting} className="button submit-button">
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" onClick={handleCloseEditModal} className="button cancel-button" style={{ marginLeft: '0.5rem' }}>
                    Cancel
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </Modal>
    )
  );

  return (
    <>
      <div className="game-page">
        <Link to="/dashboard">← Back to Dashboard</Link>
        <div className="game-card">
          <h1>{game.title}</h1>
          <p><strong>System:</strong> {game.system}</p>
          {game.description && (<p><strong>Description:</strong> {game.description}</p>)}
          {game.start_date && (<p><strong>Start Date:</strong> {formatDate(game.start_date)}</p>)}
          {game.setting && (<p><strong>Setting:</strong> {game.setting}</p>)}
          <p><strong>Status:</strong> {game.status}</p>
          <button onClick={handleOpenEditModal}>Edit Game</button>
          <button onClick={handleDelete}>Delete Game</button>
        </div>
        {renderPlayerCards()}
        {renderSessionsSection()}
      </div>
      {renderEditModal()}
    </>
  );
}

export default GamePage;