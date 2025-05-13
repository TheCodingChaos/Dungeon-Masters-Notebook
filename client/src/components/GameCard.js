import { Link } from 'react-router-dom';
import PlayerCard from './PlayerCard';
import "./GameCard.css";

export default function GameCard({ game }) {
  // Destructure game properties
  const { id, title, description, players } = game;

  // Prepare values for JSX
  const gameLink = "/games/" + id;
  const hasDescription = Boolean(description);
  let descriptionNode = null;
  if (hasDescription) {
    descriptionNode = (
      <p>
        {description}
      </p>
    );
  }
  const playerCards = players.map(function(player) {
    return (
      <PlayerCard
        key={player.id}
        player={player}
        gameId={id}
      />
    );
  });

  return (
    <div className="game-card">
      {/* Game title with link to game details */}
      <h3>
        <Link to={gameLink}>
          {title}
        </Link>
      </h3>

      {/* Optional game description */}
      {descriptionNode}

      {/* List of players in the game */}
      <div className="players-list">
        {playerCards}
      </div>
    </div>
  );
}