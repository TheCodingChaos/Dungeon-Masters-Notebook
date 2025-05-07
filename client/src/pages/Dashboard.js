

import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { SessionContext } from "../contexts/SessionContext";
import NewGame from "../components/NewGame";
import NewPlayer from "../components/NewPlayer";

// Helper to format ISO date strings as "MMM DD, YYYY"
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  });
};

function Dashboard() {
  const { sessionData } = useContext(SessionContext);
  const games = sessionData.user?.games || [];
  const [showForm, setShowForm] = useState(false);
  const [activePlayerFormId, setActivePlayerFormId] = useState(null);

  // Prepare the list of game cards
  const gameCards = games.map((game) => {
    const isPlayerFormActive = activePlayerFormId === game.id;
    return (
      <div key={game.id} className="game-card">
        <h2>{game.title}</h2>
        <p><strong>System:</strong> {game.system}</p>
        {game.start_date && (
          <p><strong>Start Date:</strong> {formatDate(game.start_date)}</p>
        )}
        <ul>
          {game.players?.length
            ? game.players.map((player) => (
                <li key={player.id}>{player.name}</li>
              ))
            : <li>No players yet</li>}
        </ul>
        <button
          type="button"
          onClick={() =>
            setActivePlayerFormId(isPlayerFormActive ? null : game.id)
          }
        >
          {isPlayerFormActive ? "Cancel" : "+ New Player"}
        </button>
        {isPlayerFormActive && (
          <div style={{ margin: "0.5rem 0" }}>
            <NewPlayer
              gameId={game.id}
              onSuccess={() => setActivePlayerFormId(null)}
            />
          </div>
        )}
        <Link to={`/games/${game.id}`}>View Details</Link>
      </div>
    );
  });

  return (
    <div>
      <h1>Dashboard</h1>
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New Game"}
        </button>
      </div>
      {showForm && (
        <div style={{ marginBottom: "1rem" }}>
          <NewGame onSuccess={() => setShowForm(false)} />
        </div>
      )}
      <div className="game-list">
        {gameCards.length > 0 ? gameCards : <p>No games found. Create one above!</p>}
      </div>
    </div>
  );
}

export default Dashboard;