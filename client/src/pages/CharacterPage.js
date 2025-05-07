
import React, { useContext, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
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
  let char, parentPlayer;
  games.forEach(g =>
    g.players.forEach(p =>
      p.characters?.forEach(c => {
        if (c.id === parseInt(characterId, 10)) {
          char = c;
          parentPlayer = p;
        }
      })
    )
  );


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
              characters: (p.characters||[]).filter(ch => ch.id !== char.id)
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
              {/* form fields */}
            </Form>
          )}
        </Formik>
        {/* Edit form JSX ends */}
      </div>
    );
  } else {
    content = (
      <div>
        <Link to={`/players/${parentPlayer.id}`}>← Back to Player</Link>
        <h1>{char.name}</h1>
        <p><strong>Class:</strong> {char.character_class}</p>
        <p><strong>Level:</strong> {char.level}</p>
        {char.icon && <img src={char.icon} alt={`${char.name} icon`} style={{maxWidth: "100px"}} />}
        <p><strong>Status:</strong> {char.is_active ? "Active" : "Inactive"}</p>
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