import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import MealPlanner from './pages/MealPlanner';
import Calendar from './pages/Calendar';
import Wallet from './pages/Wallet';
import Plans from './pages/Plans';
import Account from './pages/Account';
import PaymentResult from './pages/PaymentResult';
import PlannerSwitch from './pages/PlannerSwitch';
import GymOnboarding from './pages/GymOnboarding';
import IndividualOnboarding from './pages/IndividualOnboarding';

console.log({ AuthProvider, ProtectedRoute, AppLayout, Login, Register, Home, MealPlanner, Calendar, Wallet, Plans, Account });

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/planner" element={<MealPlanner />} />
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
      </AuthProvider>
    </BrowserRouter>
  );
}