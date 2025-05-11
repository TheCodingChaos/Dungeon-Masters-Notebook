import { useContext } from "react";
import FormField from "./FormField";
import { SessionContext } from "../contexts/SessionContext";
import * as Yup from "yup";
import CrudForm from "../hooks/UseCRUDForm";

// Define validation schema for a new session
const NewSessionSchema = Yup.object({
  date: Yup.date().required("Date is required"),
  summary: Yup.string(),
});

// Component for creating a new game session
export default function NewSession({ gameId, onSuccess }) {
  const { setSessionData } = useContext(SessionContext);

  return (
    <CrudForm
      path={`/games/${gameId}/sessions`}
      initialValues={{
        date: "",
        summary: "",
      }}
      validationSchema={NewSessionSchema}
      onSubmitSuccess={(newSession) => {
        // Copy the previous games array
        const updatedGames = [];

        // Loop through the previous games
        setSessionData((prev) => {
          prev.user.games.forEach((g) => {
            if (g.id === gameId) {
              // If it's the current game, append the new session
              const updatedGame = {
                ...g,
                sessions: [...(g.sessions || []), newSession],
              };
              updatedGames.push(updatedGame);
            } else {
              // Otherwise, leave the game unchanged
              updatedGames.push(g);
            }
          });

          // Update the session context with the modified games list
          return {
            ...prev,
            user: {
              ...prev.user,
              games: updatedGames,
            },
          };
        });

        // Trigger any additional success handler
        if (onSuccess) onSuccess(newSession);
      }}
    >
      {/* Input for session date */}
      <FormField
        label="Date"
        name="date"
        type="date"
      />

      {/* Input for session summary */}
      <FormField
        label="Summary"
        name="summary"
        as="textarea"
      />
    </CrudForm>
  );
}