import { useContext } from "react";
import { SessionContext } from "../contexts/SessionContext";

/**
 * useSessionOptions: provides dropdown option lists for games, players, and characters.
 * Returns arrays of { value, label } for current user's games, players, and characters.
 */
export default function useSessionOptions() {
  const { sessionData } = useContext(SessionContext);
  const user = sessionData.user;

  // List of the user's games or empty array
  const userGames = user && user.games ? user.games : [];

  // List of the user's top-level players or empty array
  const userPlayers = user && user.players ? user.players : [];

  // Combine all players: start with top-level
  const allPlayers = [];
  for (let i = 0; i < userPlayers.length; i++) {
    allPlayers.push(userPlayers[i]);
  }
  // Add players from each game
  for (let j = 0; j < userGames.length; j++) {
    const game = userGames[j];
    if (game.players) {
      for (let k = 0; k < game.players.length; k++) {
        allPlayers.push(game.players[k]);
      }
    }
  }

  // Build gameOptions list
  const gameOptions = [];
  for (let i = 0; i < userGames.length; i++) {
    const game = userGames[i];
    const option = { value: game.id, label: game.title };
    gameOptions.push(option);
  }

  // Remove duplicate players by ID
  const uniquePlayersMap = {};
  for (let i = 0; i < allPlayers.length; i++) {
    const player = allPlayers[i];
    uniquePlayersMap[player.id] = player;
  }
  // Build playerOptions list
  const playerOptions = [];
  for (const id in uniquePlayersMap) {
    const p = uniquePlayersMap[id];
    playerOptions.push({ value: p.id, label: p.name });
  }

  // Gather all characters from all players in all games
  const allCharacters = [];
  for (let i = 0; i < userGames.length; i++) {
    const game = userGames[i];
    if (game.players) {
      for (let j = 0; j < game.players.length; j++) {
        const player = game.players[j];
        if (player.characters) {
          for (let k = 0; k < player.characters.length; k++) {
            allCharacters.push(player.characters[k]);
          }
        }
      }
    }
  }

  // Remove duplicate characters by ID
  const uniqueCharactersMap = {};
  for (let i = 0; i < allCharacters.length; i++) {
    const character = allCharacters[i];
    uniqueCharactersMap[character.id] = character;
  }
  // Build characterOptions list
  const characterOptions = [];
  for (const id in uniqueCharactersMap) {
    const c = uniqueCharactersMap[id];
    characterOptions.push({ value: c.id, label: c.name });
  }

  return { gameOptions, playerOptions, characterOptions };
}