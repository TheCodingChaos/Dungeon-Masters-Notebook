
import React, { useContext, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { SessionContext } from "../contexts/SessionContext";

function GamePage() {
  const { gameId } = useParams();
  const { sessionData, setSessionData } = useContext(SessionContext);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const EditGameSchema = Yup.object({
    title: Yup.string().required("Required"),
    system: Yup.string().required("Required"),
    status: Yup.string().required("Required"),
    description: Yup.string(),
    start_date: Yup.date().nullable(),
    setting: Yup.string(),
  });
  const game = sessionData.user?.games.find(
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

  // DETAIL VIEW
  return (
    <div>
      <Link to="/dashboard">← Back to Dashboard</Link>
      <h1>{game.title}</h1>
      <p><strong>System:</strong> {game.system}</p>
      {game.description && (<p><strong>Description:</strong> {game.description}</p>)}
      {game.start_date && (<p><strong>Start Date:</strong> {game.start_date}</p>)}
      {game.setting && (<p><strong>Setting:</strong> {game.setting}</p>)}
      <p><strong>Status:</strong> {game.status}</p>
      <div style={{ marginTop: "1rem" }}>
        <button onClick={() => setIsEditing(true)}>Edit</button>
        <button onClick={handleDelete} style={{ marginLeft: "0.5rem" }}>Delete</button>
      </div>
    </div>
  );
}

export default GamePage;