import { createContext, useState, useEffect } from "react";

// Create the context object
export const SessionContext = createContext(null);

// Context provider component
export default function SessionProvider({ children }) {
  // Holds the session state (e.g. logged-in user)
  const [sessionData, setSessionData] = useState({});

  // Tracks whether the session has been checked yet
  const [isSessionChecked, setIsSessionChecked] = useState(false);

  // Function to check for an existing user session on page load
  async function initializeSession() {
    try {
      const response = await fetch("/check_session", { credentials: "include" });

      if (response.ok) {
        const user = await response.json();

        // Save the user into sessionData state
        setSessionData((prev) => ({
          ...prev,
          user: user,
        }));
      }
    } catch (error) {
      console.error("Session initialization failed:", error);
    }

    // Mark that the session check has completed
    setIsSessionChecked(true);
  }

  // Check session on initial component mount
  useEffect(() => {
    initializeSession();
  }, []);

  // Show loading state while checking session
  if (!isSessionChecked) {
    return <p>Loading...</p>;
  }

  // Provide session context to children
  return (
    <SessionContext.Provider value={{ sessionData, setSessionData }}>
      {children}
    </SessionContext.Provider>
  );
}