import React, { useContext } from "react";
import callApi from "../utils/CallApi";
import FormField from "./FormField";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { SessionContext } from "../contexts/SessionContext";
import NewPlayer from "./NewPlayer";
import "../styles/pages.css";

const DEFAULT_IMAGES = [
  "https://static.vecteezy.com/system/resources/thumbnails/051/960/031/small/pixel-art-warrior-character-holding-a-sword-in-armor-and-red-cape-ideal-for-gaming-content-and-retro-themed-designs-png.png",
  "https://static.vecteezy.com/system/resources/thumbnails/051/960/254/small/pixel-art-of-a-heroic-character-holding-a-bright-flame-dressed-in-fantasy-attire-with-a-red-cape-vibrant-detailed-and-magical-illustration-png.png",
  "https://as2.ftcdn.net/jpg/05/65/42/35/1000_F_565423542_jusEcTj3M1mnvI6atklmj9ltzIrzhkiH.jpg",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGhKPArPklv0kF9XY385Qc_x92Qhx5ozZZXlkL7x3DX-VQcFnuN96v2DgvAR1YhiJNBtY&usqp=CAU",
  "https://preview.redd.it/vvzpigme0ds61.jpg?width=640&crop=smart&auto=webp&s=baa3b256c0011a13f3c3fb01700f9890b7acce9f",
  "https://static.vecteezy.com/system/resources/previews/004/829/271/non_2x/knight-character-in-pixel-art-style-vector.jpg",
  "https://i.redd.it/6lmzvgb3uje31.png",
  "https://www.shutterstock.com/image-vector/pixel-art-wizard-long-beard-260nw-2544146115.jpg",
  "https://thumbs.dreamstime.com/b/pixel-art-mage-wizard-back-272560987.jpg",
  "https://preview.redd.it/pixel-art-of-yuan-ti-warlock-v0-9zw5qdwen1g91.png?auto=webp&s=d18555d7e47f32c97f24881874038fd2054b083a"
];

// Validation schema for character creation
const CharacterSchema = Yup.object().shape({
  player_id: Yup.string().required("Player is required"),
  name: Yup.string()
    .min(2, "Name is too short")
    .required("Name is required"),
  character_class: Yup.string()
    .min(2, "Class is too short")
    .required("Class is required"),
  level: Yup.number()
    .min(1, "Level must be at least 1")
    .integer("Level must be a whole number")
    .required("Level is required"),
  icon: Yup.string()
    .url("Must be a valid URL")
    .nullable()
    .transform(value => (value === "" ? null : value)),
  is_active: Yup.boolean(),
});

function NewCharacter({
  gameId,
  playerId,
  onSuccess,
  character = null,
  submitLabel = "Add Character",
}) {
  const { sessionData } = useContext(SessionContext);

  // Determine list of valid players to choose from
  let playersList = [];
  if (playerId) {
    const games = sessionData.user?.games || [];
    playersList = games
      .flatMap(g => g.players || [])
      .filter(p => p.id === playerId);
  } else if (gameId) {
    playersList =
      sessionData.user?.games.find(g => g.id === gameId)?.players || [];
  }

  // Dedupe and filter for numeric IDs
  const dedupedPlayers = Array.isArray(playersList)
    ? Array.from(new Map(playersList.map(p => [p.id, p])).values())
    : [];
  const validPlayers = dedupedPlayers.filter(p => typeof p.id === "number");

  // Build <option> elements for players
  const playerOptions = validPlayers.map(p => (
    <option key={p.id} value={p.id}>
      {p.name}
    </option>
  ));

  // Initial form values
  const initialFormValues = {
    player_id:
      playerId ||
      character?.player_id ||
      (validPlayers.length ? validPlayers[0].id : "") ||
      "",
    name: character?.name || "",
    character_class: character?.character_class || "",
    level: character?.level || 1,
    icon: character?.icon || "",
    is_active:
      character?.is_active !== undefined ? character.is_active : true,
  };

  // Submission handler with improved error parsing
  const handleFormSubmit = async (values, { setSubmitting, setErrors, resetForm }) => {
    try {
      const iconUrl = values.icon && values.icon.trim() !== ""
        ? values.icon
        : DEFAULT_IMAGES[Math.floor(Math.random() * DEFAULT_IMAGES.length)];
      const payload = { ...values, game_id: gameId, icon: iconUrl };
      const newChar = await callApi(
        `/players/${values.player_id}/characters`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
      if (onSuccess) onSuccess(newChar);
      resetForm();
    } catch (e) {
      console.error("Character form error:", e);
      if (e.errors && typeof e.errors === "object") {
        setErrors(e.errors);
      } else {
        setErrors({ server: e.message || "An unexpected error occurred." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Extracted render helper
  const renderFormFields = ({ isSubmitting, values, setFieldValue, errors }) => (
    <Form noValidate>
      {errors.server && <div className="error">{errors.server}</div>}

      <FormField
        label="Player"
        name="player_id"
        as="select"
        disabled={!!playerId}
      >
        <option value="" disabled>
          Select player
        </option>
        {playerOptions}
        {!playerId && <option value="__new">Add New Player...</option>}
      </FormField>

      {values.player_id === "__new" ? (
        <div className="new-player-form-container">
          <h4>Create and Select New Player</h4>
          <NewPlayer
            gameId={gameId}
            onSuccess={newPlayer => setFieldValue("player_id", newPlayer.id)}
          />
        </div>
      ) : (
        <>
          <FormField label="Name" name="name" />
          <FormField label="Class" name="character_class" />
          <FormField label="Level" name="level" type="number" />
          <FormField label="Icon URL" name="icon" />
          <FormField label="Active" name="is_active" type="checkbox" />

          <div className="form-actions">
            <button
              type="submit"
              disabled={isSubmitting}
              className="button submit-button"
            >
              {isSubmitting
                ? submitLabel.toLowerCase().includes("add")
                  ? "Adding..."
                  : "Saving..."
                : submitLabel}
            </button>
          </div>
        </>
      )}
    </Form>
  );

  return (
    <Formik
      initialValues={initialFormValues}
      validationSchema={CharacterSchema}
      onSubmit={handleFormSubmit}
    >
      {renderFormFields}
    </Formik>
  );
}

export default NewCharacter;