import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MobileGate from '../pages/MobileGate';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <p className="center-note">Loading...</p>;
  if (!user) return <Navigate to="/welcome" replace />;
  // The server says needsMobile until a number is saved. Nothing else is shown before that.
  return user.needsMobile ? <MobileGate /> : <Outlet />;
}