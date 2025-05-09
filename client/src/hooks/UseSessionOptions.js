

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

  // Players: unique across all games (declarative)
  const playerOptions = Array.from(
    new Map(
      user?.games?.flatMap(g => g.players || []).map(p => [p.id, p])
    ).values()
  ).map(p => ({ value: p.id, label: p.name }));

  // Characters: unique across all games/players (declarative)
  const characterOptions = Array.from(
    new Map(
      user?.games
        ?.flatMap(g => g.players || [])
        .flatMap(p => p.characters || [])
        .map(c => [c.id, c])
    ).values()
  ).map(c => ({ value: c.id, label: c.name }));

  return { gameOptions, playerOptions, characterOptions };
}