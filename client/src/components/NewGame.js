import FormField from "./FormField";
import * as Yup from "yup";
import CrudForm from "../hooks/UseCRUDForm";

// Define validation schema for new game form
const NewGameSchema = Yup.object({
  title: Yup.string().required("Title is required"),
  system: Yup.string().required("System is required"),
  status: Yup.string().required("Status is required"),
  description: Yup.string(),
  start_date: Yup.date().nullable(),
  setting: Yup.string(),
});

// Renders a form to create a new game
export default function NewGame({ onSuccess }) {
  return (
    <CrudForm
      path="/games"
      initialValues={{
        title: "",
        system: "",
        status: "",
        description: "",
        start_date: "",
        setting: "",
      }}
      validationSchema={NewGameSchema}
      onSubmitSuccess={(newGame) => {
        if (onSuccess) onSuccess(newGame);
      }}
    >
      {/* Form fields for each game attribute */}
      <FormField label="Title" name="title" />
      
      <FormField label="System" name="system" />
      
      <FormField label="Status" name="status" />
      
      <FormField label="Description" name="description" as="textarea" />
      
      <FormField label="Start Date" name="start_date" type="date" />
      
      <FormField label="Setting" name="setting" />
    </CrudForm>
  );
}