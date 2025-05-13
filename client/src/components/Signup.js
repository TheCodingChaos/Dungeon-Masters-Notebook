import callApi from "../utils/CallApi";
import FormField from "./FormField";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { SessionContext } from "../contexts/SessionContext";
import "../styles/pages.css";
import "../components/FormField.css";

// Validation rules for signup form
const SignupSchema = Yup.object({
  username: Yup.string().required("Required"),
  password: Yup.string().required("Required"),
});

function Signup() {
  const { setSessionData } = useContext(SessionContext);
  const navigate = useNavigate();

  // Initial form values
  const initialFormValues = { username: "", password: "" };

  // Form submission handler
  const handleFormSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      // Submit signup form
      await callApi("/signup", {
        method: "POST",
        body: JSON.stringify(values),
      });
      // Fetch and set session
      const sessionUser = await callApi("/check_session");
      setSessionData((prev) => ({ ...prev, user: sessionUser }));
      // Navigate to dashboard
      navigate("/dashboard");
    } catch (err) {
      setErrors({ server: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <Formik
        initialValues={initialFormValues}
        validationSchema={SignupSchema}
        onSubmit={handleFormSubmit}
      >
        {({ isSubmitting, errors }) => (
          <div className="form-wrapper">
            <Form>
              {/* Display server-side error message if present */}
              {errors.server && <div className="error">{errors.server}</div>}

              {/* Input for username */}
              <FormField label="Username" name="username" type="text" />

              {/* Input for password */}
              <FormField label="Password" name="password" type="password" />

              {/* Submit button */}
              <button type="submit" disabled={isSubmitting}>
                Sign Up
              </button>
            </Form>
          </div>
        )}
      </Formik>
    </div>
  );
}

export default Signup;