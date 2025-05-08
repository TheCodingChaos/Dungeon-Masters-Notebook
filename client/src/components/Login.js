import callApi from "../utils/CallApi"
import FormField from "./FormField";
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
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
          await callApi("/login", { method: "POST", body: JSON.stringify(values) });
          const sessionUser = await callApi("/check_session");
          setSessionData(prev => ({ ...prev, user: sessionUser }));
          navigate("/dashboard");
        } catch (err) {
          setErrors({ server: err.message });
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, errors }) => (
        <Form>
          {errors.server && <div>{errors.server}</div>}
          <FormField label="Username" name="username" type="text" />
          <FormField label="Password" name="password" type="password" />
          <button type="submit" disabled={isSubmitting}>
            Login
          </button>
        </Form>
      )}
    </Formik>
  );
}
export default Login;