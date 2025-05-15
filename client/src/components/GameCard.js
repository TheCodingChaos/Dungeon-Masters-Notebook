import { Link } from 'react-router-dom';
import PlayerCard from './PlayerCard';
import "./GameCard.css";

export default function GameCard({ game }) {
  // Destructure game properties
  const { id, title, description, players } = game;

  // Compute the game link
  const gameLink = "/games/" + id;

  // Compute the description node if present
  const descriptionNode = description
    ? <p>{description}</p>
    : null;

  // Render the player cards
  function renderPlayerCards() {
    return players.map((player) => (
      <PlayerCard
        key={player.id}
        player={player}
        gameId={id}
      />
    ));
  }

  return (
    <div className="game-card">
      <h3>
        <Link to={gameLink}>
          {title}
        </Link>
      </h3>
      {descriptionNode}
      <div className="players-list">
        {renderPlayerCards()}
      </div>
    </div>
  );
}