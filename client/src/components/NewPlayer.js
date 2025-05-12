import { useContext, useState } from "react";
import { SessionContext } from "../contexts/SessionContext";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import callApi from "../utils/CallApi";
import FormField from "./FormField";

// Validation schema matching the NewPlayerAndCharacter endpoint
const NewPlayerAndCharacterSchema = Yup.object({
  name: Yup.string().required("Player name is required"),
  summary: Yup.string(),
  character: Yup.object({
    name: Yup.string().required("Character name is required"),
    character_class: Yup.string().required("Character class is required"),
    level: Yup.number().min(1).required("Level is required"),
    icon: Yup.string().url().nullable(),
    is_active: Yup.boolean(),
  }).required(),
});

// Form to add a new player and their starting character using the new endpoint
export default function NewPlayer({ gameId, onSuccess }) {
  const { sessionData } = useContext(SessionContext);
  const games = sessionData.user?.games || [];
  // Local state for chosen game
  const [selectedGameId, setSelectedGameId] = useState(gameId || games[0]?.id || "");

  return (
    <Formik
      initialValues={{
        name: "",
        summary: "",
        character: {
          name: "",
          character_class: "",
          level: 1,
          icon: "",
          is_active: true,
        },
      }}
      validationSchema={NewPlayerAndCharacterSchema}
      onSubmit={async (values, { setSubmitting, setErrors, resetForm }) => {
        try {
          const gameIdNum = Number(selectedGameId);
          console.log("Posting to gameId", gameIdNum);
          const response = await callApi(
            `/games/${gameIdNum}/players?include=character`,
            {
              method: "POST",
              body: JSON.stringify({
                name: values.name,
                summary: values.summary,
                character: {
                  ...values.character,
                  level: Number(values.character.level),
                },
              }),
            }
          );
          resetForm();
          // Notify parent with the correct game ID, new player, and new character
          onSuccess && onSuccess(Number(selectedGameId), response, response.character);
        } catch (e) {
          console.error("API error response:", e);
          if (e.errors) {
            setErrors(e.errors);
          } else {
            setErrors({ server: e.message });
          }
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, errors }) => (
        <Form>
          {/* Server error */}
          {errors.server && <div className="error">{errors.server}</div>}

          {/* Game selection dropdown */}
          <label style={{ marginBottom: '0.5rem', display: 'block' }}>
            Game:&nbsp;
            <select
              value={selectedGameId || ''}
              onChange={e => setSelectedGameId(e.target.value)}
            >
              <option value="" disabled>Select a game</option>
              {games.map(g => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </label>


          {/* Player info */}
          <FormField label="Player Name" name="name" />
          <FormField label="Summary" name="summary" as="textarea" />

          {/* Character section */}
          <h4>Starting Character</h4>
          <FormField label="Character Name" name="character.name" />
          <FormField label="Class" name="character.character_class" />
          <FormField label="Level" name="character.level" type="number" />
          <FormField label="Icon URL" name="character.icon" />
          <FormField label="Active" name="character.is_active" type="checkbox" />

          <button type="submit" disabled={isSubmitting}>Add Player</button>
        </Form>
      )}
    </Formik>
  );
}
