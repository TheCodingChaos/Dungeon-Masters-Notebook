import { createContext, useState, useEffect } from "react";
import callApi from "../utils/CallApi";

// Create the context object
export const SessionContext = createContext(null);

// Context provider component
export default function SessionProvider({ children }) {
  // Holds the session state (e.g. logged-in user)
  const [sessionData, setSessionData] = useState({});
  // Tracks whether the session has been checked yet
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  // Tracks whether the user is authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Update authentication state whenever sessionData changes
  useEffect(() => {
    setIsAuthenticated(!!sessionData.user);
  }, [sessionData]);

  // Function to check for an existing user session on page load
  async function initializeSession() {
    try {
      const response = await callApi("/check_session");
      if (response && !response.error) {
        setSessionData({ user: response });
        setIsAuthenticated(true);
      } else {
        setSessionData({});
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Session initialization failed:", error);
      setSessionData({});
      setIsAuthenticated(false);
    } finally {
      setIsSessionChecked(true);
    }
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
    <SessionContext.Provider value={{ 
      sessionData, 
      setSessionData, 
      isAuthenticated, 
      isSessionChecked,
      logout: async () => {
        try {
          await callApi("/logout", { method: "DELETE" });
        } catch (error) {
          console.error("Logout failed:", error);
        } finally {
          setSessionData({});
          setIsAuthenticated(false);
        }
      }
    }}>
      {children}
    </SessionContext.Provider>
  );
}