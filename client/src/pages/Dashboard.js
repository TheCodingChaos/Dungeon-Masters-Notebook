
import React, { useContext } from "react";
import { SessionContext } from "../contexts/SessionContext";
import NewGame from "../components/NewGame";
import NewPlayer from "../components/NewPlayer";
import GameCard from "../components/GameCard";

export default function Dashboard() {
  const { sessionData, setSessionData } = useContext(SessionContext);
  const user = sessionData.user;
  if (!user) return null;

  const games = user.games || [];

  const handleGameCreated = newGame => {
    setSessionData(prev => ({
      ...prev,
      user: { ...prev.user, games: [...(prev.user.games||[]), newGame] }
    }));
  };

  const handlePlayerCreated = (gameId, newPlayer) => {
    setSessionData(prev => ({
      ...prev,
      user: {
        ...prev.user,
        games: prev.user.games.map(g =>
          g.id === gameId ? { ...g, players: [...(g.players||[]), newPlayer] } : g
        )
      }
    }));
  };

  const handleCharacterCreated = (gameId, newChar) => {
    setSessionData(prev => ({
      ...prev,
      user: {
        ...prev.user,
        games: prev.user.games.map(g => {
          if (g.id !== newChar.game_id) return g;
          return {
            ...g,
            players: (g.players||[]).map(p =>
              p.id === newChar.player_id
                ? { ...p, characters: [...(p.characters||[]), newChar] }
                : p
            )
          };
        })
      }
    }));
  };

  return (
    <div>
      <NewGame onSuccess={handleGameCreated} />

      {games.length > 0 ? (
        games.map(game => (
          <div key={game.id}>
            <GameCard
              game={game}
              onCharacterAdded={handleCharacterCreated}
            />
            <NewPlayer
              gameId={game.id}
              onSuccess={(newPlayer, newChar) => {
                handlePlayerCreated(game.id, newPlayer);
                newChar && handleCharacterCreated(game.id, newChar);
              }}
            />
          </div>
        ))
      ) : (
        <p>No games found. Create one above!</p>
      )}
    </div>
  );
}