import React, { useContext, useState, useEffect } from 'react';
import callApi from '../utils/CallApi';
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

  useEffect(() => {
    if (session === null) {
      navigate("/dashboard", { replace: true });
    }
  }, [session, navigate]);
  if (!session) return null;

  if (!session) {
    return (
      <div>
        <p>Session not found.</p>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await callApi(`/sessions/${session.id}`, { method: 'DELETE' });
      setSessionData(prev => ({
        ...prev,
        user: {
          ...prev.user,
          games: prev.user.games.map(g => ({
            ...g,
            sessions: (g.sessions || []).filter(s => s.id !== session.id)
          }))
        }
      }));
      navigate(`/games/${session.game_id}`, { replace: true });
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  const EditSessionSchema = Yup.object().shape({
    date: Yup.date()
      .required('Date is required'),
    summary: Yup.string()
      .max(2000, 'Summary is too long')
      .nullable(),
  });

  // --- Edit Session Form render helper ---
  const renderEditSessionForm = ({ isSubmitting, errors }) => (
    <Form noValidate className="edit-session-form">
      <h3>Edit Session</h3>
      {errors.server && <div className="error-message server-error">{errors.server}</div>}
      <FormField label="Date" name="date" type="date" />
      <FormField label="Summary (Optional)" name="summary" as="textarea" placeholder="Key events, notes, or outcomes..." />
      <div className="form-actions">
        <button type="submit" disabled={isSubmitting} className="button submit-button">
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
        <button type="button" onClick={() => setIsEditing(false)} className="button cancel-button" style={{ marginLeft: '0.5rem' }}>
          Cancel
        </button>
      </div>
    </Form>
  );

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
              const updated = await callApi(`/sessions/${session.id}`, {
                method: "PATCH",
                body: JSON.stringify(payload),
              });
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
          enableReinitialize
        >
          {renderEditSessionForm}
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