import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import CharacterCard from './CharacterCard';
import NewCharacter from './NewCharacter';
import { SessionContext } from '../contexts/SessionContext';
import Modal from "./Modal";
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

  // Toggle the new character form visibility
  const handleToggleForm = () => setShowForm(prev => !prev);

  // Label for toggle button
  const toggleButtonLabel = showForm ? 'Cancel' : '+ New Character';

  // Rendered list of character cards
  const characterCards = player.characters.map((c) => (
    <CharacterCard key={c.id} character={c} />
  ));

  // Handle successful character add
  const handleNewCharacterSuccess = (newChar) => {
    setShowForm(false);
    handleCharacterAdded(newChar);
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
        {characterCards}
      </div>

      <button onClick={handleToggleForm}>
        {toggleButtonLabel}
      </button>
      {/* Modal for new-character form */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
      >
        <NewCharacter
          gameId={gameId}
          playerId={player.id}
          onSuccess={(newChar) => {
            handleNewCharacterSuccess(newChar);
            setShowForm(false);
          }}
        />
      </Modal>

    </div>
  );
}