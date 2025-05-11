import callApi from "../utils/CallApi";
import FormField from "./FormField";
import { useContext } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { SessionContext } from "../contexts/SessionContext";
import NewPlayer from "./NewPlayer";
import "../styles/pages.css"; // Assuming global CSS file for new styles

// Validation schema for character creation
const CharacterSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  character_class: Yup.string().required("Class is required"),
  level: Yup.number().min(1, "Level must be at least 1").required("Level is required"),
  icon: Yup.string().url("Must be a valid URL").nullable(),
  is_active: Yup.boolean(),
});

function NewCharacter({ gameId, playerId, onSuccess, character = null, submitLabel = "Add Character" }) {
  const { sessionData } = useContext(SessionContext);

  // Determine list of valid players to choose from
  let playersList = [];

  if (playerId) {
    // If a playerId is provided directly, pull that player from the game list
    const games = sessionData.user?.games || [];
    playersList = games
      .flatMap(g => g.players || [])
      .filter(p => p.id === playerId);
  } else if (gameId) {
    // Otherwise, pull all players from the given game
    playersList = sessionData.user?.games
      .find(g => g.id === gameId)
      ?.players || [];
  }

  // Ensure players are valid entries with numeric IDs
  const validPlayers = Array.isArray(playersList)
    ? playersList.filter(p => p && typeof p.id === 'number')
    : [];

  return (
    <Formik
      initialValues={{
        player_id: playerId || character?.player_id || validPlayers[0]?.id || "",
        name: character?.name || "",
        character_class: character?.character_class || "",
        level: character?.level || 1,
        icon: character?.icon || "",
        is_active: character?.is_active !== undefined ? character.is_active : true,
      }}
      validationSchema={CharacterSchema}
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        try {
          const payload = { ...values, game_id: gameId };
          const newChar = await callApi(
            `/games/${gameId}/players/${values.player_id}/characters`,
            {
              method: "POST",
              body: JSON.stringify(payload)
            }
          );
          if (onSuccess) onSuccess(newChar);
          resetForm();
        } catch (e) {
          console.error(e);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, values, setFieldValue }) => (
        <Form>
          <FormField label="Player" name="player_id" as="select" disabled={!!playerId}>
            <option value="" disabled>Select player</option>
            {validPlayers.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
            <option value="__new">Add New Player...</option>
          </FormField>

          {values.player_id === "__new" ? (
            <div className="new-player-wrapper">
              <NewPlayer
                gameId={gameId}
                onSuccess={(newPlayer) => {
                  setFieldValue("player_id", newPlayer.id);
                }}
              />
            </div>
          ) : (
            <>
              <FormField label="Name" name="name" />
              <FormField label="Class" name="character_class" />
              <FormField label="Level" name="level" type="number" />
              <FormField label="Icon URL" name="icon" />
              <FormField label="Active" name="is_active" type="checkbox" />
              <button type="submit" disabled={isSubmitting}>
                {submitLabel}
              </button>
            </>
          )}
        </Form>
      )}
    </Formik>
  );
}

export default NewCharacter;