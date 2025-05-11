import { useContext } from "react";
import { SessionContext } from "../contexts/SessionContext";
import NewGame from "../components/NewGame";
import NewPlayer from "../components/NewPlayer";
import GameCard from "../components/GameCard";
import "../styles/pages.css";

// Dashboard page for managing games, players, and characters
export default function Dashboard() {
  // Retrieve session data and update function from context
  const { sessionData, setSessionData } = useContext(SessionContext);
  const user = sessionData.user;

  // If the user is not logged in, show nothing
  if (!user) return null;

  // Get user's games, or empty array if none
  const games = user.games || [];

  // Handle when a new game is created
  function handleGameCreated(newGame) {
    setSessionData(function(prev) {
      return {
        ...prev,
        user: {
          ...prev.user,
          games: [...(prev.user.games || []), newGame],
        },
      };
    });
  }

  // Handle when a new player is created and added to a game
  function handlePlayerCreated(gameId, newPlayer) {
    setSessionData(function(prev) {
      // Create updated games array with new player added to the correct game
      const updatedGames = [];
      for (let i = 0; i < prev.user.games.length; i++) {
        const g = prev.user.games[i];
        if (g.id === gameId) {
          updatedGames.push({
            ...g,
            players: [...(g.players || []), newPlayer],
          });
        } else {
          updatedGames.push(g);
        }
      }
      return {
        ...prev,
        user: {
          ...prev.user,
          games: updatedGames,
        },
      };
    });
  }

  // Handle when a new character is created and added to a player in a game
  function handleCharacterCreated(gameId, newChar) {
    setSessionData(function(prev) {
      // Create updated games array with new character added to the correct player
      const updatedGames = [];
      for (let i = 0; i < prev.user.games.length; i++) {
        const g = prev.user.games[i];
        if (g.id !== gameId) {
          updatedGames.push(g);
          continue;
        }
        // Update players for this game
        const updatedPlayers = [];
        for (let j = 0; j < (g.players || []).length; j++) {
          const p = g.players[j];
          if (p.id === newChar.player_id) {
            updatedPlayers.push({
              ...p,
              characters: [...(p.characters || []), newChar],
            });
          } else {
            updatedPlayers.push(p);
          }
        }
        updatedGames.push({
          ...g,
          players: updatedPlayers,
        });
      }
      return {
        ...prev,
        user: {
          ...prev.user,
          games: updatedGames,
        },
      };
    });
  }

  return (
    <div className="dash-page">
      {/* List of game cards */}
      {games.length > 0 ? (
        // Render each game as a card inside a wrapper
        games.map(function(game) {
          return (
            <div key={game.id}>
              <div className="game-card-wrapper">
                <GameCard game={game} />
              </div>
            </div>
          );
        })
      ) : (
        <p>No games found. Create one above!</p>
      )}
      {/* Form section for creating games and players */}
      <div className="dashboard-form-section">
        <div className="form-wrapper">
          <h3>New Game</h3>
          <NewGame onSuccess={handleGameCreated} />
        </div>
        <div className="form-wrapper">
          <h3>New Player</h3>
          <NewPlayer
            gameId={games[0]?.id || null}
            onSuccess={function(newPlayer, newChar) {
              // Only handle if there's at least one game
              if (!games[0]) return;
              handlePlayerCreated(games[0].id, newPlayer);
              if (newChar) {
                handleCharacterCreated(games[0].id, newChar);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}