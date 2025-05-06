

import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { SessionContext } from "../contexts/SessionContext";
import NewGame from "../components/NewGame";

function Dashboard() {
  const { sessionData } = useContext(SessionContext);
  const games = sessionData.user?.games || [];
  const [showForm, setShowForm] = useState(false);

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
        {games.map((game) => (
          <div key={game.id} className="game-card">
            <Link to={`/games/${game.id}`}>
              <h2>{game.title}</h2>
              <p><strong>System:</strong> {game.system}</p>
              {game.start_date && (
                <p><strong>Start Date:</strong> {game.start_date}</p>
              )}
            </Link>
          </div>
        ))}
        {games.length === 0 && <p>No games found. Create one above!</p>}
      </div>
    </div>
  );
}

export default Dashboard;