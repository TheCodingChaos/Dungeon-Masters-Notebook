
import { useContext, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import FormField from "../components/FormField";
import * as Yup from "yup";
import { SessionContext } from "../contexts/SessionContext";
import "../styles/pages.css";
import "../components/CharacterCard.css";
import "../components/FormField.css";

const CharacterSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  character_class: Yup.string().required("Class is required"),
  level: Yup.number().min(1).required("Level is required"),
  icon: Yup.string().url().nullable(),
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


  const handleDelete = async () => {
    setIsDeleting(true);
    const res = await fetch(`/characters/${char.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      // Remove deleted character from session state
      const updatedGames = [];

      for (const game of sessionData.user.games) {
        // For each player in the game, filter out the deleted character
        const updatedPlayers = game.players.map((player) => {
          const updatedCharacters = (player.characters || []).filter(
            (ch) => ch.id !== char.id
          );
          return { ...player, characters: updatedCharacters };
        });
        updatedGames.push({ ...game, players: updatedPlayers });
      }

      setSessionData((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          games: updatedGames,
        },
      }));
      navigate(`/players/${parentPlayer.id}`);
    } else {
      setIsDeleting(false);
    }
  };
  if (!char) {
    return (
      <div>
        <p>Character not found.</p>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div>
        <h1>Edit Character</h1>
        <Formik
          initialValues={{
            name: char.name,
            character_class: char.character_class,
            level: char.level,
            icon: char.icon || "",
            is_active: char.is_active,
          }}
          validationSchema={CharacterSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              const res = await fetch(`/characters/${char.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(values),
              });
              if (!res.ok) throw new Error("Failed to update character");
              const updated = await res.json();
              // Update character in session state
              const updatedGames = [];

              for (const game of sessionData.user.games) {
                // For each player in the game, update the character if it matches
                const updatedPlayers = game.players.map((player) => {
                  const updatedCharacters = player.characters.map((ch) =>
                    ch.id === updated.id ? updated : ch
                  );
                  return { ...player, characters: updatedCharacters };
                });
                updatedGames.push({ ...game, players: updatedPlayers });
              }

              setSessionData((prev) => ({
                ...prev,
                user: {
                  ...prev.user,
                  games: updatedGames,
                },
              }));
              setIsEditing(false);
            } catch (e) {
              console.error(e);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <div className="form-wrapper">
              <Form>
                <FormField label="Name" name="name" />
                <FormField label="Class" name="character_class" />
                <FormField label="Level" name="level" type="number" />
                <FormField label="Icon URL" name="icon" />
                <FormField label="Active" name="is_active" type="checkbox" />
                <button type="submit" disabled={isSubmitting}>Save</button>
                <button type="button" onClick={() => setIsEditing(false)} disabled={isSubmitting}>Cancel</button>
              </Form>
            </div>
          )}
        </Formik>
      </div>
    );
  }
  return (
    <div className="character-page">
      <Link to={`/players/${parentPlayer.id}`}>← Back to Player</Link>
      <div className="character-card">
        <h1>{char.name}</h1>
        <p><strong>Class:</strong> {char.character_class}</p>
        <p><strong>Level:</strong> {char.level}</p>
        {char.icon && (
          <img
            src={char.icon}
            alt={`${char.name} icon`}
            style={{ maxWidth: "100px" }}
          />
        )}
        <p><strong>Status:</strong> {char.is_active ? "Active" : "Inactive"}</p>
        <p><strong>Created by:</strong> <Link to={`/players/${parentPlayer.id}`}>{parentPlayer.name}</Link></p>
        <div>
          <h3>Game</h3>
          <Link to={`/games/${char.game_id}`}>
            {sessionData.user.games.find(g => g.id === char.game_id)?.title || 'Unknown Game'}
          </Link>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <button onClick={() => setIsEditing(true)}>Edit</button>
          <button onClick={handleDelete} style={{ marginLeft: "0.5rem" }} disabled={isDeleting}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default CharacterPage;