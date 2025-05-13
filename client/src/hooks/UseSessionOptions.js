import { useContext } from "react";
import { SessionContext } from "../contexts/SessionContext";

/**
 * useSessionOptions: provides dropdown option lists for games, players, and characters.
 * Returns arrays of { value, label } for current user's games, players, and characters.
 */
export default function useSessionOptions() {
  const { sessionData } = useContext(SessionContext);
  const user = sessionData.user;

  // --- Build game options ---
  // Format each game as { value: game.id, label: game.title }
  const gameOptions = user?.games?.map((game) => ({
    value: game.id,
    label: game.title,
  })) || [];

  // --- Build player options ---
  // Start with any players attached at top level (unattached to games)
  const allPlayers = user?.players ? [...user.players] : [];

  // Gather all players from all games
  if (user?.games) {
    for (let game of user.games) {
      if (game.players) {
        for (let player of game.players) {
          allPlayers.push(player);
        }
      }
    }
  }

  // Create a map to ensure player IDs are unique
  const uniquePlayersMap = new Map();
  for (let player of allPlayers) {
    uniquePlayersMap.set(player.id, player);
  }

  // Format players as { value: id, label: name }
  const playerOptions = Array.from(uniquePlayersMap.values()).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  // --- Build character options ---
  const allCharacters = [];

  // Gather all characters from all players of all games
  if (user?.games) {
    for (let game of user.games) {
      if (game.players) {
        for (let player of game.players) {
          if (player.characters) {
            for (let character of player.characters) {
              allCharacters.push(character);
            }
          }
        }
      }
    }
  }

  // Create a map to ensure character IDs are unique
  const uniqueCharactersMap = new Map();
  for (let character of allCharacters) {
    uniqueCharactersMap.set(character.id, character);
  }

  // Format characters as { value: id, label: name }
  const characterOptions = Array.from(uniqueCharactersMap.values()).map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return { gameOptions, playerOptions, characterOptions };
}