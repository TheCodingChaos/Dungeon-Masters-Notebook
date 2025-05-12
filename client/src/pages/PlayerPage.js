import { useContext, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { SessionContext } from "../contexts/SessionContext";
import { Formik, Form } from "formik";
import FormField from "../components/FormField";
import * as Yup from "yup";
import "../styles/pages.css";
import "../components/PlayerCard.css";
import "../components/CharacterCard.css";
import "../components/FormField.css";
import Modal from "../components/Modal";
import NewCharacter from "../components/NewCharacter";

const EditPlayerSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  summary: Yup.string(),
});

function PlayerPage() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { sessionData, setSessionData } = useContext(SessionContext);
  const [isEditing, setIsEditing] = useState(false);

  // Find the player across all games
  const games = sessionData.user?.games || [];
  const player = games
    .flatMap(g => g.players || [])
    .find(p => p.id === parseInt(playerId, 10));
  // Offer all games for character assignment
  const gamesWithPlayer = games;
  // Modal open state and selected game for new character
  const [showModal, setShowModal] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(
    gamesWithPlayer[0]?.id || ""
  );


  // Delete handler
  const handleDelete = async () => {
    const res = await fetch(`/players/${player.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      // Remove player from context
      setSessionData(prev => ({
        ...prev,
        user: {
          ...prev.user,
          games: prev.user.games.map(g => ({
            ...g,
            players: (g.players || []).filter(pl => pl.id !== player.id)
          }))
        }
      }));
      navigate("/dashboard");
    }
  };

  if (!player) {
    return (
      <div>
        <p>Player not found.</p>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div>
        <h1>Edit Player</h1>
        <Formik
          initialValues={{
            name: player.name || "",
            summary: player.summary || "",
          }}
          validationSchema={EditPlayerSchema}
          onSubmit={async (values, { setSubmitting, setErrors }) => {
            try {
              const res = await fetch(`/players/${player.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(values),
              });
              if (!res.ok) throw new Error("Failed to update player");
              const updatedPlayer = await res.json();
              setSessionData(prev => ({
                ...prev,
                user: {
                  ...prev.user,
                  games: prev.user.games.map(g => ({
                    ...g,
                    players: g.players.map(p =>
                      p.id === updatedPlayer.id ? { ...p, ...updatedPlayer } : p
                    ),
                  })),
                },
              }));
              setIsEditing(false);
            } catch (e) {
              setErrors({ server: e.message });
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, errors }) => (
            <div className="form-wrapper">
            <Form>
              {errors.server && <div className="error">{errors.server}</div>}
              <FormField label="Name" name="name" />
              <FormField label="Summary" name="summary" as="textarea" />
              <button type="submit" disabled={isSubmitting}>Save</button>
              <button type="button" onClick={() => setIsEditing(false)} style={{ marginLeft: "0.5rem" }}>
                Cancel
              </button>
            </Form>
            </div>
          )}
        </Formik>
      </div>
    );
  }

  // --- Refactored: preprocess character list and logic outside JSX return ---
  // Build a map from game id to title for fast lookup
  const gameMap = new Map();
  games.forEach(g => gameMap.set(g.id, g.title));

  // Gather all characters for this player across every game
  const allCharacters = games.reduce((acc, g) => {
    const pl = (g.players || []).find(p => p.id === player.id);
    if (pl && Array.isArray(pl.characters)) {
      acc.push(...pl.characters);
    }
    return acc;
  }, []);

  // Preprocess character list for display
  let characterListItems = [];

  if (allCharacters.length > 0) {
    characterListItems = allCharacters.map(c => {
      const gameTitle = gameMap.get(c.game_id) || "?";

      const handleToggleActive = async () => {
        const res = await fetch(`/characters/${c.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ is_active: !c.is_active }),
        });

        if (res.ok) {
          const updatedChar = await res.json();

          setSessionData((prev) => {
            const updatedGames = prev.user.games.map((g) => {
              const updatedPlayers = g.players.map((p) => {
                if (p.id === updatedChar.player_id) {
                  const updatedCharacters = p.characters.map((ch) =>
                    ch.id === updatedChar.id ? updatedChar : ch
                  );
                  return { ...p, characters: updatedCharacters };
                }
                return p;
              });
              return { ...g, players: updatedPlayers };
            });

            return {
              ...prev,
              user: { ...prev.user, games: updatedGames },
            };
          });
        }
      };

      return (
        <li key={c.id} className="character-item">
          {c.icon && (
            <img
              src={c.icon}
              alt={c.name + " icon"}
              className="character-icon"
            />
          )}
          <div>
            <Link to={`/characters/${c.id}`}>{c.name}</Link> ({c.character_class} L{c.level}) —
            <label className="character-active-toggle">
              <input
                type="checkbox"
                checked={c.is_active}
                onChange={handleToggleActive}
              />
              Active
            </label>{" "}
            in <Link to={`/games/${c.game_id}`}>{gameTitle}</Link>
          </div>
        </li>
      );
    });
  } else {
    characterListItems = [<li key="no-characters">No characters yet</li>];
  }

  return (
    <div className="player-page">
      <Link to="/dashboard">← Back to Dashboard</Link>
      <div className="player-card">
        <h1>{player.name}</h1>
        {player.summary && (
          <p><strong>Summary:</strong> {player.summary}</p>
        )}
      </div>
      <div className="character-card character-list-section">
        <h3>Characters</h3>
        <ul className="character-list">
          {characterListItems}
        </ul>
      </div>
      {/* Button to open add-character modal */}
      <button style={{ marginTop: '1rem' }} onClick={() => setShowModal(true)}>
        + New Character
      </button>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div style={{ padding: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            Game:&nbsp;
            <select
              value={selectedGameId}
              onChange={e => setSelectedGameId(Number(e.target.value))}
            >
              <option value="" disabled>Select game</option>
              {gamesWithPlayer.map(g => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </label>
          <NewCharacter
            gameId={selectedGameId}
            playerId={player.id}
            onSuccess={newChar => {
              // jump selector to the game we just added to
              setSelectedGameId(newChar.game_id);
              setShowModal(false);
              // update context with the new character
              setSessionData(prev => {
                const updatedGames = prev.user.games.map(g => {
                  if (g.id !== newChar.game_id) return g;
                  const existingPlayers = g.players || [];
                  const hasPlayer = existingPlayers.some(p => p.id === newChar.player_id);
                  const updatedPlayers = hasPlayer
                    ? existingPlayers.map(p =>
                        p.id === newChar.player_id
                          ? { ...p, characters: [...(p.characters || []), newChar] }
                          : p
                      )
                    : [
                        ...existingPlayers,
                        { ...player, characters: [newChar] }
                      ];
                  return { ...g, players: updatedPlayers };
                });
                return { ...prev, user: { ...prev.user, games: updatedGames } };
              });
            }}
          />
        </div>
      </Modal>
      {/* Edit and Delete buttons section */}
      <div className="player-actions">
        <button onClick={() => setIsEditing(true)}>Edit</button>
        <button
          onClick={handleDelete}
          className="player-delete-btn"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default PlayerPage;