import React, { useContext } from 'react';
import { SessionContext } from '../contexts/SessionContext';
import NewGameWithAssignments from '../components/NewGameWithAssignments';
import NewPlayer from '../components/NewPlayer';
import GameCard from '../components/GameCard';
import '../styles/pages.css';

export default function Dashboard() {
  const { sessionData, setSessionData } = useContext(SessionContext);
  const user = sessionData.user;
  const gamesList = user?.games || [];

  if (!user) {
    return null;
  }

  // Handlers to update session data
  const addGameToSession = newGame => {
    setSessionData(prev => ({
      ...prev,
      user: {
        ...prev.user,
        games: [...(prev.user.games || []), newGame],
      },
    }));
  };

  const addPlayerToGame = (gameId, newPlayer) => {
    setSessionData(prev => ({
      ...prev,
      user: {
        ...prev.user,
        games: prev.user.games.map(game =>
          game.id === gameId
            ? { ...game, players: [...(game.players || []), newPlayer] }
            : game
        ),
      },
    }));
  };

  const addCharacterToPlayer = (gameId, newCharacter) => {
    setSessionData(prev => ({
      ...prev,
      user: {
        ...prev.user,
        games: prev.user.games.map(game =>
          game.id === gameId
            ? {
                ...game,
                players: (game.players || []).map(player =>
                  player.id === newCharacter.player_id
                    ? {
                        ...player,
                        characters: [
                          ...(player.characters || []),
                          newCharacter,
                        ],
                      }
                    : player
                ),
              }
            : game
        ),
      },
    }));
  };

  // Combined callback from NewPlayer
  const handleNewPlayerSuccess = (gameId, newPlayer, newChar) => {
    addPlayerToGame(gameId, newPlayer);
    if (newChar) {
      addCharacterToPlayer(gameId, newChar);
    }
  };

  // Render game cards or fallback message
  const renderGameCards = () =>
    gamesList.length > 0 ? (
      gamesList.map(game => (
        <div key={game.id} className="game-card-wrapper">
          <GameCard game={game} />
        </div>
      ))
    ) : (
      <p>No games found. Create one above!</p>
    );

  return (
    <div className="dash-page">
      {renderGameCards()}

      <div className="dashboard-form-section">
        <div className="form-wrapper">
          <h3>New Game</h3>
          <NewGameWithAssignments onSuccess={addGameToSession} />
        </div>
        <div className="form-wrapper">
          <h3>New Player & Initial Character</h3>
          <NewPlayer
            gameId={gamesList[0]?.id || null}
            onSuccess={handleNewPlayerSuccess}
          />
        </div>
      </div>
    </div>
  );
}