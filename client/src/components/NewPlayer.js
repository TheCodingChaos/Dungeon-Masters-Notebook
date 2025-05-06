import React, { useContext } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { SessionContext } from "../contexts/SessionContext";

const NewPlayerSchema = Yup.object({
  name: Yup.string().required("Name is required"),
});

export default function NewPlayer({ gameId, onSuccess }) {
  const { sessionData, setSessionData } = useContext(SessionContext);

  return (
    <Formik
      initialValues={{ name: "" }}
      validationSchema={NewPlayerSchema}
      onSubmit={async (values, { setSubmitting, setErrors, resetForm }) => {
        try {
          const res = await fetch(`/games/${gameId}/players`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ name: values.name }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to create player");
          }
          const newPlayer = await res.json();
          setSessionData(prev => ({
            ...prev,
            user: {
              ...prev.user,
              games: prev.user.games.map(g =>
                g.id === gameId
                  ? { ...g, players: [...(g.players || []), newPlayer] }
                  : g
              ),
            },
          }));
          resetForm();
          if (onSuccess) onSuccess();
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
          <div>
            <label htmlFor="name">Player Name</label>
            <Field name="name" type="text" />
            <ErrorMessage name="name" component="div" />
          </div>
          <button type="submit" disabled={isSubmitting}>
            Add Player
          </button>
        </Form>
      )}
    </Formik>
  );
}

