import callApi from "../utils/CallApi";
import FormField from "./FormField";
import React from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";

const NewPlayerWithCharacterSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  summary: Yup.string(),
  character_name: Yup.string().required("Character name is required"),
  character_class: Yup.string().required("Character class is required"),
  level: Yup.number().min(1, "Level must be at least 1").required("Level is required"),
  icon: Yup.string().url("Must be a valid URL").nullable(),
  is_active: Yup.boolean(),
});

export default function NewPlayer({ gameId, onSuccess }) {
  return (
    <Formik
      initialValues={{
        name: "",
        summary: "",
        character_name: "",
        character_class: "",
        level: 1,
        icon: "",
        is_active: true,
      }}
      validationSchema={NewPlayerWithCharacterSchema}
      onSubmit={async (values, { setSubmitting, setErrors, resetForm }) => {
        try {
          const newPlayer = await callApi(`/games/${gameId}/players`, { method: "POST", body: JSON.stringify({ name: values.name, summary: values.summary }) });
          const charPayload = {
            name: values.character_name,
            character_class: values.character_class,
            level: values.level,
            icon: values.icon,
            is_active: values.is_active,
            game_id: gameId,
          };
          const newChar = await callApi(`/players/${newPlayer.id}/characters`, { method: "POST", body: JSON.stringify(charPayload) });
          resetForm();
          if (onSuccess) onSuccess(newPlayer, newChar);
        } catch (e) {
          setErrors({ server: e.message });
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, errors }) => (
        <Form>
          {errors.server && <div className="error">{errors.server}</div>}
          <FormField label="Player Name" name="name" />
          <FormField label="Summary" name="summary" as="textarea" />
          <FormField label="Character Name" name="character_name" />
          <FormField label="Class" name="character_class" />
          <FormField label="Level" name="level" type="number" />
          <FormField label="Icon URL" name="icon" />
          <div>
            <label>
              <input name="is_active" type="checkbox" />
              Active
            </label>
          </div>
          <button type="submit" disabled={isSubmitting}>
            Add Player
          </button>
        </Form>
      )}
    </Formik>
  );
}

