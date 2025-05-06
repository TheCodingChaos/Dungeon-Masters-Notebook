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
      onSubmit={(values, { setSubmitting, setErrors }) => {
        fetch("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
          credentials: "include"
        })
          .then((r) => {
            if (r.ok) {
              r.json().then((user) => {
                setSessionData(prev => ({ ...prev, user }));
                navigate("/dashboard");
              });
            } else {
              r.json().then((err) =>
                setErrors({ server: err.error })
              );
            }
          })
          .finally(() => setSubmitting(false));
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