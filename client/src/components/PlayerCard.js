

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CharacterCard from './CharacterCard';
import NewCharacter from './NewCharacter';

export default function PlayerCard({ player, gameId, onCharacterAdded }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="player-card">
      <h4>
        <Link to={`/players/${player.id}`}>{player.name}</Link>
      </h4>
      {player.summary && <p>{player.summary}</p>}
      <div className="characters-list">
        {player.characters.map(c => (
          <CharacterCard key={c.id} character={c} />
        ))}
      </div>
      <button onClick={() => setShowForm(f => !f)}>
        {showForm ? 'Cancel' : '+ New Character'}
      </button>
      {showForm && (
        <NewCharacter
          gameId={gameId}
          playerId={player.id}
          onSuccess={newChar => {
            setShowForm(false);
            onCharacterAdded(gameId, newChar);
          }}
        />
      )}
    </div>
  );
}