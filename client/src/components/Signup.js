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

  return (
    <div className="auth-page">
      <Formik
        initialValues={{ username: "", password: "" }}
        validationSchema={SignupSchema}
        onSubmit={async (values, { setSubmitting, setErrors }) => {
          try {
            // Step 1: Submit signup form to the server
            await callApi("/signup", {
              method: "POST",
              body: JSON.stringify(values),
            });

            // Step 2: Fetch user session after successful signup
            const sessionUser = await callApi("/check_session");

            // Step 3: Update session context
            setSessionData((prev) => ({
              ...prev,
              user: sessionUser,
            }));

            // Step 4: Redirect to dashboard
            navigate("/dashboard");
          } catch (err) {
            // Step 5: Handle any server-side errors
            setErrors({ server: err.message });
          } finally {
            // Step 6: Turn off submitting indicator
            setSubmitting(false);
          }
        }}
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