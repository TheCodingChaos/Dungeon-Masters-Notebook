import React, { useContext, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import CharacterCard from './CharacterCard';
import NewCharacter from './NewCharacter';
import { SessionContext } from '../contexts/SessionContext';
import Modal from './Modal';
import "./PlayerCard.css";
import "./CharacterCard.css";

export default function PlayerCard({ player, gameId }) {
  const [isNewCharacterFormVisible, setIsNewCharacterFormVisible] = useState(false);
  const { setSessionData } = useContext(SessionContext);

  const handleCharacterAddedToSession = (newChar) => {
    setSessionData(prev => {
      if (!prev.user?.games) return prev;
      const updatedGames = prev.user.games.map(game => {
        if (game.id === newChar.game_id) {
          const updatedPlayers = (game.players || []).map(p => {
            if (p.id === newChar.player_id) {
              return { ...p, characters: [...(p.characters || []), newChar] };
            }
            return p;
          });
          return { ...game, players: updatedPlayers };
        }
        return game;
      });
      return { ...prev, user: { ...prev.user, games: updatedGames } };
    });
  };

  const toggleNewCharacterForm = () => setIsNewCharacterFormVisible(prev => !prev);

  const newCharacterButtonLabel = isNewCharacterFormVisible
    ? 'Cancel Adding Character'
    : '+ Add New Character';

  const renderedCharacterCards = useMemo(() => {
    if (!player?.characters || !Array.isArray(player.characters) || player.characters.length === 0) {
      return <p className="no-characters-message">This player has no characters yet.</p>;
    }
    return player.characters.map(c => <CharacterCard key={c.id} character={c} />);
  }, [player?.characters]);

  const handleNewCharacterFormSuccess = newChar => {
    handleCharacterAddedToSession(newChar);
    setIsNewCharacterFormVisible(false);
  };

  return (
    <div className="player-card">
      <h4 className="player-name">
        <Link to={`/players/${player.id}`}>{player.name}</Link>
      </h4>

      {player.summary && <p className="player-summary">{player.summary}</p>}

      <h5 className="characters-list-title">Characters:</h5>
      <div className="characters-list">
        {renderedCharacterCards}
      </div>

      <button
        type="button"
        onClick={toggleNewCharacterForm}
        className="button toggle-new-character-form-button"
      >
        {newCharacterButtonLabel}
      </button>
      <Modal isOpen={isNewCharacterFormVisible} onClose={toggleNewCharacterForm}>
        <div className="new-character-form-modal-content">
          <h3>Add New Character for {player.name}</h3>
          <NewCharacter
            gameId={gameId}
            playerId={player.id}
            onSuccess={handleNewCharacterFormSuccess}
            submitLabel="Create Character"
          />
        </div>
      </Modal>
    </div>
  );
}