

import React, { useContext } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { SessionContext } from "../contexts/SessionContext";

const NewGameSchema = Yup.object({
  title: Yup.string().required("Title is required"),
  system: Yup.string().required("System is required"),
  status: Yup.string().required("Status is required"),
  description: Yup.string(),
  start_date: Yup.date().nullable(),
  setting: Yup.string(),
});

export default function NewGame({ onSuccess }) {
  const { sessionData, setSessionData } = useContext(SessionContext);

  return (
    <Formik
      initialValues={{
        title: "",
        system: "",
        status: "",
        description: "",
        start_date: "",
        setting: "",
      }}
      validationSchema={NewGameSchema}
      onSubmit={async (values, { setSubmitting, setErrors, resetForm }) => {
        try {
          // Convert empty date string to null
          const payload = { ...values, start_date: values.start_date || null };
          const res = await fetch("/games", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to create game");
          }
          const newGame = await res.json();
          setSessionData(prev => ({
            ...prev,
            user: {
              ...prev.user,
              games: [...(prev.user.games || []), newGame]
            }
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
            <label htmlFor="title">Title</label>
            <Field name="title" type="text" />
            <ErrorMessage name="title" component="div" />
          </div>
          <div>
            <label htmlFor="system">System</label>
            <Field name="system" type="text" />
            <ErrorMessage name="system" component="div" />
          </div>
          <div>
            <label htmlFor="status">Status</label>
            <Field name="status" type="text" />
            <ErrorMessage name="status" component="div" />
          </div>
          <div>
            <label htmlFor="description">Description</label>
            <Field name="description" as="textarea" />
            <ErrorMessage name="description" component="div" />
          </div>
          <div>
            <label htmlFor="start_date">Start Date</label>
            <Field name="start_date" type="date" />
            <ErrorMessage name="start_date" component="div" />
          </div>
          <div>
            <label htmlFor="setting">Setting</label>
            <Field name="setting" type="text" />
            <ErrorMessage name="setting" component="div" />
          </div>
          <button type="submit" disabled={isSubmitting}>
            Create Game
          </button>
        </Form>
      )}
    </Formik>
  );
}