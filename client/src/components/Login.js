import callApi from "../utils/CallApi";
import FormField from "./FormField";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { SessionContext } from "../contexts/SessionContext";
import "../styles/pages.css";
import "../components/FormField.css";

// Define validation schema for the login form
const LoginSchema = Yup.object({
  username: Yup.string().required("Required"),
  password: Yup.string().required("Required"),
});

function Login() {
  const { setSessionData } = useContext(SessionContext);
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <Formik
        initialValues={{ username: "", password: "" }}
        validationSchema={LoginSchema}
        onSubmit={async (values, { setSubmitting, setErrors }) => {
          try {
            // Send login request and get back the user data
            const user = await callApi("/login", {
              method: "POST",
              body: JSON.stringify(values),
            });
            // Set session directly and navigate
            setSessionData(prev => ({ ...prev, user }));
            navigate("/dashboard");
          } catch (err) {
            // Set server error to display in form
            setErrors({ server: err.message });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting, errors }) => (
          <div className="form-wrapper">
            <Form>
              {/* Display server error if exists */}
              {errors.server && <div className="error">{errors.server}</div>}

              {/* Username input field */}
              <FormField label="Username" name="username" type="text" />

              {/* Password input field */}
              <FormField label="Password" name="password" type="password" />

              {/* Submit button */}
              <button type="submit" disabled={isSubmitting}>
                Login
              </button>
            </Form>
          </div>
        )}
      </Formik>
    </div>
  );
}

export default Login;