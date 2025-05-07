import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

const NewPlayerSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  summary: Yup.string(),
});

export default function NewPlayer({ gameId, onSuccess }) {
  return (
    <Formik
      initialValues={{ name: "", summary: "" }}
      validationSchema={NewPlayerSchema}
      onSubmit={async (values, { setSubmitting, setErrors, resetForm }) => {
        try {
          const res = await fetch(`/games/${gameId}/players`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ name: values.name, summary: values.summary }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to create player");
          }
          const newPlayer = await res.json();
          resetForm();
          if (onSuccess) onSuccess(newPlayer);
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
          <div>
            <label htmlFor="summary">Summary</label>
            <Field name="summary" as="textarea" />
            <ErrorMessage name="summary" component="div" />
          </div>
          <button type="submit" disabled={isSubmitting}>
            Add Player
          </button>
        </Form>
      )}
    </Formik>
  );
}

