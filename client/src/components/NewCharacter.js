

import React, { useContext } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
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
          const res = await fetch(`/players/${values.player_id}/characters`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error("Failed to create character");
          const newChar = await res.json();
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
          <div>
            <label htmlFor="player_id">Player</label>
            <Field as="select" name="player_id" disabled={!!playerId}>
              <option value="" disabled>Select player</option>
              {validPlayers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              <option value="__new">Add New Player...</option>
            </Field>
            <ErrorMessage name="player_id" component="div" />
          </div>
          {values.player_id === "__new" && (
            <div style={{ margin: "1rem 0" }}>
              <NewPlayer
                gameId={gameId}
                onSuccess={(newPlayer) => {
                  setFieldValue("player_id", newPlayer.id);
                }}
              />
            </div>
          )}
          <div>
            <label htmlFor="name">Name</label>
            <Field name="name" />
            <ErrorMessage name="name" component="div" />
          </div>
          <div>
            <label htmlFor="character_class">Class</label>
            <Field name="character_class" />
            <ErrorMessage name="character_class" component="div" />
          </div>
          <div>
            <label htmlFor="level">Level</label>
            <Field name="level" type="number" />
            <ErrorMessage name="level" component="div" />
          </div>
          <div>
            <label htmlFor="icon">Icon URL</label>
            <Field name="icon" />
            <ErrorMessage name="icon" component="div" />
          </div>
          <div>
            <label>
              <Field name="is_active" type="checkbox" />
              Active
            </label>
          </div>
          <button type="submit" disabled={isSubmitting}>
            Add Character
          </button>
        </Form>
      )}
    </Formik>
  );
}

export default NewCharacter;