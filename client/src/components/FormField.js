import { Field, ErrorMessage } from "formik";
import "./FormField.css";

/**
 * A reusable form field for Formik with label and validation error message.
 *
 * Props:
 *   - label: string (text for the label)
 *   - name: string (field name for Formik binding)
 *   - type: string (HTML input type, default is "text")
 *   - as: string (optional, e.g. "textarea" or "select")
 *   - children: content inside the field (used for select options)
 *   - ...rest: other input props
 */
function FormField({ label, name, type = "text", as, children, ...rest }) {
  // Render field for checkbox type with label next to input
  const renderCheckbox = () => (
    <label>
      <Field name={name} type="checkbox" {...rest} />
      {label}
    </label>
  );

  // Render normal input/select/textarea with label above
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