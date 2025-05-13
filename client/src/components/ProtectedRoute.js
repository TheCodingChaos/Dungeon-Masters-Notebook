import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { SessionContext } from "../contexts/SessionContext";

function ProtectedRoute({ children }) {
  const { sessionData, isSessionChecked } = useContext(SessionContext);

    if (!isSessionChecked) {
      return <p>Loading...</p>;
    }

  return sessionData.user ? children : <Navigate replace to="/" />;
}

export default ProtectedRoute;