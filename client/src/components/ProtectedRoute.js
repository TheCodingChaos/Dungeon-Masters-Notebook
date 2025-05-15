import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { SessionContext } from "../contexts/SessionContext";

function ProtectedRoute() {
  const { sessionData, isSessionChecked } = useContext(SessionContext);
  if (!isSessionChecked) {
    return <p>Loading...</p>;
  }
  if (!sessionData.user) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

export default ProtectedRoute;