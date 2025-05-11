
import { useContext, useState } from "react";
import { useParams, Link } from "react-router-dom";
import NewSession from "../components/NewSession";
import FormField from "../components/FormField";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { SessionContext } from "../contexts/SessionContext";
import PlayerCard from "../components/PlayerCard";
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
  const [isEditing, setIsEditing] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
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


  // If game not found
  if (!game) {
    return (
      <div>
        <p>Game not found.</p>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    );
  }

  // EDITING VIEW
  if (isEditing) {
    return (
      <div>
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
              // Normalize empty date to null
              const payload = { ...values, start_date: values.start_date || null };
              const res = await fetch(`/games/${gameId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
              });
              if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to update");
              }
              const updated = await res.json();
              // Update context
              setSessionData(prev => ({
                ...prev,
                user: {
                  ...prev.user,
                  games: prev.user.games.map(g => g.id === updated.id ? updated : g)
                }
              }));
              setIsEditing(false);
            } catch (e) {
              setErrors({ server: e.message });
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, errors }) => (
            <Form>
              {errors.server && <div>{errors.server}</div>}
              <FormField label="Title" name="title" />
              <FormField label="System" name="system" />
              <FormField label="Status" name="status" />
              <FormField label="Description" name="description" as="textarea" />
              <FormField label="Start Date" name="start_date" type="date" />
              <FormField label="Setting" name="setting" />
              <button type="submit" disabled={isSubmitting}>Save</button>
              <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
            </Form>
          )}
        </Formik>
      </div>
    );
  }
  // Precompute UI bits for a pure-JSX return
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

  /*   const playerItems = uniquePlayers.length > 0
      ? uniquePlayers.map(player => (
        <li key={player.id}>
          <Link to={`/players/${player.id}`}>{player.name}</Link>
        </li>
      ))
      : <li>No players yet</li>; */


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

  const sessionFormElement = showSessionForm && (
    <div style={{ margin: "1rem 0" }}>
      <NewSession gameId={game.id} onSuccess={() => setShowSessionForm(false)} />
    </div>
  );

  const sessionToggleLabel = showSessionForm ? "Cancel" : "+ New Session";

  // const characterItems = (game.players || []).flatMap(p =>
  //   (p.characters || []).map(c => (
  //     <li key={c.id} style={{ marginBottom: "0.5rem" }}>
  //       {c.name} ({c.character_class} L{c.level}) — {c.is_active ? "Active" : "Inactive"} — {p.name}
  //     </li>
  //   ))
  // );

  const sessionsListUI = sessionItems;

  // DETAIL VIEW
  return (
    <div className="game-page">
      <Link to="/dashboard">← Back to Dashboard</Link>
      <div className="game-card">
        <h1>{game.title}</h1>
        <p><strong>System:</strong> {game.system}</p>
        {game.description && (<p><strong>Description:</strong> {game.description}</p>)}
        {game.start_date && (<p><strong>Start Date:</strong> {formatDate(game.start_date)}</p>)}
        {game.setting && (<p><strong>Setting:</strong> {game.setting}</p>)}
        <p><strong>Status:</strong> {game.status}</p>
      </div>
      <div style={{ marginTop: "1rem" }}>
        <div className="players-list">
          {playerCards}
        </div>
      </div>
      <div className="character-card" style={{ marginTop: "1rem" }}>
        <h3>Sessions</h3>
        <button onClick={() => setShowSessionForm(!showSessionForm)}>
          {sessionToggleLabel}
        </button>
        {sessionFormElement}
        <ul>{sessionsListUI}</ul>
      </div>
    </div>
  );
}

export default GamePage;