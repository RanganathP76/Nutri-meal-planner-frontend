import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

export default function AdminDashboard() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
  const [adminUser, setAdminUser] = useState(JSON.parse(localStorage.getItem('admin_info') || 'null'));
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sections: 'analytics' | 'meals' | 'addMeal' | 'payouts' | 'team'
  const [activeSection, setActiveSection] = useState('analytics');

  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [meals, setMeals] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [team, setTeam] = useState([]);

  // Form: Add Meal
  const [mealForm, setMealForm] = useState({
    name: '',
    imageUrl: '',
    cuisine: 'South Indian',
    mealTypes: ['breakfast'],
    dietType: 'vegetarian',
    calories: 420,
    protein: 15,
    carbs: 65,
    fat: 10,
    fiber: 8,
    digestiveLoad: 'light',
    primaryCarb: 'rice',
    primaryProtein: 'toor_dal'
  });

  // Form: Add Team Member
  const [teamForm, setTeamForm] = useState({
    name: '',
    email: '',
    password: '',
    canEditOwnMealsOnly: true
  });

  // 1. ADMIN LOGIN
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_info', JSON.stringify(data.admin));
      setToken(data.token);
      setAdminUser(data.admin);
    } catch (err) {
      alert(err.message);
    }
  };

  // 2. FETCH DATA HANDLERS
  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/analytics/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAnalytics(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMeals = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/meals/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setMeals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeam = async () => {
    if (adminUser?.role !== 'main_admin') return;
    try {
      const res = await fetch(`${API_BASE}/admin/auth/team`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setTeam(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAnalytics();
      fetchMeals();
      fetchTeam();
    }
  }, [token]);

  // 3. CREATE MEAL
  const handleAddMeal = async (e) => {
    e.preventDefault();
    try {
      const body = {
        name: mealForm.name,
        imageUrl: mealForm.imageUrl,
        cuisine: mealForm.cuisine,
        mealTypes: mealForm.mealTypes,
        dietType: mealForm.dietType,
        nutritionPerServing: {
          calories: Number(mealForm.calories),
          protein: Number(mealForm.protein),
          carbohydrates: Number(mealForm.carbs),
          fat: Number(mealForm.fat),
          fiber: Number(mealForm.fiber)
        },
        digestiveProfile: {
          digestiveLoad: mealForm.digestiveLoad,
          primaryCarb: mealForm.primaryCarb,
          primaryProtein: mealForm.primaryProtein
        }
      };

      const res = await fetch(`${API_BASE}/admin/meals/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('✓ Meal saved to catalog!');
      setActiveSection('meals');
      fetchMeals();
    } catch (err) {
      alert(err.message);
    }
  };

  // 4. CREATE TEAM MEMBER
  const handleAddTeamMember = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/auth/team/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: teamForm.name,
          email: teamForm.email,
          password: teamForm.password,
          permissions: {
            canAddMeals: true,
            canEditOwnMealsOnly: teamForm.canEditOwnMealsOnly
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('✓ Team member created!');
      setTeamForm({ name: '', email: '', password: '', canEditOwnMealsOnly: true });
      fetchTeam();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    setToken('');
    setAdminUser(null);
  };

  // Login Screen
  if (!token) {
    return (
      <div style={{ maxWidth: '380px', margin: '80px auto', padding: '24px', border: '1px solid #e5e7eb', borderRadius: '8px', fontFamily: 'system-ui, sans-serif', background: '#fff' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '20px' }}>Staff Admin Portal</h2>
        <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: '13px' }}>Sign in with Main Admin or Meal Manager credentials.</p>
        
        <form onSubmit={handleAdminLogin} style={{ display: 'grid', gap: '12px' }}>
          <input
            type="email"
            placeholder="admin@nutritionplanner.com"
            required
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
          />
          <button type="submit" style={{ padding: '12px', background: '#111827', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            Login to Admin Portal
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px' }}>Control Panel</h1>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>
            Authenticated: <strong>{adminUser.name}</strong> ({adminUser.role === 'main_admin' ? '⭐ Super Admin' : 'Meal Manager'})
          </span>
        </div>
        <button onClick={handleLogout} style={{ padding: '6px 14px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
          Logout
        </button>
      </header>

      {/* Nav Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { id: 'analytics', label: '📊 Analytics' },
          { id: 'meals', label: `🍽️ Meals (${meals.length})` },
          { id: 'addMeal', label: '+ Add Meal' },
          ...(adminUser.role === 'main_admin' ? [{ id: 'team', label: `👥 Team (${team.length})` }] : [])
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: activeSection === tab.id ? '#2563eb' : '#f3f4f6',
              color: activeSection === tab.id ? '#fff' : '#374151',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. ANALYTICS SECTION */}
      {activeSection === 'analytics' && (
        <div>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Platform Overview</h3>
          {analytics ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '8px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <span style={{ fontSize: '12px', color: '#1e40af' }}>Total Registered Users</span>
                <h2 style={{ margin: '6px 0', fontSize: '28px', color: '#1e3a8a' }}>{analytics.users.totalRegistered}</h2>
                <span style={{ fontSize: '12px', color: '#3b82f6' }}>{analytics.users.activePaidSubscribers} Paid Active</span>
              </div>

              <div style={{ padding: '16px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '12px', color: '#166534' }}>Meals Catalog</span>
                <h2 style={{ margin: '6px 0', fontSize: '28px', color: '#14532d' }}>{analytics.mealsCatalog.totalMeals}</h2>
                <span style={{ fontSize: '12px', color: '#22c55e' }}>{analytics.mealsCatalog.vegMeals} Veg / {analytics.mealsCatalog.nonVegMeals} Non-Veg</span>
              </div>

              <div style={{ padding: '16px', borderRadius: '8px', background: '#faf5ff', border: '1px solid #e9d5ff' }}>
                <span style={{ fontSize: '12px', color: '#6b21a8' }}>Platform Fee Revenue</span>
                <h2 style={{ margin: '6px 0', fontSize: '28px', color: '#581c87' }}>₹{analytics.financials.totalPlatformFeesCollectedRupees}</h2>
                <span style={{ fontSize: '12px', color: '#a855f7' }}>Fees + GST collected</span>
              </div>

              <div style={{ padding: '16px', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fde68a' }}>
                <span style={{ fontSize: '12px', color: '#92400e' }}>Pending Payout Requests</span>
                <h2 style={{ margin: '6px 0', fontSize: '28px', color: '#78350f' }}>{analytics.financials.pendingPayoutRequestsCount}</h2>
                <span style={{ fontSize: '12px', color: '#f59e0b' }}>Awaiting Approval</span>
              </div>
            </div>
          ) : (
            <p>Loading analytics data...</p>
          )}
        </div>
      )}

      {/* 2. ALL MEALS TABLE WITH CREATOR AUDIT & PERMISSION CHECK */}
      {activeSection === 'meals' && (
        <div>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Master Meal Catalog</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '10px' }}>Dish Name</th>
                <th style={{ padding: '10px' }}>Cuisine</th>
                <th style={{ padding: '10px' }}>Meal Slot</th>
                <th style={{ padding: '10px' }}>Calories / Protein</th>
                <th style={{ padding: '10px' }}>Added By (Audit)</th>
                <th style={{ padding: '10px' }}>Permission</th>
              </tr>
            </thead>
            <tbody>
              {meals.map((meal) => {
                const isOwner = meal.createdBy?._id === adminUser.id || meal.createdBy === adminUser.id;
                const canEdit = adminUser.role === 'main_admin' || isOwner;

                return (
                  <tr key={meal._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '10px', fontWeight: '600' }}>{meal.name}</td>
                    <td style={{ padding: '10px' }}>{meal.cuisine}</td>
                    <td style={{ padding: '10px' }}>{meal.mealTypes?.join(', ')}</td>
                    <td style={{ padding: '10px' }}>
                      {meal.nutritionPerServing?.calories} kcal / {meal.nutritionPerServing?.protein}g
                    </td>
                    <td style={{ padding: '10px', color: '#6b7280' }}>
                      {meal.createdBy?.name || 'System Initializer'}
                    </td>
                    <td style={{ padding: '10px' }}>
                      {canEdit ? (
                        <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓ Full Edit Access</span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>🔒 Read Only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. ADD MEAL FORM */}
      {activeSection === 'addMeal' && (
        <div style={{ maxWidth: '640px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Add Dish to Meal Catalog</h3>
          <form onSubmit={handleAddMeal} style={{ display: 'grid', gap: '14px' }}>
            <input
              type="text"
              placeholder="Dish Name (e.g. Ragi Mudde with Sambar & Sprouted Salad)"
              required
              value={mealForm.name}
              onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />

            <input
              type="url"
              placeholder="Photo URL (Cloudinary / Image Link)"
              value={mealForm.imageUrl}
              onChange={(e) => setMealForm({ ...mealForm, imageUrl: e.target.value })}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <select
                value={mealForm.cuisine}
                onChange={(e) => setMealForm({ ...mealForm, cuisine: e.target.value })}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="South Indian">South Indian</option>
                <option value="North Indian">North Indian</option>
                <option value="Other">Other</option>
              </select>

              <select
                value={mealForm.dietType}
                onChange={(e) => setMealForm({ ...mealForm, dietType: e.target.value })}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="vegetarian">Vegetarian</option>
                <option value="non-vegetarian">Non-Vegetarian</option>
              </select>

              <select
                value={mealForm.mealTypes[0]}
                onChange={(e) => setMealForm({ ...mealForm, mealTypes: [e.target.value] })}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#6b7280' }}>Calories (kcal)</label>
                <input
                  type="number"
                  required
                  value={mealForm.calories}
                  onChange={(e) => setMealForm({ ...mealForm, calories: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#6b7280' }}>Protein (g)</label>
                <input
                  type="number"
                  required
                  value={mealForm.protein}
                  onChange={(e) => setMealForm({ ...mealForm, protein: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#6b7280' }}>Carbohydrates (g)</label>
                <input
                  type="number"
                  required
                  value={mealForm.carbs}
                  onChange={(e) => setMealForm({ ...mealForm, carbs: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <select
                value={mealForm.digestiveLoad}
                onChange={(e) => setMealForm({ ...mealForm, digestiveLoad: e.target.value })}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="light">Digestive Load: Light (Safe for Night)</option>
                <option value="medium">Digestive Load: Medium</option>
                <option value="heavy">Digestive Load: Heavy (Filtered out at Dinner)</option>
              </select>
            </div>

            <button
              type="submit"
              style={{ padding: '12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Save Meal to Database
            </button>
          </form>
        </div>
      )}

      {/* 4. TEAM MEMBER ROLES & ACCESS CONTROL (Main Admin Only) */}
      {activeSection === 'team' && adminUser.role === 'main_admin' && (
        <div>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Team Management (RBAC)</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Create New Team Member Form */}
            <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>Add Team Member (Meal Manager)</h4>
              <form onSubmit={handleAddTeamMember} style={{ display: 'grid', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={teamForm.email}
                  onChange={(e) => setTeamForm({ ...teamForm, email: e.target.value })}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
                <input
                  type="password"
                  placeholder="Initial Password"
                  required
                  value={teamForm.password}
                  onChange={(e) => setTeamForm({ ...teamForm, password: e.target.value })}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
                <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="checkbox"
                    checked={teamForm.canEditOwnMealsOnly}
                    onChange={(e) => setTeamForm({ ...teamForm, canEditOwnMealsOnly: e.target.checked })}
                  />
                  Restrict to editing only their own added meals
                </label>
                <button type="submit" style={{ padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Create Team Member
                </button>
              </form>
            </div>

            {/* List Team Members */}
            <div>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>Active Staff ({team.length})</h4>
              <div style={{ display: 'grid', gap: '8px' }}>
                {team.map((member) => (
                  <div key={member._id} style={{ background: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '13px' }}>
                    <div style={{ fontWeight: 'bold' }}>{member.name}</div>
                    <div style={{ color: '#6b7280', fontSize: '12px' }}>{member.email}</div>
                    <div style={{ marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>
                        {member.role === 'main_admin' ? 'Super Admin' : 'Meal Manager (Scoped)'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}