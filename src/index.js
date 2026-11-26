import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
import './styles/legacy.css';

import App from './App';
import NutriGapSplash from './components/NutriGapSplash';
import './styles/glass.css'; // after App so it overrides every component stylesheet
import { captureReferral } from './utils/referral';

captureReferral();

function AppEntry() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (showSplash) {
    return (
      <NutriGapSplash onComplete={handleSplashComplete} />
    );
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppEntry />
  </React.StrictMode>
);