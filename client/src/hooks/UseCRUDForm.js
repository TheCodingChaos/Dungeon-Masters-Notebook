

import React from 'react';
import { Formik, Form } from 'formik';

/**
 * useCrudForm: wraps Formik boilerplate for create/edit forms.
 * Props:
 *  - path: API endpoint (string)
 *  - initialValues: object for form initial values
 *  - validationSchema: Yup schema
 *  - onSubmitSuccess: callback(data)
 *  - children: JSX form fields
 */
export default function UseCrudForm({
  path,
  initialValues,
  validationSchema,
  onSubmitSuccess,
  children
}) {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting, resetForm, setErrors }) => {
        try {
          const response = await fetch(path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(values),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Submit failed');
          resetForm();
          if (onSubmitSuccess) onSubmitSuccess(data);
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
          {children}
          <button type="submit" disabled={isSubmitting}>
            Save
          </button>
        </Form>
      )}
    </Formik>
  );
}