import React, { useEffect, useState } from 'react';
import './NutriGapSplash.css';

export default function NutriGapSplash({ onComplete }) {
  const [phase, setPhase] = useState('logo');

  useEffect(() => {
    const sloganTimer = setTimeout(() => {
      setPhase('slogan');
    }, 2600);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4800);

    return () => {
      clearTimeout(sloganTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="nutrigap-splash">

      {phase === 'logo' && (
        <div className="nutrigap-logo-container">
          <img
            src={`${process.env.PUBLIC_URL}/nutri-gap-logo.png`}
            alt="Nutri Gap"
            className="nutrigap-logo"
          />
        </div>
      )}

      {phase === 'slogan' && (
        <div className="nutrigap-slogan-container">
          <h1>Plan &amp; Fill</h1>
          <p>The Nutrition Gap</p>
        </div>
      )}

    </div>
  );
}