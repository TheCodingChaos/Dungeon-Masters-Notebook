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

  const handleLoginSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      const user = await callApi("/login", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setSessionData(prev => ({ ...prev, user }));
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
        initialValues={{ username: "", password: "" }}
        validationSchema={LoginSchema}
        onSubmit={handleLoginSubmit}
      >
        {({ isSubmitting, errors }) => (
          <div className="form-wrapper">
            <Form>
              {errors.server && <div className="error">{errors.server}</div>}
              <FormField label="Username" name="username" type="text" />
              <FormField label="Password" name="password" type="password" />
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