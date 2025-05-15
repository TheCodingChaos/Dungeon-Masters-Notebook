import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { SessionContext } from '../contexts/SessionContext';

function ProtectedRoute() {
  const { sessionData, isSessionChecked } = useContext(SessionContext);
  const user = sessionData.user;
  if (!isSessionChecked) {
    return <p>Loading...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export default ProtectedRoute;