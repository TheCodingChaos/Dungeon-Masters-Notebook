
import React, { useContext, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
// No Formik or Yup imports needed
import { SessionContext } from "../contexts/SessionContext";
import NewCharacter from "../components/NewCharacter";

function PlayerPage() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { sessionData, setSessionData } = useContext(SessionContext);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState("");

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
      navigate("/dashboard");
    }
  };

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
        <Link to="/dashboard">← Back to Dashboard</Link>
        <h1>{player.name}</h1>
        {player.summary && (
          <p><strong>Summary:</strong> {player.summary}</p>
        )}
        <div style={{ margintTop: "1rem"}}>
          <h3>Characters</h3>
          <ul style={{ listStyle: "none", padding: 0}}>
            {player?.characters?.length
              ? player.characters.map(c => (
                <li key={c.id} style={{display: "flex", alignItems: "center", marginBottom: "0.5rem"}}>
                  {c.icon && <img src={c.icon} alt={`${c.name} icon`} style={{ maxWidth: "50px", marginRight: "0.5rem" }} />}
                  <div>
                    <Link to={`/characters/${c.id}`}>{c.name}</Link> ({c.character_class} L{c.level}) —
                    {c.is_active ? " Active" : " Inactive"} in{" "}
                    <Link to={`/games/${c.game_id}`}>
                      {sessionData.user.games.find(g => g.id === c.game_id)?.title || "?"}
                    </Link>
                  </div>
                </li>
              ))
            : <li>No characters yet</li>}
          </ul>

          <h4>Add this Player to a Game</h4>
          <select value={selectedGameId} onChange={e => setSelectedGameId(e.target.value)}>
            <option value="">Select a game</option>
            {sessionData.user.games
              .filter(g => !player.characters.some(c => c.game_id === g.id))
              .map(g => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
          </select>
          {selectedGameId && (
            <NewCharacter
            gameId={+selectedGameId}
            playerId={player.id}
            onSuccess={newChar => {
              setSelectedGameId("");
              setSessionData(prev => ({
                ...prev,
                user: {
                  ...prev.user,
                  games: prev.user.games.map(g =>
                    g.id === newChar.game_id
                    ? {
                      ...g,
                      players: [
                        ...(g.players||[]),
                        {
                          id: player.id,
                          name: player.name,
                          summary: player.summary,
                          characters: [newChar]
                        }
                      ]
                      }
                    : g
                  )
                }
              }));
            }}
          />
        )}
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