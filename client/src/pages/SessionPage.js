import { useContext, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import FormField from "../components/FormField";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { SessionContext } from "../contexts/SessionContext";
import "../styles/pages.css"

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

  // Find session across all games using for-loops for clarity
  const games = sessionData.user?.games || [];
  let session = null;
  for (const game of games) {
    for (const s of game.sessions || []) {
      if (s.id === parseInt(sessionId, 10)) {
        session = s;
        break;
      }
    }
    if (session) break;
  }

  if (!session) {
    return (
      <div>
        <p>Session not found.</p>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    );
  }

  const handleDelete = async () => {
    const res = await fetch(`/sessions/${session.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      // Remove from context using forEach and variable assignment for clarity
      setSessionData(prev => {
        const newGames = prev.user.games.map(g => {
          const newSessions = (g.sessions || []).filter(s => s.id !== session.id);
          return { ...g, sessions: newSessions };
        });
        return {
          ...prev,
          user: {
            ...prev.user,
            games: newGames
          }
        };
      });
      navigate(`/games/${session.game_id}`);
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
            date: session.date || "",
            summary: session.summary || "",
          }}
          validationSchema={EditSessionSchema}
          onSubmit={async (values, { setSubmitting, setErrors }) => {
            try {
              const payload = {
                date: values.date || null,
                summary: values.summary,
              };
              const res = await fetch(`/sessions/${session.id}`, {
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
              // Update context with clearer logic
              setSessionData(prev => {
                const newGames = prev.user.games.map(g => {
                  const newSessions = (g.sessions || []).map(s =>
                    s.id === updated.id ? updated : s
                  );
                  return { ...g, sessions: newSessions };
                });
                return {
                  ...prev,
                  user: {
                    ...prev.user,
                    games: newGames
                  }
                };
              });
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
              <FormField label="Date" name="date" type="date" />
              <FormField label="Summary" name="summary" as="textarea" />
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
    <div className="session-page">
      <Link to={`/games/${session.game_id}`}>← Back to Game</Link>
      <h1>Session on {formatDate(session.date)}</h1>
      {session.summary && <p>{session.summary}</p>}
      <div className="session-actions">
        <button onClick={() => setIsEditing(true)}>Edit</button>
        <button onClick={handleDelete} className="session-delete-button">
          Delete
        </button>
      </div>
    </div>
  );
}

export default SessionPage;