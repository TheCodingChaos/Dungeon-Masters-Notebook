
import { Formik, Form } from 'formik';

/**
 * UseCrudForm: a wrapper component to simplify Formik form creation.
 *
 * Props:
 *  - path: string (API endpoint for POST request)
 *  - initialValues: object (initial values for the form)
 *  - validationSchema: Yup object (schema for validation)
 *  - onSubmitSuccess: function to call if POST is successful
 *  - children: JSX form inputs
 */
export default function UseCrudForm({
  path,
  initialValues,
  validationSchema,
  onSubmitSuccess,
  children,
}) {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting, resetForm, setErrors }) => {
        try {
          // Step 1: Send POST request with form values
          const response = await fetch(path, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(values),
          });

          // Step 2: Parse JSON response
          const data = await response.json();

          // Step 3: If server responded with error, throw it
          if (!response.ok) {
            throw new Error(data.error || 'Submit failed');
          }

          // Step 4: Reset the form after successful submission
          resetForm();

          // Step 5: Trigger success callback
          if (onSubmitSuccess) {
            onSubmitSuccess(data);
          }
        } catch (err) {
          // Step 6: Handle errors and show message in form
          setErrors({ server: err.message });
        } finally {
          // Step 7: Turn off submitting indicator
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, errors }) => (
        <Form>
          {/* Display server error if one occurs */}
          {errors.server && <div className="error">{errors.server}</div>}

          {/* Render form inputs */}
          {children}

          {/* Submit button */}
          <button type="submit" disabled={isSubmitting}>
            Save
          </button>
        </Form>
      )}
    </Formik>
  );
}