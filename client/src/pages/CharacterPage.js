import React from 'react';
import { useContext, useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import FormField from "../components/FormField";
import * as Yup from "yup";
import { SessionContext } from "../contexts/SessionContext";
import "../styles/pages.css";
import "../components/CharacterCard.css";
import "../components/FormField.css";
import Modal from "../components/Modal";
import callApi from "../utils/CallApi";

const CharacterValidationSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name is too short')
    .required('Name is required'),
  character_class: Yup.string()
    .min(2, 'Class is too short')
    .required('Class is required'),
  level: Yup.number()
    .integer('Level must be a whole number')
    .min(1, 'Level must be at least 1')
    .required('Level is required'),
  icon: Yup.string()
    .url('Icon URL must be a valid URL')
    .nullable()
    .transform(value => (value === '' ? null : value)),
  is_active: Yup.boolean(),
});

function CharacterPage() {
  const { characterId } = useParams();
  const navigate = useNavigate();
  const { sessionData, setSessionData } = useContext(SessionContext);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Step 1: Find the character and its player
  // Loop through all games, players, and characters to find the matching character and its parent player
  const games = sessionData.user?.games || [];
  let foundCharacter = null;
  let foundPlayer = null;

  for (const game of games) {
    for (const player of game.players || []) {
      for (const character of player.characters || []) {
        if (character.id === parseInt(characterId, 10)) {
          foundCharacter = character;
          foundPlayer = player;
          break;
        }
      }
      if (foundCharacter) break;
    }
    if (foundCharacter) break;
  }

  const char = foundCharacter;
  const parentPlayer = foundPlayer;

  // after you locate `char`
  useEffect(() => {
    if (char === undefined) return;
    if (!char) {
      navigate("/dashboard", { replace: true });
    }
  }, [char, navigate]);
  if (!char) return null;

  // Edit form initial values
  const editInitialValues = {
    name: char?.name || "",
    character_class: char?.character_class || "",
    level: char?.level || 1,
    icon: char?.icon || "",
    is_active: char?.is_active || false,
  };

  // Edit form submission handler
  const handleEditSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      const updated = await callApi(`/characters/${char.id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      });
      // Update character in session
      setSessionData(prev => {
        const updatedGames = prev.user.games.map(game => ({
          ...game,
          players: game.players.map(player => ({
            ...player,
            characters: player.characters.map(ch =>
              ch.id === updated.id ? updated : ch
            ),
          })),
        }));
        return { ...prev, user: { ...prev.user, games: updatedGames } };
      });
      setIsEditing(false);
    } catch (e) {
      setErrors({ server: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await callApi(`/characters/${char.id}`, { method: 'DELETE' });
      // Remove character from session
      setSessionData(prev => {
        const updatedGames = prev.user.games.map(game => ({
          ...game,
          players: game.players.map(player => ({
            ...player,
            characters: (player.characters || []).filter(ch => ch.id !== char.id),
          })),
        }));
        return { ...prev, user: { ...prev.user, games: updatedGames } };
      });
      navigate(`/players/${parentPlayer.id}`, { replace: true });
    } catch (error) {
      console.error('Error deleting character:', error);
      setIsDeleting(false);
    }
  };

  const renderEditCharacterForm = ({ isSubmitting, errors }) => (
    <Form noValidate className="edit-character-form">
      <h3>Edit {char.name}</h3>
      {errors.server && (
        <div className="error-message server-error">{errors.server}</div>
      )}
      <FormField label="Name" name="name" />
      <FormField label="Class" name="character_class" />
      <FormField label="Level" name="level" type="number" />
      <FormField label="Icon URL" name="icon" />
      <FormField label="Active" name="is_active" type="checkbox" />
      <div className="form-actions">
        <button type="submit" disabled={isSubmitting} className="button submit-button">
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="button cancel-button"
          style={{ marginLeft: '0.5rem' }}
        >
          Cancel
        </button>
      </div>
    </Form>
  );

  if (!char) {
    return (
      <div>
        <p>Character not found.</p>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    );
  }

  // Precompute values for JSX
  const gameTitle =
    sessionData.user.games.find(g => g.id === char.game_id)?.title ||
    'Unknown Game';
  const statusText = char.is_active ? 'Active' : 'Inactive';
  const imageStyle = { maxWidth: '100px' };
  const actionsStyle = { marginTop: '1rem' };

  return (
    <div className="character-page">
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)}>
        <div style={{ padding: "1rem" }}>
          <h1>Edit Character</h1>
          <Formik
            initialValues={editInitialValues}
            validationSchema={CharacterValidationSchema}
            onSubmit={handleEditSubmit}
            enableReinitialize
          >
            {renderEditCharacterForm}
          </Formik>
        </div>
      </Modal>
      <Link className="return-link" to={`/players/${parentPlayer.id}`}>← Back to Player</Link>
      <div className="character-card">
        <h1>{char.name}</h1>
        <p><strong>Class:</strong> {char.character_class}</p>
        <p><strong>Level:</strong> {char.level}</p>
        {char.icon && (
          <img
            src={char.icon}
            alt={`${char.name} icon`}
            style={imageStyle}
          />
        )}
        <p><strong>Status:</strong> {statusText}</p>
        <p><strong>Created by:</strong> <Link to={`/players/${parentPlayer.id}`}>{parentPlayer.name}</Link></p>
        <div>
          <h3>Game</h3>
          <Link to={`/games/${char.game_id}`}>
            {gameTitle}
          </Link>
        </div>
        <div style={actionsStyle}>
          <button onClick={() => setIsEditing(true)}>Edit</button>
          <button onClick={handleDelete} style={{ marginLeft: "0.5rem" }} disabled={isDeleting}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default CharacterPage;