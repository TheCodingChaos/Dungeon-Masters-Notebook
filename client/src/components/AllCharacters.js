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

    const games = sessionData.user?.games || [];
    // Flatten all characters with player and game info (imperative for clarity)
    const allCharacters = [];
    games.forEach(game => {
      (game.players || []).forEach(player => {
        (player.characters || []).forEach(character => {
          allCharacters.push({
            ...character,
            game,
            player,
            gameTitle: game.title,  // add direct title for convenience
          });
        });
      });
    });
    // Remove duplicate characters by ID
    const uniqueChars = Array.from(new Map(allCharacters.map(c => [c.id, c])).values());

    // Filter by game/player if selected, using early returns for readability
    let filtered = uniqueChars;
    if (filterGameId) {
      // Match against character.game_id rather than wrapper game.id
      filtered = filtered.filter(c => String(c.game_id) === filterGameId);
    }
    if (filterPlayerId) {
      filtered = filtered.filter(c => String(c.player.id) === filterPlayerId);
    }

    // For dropdown options:
    const uniqueGames = games;
    // Unique players across all games (declarative)
    const uniquePlayers = Array.from(
      new Map(
        games.flatMap(g => g.players ?? []).map(p => [p.id, p])
      ).values()
    );


    // Edit handler
    const handleEdit = (character) => {
        setEditingId(character.id);
    };

    // Delete handler
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


    // Precompute filters array
    const filters = [
      {
        label: "Filter by Game",
        options: uniqueGames.map(g => ({ value: g.id, label: g.title })),
        value: filterGameId,
        onChange: e => setFilterGameId(e.target.value),
      },
      {
        label: "Filter by Player",
        options: uniquePlayers.map(p => ({ value: p.id, label: p.name })),
        value: filterPlayerId,
        onChange: e => setFilterPlayerId(e.target.value),
      },
    ];

    // Precompute renderItem function
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

    return (
      <div>
        <FilterableList
          filters={filters}
          items={filtered}
          renderItem={renderItem}
        />
      </div>
    );
}