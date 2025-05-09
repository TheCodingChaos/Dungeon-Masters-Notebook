

import React, { useContext, useState } from "react";
import { SessionContext } from "../contexts/SessionContext";
import NewCharacter from "./NewCharacter";
import FilterableList from "./FilterableList";
import CharacterCard from "./CharacterCard";

export default function AllCharacters() {
    const { sessionData, setSessionData } = useContext(SessionContext);
    const [filterGameId, setFilterGameId] = useState("");
    const [filterPlayerId, setFilterPlayerId] = useState("");
    const [newCharGameId, setNewCharGameId] = useState("");
    const [editingId, setEditingId] = useState(null);

    const games = sessionData.user?.games || [];
    // Flatten all characters with player and game info (declarative)
    const allCharacters = games.flatMap(game =>
      (game.players ?? []).flatMap(player =>
        (player.characters ?? []).map(character => ({ ...character, game, player }))
      )
    );
    // Deduplicate by character id
    const uniqueChars = Array.from(new Map(allCharacters.map(c => [c.id, c])).values());

    // Filter by game/player if selected
    let filtered = uniqueChars;
    if (filterGameId) {
        filtered = filtered.filter(c => String(c.game.id) === filterGameId);
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

    // Handler for new character creation
    const handleNewCharSuccess = (newChar) => {
        setNewCharGameId("");
        setSessionData(prev => ({
            ...prev,
            user: {
                ...prev.user,
                games: prev.user.games.map(g => {
                    if (g.id !== newChar.game_id) return g;
                    // Add to characters
                    const updatedGame = {
                        ...g,
                        characters: [...(g.characters || []), newChar]
                    };
                    // Also add to player in this game
                    updatedGame.players = updatedGame.players.map(p =>
                        p.id === newChar.player_id
                            ? { ...p, characters: [...(p.characters || []), newChar] }
                            : p
                    );
                    return updatedGame;
                })
            }
        }));
    };

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

    const newCharControls = (
        <div style={{ marginBottom: "1rem" }}>
            <label>
                Create New Character in Game:{' '}
                <select
                    value={newCharGameId}
                    onChange={e => setNewCharGameId(e.target.value)}
                >
                    <option value="">Select Game</option>
                    {uniqueGames.map(g => (
                        <option key={g.id} value={g.id}>{g.title}</option>
                    ))}
                </select>
            </label>
            {newCharGameId && (
                <div style={{ marginTop: "0.5rem" }}>
                    <NewCharacter
                        gameId={+newCharGameId}
                        onSuccess={handleNewCharSuccess}
                    />
                </div>
            )}
        </div>
    );

    return (
        <div>
            <FilterableList
                filters={[
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
                ]}
                items={filtered}
                renderItem={c =>
                    editingId === c.id ? (
                        <NewCharacter
                            key={c.id}
                            gameId={c.game.id}
                            playerId={c.player.id}
                            onSuccess={(updatedChar) => {
                                setEditingId(null);
                                setSessionData(prev => ({
                                    ...prev,
                                    user: {
                                        ...prev.user,
                                        games: prev.user.games.map(g => {
                                            if (g.id !== updatedChar.game_id) return g;
                                            return {
                                                ...g,
                                                players: g.players.map(p =>
                                                    p.id === updatedChar.player_id
                                                        ? {
                                                            ...p,
                                                            characters: p.characters.map(c =>
                                                                c.id === updatedChar.id ? updatedChar : c
                                                            ),
                                                        }
                                                        : p
                                                ),
                                            };
                                        }),
                                    },
                                }));
                            }}
                        />
                    ) : (
                        <CharacterCard
                            key={c.id}
                            character={c}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    )
                }
            />
            {newCharControls}
        </div>
    );
}