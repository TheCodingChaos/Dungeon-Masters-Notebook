import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { SessionContext } from "../contexts/SessionContext";

function ProtectedRoute({ children }) {
  const { isAuthenticated, isSessionChecked } = useContext(SessionContext);

  if (!isSessionChecked) {
    return <p>Loading...</p>;
  }

  return isAuthenticated ? children : <Navigate replace to="/" />;
}

export default ProtectedRoute;