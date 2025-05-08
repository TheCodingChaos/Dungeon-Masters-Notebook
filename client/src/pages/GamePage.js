
import React, { useContext, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import NewPlayer from "../components/NewPlayer";
import NewCharacter from "../components/NewCharacter";
import NewSession from "../components/NewSession";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { SessionContext } from "../contexts/SessionContext";
import PlayerCard from "../components/PlayerCard";

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
  const [openCharFor, setOpenCharFor] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const [showPlayerForm, setShowPlayerForm] = useState(false);
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

  const handleDelete = async () => {
    const res = await fetch(`/games/${gameId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setSessionData(prev => ({
        ...prev,
        user: {
          ...prev.user,
          games: prev.user.games.filter(g => g.id !== parseInt(gameId, 10))
        }
      }));
      navigate("/dashboard");
    }
  };

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
              <div><label>Title</label><Field name="title" /><ErrorMessage name="title" /></div>
              <div><label>System</label><Field name="system" /><ErrorMessage name="system" /></div>
              <div><label>Status</label><Field name="status" /><ErrorMessage name="status" /></div>
              <div><label>Description</label><Field name="description" as="textarea" /><ErrorMessage name="description" /></div>
              <div><label>Start Date</label><Field name="start_date" type="date" /><ErrorMessage name="start_date" /></div>
              <div><label>Setting</label><Field name="setting" /><ErrorMessage name="setting" /></div>
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

  // Players list and form toggle logic
  const playersList = Array.isArray(game.players)
    ? game.players.filter(player => player != null)
    : [];
  // Remove duplicate players
  const uniquePlayers = playersList.filter(
    (p, i, arr) => arr.findIndex(x => x.id === p.id) === i
  );
  /*   const playerItems = uniquePlayers.length > 0
      ? uniquePlayers.map(player => (
        <li key={player.id}>
          <Link to={`/players/${player.id}`}>{player.name}</Link>
        </li>
      ))
      : <li>No players yet</li>; */

  const playerFormElement = showPlayerForm && (
    <div style={{ margin: "1rem 0" }}>
      <NewPlayer
        gameId={game.id}
        onSuccess={(newPlayer) => {
          // Close form and append the new player to this game in context
          setShowPlayerForm(false);
          setSessionData(prev => ({
            ...prev,
            user: {
              ...prev.user,
              games: prev.user.games.map(g =>
                g.id === game.id
                  ? { ...g, players: [...(g.players || []), newPlayer] }
                  : g
              )
            }
          }));
        }}
      />
    </div>
  );

  const playerToggleLabel = showPlayerForm ? "Cancel" : "+ New Player";

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

  // Precompute UI sections for pure JSX return
  const characterItems = (game.players || []).flatMap(p =>
    (p.characters || []).map(c => (
      <li key={c.id} style={{ marginBottom: "0.5rem" }}>
        {c.name} ({c.character_class} L{c.level}) — {c.is_active ? "Active" : "Inactive"} — {p.name}
      </li>
    ))
  );

  const playersListUI = uniquePlayers.length > 0
    ? uniquePlayers.map(player => (
      <li key={player.id} style={{ marginBottom: "1rem" }}>
        <Link to={`/players/${player.id}`}>{player.name}</Link>
        <button
          onClick={() =>
            setOpenCharFor(openCharFor === player.id ? null : player.id)
          }
          style={{ marginLeft: "0.5rem" }}
        >
          {openCharFor === player.id ? "Cancel" : "+ Add Character"}
        </button>
        {openCharFor === player.id && (
          <NewCharacter
            gameId={game.id}
            playerId={player.id}
            onSuccess={newChar => {
              setOpenCharFor(null);
              setSessionData(prev => ({
                ...prev,
                user: {
                  ...prev.user,
                  games: prev.user.games.map(g =>
                    g.id === game.id
                      ? {
                        ...g,
                        players: g.players.map(pl =>
                          pl.id === player.id
                            ? { ...pl, characters: [...(pl.characters || []), newChar] }
                            : pl
                        )
                      }
                      : g
                  )
                }
              }));
            }}
          />
        )}
      </li>
    ))
    : <li>No players yet</li>;

  const sessionsListUI = sessionItems;

  // DETAIL VIEW
  return (
    <div>
      <Link to="/dashboard">← Back to Dashboard</Link>
      <h1>{game.title}</h1>
      <p><strong>System:</strong> {game.system}</p>
      {game.description && (<p><strong>Description:</strong> {game.description}</p>)}
      {game.start_date && (<p><strong>Start Date:</strong> {formatDate(game.start_date)}</p>)}
      {game.setting && (<p><strong>Setting:</strong> {game.setting}</p>)}
      <p><strong>Status:</strong> {game.status}</p>
      <div style={{ marginTop: "1rem" }}>
        <h3>Characters</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {characterItems}
        </ul>
      </div>
      <div style={{ marginTop: "1rem" }}>
        <div className="players-list">
          {playerCards}
        </div>
      </div>
      <div style={{ marginTop: "1rem" }}>
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