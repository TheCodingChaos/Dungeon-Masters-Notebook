

import React, { useContext, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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

function SessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { sessionData, setSessionData } = useContext(SessionContext);
  const [isEditing, setIsEditing] = useState(false);

  // Find session across all games
  const games = sessionData.user?.games || [];
  const sess = games.flatMap(g => g.sessions || [])
    .find(s => s.id === parseInt(sessionId, 10));

  if (!sess) {
    return (
      <div>
        <p>Session not found.</p>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    );
  }

  const handleDelete = async () => {
    const res = await fetch(`/sessions/${sess.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      // Remove from context
      setSessionData(prev => ({
        ...prev,
        user: {
          ...prev.user,
          games: prev.user.games.map(g => ({
            ...g,
            sessions: (g.sessions || []).filter(s => s.id !== sess.id)
          }))
        }
      }));
      navigate(`/games/${sess.game_id}`);
    }
  };

  const EditSessionSchema = Yup.object({
    date: Yup.date().required("Date is required"),
    summary: Yup.string(),
  });

  if (isEditing) {
    return (
      <div>
        <h1>Edit Session</h1>
        <Formik
          initialValues={{
            date: sess.date || "",
            summary: sess.summary || "",
          }}
          validationSchema={EditSessionSchema}
          onSubmit={async (values, { setSubmitting, setErrors }) => {
            try {
              const payload = {
                date: values.date || null,
                summary: values.summary,
              };
              const res = await fetch(`/sessions/${sess.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
              });
              if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to update session");
              }
              const updated = await res.json();
              // Update context
              setSessionData(prev => ({
                ...prev,
                user: {
                  ...prev.user,
                  games: prev.user.games.map(g => ({
                    ...g,
                    sessions: (g.sessions || []).map(s =>
                      s.id === updated.id ? updated : s
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
                <label htmlFor="date">Date</label>
                <Field name="date" type="date" />
                <ErrorMessage name="date" component="div" />
              </div>
              <div>
                <label htmlFor="summary">Summary</label>
                <Field name="summary" as="textarea" />
                <ErrorMessage name="summary" component="div" />
              </div>
              <button type="submit" disabled={isSubmitting}>
                Save
              </button>
              <button type="button" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            </Form>
          )}
        </Formik>
      </div>
    );
  }

  return (
    <div>
      <Link to={`/games/${sess.game_id}`}>← Back to Game</Link>
      <h1>Session on {formatDate(sess.date)}</h1>
      {sess.summary && <p>{sess.summary}</p>}
      <div style={{ marginTop: "1rem" }}>
        <button onClick={() => setIsEditing(true)}>Edit</button>
        <button onClick={handleDelete} style={{ marginLeft: "0.5rem" }}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default SessionPage;