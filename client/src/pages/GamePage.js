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
  const EditGameSchema = Yup.object({
    title: Yup.string().required("Required"),
    system: Yup.string().required("Required"),
    status: Yup.string().required("Required"),
    description: Yup.string(),
    start_date: Yup.date().nullable(),
    setting: Yup.string(),
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
  
  const playerCards = (game.players || []).map(player => (
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
  ));

  // Sessions list and form toggle logic
  const sessionsList = Array.isArray(game.sessions)
    ? game.sessions.filter(s => s != null)
    : [];
  const sessionItems = sessionsList.length > 0
    ? sessionsList.map(sess => {
      const displaySummary = sess.summary && sess.summary.length > 30
        ? sess.summary.slice(0, 30) + '...'
        : sess.summary || "";
      return (
        <li key={sess.id}>
          <Link to={`/sessions/${sess.id}`}>
            {formatDate(sess.date)}{displaySummary ? `: ${displaySummary}` : ""}
          </Link>
        </li>
      );
    })
    : [<li key="no-sessions">No sessions yet</li>];

  const sessionsListUI = sessionItems;

  // Session form element
  const sessionFormWrapper = showSessionForm ? (
    <div style={sessionContainerStyle}>
      <NewSession gameId={game.id} onSuccess={() => setShowSessionForm(false)} />
    </div>
  ) : null;

  // Toggle button label
  const sessionToggleLabel = showSessionForm ? "Cancel" : "+ New Session";

  // Players list section
  const playersListSection = (
    <div style={sectionSpacing}>
      <div className="players-list">{playerCards}</div>
    </div>
  );

  // Sessions list section
  const sessionsSection = (
    <div className="character-card" style={sectionSpacing}>
      <h3>Sessions</h3>
      <button onClick={handleToggleSessionForm}>
        {sessionToggleLabel}
      </button>
      {sessionFormWrapper}
      <ul>{sessionsListUI}</ul>
    </div>
  );

  // Edit modal element
  const editModal = showEditModal ? (
    <Modal isOpen onClose={handleCloseEditModal}>
      <div className="modal-edit-container">
        <h1>Edit Game</h1>
        <Formik
          initialValues={{
            title: game.title || "",
            system: game.system || "",
            status: game.status || "",
            description: game.description || "",
            start_date: game.start_date || "",
            setting: game.setting || "",
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
              setErrors({ server: e.message });
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, errors }) => (
            <Form>
              {errors.server && <div className="error">{errors.server}</div>}
              <FormField label="Title" name="title" />
              <FormField label="System" name="system" />
              <FormField label="Status" name="status" />
              <FormField label="Description" name="description" as="textarea" />
              <FormField label="Start Date" name="start_date" type="date" />
              <FormField label="Setting" name="setting" />
              <div style={actionsContainerStyle}>
                <button type="submit" disabled={isSubmitting}>Save</button>
                <button type="button" onClick={handleCloseEditModal}>Cancel</button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </Modal>
  ) : null;

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
        {playersListSection}
        {sessionsSection}
      </div>
      {editModal}
    </>
  );
}

export default GamePage;