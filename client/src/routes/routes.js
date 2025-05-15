import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import App from "../App";
import AuthPage from "../pages/AuthPage";
import Login from "../components/Login";
import Signup from "../components/Signup";
import Dashboard from "../pages/Dashboard";
import GamePage from "../pages/GamePage";
import PlayerPage from "../pages/PlayerPage";
import SessionPage from "../pages/SessionPage";
import CharacterPage from "../pages/CharacterPage";
import AllCharactersPage from "../pages/AllCharactersPage";
import ErrorPage from "../components/ErrorPage";

import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { SessionContext } from "../contexts/SessionContext";

// Wrapper that redirects authenticated users away from public pages
function AuthRedirect({ children }) {
  const { sessionData, isSessionChecked } = useContext(SessionContext);
  if (!isSessionChecked) return null;  // or a spinner if you prefer
  return sessionData.user ? <Navigate to="/dashboard" replace /> : children;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <AuthRedirect><AuthPage /></AuthRedirect> },
      { path: "login", element: <AuthRedirect><Login /></AuthRedirect> },
      { path: "signup", element: <AuthRedirect><Signup /></AuthRedirect> },

      // Protected pages
      {
        element: <ProtectedRoute />,
        children: [
          { path: "dashboard", element: <Dashboard /> },
          { path: "games/:gameId", element: <GamePage /> },
          { path: "players/:playerId", element: <PlayerPage /> },
          { path: "sessions/:sessionId", element: <SessionPage /> },
          { path: "characters/:characterId", element: <CharacterPage /> },
          { path: "characters", element: <AllCharactersPage /> },
        ],
      },

      { path: "*", element: <ErrorPage /> },
    ],
  },
]);