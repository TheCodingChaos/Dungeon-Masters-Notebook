

import React from 'react';
import { Link } from 'react-router-dom';
import PlayerCard from './PlayerCard';

export default function GameCard({ game, onCharacterAdded }) {
  return (
    <div className="game-card">
      <h3>
        <Link to={`/games/${game.id}`}>{game.title}</Link>
      </h3>
      {game.description && <p>{game.description}</p>}
      <div className="players-list">
        {game.players.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            gameId={game.id}
            onCharacterAdded={onCharacterAdded}
          />
        ))}
      </div>
    </div>
  );
}