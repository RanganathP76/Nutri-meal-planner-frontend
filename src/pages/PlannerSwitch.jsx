import { useAuth } from '../context/AuthContext';
import MealPlanner from './MealPlanner';
import GymPlanner from './GymPlanner';
import IndividualPlanner from './IndividualPlanner';

export default function PlannerSwitch() {
  const { user } = useAuth();
  const type = user.activePlan?.isActive ? user.activePlan.planType : 'basic';
  if (type === 'gym') return <GymPlanner />;
  if (type === 'individual') return <IndividualPlanner />;
  return <MealPlanner />;
}