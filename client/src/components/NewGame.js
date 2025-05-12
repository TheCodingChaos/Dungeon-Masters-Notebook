import { Formik, Form } from 'formik';
import callApi from '../utils/CallApi';
import FormField from "./FormField";
import * as Yup from "yup";

// Define validation schema for new game form
const NewGameSchema = Yup.object({
  title: Yup.string().required("Title is required"),
  system: Yup.string().required("System is required"),
  status: Yup.string().required("Status is required"),
  description: Yup.string(),
  start_date: Yup.date().nullable(),
  setting: Yup.string(),
});

export default function NewGame({ onSuccess }) {
  return (
    <Formik
      initialValues={{
        title: '',
        system: '',
        status: '',
        description: '',
        start_date: '',
        setting: '',
      }}
      validationSchema={NewGameSchema}
      onSubmit={async (values, { setSubmitting, resetForm, setErrors }) => {
        try {
          const newGame = await callApi('/games', {
            method: 'POST',
            body: JSON.stringify(values),
          });
          resetForm();
          if (onSuccess) onSuccess(newGame);
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
          <FormField label="Title" name="title" />
          <FormField label="System" name="system" />
          <FormField label="Status" name="status" />
          <FormField label="Description" name="description" as="textarea" />
          <FormField label="Start Date" name="start_date" type="date" />
          <FormField label="Setting" name="setting" />
          <button type="submit" disabled={isSubmitting}>
            Save
          </button>
        </Form>
      )}
    </Formik>
  );
}