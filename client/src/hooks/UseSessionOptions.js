

import { useContext } from "react";
import { SessionContext } from "../contexts/SessionContext";

/**
 * Returns arrays of { value, label } for games, players, and characters for the current session.
 */
export default function useSessionOptions() {
  const { sessionData } = useContext(SessionContext);
  const user = sessionData.user;

  // Games: {value: id, label: title}
  const gameOptions =
    user?.games?.map(g => ({
      value: g.id,
      label: g.title
    })) || [];

  // Players: unique across all games
  let playerList = [];
  if (user?.games) {
    const seen = new Set();
    user.games.forEach(g => {
      (g.players || []).forEach(p => {
        if (p && !seen.has(p.id)) {
          seen.add(p.id);
          playerList.push(p);
        }
      });
    });
  }
  const playerOptions = playerList.map(p => ({
    value: p.id,
    label: p.name
  }));

  // Characters: unique across all games/players
  let characterList = [];
  if (user?.games) {
    const seen = new Set();
    user.games.forEach(g => {
      (g.players || []).forEach(p => {
        (p.characters || []).forEach(c => {
          if (c && !seen.has(c.id)) {
            seen.add(c.id);
            characterList.push(c);
          }
        });
      });
    });
  }
  const characterOptions = characterList.map(c => ({
    value: c.id,
    label: c.name
  }));

  return { gameOptions, playerOptions, characterOptions };
}