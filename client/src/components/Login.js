import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { SessionContext } from "../contexts/SessionContext";

const LoginSchema = Yup.object({
  username: Yup.string().required("Required"),
  password: Yup.string().required("Required"),
});

function Login() {
  const { setSessionData } = useContext(SessionContext);
  const navigate = useNavigate();

  return (
    <Formik
      initialValues={{ username: "", password: "" }}
      validationSchema={LoginSchema}
      onSubmit={async (values, { setSubmitting, setErrors }) => {
        try {
          const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
            credentials: "include"
          });
          if (!response.ok) {
            const err = await response.json();
            setErrors({ server: err.error });
          } else {
            // Fetch full session (including nested games/players/sessions)
            const sessionRes = await fetch("/check_session", { credentials: "include" });
            if (sessionRes.ok) {
              const sessionUser = await sessionRes.json();
              setSessionData(prev => ({ ...prev, user: sessionUser }));
              navigate("/dashboard");
            } else {
              const err2 = await sessionRes.json();
              setErrors({ server: err2.error || "Session fetch failed" });
            }
          }
        } catch (e) {
          setErrors({ server: e.message });
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, errors }) => (
        <Form>
          {errors.server && <div>{errors.server}</div>}
          <div>
            <label htmlFor="username">Username</label>
            <Field name="username" type="text" />
            <ErrorMessage name="username" component="div" />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <Field name="password" type="password" />
            <ErrorMessage name="password" component="div" />
          </div>
          <button type="submit" disabled={isSubmitting}>
            Login
          </button>
        </Form>
      )}
    </Formik>
  );
}
export default Login;