import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AdminDashboard from './AdminDashboard';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Access Admin Dashboard by opening: http://localhost:3000?view=admin
const urlParams = new URLSearchParams(window.location.search);
const isAdminView = urlParams.get('view') === 'admin';

root.render(
  <React.StrictMode>
    {isAdminView ? <AdminDashboard /> : <App />}
  </React.StrictMode>
);
