
import React, { useContext, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { SessionContext } from "../contexts/SessionContext";

function PlayerPage() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { sessionData, setSessionData } = useContext(SessionContext);
  const [isEditing, setIsEditing] = useState(false);

  // Find the player across all games
  const games = sessionData.user?.games || [];
  const player = games
    .flatMap(g => g.players || [])
    .find(p => p.id === parseInt(playerId, 10));

  // Not found fallback
  if (!player) {
    return (
      <div>
        <p>Player not found.</p>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    );
  }

  // Delete handler
  const handleDelete = async () => {
    const res = await fetch(`/players/${player.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      // Remove player from context
      setSessionData(prev => ({
        ...prev,
        user: {
          ...prev.user,
          games: prev.user.games.map(g => ({
            ...g,
            players: (g.players || []).filter(pl => pl.id !== player.id)
          }))
        }
      }));
      navigate(`/games/${player.game_id}`);
    }
  };

  // Edit form schema
  const EditPlayerSchema = Yup.object({
    name: Yup.string().required("Name is required"),
  });

  // Editing view
  if (isEditing) {
    return (
      <div>
        <h1>Edit Player</h1>
        <Formik
          initialValues={{ name: player.name, summary: player.summary || "" }}
          validationSchema={EditPlayerSchema}
          onSubmit={async (values, { setSubmitting, setErrors }) => {
            try {
              // Submit patch
              const res = await fetch(`/players/${player.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ name: values.name }),
              });
              if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to update player");
              }
              const updated = await res.json();
              // Update context
              setSessionData(prev => ({
                ...prev,
                user: {
                  ...prev.user,
                  games: prev.user.games.map(g => ({
                    ...g,
                    players: (g.players || []).map(pl =>
                      pl.id === updated.id ? updated : pl
                    )
                  }))
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
              <div>
                <label htmlFor="name">Name</label>
                <Field name="name" type="text" />
                <ErrorMessage name="name" component="div" />
              </div>
              <div>
                <label htmlFor="summary">Summary</label>
                <Field name="summary" as="textarea" />
                <ErrorMessage name="summary" component="div" />
              </div>
              <button type="submit" disabled={isSubmitting}>Save</button>
              <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
            </Form>
          )}
        </Formik>
      </div>
    );
  }

  // Detail view
  return (
    <div>
      <Link to={`/games/${player.game_id}`}>← Back to Game</Link>
      <h1>{player.name}</h1>
      {player.summary && (
        <p><strong>Summary:</strong> {player.summary}</p>
      )}
      <div style={{ marginTop: "1rem" }}>
        <button onClick={() => setIsEditing(true)}>Edit</button>
        <button onClick={handleDelete} style={{ marginLeft: "0.5rem" }}>Delete</button>
      </div>
    </div>
  );
}

export default PlayerPage;