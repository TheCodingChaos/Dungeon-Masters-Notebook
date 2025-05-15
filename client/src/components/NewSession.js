import React, { useContext } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import callApi from '../utils/CallApi';
import FormField from './FormField';
import { SessionContext } from '../contexts/SessionContext';
import '../styles/pages.css';

// Helper to default the date field to today
const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Robust validation schema
const NewSessionSchema = Yup.object().shape({
  date: Yup.date()
    .required('Date is required'),
  summary: Yup.string()
    .max(2000, 'Summary is too long')
    .nullable(),
});

export default function NewSession({ gameId, onSuccess }) {
  const { setSessionData } = useContext(SessionContext);

  // Initial form values with today's date
  const initialNewSessionValues = {
    date: getTodayDateString(),
    summary: '',
  };

  // Submission handler with strong error parsing
  const handleCreateSessionSubmit = async (values, { setErrors, resetForm, setSubmitting }) => {
    try {
      const payload = {
        date: values.date,
        summary: values.summary || null,
      };
      const newEntry = await callApi(
        `/games/${gameId}/sessions`,
        { method: 'POST', body: JSON.stringify(payload) }
      );

      if (newEntry?.id) {
        // Append to the correct game's sessions in context
        setSessionData(prev => ({
          ...prev,
          user: {
            ...prev.user,
            games: prev.user.games.map(g =>
              g.id === gameId
                ? { ...g, sessions: [...(g.sessions || []), newEntry] }
                : g
            )
          }
        }));
        resetForm();
        onSuccess?.(newEntry);
      } else {
        console.warn('Unexpected API response:', newEntry);
        setErrors({ server: 'Failed to create session: Unexpected server response.' });
      }
    } catch (err) {
      console.error('Error creating session:', err);
      if (err.errors && typeof err.errors === 'object' && !Array.isArray(err.errors)) {
        setErrors(err.errors);
      } else {
        setErrors({ server: err.message || 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Render helper for the form fields
  const renderSessionFormFields = ({ isSubmitting, errors }) => (
    <Form noValidate className="new-session-form">
      {errors.server && (
        <div className="error-message server-error">{errors.server}</div>
      )}

      <FormField
        label="Session Date"
        name="date"
        type="date"
      />
      <FormField
        label="Summary (Optional)"
        name="summary"
        as="textarea"
        placeholder="Key events, decisions, or memorable moments"
      />

      <div className="form-actions">
        <button
          type="submit"
          disabled={isSubmitting}
          className="button submit-button"
        >
          {isSubmitting ? 'Saving...' : 'Save Session'}
        </button>
      </div>
    </Form>
  );

  return (
    <div className="new-session-container">
      <h3>Log New Game Session</h3>
      <Formik
        initialValues={initialNewSessionValues}
        validationSchema={NewSessionSchema}
        onSubmit={handleCreateSessionSubmit}
        enableReinitialize
      >
        {renderSessionFormFields}
      </Formik>
    </div>
  );
}