

import React from "react";
import { Field, ErrorMessage } from "formik";

/**
 * A generic form field wrapper for Formik fields with label and error message.
 * Props:
 *   - label: string (label text)
 *   - name: string (field name)
 *   - type: string (input type, default "text")
 *   - as: string (optional, e.g. "textarea" or "select")
 *   - children: for custom input elements (e.g. options for select)
 *   - ...rest: other props passed to Field
 */
function FormField({ label, name, type = "text", as, children, ...rest }) {
  return (
    <div>
      {label && <label htmlFor={name}>{label}</label>}
      <Field name={name} type={type} as={as} {...rest}>
        {children}
      </Field>
      <ErrorMessage name={name} component="div" />
    </div>
  );
}

export default FormField;