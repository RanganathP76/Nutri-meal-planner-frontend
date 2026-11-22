import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FeedbackProvider } from './ui/Kit';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import Wallet from './pages/Wallet';
import Plans from './pages/Plans';
import Account from './pages/Account';
import PaymentResult from './pages/PaymentResult';
import PlannerSwitch from './pages/PlannerSwitch';
import GymOnboarding from './pages/GymOnboarding';
import IndividualOnboarding from './pages/IndividualOnboarding';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Help from './pages/Help';
import Disclaimer from './pages/Disclaimer';
import RefundPolicy from './pages/RefundPolicy';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FeedbackProvider>
        <Routes>
          <Route path="/welcome" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/help" element={<Help />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/account" element={<Account />} />
              <Route path="/payment/:result" element={<PaymentResult />} />
              <Route path="/planner" element={<PlannerSwitch />} />
              <Route path="/gym/setup" element={<GymOnboarding />} />
              <Route path="/individual/setup" element={<IndividualOnboarding />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </FeedbackProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}