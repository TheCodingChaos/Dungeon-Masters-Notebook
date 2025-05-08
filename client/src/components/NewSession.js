

import FormField from "./FormField";

import React from "react";
import * as Yup from "yup";
import CrudForm from "../hooks/useCRUDForm";

const NewSessionSchema = Yup.object({
  date: Yup.date().required("Date is required"),
  summary: Yup.string(),
});

export default function NewSession({ gameId, onSuccess }) {
  return (
    <CrudForm
      path={`/games/${gameId}/sessions`}
      initialValues={{ date: "", summary: "" }}
      validationSchema={NewSessionSchema}
      onSubmitSuccess={newSession => {
        // Update context and call onSuccess if provided
        // setSessionData is expected to be handled in parent via onSuccess if needed
        if (typeof window !== "undefined" && window.setSessionData) {
          window.setSessionData(prev => ({
            ...prev,
            user: {
              ...prev.user,
              games: prev.user.games.map(g =>
                g.id === parseInt(gameId, 10)
                  ? { ...g, sessions: [...(g.sessions||[]), newSession] }
                  : g
              ),
            },
          }));
        }
        onSuccess && onSuccess(newSession);
      }}
    >
      <FormField label="Date" name="date" type="date" />
      <FormField label="Summary" name="summary" as="textarea" />
    </CrudForm>
  );
}