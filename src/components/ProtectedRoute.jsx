import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <p className="center-note">Loading...</p>;
  return user ? <Outlet /> : <Navigate to="/welcome" replace />;
}