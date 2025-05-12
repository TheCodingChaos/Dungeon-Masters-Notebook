import { useContext, useState } from "react";
import { SessionContext } from "../contexts/SessionContext";
import FilterableList from "./FilterableList";
import CharacterCard from "./CharacterCard";
import NewCharacter from "./NewCharacter"

export default function AllCharacters() {
    const { sessionData, setSessionData } = useContext(SessionContext);
    const [filterGameId, setFilterGameId] = useState("");
    const [filterPlayerId, setFilterPlayerId] = useState("");
    const [editingId, setEditingId] = useState(null);

    // 1) Pull games from context
    const games = sessionData.user && sessionData.user.games ? sessionData.user.games : [];

    // 2) Flatten all characters with player and game info using for loops
    const allCharacters = [];
    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      const players = game.players || [];
      for (let j = 0; j < players.length; j++) {
        const player = players[j];
        const characters = player.characters || [];
        for (let k = 0; k < characters.length; k++) {
          const character = characters[k];
          const entry = {
            id: character.id,
            game: game,
            player: player,
            gameTitle: game.title,
            ...character
          };
          allCharacters.push(entry);
        }
      }
    }

    // 3) Dedupe: only first occurrence of each id
    const seen = {};
    const uniqueChars = [];
    for (let i = 0; i < allCharacters.length; i++) {
      const c = allCharacters[i];
      if (!seen[c.id]) {
        seen[c.id] = true;
        uniqueChars.push(c);
      }
    }

    // 4) Filter by game
    let filteredByGame = [];
    if (filterGameId) {
      for (let i = 0; i < uniqueChars.length; i++) {
        if (String(uniqueChars[i].game_id) === filterGameId) {
          filteredByGame.push(uniqueChars[i]);
        }
      }
    } else {
      filteredByGame = uniqueChars;
    }

    // 5) Filter by player
    let filteredChars = [];
    if (filterPlayerId) {
      for (let i = 0; i < filteredByGame.length; i++) {
        if (String(filteredByGame[i].player.id) === filterPlayerId) {
          filteredChars.push(filteredByGame[i]);
        }
      }
    } else {
      filteredChars = filteredByGame;
    }

    // 6) Build gameOptions
    const gameOptions = [];
    for (let i = 0; i < games.length; i++) {
      const g = games[i];
      gameOptions.push({ value: g.id, label: g.title });
    }

    // 7) Build playerOptions
    const allPlayers = [];
    for (let i = 0; i < games.length; i++) {
      const players = games[i].players || [];
      for (let j = 0; j < players.length; j++) {
        allPlayers.push(players[j]);
      }
    }
    const seenPlayers = {};
    const playerOptions = [];
    for (let i = 0; i < allPlayers.length; i++) {
      const p = allPlayers[i];
      if (!seenPlayers[p.id]) {
        seenPlayers[p.id] = true;
        playerOptions.push({ value: p.id, label: p.name });
      }
    }

    // 8) Filters array
    const filters = [
      { label: "Filter by Game", options: gameOptions, value: filterGameId, onChange: e => setFilterGameId(e.target.value) },
      { label: "Filter by Player", options: playerOptions, value: filterPlayerId, onChange: e => setFilterPlayerId(e.target.value) }
    ];

    // 9) Handlers & renderItem
    const handleEdit = (character) => {
      setEditingId(character.id);
    };

    const handleDelete = async (character) => {
      const res = await fetch(`/characters/${character.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setSessionData(prev => ({
          ...prev,
          user: {
            ...prev.user,
            games: prev.user.games.map(g => ({
              ...g,
              players: g.players.map(p => ({
                ...p,
                characters: p.characters.filter(c => c.id !== character.id)
              }))
            }))
          }
        }));
      }
    };

    const renderItem = (c) => {
      let jsx;
      if (editingId === c.id) {
        jsx = (
          <NewCharacter
            key={c.id}
            gameId={c.game.id}
            playerId={c.player.id}
            character={c}
            submitLabel="Save Changes"
            onSuccess={(updatedChar) => {
              setEditingId(null);
              const updatedGames = sessionData.user.games.map(game => {
                if (game.id !== updatedChar.game_id) return game;
                const updatedPlayers = game.players.map(player => {
                  if (player.id !== updatedChar.player_id) return player;
                  const updatedCharacters = player.characters.map(char =>
                    char.id === updatedChar.id ? updatedChar : char
                  );
                  return { ...player, characters: updatedCharacters };
                });
                return { ...game, players: updatedPlayers };
              });
              setSessionData(prev => ({
                ...prev,
                user: {
                  ...prev.user,
                  games: updatedGames,
                },
              }));
            }}
          />
        );
      } else {
        jsx = (
          <CharacterCard
            key={c.id}
            character={c}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        );
      }
      return jsx;
    };

    // 10) Pure JSX return
    return (
      <div>
        <FilterableList
          filters={filters}
          items={filteredChars}
          renderItem={renderItem}
        />
      </div>
    );
}