import React from 'react';
import { Formik, Form } from 'formik';
import callApi from '../utils/CallApi';
import FormField from "./FormField";
import * as Yup from "yup";

// Define robust validation schema for new game form
const NewGameSchema = Yup.object().shape({
  title: Yup.string()
    .min(3, 'Title is too short')
    .required('Title is required'),
  system: Yup.string()
    .min(2, 'System name is too short')
    .required('System is required'),
  status: Yup.string().required('Status is required'),
  description: Yup.string().max(1000, 'Description is too long'),
  start_date: Yup.date()
    .nullable()
    .transform(value => (value instanceof Date && !isNaN(value) ? value : null)),
  setting: Yup.string().max(200, 'Setting is too long'),
});

export default function NewGame({ onSuccess }) {
  // Initial form values
  const initialFormValues = {
    title: '',
    system: '',
    status: '',
    description: '',
    start_date: '',
    setting: '',
  };

  // Extracted submit handler with robust error parsing
  const handleNewGameSubmit = async (values, { resetForm, setErrors, setSubmitting }) => {
    try {
      const gameData = {
        ...values,
        start_date: values.start_date || null,
      };
      const newGame = await callApi('/games', {
        method: 'POST',
        body: JSON.stringify(gameData),
      });
      if (newGame && newGame.id) {
        resetForm();
        if (onSuccess) onSuccess(newGame);
      } else {
        console.warn('Unexpected API response:', newGame);
        setErrors({ server: 'Failed to create game: Unexpected server response.' });
      }
    } catch (err) {
      console.error('Error creating game:', err);
      if (err.errors && typeof err.errors === 'object' && !Array.isArray(err.errors)) {
        setErrors(err.errors);
      } else {
        setErrors({ server: err.message || 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Extracted render helper for form fields
  const renderFormFields = ({ isSubmitting, errors, values, setFieldValue }) => (
    <Form noValidate>
      {errors.server && <div className="error">{errors.server}</div>}

      <FormField
        label="Title"
        name="title"
        type="text"
        placeholder="Enter the game title"
      />
      <FormField
        label="System"
        name="system"
        type="text"
        placeholder="e.g., Dungeons & Dragons 5e"
      />
      <FormField
        label="Status"
        name="status"
        type="text"
        placeholder="e.g., Active, Planning"
      />
      <FormField
        label="Description"
        name="description"
        as="textarea"
        placeholder="Brief synopsis..."
      />
      <FormField
        label="Start Date"
        name="start_date"
        type="date"
      />
      <FormField
        label="Setting"
        name="setting"
        type="text"
        placeholder="e.g., Forgotten Realms"
      />

      <div className="form-actions">
        <button
          type="submit"
          disabled={isSubmitting}
          className="button submit-button"
        >
          {isSubmitting ? "Saving..." : "Create Game"}
        </button>
      </div>
    </Form>
  );

  return (
    <div className="new-game-form-container">
      <h3>Create New Game</h3>
      <Formik
        initialValues={initialFormValues}
        validationSchema={NewGameSchema}
        onSubmit={handleNewGameSubmit}
      >
        {renderFormFields}
      </Formik>
    </div>
  );
}