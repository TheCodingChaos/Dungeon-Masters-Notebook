

import callApi from "../utils/CallApi";
import FormField from "./FormField";

import React, { useContext } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { SessionContext } from "../contexts/SessionContext";
import NewPlayer from "./NewPlayer";

const CharacterSchema = Yup.object({
  // player_id is not required here; it will be set via prop or default
  name: Yup.string().required("Name is required"),
  character_class: Yup.string().required("Class is required"),
  level: Yup.number().min(1, "Level must be at least 1").required("Level is required"),
  icon: Yup.string().url("Must be a valid URL").nullable(),
  is_active: Yup.boolean(),
});

function NewCharacter({ gameId, playerId, onSuccess }) {
  const { sessionData } = useContext(SessionContext);
  let playersList = [];
  if (playerId) {
    // Single-player context
    const games = sessionData.user?.games || [];
    playersList = games
      .flatMap(g => g.players || [])
      .filter(p => p.id === playerId);
  } else if (gameId) {
    // Game context
    playersList = sessionData.user?.games
      .find(g => g.id === gameId)
      ?.players || [];
  }
  // Ensure playersList is an array without null/undefined entries
  playersList = Array.isArray(playersList)
    ? playersList.filter(p => p && typeof p.id === 'number')
    : [];
  // Only keep entries with a numeric id
  const validPlayers = playersList.filter(p => p && typeof p.id === 'number');

  return (
    <Formik
      initialValues={{
        player_id: playerId || playersList[0]?.id || "",
        name: "",
        character_class: "",
        level: 1,
        icon: "",
        is_active: true,
      }}
      validationSchema={CharacterSchema}
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        try {
          // Include gameId so backend can set the correct game_id
          const payload = { ...values, game_id: gameId };
          const newChar = await callApi(`/players/${values.player_id}/characters`, { method: "POST", body: JSON.stringify(payload) });
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
            <div style={{ margin: "1rem 0" }}>
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
              <div>
                <label>
                  <input name="is_active" type="checkbox" />
                  Active
                </label>
              </div>
              <button type="submit" disabled={isSubmitting}>
                Add Character
              </button>
            </>
          )}
        </Form>
      )}
    </Formik>
  );
}

export default NewCharacter;