
import React, { useContext, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import NewPlayer from "../components/NewPlayer";
import NewSession from "../components/NewSession";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { SessionContext } from "../contexts/SessionContext";

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
              <div><label>Title</label><Field name="title" /><ErrorMessage name="title"/></div>
              <div><label>System</label><Field name="system"/><ErrorMessage name="system"/></div>
              <div><label>Status</label><Field name="status"/><ErrorMessage name="status"/></div>
              <div><label>Description</label><Field name="description" as="textarea"/><ErrorMessage name="description"/></div>
              <div><label>Start Date</label><Field name="start_date" type="date"/><ErrorMessage name="start_date"/></div>
              <div><label>Setting</label><Field name="setting"/><ErrorMessage name="setting"/></div>
              <button type="submit" disabled={isSubmitting}>Save</button>
              <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
            </Form>
          )}
        </Formik>
      </div>
    );
  }

  // Players list and form toggle logic
  const playerItems = game.players?.length
    ? game.players.map(player => (
        <li key={player.id}>
          <Link to={`/players/${player.id}`}>{player.name}</Link>
        </li>
      ))
    : <li>No players yet</li>;

  const playerFormElement = showPlayerForm && (
    <div style={{ margin: "1rem 0" }}>
      <NewPlayer gameId={game.id} onSuccess={() => setShowPlayerForm(false)} />
    </div>
  );

  const playerToggleLabel = showPlayerForm ? "Cancel" : "+ New Player";

  // Sessions list and form toggle logic
  const sessionItems = game.sessions?.length
    ? game.sessions.map(sess => (
        <li key={sess.id}>
          <Link to={`/sessions/${sess.id}`}>
            {formatDate(sess.date)}{sess.summary ? `: ${sess.summary}` : ""}
          </Link>
        </li>
      ))
    : <li>No sessions yet</li>;

  const sessionFormElement = showSessionForm && (
    <div style={{ margin: "1rem 0" }}>
      <NewSession gameId={game.id} onSuccess={() => setShowSessionForm(false)} />
    </div>
  );

  const sessionToggleLabel = showSessionForm ? "Cancel" : "+ New Session";

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
        <h3>Players</h3>
        <button onClick={() => setShowPlayerForm(!showPlayerForm)}>
          {playerToggleLabel}
        </button>
        {playerFormElement}
        <ul>{playerItems}</ul>
      </div>
      <div style={{ marginTop: "1rem" }}>
        <h3>Sessions</h3>
        <button onClick={() => setShowSessionForm(!showSessionForm)}>
          {sessionToggleLabel}
        </button>
        {sessionFormElement}
        <ul>{sessionItems}</ul>
      </div>
      <div style={{ marginTop: "1rem" }}>
        <button onClick={() => setIsEditing(true)}>Edit</button>
        <button onClick={handleDelete} style={{ marginLeft: "0.5rem" }}>Delete</button>
      </div>
    </div>
  );
}

export default GamePage;