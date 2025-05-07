

import React, { useContext } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { SessionContext } from "../contexts/SessionContext";

const NewSessionSchema = Yup.object({
  date: Yup.date().required("Date is required"),
  summary: Yup.string(),
});

export default function NewSession({ gameId, onSuccess }) {
  const { setSessionData } = useContext(SessionContext);

  return (
    <Formik
      initialValues={{ date: "", summary: "" }}
      validationSchema={NewSessionSchema}
      onSubmit={async (values, { setSubmitting, setErrors, resetForm }) => {
        try {
          const payload = {
            date: values.date || null,
            summary: values.summary,
          };
          const res = await fetch(`/games/${gameId}/sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to create session");
          }
          const newSession = await res.json();
          // Update context: append to correct game
          setSessionData(prev => ({
            ...prev,
            user: {
              ...prev.user,
              games: prev.user.games.map(g =>
                g.id === parseInt(gameId, 10)
                  ? { ...g, sessions: [...(g.sessions || []), newSession] }
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
            Add Session
          </button>
        </Form>
      )}
    </Formik>
  );
}