import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import CharacterCard from './CharacterCard';
import NewCharacter from './NewCharacter';
import { SessionContext } from '../contexts/SessionContext';
import "./PlayerCard.css";
import "./CharacterCard.css";

export default function PlayerCard({ player, gameId }) {
  const [showForm, setShowForm] = useState(false);
  const { setSessionData } = useContext(SessionContext);

  // Handle when a new character is added to this player
  const handleCharacterAdded = (newChar) => {
    setSessionData((prev) => {
      const updatedGames = [];

      // Go through each game in the user's list
      for (let game of prev.user.games) {
        if (game.id === newChar.game_id) {
          // This is the game the character belongs to
          const updatedPlayers = game.players.map((p) => {
            if (p.id === newChar.player_id) {
              // This is the player we're adding the character to
              return {
                ...p,
                characters: [...(p.characters || []), newChar],
              };
            }
            return p;
          });

          updatedGames.push({
            ...game,
            players: updatedPlayers,
          });
        } else {
          updatedGames.push(game);
        }
      }

      return {
        ...prev,
        user: {
          ...prev.user,
          games: updatedGames,
        },
      };
    });
  };

  return (
    <div className="player-card">
      {/* Player name as a link */}
      <h4>
        <Link to={`/players/${player.id}`}>{player.name}</Link>
      </h4>

      {/* Show summary if available */}
      {player.summary && <p>{player.summary}</p>}

      {/* List of character cards */}
      <div className="characters-list">
        {player.characters.map((c) => (
          <CharacterCard key={c.id} character={c} />
        ))}
      </div>

      {/* Button to toggle character creation form */}
      <button onClick={() => setShowForm((f) => !f)}>
        {showForm ? 'Cancel' : '+ New Character'}
      </button>

      {/* Show character form if toggled */}
      {showForm && (
        <NewCharacter
          gameId={gameId}
          playerId={player.id}
          onSuccess={(newChar) => {
            setShowForm(false);
            handleCharacterAdded(newChar);
          }}
        />
      )}
    </div>
  );
}