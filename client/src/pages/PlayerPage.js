
import React, { useContext, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
// No Formik or Yup imports needed
import { SessionContext } from "../contexts/SessionContext";
import NewCharacter from "../components/NewCharacter";
import { Link as RouterLink } from "react-router-dom";

function PlayerPage() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { sessionData, setSessionData } = useContext(SessionContext);
  const [isEditing, setIsEditing] = useState(false);
  const [showCharForm, setShowCharForm] = useState(false);

  // Find the player across all games
  const games = sessionData.user?.games || [];
  const player = games
    .flatMap(g => g.players || [])
    .find(p => p.id === parseInt(playerId, 10));


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
      navigate(`/games/${player.game_id}`);
    }
  };


  // Characters list and form logic
  const charItems = player?.characters?.length
    ? player.characters.map(c => (
        <li key={c.id}>
          <RouterLink to={`/characters/${c.id}`}>{c.name}</RouterLink>
        </li>
      ))
    : <li>No characters yet</li>;
  const charFormElement = showCharForm && (
    <div style={{ margin: "1rem 0" }}>
      <NewCharacter
        playerId={player.id}
        onSuccess={() => setShowCharForm(false)}
      />
    </div>
  );
  const charToggleLabel = showCharForm ? "Cancel" : "+ New Character";

  let content;
  if (!player) {
    content = (
      <div>
        <p>Player not found.</p>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    );
  } else if (isEditing) {
    content = (
      <div>
        <h1>Edit Player</h1>
        {/* Edit player form JSX */}
      </div>
    );
  } else {
    content = (
      <div>
        <Link to={`/games/${player.game_id}`}>← Back to Game</Link>
        <h1>{player.name}</h1>
        {player.summary && (
          <p><strong>Summary:</strong> {player.summary}</p>
        )}
        <div style={{ marginTop: "1rem" }}>
          <h3>Characters</h3>
          <button onClick={() => setShowCharForm(!showCharForm)}>
            {charToggleLabel}
          </button>
          {charFormElement}
          <ul>{charItems}</ul>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <button onClick={() => setIsEditing(true)}>Edit</button>
          <button onClick={handleDelete} style={{ marginLeft: "0.5rem" }}>Delete</button>
        </div>
      </div>
    );
  }
  return content;
}

export default PlayerPage;