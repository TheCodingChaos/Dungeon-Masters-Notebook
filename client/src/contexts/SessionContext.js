import React, { createContext, useState, useEffect } from "react";

export const SessionContext = createContext(null);

export default function SessionProvider({ children }) {
  const [sessionData, setSessionData] = useState({});
  const [isSessionChecked, setIsSessionChecked] = useState(false);

  useEffect(() => {
    async function initialize() {
      try {
        const res = await fetch("/check_session", { credentials: "include" });
        if (res.ok) {
          const user = await res.json();
          setSessionData(prev => ({ ...prev, user }));
        }
      } catch (e) {
        console.error("Session init failed", e);
      }
      setIsSessionChecked(true);
    }
    initialize();
  }, []);

  if (!isSessionChecked) {
    return <p>Loading...</p>;
  }

  return (
    <SessionContext.Provider value={{ sessionData, setSessionData }}>
      {children}
    </SessionContext.Provider>
  );
}