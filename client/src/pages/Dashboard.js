

import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { SessionContext } from "../contexts/SessionContext";
import NewGame from "../components/NewGame";
import NewPlayer from "../components/NewPlayer";
import NewCharacter from "../components/NewCharacter";

export default function Dashboard() {
  const { sessionData, setSessionData } = useContext(SessionContext);
  // Track which player’s “Add Character” form is open
  const [openCharFor, setOpenCharFor] = useState(null);
  const toggleCharForm = (playerId) => {
    setOpenCharFor(prev => (prev === playerId ? null : playerId));
  };

  const user = sessionData.user;
  if (!user) return null;

  const games = user.games || [];

  // Helper to update context when a new game is created
  const handleGameCreated = (game) => {
    setSessionData(prev => ({
      ...prev,
      user: {
        ...prev.user,
        games: [...(prev.user.games || []), game]
      }
    }));
  };

  // Helper to update context when a new player is added to a game
  const handlePlayerCreated = (gameId, player) => {
    setSessionData(prev => ({
      ...prev,
      user: {
        ...prev.user,
        games: prev.user.games.map(g =>
          g.id === gameId
            ? { ...g, players: [...(g.players || []), player] }
            : g
        )
      }
    }));
  };

  // Helper to update context when a new character is created
  const handleCharacterCreated = (gameId, character) => {
    setSessionData(prev => ({
      ...prev,
      user: {
        ...prev.user,
        games: prev.user.games.map(g => {
          if (g.id !== gameId) return g;
          // append to characters array
          const updatedGame = {
            ...g,
            characters: [...(g.characters || []), character]
          };
          // also add to player entry
          updatedGame.players = updatedGame.players.map(p =>
            p.id === character.player_id
              ? { ...p, characters: [...(p.characters || []), character] }
              : p
          );
          return updatedGame;
        })
      }
    }));
  };

  return (
    <div>
      <h1>Welcome, {user.username}!</h1>
      <p>Here you can manage your games, add players, and assign characters.</p>

      <section>
        <h2>Create a New Game</h2>
        <NewGame onSuccess={handleGameCreated} />
      </section>

      <section>
        <h2>Your Games</h2>
        <div className="game-list">
          {games.length > 0 ? (
            games.map(game => {
              // Remove any null/undefined entries before rendering players
              const filteredPlayers = Array.isArray(game.players)
                ? game.players.filter(p => p != null)
                : [];
              return (
                <div key={game.id} className="game-card">
                  <h3>
                    <Link to={`/games/${game.id}`}>{game.title}</Link>
                  </h3>
                  {game.description && <p>{game.description}</p>}

                  <div>
                    <h4>Players</h4>
                    {filteredPlayers.length > 0 ? (
                      filteredPlayers.map(p => (
                        <div key={p.id} className="player-card">
                          <Link to={`/players/${p.id}`}>{p.name}</Link>
                          {p.summary && <p>{p.summary}</p>}
                          <ul>
                            {p.characters?.length ? (
                              p.characters.map(c => (
                                <li key={c.id}>
                                  {c.name} ({c.character_class} L{c.level})
                                </li>
                              ))
                            ) : (
                              <li>No characters yet</li>
                            )}
                          </ul>
                          <button onClick={() => toggleCharForm(p.id)}>
                            {openCharFor === p.id ? "Cancel" : "+ New Character"}
                          </button>
                          {openCharFor === p.id && (
                            <div style={{ margin: "0.5rem 0" }}>
                              <NewCharacter
                                gameId={game.id}
                                playerId={p.id}
                                onSuccess={(char) => {
                                  toggleCharForm(p.id);
                                  handleCharacterCreated(game.id, char);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p>No players for this game</p>
                    )}
                    <NewPlayer
                      gameId={game.id}
                      onSuccess={(player) => handlePlayerCreated(game.id, player)}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p>No games found. Create one above!</p>
          )}
        </div>
      </section>
    </div>
  );
}