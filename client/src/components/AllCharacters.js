

import React, { useContext, useState } from "react";
import { SessionContext } from "../contexts/SessionContext";
import NewCharacter from "./NewCharacter";
import Filter from "./Filter";
import FilterableList from "./FilterableList";
import CharacterCard from "./CharacterCard";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

export default function AllCharacters() {
    const { sessionData, setSessionData } = useContext(SessionContext);
    const [filterGameId, setFilterGameId] = useState("");
    const [filterPlayerId, setFilterPlayerId] = useState("");
    const [newCharGameId, setNewCharGameId] = useState("");
    // Track which character is being edited inline
    const [editingCharId, setEditingCharId] = useState(null);

    // Schema for inline character editing
    const EditCharSchema = Yup.object({
        name: Yup.string().required("Name is required"),
        character_class: Yup.string().required("Class is required"),
        level: Yup.number().min(1, "Level must be at least 1").required("Level is required"),
        icon: Yup.string().url("Must be a valid URL").nullable(),
        is_active: Yup.boolean(),
    });

    const games = sessionData.user?.games || [];
    // Flatten all characters with player and game info
    let allCharacters = [];
    games.forEach(game => {
        (game.players || []).forEach(player => {
            (player.characters || []).forEach(character => {
                allCharacters.push({
                    ...character,
                    player,
                    game,
                });
            });
        });
    });

    // Remove duplicates (if any) by character id
    allCharacters = allCharacters.filter(
        (c, i, arr) => arr.findIndex(x => x.id === c.id) === i
    );

    // Filter by game/player if selected
    let filtered = allCharacters;
    if (filterGameId) {
        filtered = filtered.filter(c => c.game.id === +filterGameId);
    }
    if (filterPlayerId) {
        filtered = filtered.filter(c => c.player.id === +filterPlayerId);
    }

    // For dropdown options:
    const uniqueGames = games;
    // Unique players across all games
    const uniquePlayers = [];
    const seenPlayerIds = new Set();
    games.forEach(game => {
        (game.players || []).forEach(player => {
            if (player && !seenPlayerIds.has(player.id)) {
                seenPlayerIds.add(player.id);
                uniquePlayers.push(player);
            }
        });
    });

    // Handler for deleting a character
    const handleDelete = async (charId) => {
        const res = await fetch(`/characters/${charId}`, {
            method: "DELETE",
            credentials: "include",
        });
        if (res.ok) {
            // Remove character from context everywhere
            setSessionData(prev => ({
                ...prev,
                user: {
                    ...prev.user,
                    games: prev.user.games.map(g => ({
                        ...g,
                        players: (g.players || []).map(p => ({
                            ...p,
                            characters: (p.characters || []).filter(c => c.id !== charId)
                        })),
                        characters: (g.characters || []).filter(c => c.id !== charId)
                    }))
                }
            }));
        }
    };

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

    const characterCards = filtered.length === 0
        ? <p>No characters found.</p>
        : filtered.map(c => (
            <div key={c.id} style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "1rem",
                width: "260px",
                boxSizing: "border-box"
            }}>
                {editingCharId === c.id ? (
                    <Formik
                        initialValues={{
                            name: c.name,
                            character_class: c.character_class,
                            level: c.level,
                            icon: c.icon || "",
                            is_active: c.is_active,
                        }}
                        validationSchema={EditCharSchema}
                        onSubmit={async (values, { setSubmitting, setErrors }) => {
                            // ...existing submit logic...
                        }}
                    >
                        {({ isSubmitting, errors }) => (
                            <Form>
                                {/* ...existing inline form fields... */}
                            </Form>
                        )}
                    </Formik>
                ) : (
                    <div>
                        <h3>{c.name}</h3>
                        <p>
                            <strong>Class:</strong> {c.character_class}<br />
                            <strong>Level:</strong> {c.level}<br />
                            {c.icon && (
                                <>
                                    <strong>Icon:</strong>
                                    <img src={c.icon} alt={`${c.name} icon`} style={{ maxWidth: "100px" }} />
                                    <br />
                                </>
                            )}
                            <strong>Status:</strong> {c.is_active ? "Active" : "Inactive"}<br />
                            <strong>Player:</strong> {c.player.name}<br />
                            <strong>Game:</strong> {c.game.title}
                        </p>
                        <button onClick={() => setEditingCharId(c.id)}>Edit</button>
                        <button
                            onClick={() => handleDelete(c.id)}
                            style={{ marginLeft: "0.5rem" }}
                        >
                            Delete
                        </button>
                    </div>
                )}
            </div>
        ));

    return (
        <div>
            <FilterableList
                filters={[
                    {
                        label: "Filter by Game",
                        options: uniqueGames.map(g => ({ value: g.id, label: g.title })),
                        value: filterGameId,
                        onChange: setFilterGameId,
                    },
                    {
                        label: "Filter by Player",
                        options: uniquePlayers.map(p => ({ value: p.id, label: p.name })),
                        value: filterPlayerId,
                        onChange: setFilterPlayerId,
                    },
                ]}
                items={filtered}
                renderItem={c => <CharacterCard key={c.id} character={c} />}
            />

            { /* your existing “newCharControls” block goes here, unchanged */}
            {newCharControls}
        </div>
    );
}