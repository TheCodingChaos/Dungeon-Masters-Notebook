import { Link } from 'react-router-dom';
import PlayerCard from './PlayerCard';
import "./GameCard.css";

export default function GameCard({ game }) {
  const { id, title, description, players } = game;

  const gameLink = "/games/" + id;

  const descriptionNode = description
    ? <p>{description}</p>
    : null;

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