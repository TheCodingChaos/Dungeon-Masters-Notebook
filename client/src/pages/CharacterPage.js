
import React, { useContext, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import FormField from "../components/FormField";
import * as Yup from "yup";
import { SessionContext } from "../contexts/SessionContext";

const CharacterSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  character_class: Yup.string().required("Class is required"),
  level: Yup.number().min(1).required("Level is required"),
  icon: Yup.string().url().nullable(),
  is_active: Yup.boolean(),
});

function CharacterPage() {
  const { characterId } = useParams();
  const navigate = useNavigate();
  const { sessionData, setSessionData } = useContext(SessionContext);
  const [isEditing, setIsEditing] = useState(false);

  const games = sessionData.user?.games || [];
  const entry = games.flatMap(g => g.players.flatMap(p => (p.characters || []).map(c => ({ c, p }))))
    .find(({ c }) => c.id === parseInt(characterId, 10));
  const char = entry?.c;
  const parentPlayer = entry?.p;


  const handleDelete = async () => {
    const res = await fetch(`/characters/${char.id}`, {
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
              characters: (p.characters || []).filter(ch => ch.id !== char.id)
            }))
          }))
        }
      }));
      navigate(`/players/${parentPlayer.id}`);
    }
  };

  let content;
  if (!char) {
    content = (
      <div>
        <p>Character not found.</p>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    );
  } else if (isEditing) {
    content = (
      <div>
        <h1>Edit Character</h1>
        {/* Edit form JSX starts */}
        <Formik
          initialValues={{
            name: char.name,
            character_class: char.character_class,
            level: char.level,
            icon: char.icon || "",
            is_active: char.is_active,
          }}
          validationSchema={CharacterSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              const res = await fetch(`/characters/${char.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(values),
              });
              if (!res.ok) throw new Error("Failed to update character");
              const updated = await res.json();
              setSessionData(prev => ({
                ...prev,
                user: {
                  ...prev.user,
                  games: prev.user.games.map(g => ({
                    ...g,
                    players: g.players.map(p => ({
                      ...p,
                      characters: p.characters.map(ch =>
                        ch.id === updated.id ? updated : ch
                      ),
                    })),
                  })),
                },
              }));
              setIsEditing(false);
            } catch (e) {
              console.error(e);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              {ErrorMessage.server && <div className="error">{ErrorMessage.server}</div>}
              <FormField label="Name" name="name" />
              <FormField label="Class" name="character_class" />
              <FormField label="Level" name="level" type="number" />
              <FormField label="Icon URL" name="icon" />
              <div>
                <label>
                  <Field type="checkbox" name="is_active" />
                  Active
                </label>
              </div>
              <button type="submit" disabled={isSubmitting}>Save</button>
              <button type="button" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            </Form>
          )}
        </Formik>
      </div>
    );
  } else {
    content = (
      <div>
        <Link to={`/players/${parentPlayer.id}`}>← Back to Player</Link>
        <h1>{char.name}</h1>
        <p><strong>Class:</strong> {char.character_class}</p>
        <p><strong>Level:</strong> {char.level}</p>
        {char.icon && <img src={char.icon} alt={`${char.name} icon`} style={{ maxWidth: "100px" }} />}
        <p><strong>Status:</strong> {char.is_active ? "Active" : "Inactive"}</p>
        <p><strong>Created by:</strong> <Link to={`/players/${parentPlayer.id}`}>{parentPlayer.name}</Link></p>
        <div>
          <h3>Game</h3>
          <Link to={`/games/${char.game_id}`}>
            {sessionData.user.games.find(g => g.id === char.game_id)?.title || 'Unknown Game'}
          </Link>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <button onClick={() => setIsEditing(true)}>Edit</button>
          <button onClick={handleDelete} style={{ marginLeft: "0.5rem" }}>Delete</button>
        </div>
      </div>
    );
  }

  return content;
}

export default CharacterPage;