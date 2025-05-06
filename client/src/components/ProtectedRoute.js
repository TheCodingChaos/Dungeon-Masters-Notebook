

import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { SessionContext } from "../contexts/SessionContext";

function ProtectedRoute({ children }) {
  const { sessionData } = useContext(SessionContext);
  return sessionData.user ? children : <Navigate to="/" />;
}

export default ProtectedRoute;