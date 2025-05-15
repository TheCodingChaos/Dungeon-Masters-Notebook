import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import callApi from '../utils/CallApi';
import FormField from './FormField';
import { SessionContext } from '../contexts/SessionContext';
import '../styles/pages.css';
import '../components/FormField.css';

const SignupValidationSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .required('Username is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

const initialSignupFormValues = {
  username: '',
  password: '',
};

const renderSignupFormFields = ({ isSubmitting, errors }) => (
  <div className="form-wrapper">
    <Form noValidate>
      {errors.server && <div className="error-message server-error">{errors.server}</div>}
      <FormField
        label="Username"
        name="username"
        type="text"
        placeholder="Choose a unique username"
        autoComplete="username"
      />
      <FormField
        label="Password"
        name="password"
        type="password"
        placeholder="Create a secure password"
        autoComplete="new-password"
      />
      <div className="form-actions">
        <button type="submit" disabled={isSubmitting} className="button submit-button">
          {isSubmitting ? 'Creating Account...' : 'Sign Up'}
        </button>
      </div>
    </Form>
  </div>
);

export default function Signup() {
  const { setSessionData } = useContext(SessionContext);
  const navigate = useNavigate();

  const handleSignupFormSubmit = async (values, { setErrors, resetForm, setSubmitting }) => {
    try {
      await callApi('/signup', {
        method: 'POST',
        body: JSON.stringify({ username: values.username, password: values.password }),
      });
      const sessionUser = await callApi('/check_session');
      if (sessionUser?.id) {
        setSessionData(prev => ({ ...prev, user: sessionUser }));
        navigate('/dashboard');
      } else {
        console.warn('/check_session did not return a valid user after signup.');
        setErrors({ server: 'Signup succeeded, but failed to initialize session. Please log in.' });
      }
      resetForm();
    } catch (err) {
      console.error('Signup error:', err);
      if (err.errors && typeof err.errors === 'object' && !Array.isArray(err.errors)) {
        setErrors(err.errors);
      } else {
        setErrors({ server: err.message || 'Signup failed. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page signup-page">
      <h2>Create Account</h2>
      <Formik
        initialValues={initialSignupFormValues}
        validationSchema={SignupValidationSchema}
        onSubmit={handleSignupFormSubmit}
      >
        {renderSignupFormFields}
      </Formik>
    </div>
  );
}