import { Link } from 'react-router-dom';
import PlayerCard from './PlayerCard';
import "./GameCard.css";

export default function GameCard({ game }) {
  // Destructure game properties
  const { id, title, description, players } = game;

  return (
    <div className="game-card">
      {/* Game title with link to game details */}
      <h3>
        <Link to={`/games/${id}`}>{title}</Link>
      </h3>

      {/* Optional game description */}
      {description && <p>{description}</p>}

      {/* List of players in the game */}
      <div className="players-list">
        {players.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            gameId={id}
          />
        ))}
      </div>
    </div>
  );
}