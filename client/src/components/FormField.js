import { Field, ErrorMessage } from "formik";
import "./FormField.css";

function FormField({ label, name, type = "text", as, children, ...rest }) {
  const renderCheckbox = () => (
    <label>
      <Field name={name} type="checkbox" {...rest} />
      {label}
    </label>
  );

  const renderStandardField = () => (
    <>
      {label && <label htmlFor={name}>{label}</label>}
      <Field name={name} type={type} as={as} {...rest}>
        {children}
      </Field>
    </>
  );

  return (
    <div className="form-field">
      {type === "checkbox" ? renderCheckbox() : renderStandardField()}
      <ErrorMessage name={name} component="div" className="error" />
    </div>
  );
}

export default FormField;