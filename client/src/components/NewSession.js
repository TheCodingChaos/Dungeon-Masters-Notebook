import { useContext } from "react";
import FormField from "./FormField";
import { SessionContext } from "../contexts/SessionContext";
import * as Yup from "yup";
import { Formik, Form } from 'formik';
import callApi from '../utils/CallApi';

// Define validation schema for a new session
const NewSessionSchema = Yup.object({
  date: Yup.date().required("Date is required"),
  summary: Yup.string(),
});

// Component for creating a new game session
export default function NewSession({ gameId, onSuccess }) {
  const { setSessionData } = useContext(SessionContext);

  return (
    <Formik
      initialValues={{ date: '', summary: '' }}
      validationSchema={NewSessionSchema}
      onSubmit={async (values, { setSubmitting, resetForm, setErrors }) => {
        try {
          const newSession = await callApi(
            `/games/${gameId}/sessions`,
            {
              method: 'POST',
              body: JSON.stringify(values),
            }
          );
          // Update context: append to this game's sessions
          setSessionData(prev => {
            const updatedGames = prev.user.games.map(g => {
              if (g.id === gameId) {
                return { ...g, sessions: [...(g.sessions||[]), newSession] };
              }
              return g;
            });
            return { ...prev, user: { ...prev.user, games: updatedGames } };
          });
          resetForm();
          if (onSuccess) onSuccess(newSession);
        } catch (err) {
          setErrors({ server: err.message });
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, errors }) => (
        <Form>
          {errors.server && <div className="error">{errors.server}</div>}
          <FormField label="Date" name="date" type="date" />
          <FormField label="Summary" name="summary" as="textarea" />
          <button type="submit" disabled={isSubmitting}>Save</button>
        </Form>
      )}
    </Formik>
  );
}