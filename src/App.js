import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  // --- Auth & Session State ---
  const [token, setToken] = useState(localStorage.getItem('user_token') || '');
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user_info') || 'null'));
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authForm, setAuthForm] = useState({ fullName: '', phoneNumber: '', password: '', referralCodeUsed: '' });

  // --- Navigation Tabs ---
  const [activeTab, setActiveTab] = useState('planner'); // 'planner' | 'calendar' | 'wallet' | 'upgrade'

  // --- Day Planner State ---
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [mealSlot, setMealSlot] = useState('breakfast');
  const [dietType, setDietType] = useState('vegetarian');
  const [cuisine, setCuisine] = useState('All');

  // Currently planned meals for selected date
  const [selectedBreakfast, setSelectedBreakfast] = useState(null);
  const [selectedLunch, setSelectedLunch] = useState(null);
  const [selectedDinner, setSelectedDinner] = useState(null);

  const [meals, setMeals] = useState([]);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // --- Calendar Window State ---
  const [calendarData, setCalendarData] = useState([]);

  // --- Wallet State ---
  const [walletData, setWalletData] = useState({ balance: 0, referralCode: '', payoutRules: {}, transactions: [] });
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', upiId: '' });

  // Handle Session Expiry or Logged out from another device
  const handleAuthError = (errRes) => {
    if (errRes.code === 'LOGGED_OUT_BY_ANOTHER_DEVICE' || errRes.error?.includes('session')) {
      alert(errRes.error || 'Logged out by another device session.');
      handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_info');
    setToken('');
    setCurrentUser(null);
  };

  // --- Auth Handlers ---
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const endpoint = authMode === 'login' ? '/users/login' : '/users/register';
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (authMode === 'register') {
        alert('Registration successful! Please login.');
        setAuthMode('login');
      } else {
        localStorage.setItem('user_token', data.token);
        localStorage.setItem('user_info', JSON.stringify(data.user));
        setToken(data.token);
        setCurrentUser(data.user);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Fetch Meals based on dynamic budget ---
  useEffect(() => {
    if (token && activeTab === 'planner') {
      fetchRecommendations();
    }
  }, [token, mealSlot, dietType, cuisine, selectedBreakfast, selectedLunch, activeTab]);

  const fetchRecommendations = async () => {
    setLoadingMeals(true);
    try {
      const params = new URLSearchParams({
        mealType: mealSlot,
        dietType: dietType,
        cuisine: cuisine
      });
      if (selectedBreakfast) params.append('prevBreakfastId', selectedBreakfast._id);
      if (selectedLunch) params.append('prevLunchId', selectedLunch._id);

      const res = await fetch(`${API_BASE}/meals/recommendations?${params.toString()}`);
      const data = await res.json();
      setMeals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMeals(false);
    }
  };

  // --- Save Day Plan to Database (Auto-purges after 15 days) ---
  const handleSaveDayPlan = async () => {
    try {
      const res = await fetch(`${API_BASE}/planner/save-day`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          planDate: selectedDate,
          breakfastMealId: selectedBreakfast?._id,
          lunchMealId: selectedLunch?._id,
          dinnerMealId: selectedDinner?._id
        })
      });
      const data = await res.json();
      if (!res.ok) {
        handleAuthError(data);
        throw new Error(data.error);
      }
      setStatusMessage(`✓ Day plan saved for ${selectedDate}!`);
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Load Calendar History (Last 10 Days + Next 5 Days) ---
  const fetchCalendar = async () => {
    try {
      const res = await fetch(`${API_BASE}/planner/calendar-window`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) return handleAuthError(data);
      setCalendarData(data.plans || []);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Load Wallet & Transactions ---
  const fetchWallet = async () => {
    try {
      const res = await fetch(`${API_BASE}/wallet/my-wallet`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) return handleAuthError(data);
      setWalletData(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'calendar') fetchCalendar();
    if (activeTab === 'wallet') fetchWallet();
  }, [activeTab]);

  // --- Submit Withdrawal ---
  const handleWithdrawal = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/wallet/withdraw-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amountRupees: Number(withdrawForm.amount),
          upiId: withdrawForm.upiId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('Withdrawal request submitted! Deductions for GST & Gateway fee applied.');
      setWithdrawForm({ amount: '', upiId: '' });
      fetchWallet();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Razorpay Payment Integration ---
  const handleUpgradePlan = async (planType = 'family_basic') => {
    try {
      const orderRes = await fetch(`${API_BASE}/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ planType })
      });
      const { order, keyId } = await orderRes.json();

      const options = {
        key: keyId,
        amount: order.amount,
        currency: 'INR',
        name: 'Family Meal Planner',
        description: 'Annual Subscription',
        order_id: order.id,
        handler: async (response) => {
          const verifyRes = await fetch(`${API_BASE}/payments/verify-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planType
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            alert('🎉 Subscription activated successfully!');
            window.location.reload();
          } else {
            alert(verifyData.error);
          }
        },
        prefill: {
          contact: currentUser?.phoneNumber,
          name: currentUser?.fullName
        },
        theme: { color: '#2563eb' }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (err) {
      alert('Error initiating checkout: ' + err.message);
    }
  };

  // Calculate live daily macros
  const totalCalories = (selectedBreakfast?.nutritionPerServing?.calories || 0) +
                        (selectedLunch?.nutritionPerServing?.calories || 0) +
                        (selectedDinner?.nutritionPerServing?.calories || 0);

  const totalProtein = (selectedBreakfast?.nutritionPerServing?.protein || 0) +
                       (selectedLunch?.nutritionPerServing?.protein || 0) +
                       (selectedDinner?.nutritionPerServing?.protein || 0);

  // If not logged in, show mobile login form
  if (!token) {
    return (
      <div style={{ maxWidth: '420px', margin: '40px auto', padding: '24px', fontFamily: 'system-ui, sans-serif', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#fff' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Family Meal Planner</h2>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
          {authMode === 'login' ? 'Login with your single device access' : 'Create account & get custom meal schedules'}
        </p>

        <form onSubmit={handleAuthSubmit} style={{ display: 'grid', gap: '14px' }}>
          {authMode === 'register' && (
            <input
              type="text"
              placeholder="Full Name (Mother/Househead)"
              required
              value={authForm.fullName}
              onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
              style={{ padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          )}

          <input
            type="tel"
            placeholder="Phone Number (10 digits)"
            required
            value={authForm.phoneNumber}
            onChange={(e) => setAuthForm({ ...authForm, phoneNumber: e.target.value })}
            style={{ padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
          />

          <input
            type="password"
            placeholder="Password"
            required
            value={authForm.password}
            onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
            style={{ padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
          />

          {authMode === 'register' && (
            <input
              type="text"
              placeholder="Referral Code (Optional)"
              value={authForm.referralCodeUsed}
              onChange={(e) => setAuthForm({ ...authForm, referralCodeUsed: e.target.value })}
              style={{ padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          )}

          <button
            type="submit"
            style={{ padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {authMode === 'login' ? 'Secure Login' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '14px' }}
          >
            {authMode === 'login' ? "Don't have an account? Sign up" : 'Already registered? Log in'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif', paddingBottom: '80px' }}>
      
      {/* Top Header */}
      <header style={{ padding: '16px', background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>Nutrition Planner</h2>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Hi, {currentUser?.fullName || 'User'}</span>
        </div>
        <button onClick={handleLogout} style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
          Logout
        </button>
      </header>

      {/* Main Content Areas */}
      <div style={{ padding: '16px' }}>

        {/* TAB 1: MEAL PLANNER WORKFLOW */}
        {activeTab === 'planner' && (
          <div>
            {/* Date Selector (Today to Next 5 Days) */}
            <div style={{ marginBottom: '16px', background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151' }}>Planning for Date:</label>
              <input
                type="date"
                value={selectedDate}
                min={todayStr}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ width: '100%', marginTop: '6px', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
            </div>

            {/* Daily Nutrition Tracker Bar */}
            <div style={{ background: '#1e293b', color: '#fff', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span>Daily Total: <strong>{totalCalories} / 1850 kcal</strong></span>
                <span>Protein: <strong>{totalProtein} / 60g</strong></span>
              </div>
              <div style={{ width: '100%', background: '#334155', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min((totalCalories / 1850) * 100, 100)}%`, background: '#22c55e', height: '100%' }}></div>
              </div>
            </div>

            {/* Meal Slot Toggle */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              {['breakfast', 'lunch', 'dinner'].map((slot) => (
                <button
                  key={slot}
                  onClick={() => setMealSlot(slot)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    textTransform: 'capitalize',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    background: mealSlot === slot ? '#2563eb' : '#fff',
                    color: mealSlot === slot ? '#fff' : '#374151',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>

            {/* Filter Toggle: Veg / Non-Veg (Default Veg) & Cuisine */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[
                  { label: 'Veg', val: 'vegetarian' },
                  { label: 'Non-Veg', val: 'non-vegetarian' }
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => setDietType(item.val)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: '1px solid #d1d5db',
                      background: dietType === item.val ? '#16a34a' : '#fff',
                      color: dietType === item.val ? '#fff' : '#374151',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                {['All', 'South Indian', 'North Indian'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCuisine(c)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #d1d5db',
                      background: cuisine === c ? '#374151' : '#fff',
                      color: cuisine === c ? '#fff' : '#374151',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Meal Cards Display */}
            <div style={{ display: 'grid', gap: '12px' }}>
              {loadingMeals ? (
                <p style={{ textAlign: 'center', color: '#6b7280' }}>Balancing matching meals...</p>
              ) : meals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', background: '#fff', borderRadius: '8px', color: '#6b7280', fontSize: '13px' }}>
                  No compatible meals found for this combination.
                </div>
              ) : (
                meals.map((meal) => {
                  const isCurrentSelected =
                    (mealSlot === 'breakfast' && selectedBreakfast?._id === meal._id) ||
                    (mealSlot === 'lunch' && selectedLunch?._id === meal._id) ||
                    (mealSlot === 'dinner' && selectedDinner?._id === meal._id);

                  return (
                    <div
                      key={meal._id}
                      style={{
                        background: meal.madeInLast3Days ? '#fffbeb' : '#fff',
                        border: isCurrentSelected ? '2px solid #2563eb' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#111827' }}>{meal.name}</h4>
                          <span style={{ fontSize: '11px', padding: '2px 6px', background: '#f3f4f6', borderRadius: '4px', marginRight: '6px' }}>
                            {meal.cuisine}
                          </span>
                          <span style={{ fontSize: '11px', padding: '2px 6px', background: '#dcfce7', borderRadius: '4px' }}>
                            Digestion: {meal.digestiveProfile?.digestiveLoad}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            if (mealSlot === 'breakfast') setSelectedBreakfast(meal);
                            if (mealSlot === 'lunch') setSelectedLunch(meal);
                            if (mealSlot === 'dinner') setSelectedDinner(meal);
                          }}
                          style={{
                            padding: '6px 12px',
                            background: isCurrentSelected ? '#16a34a' : '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          {isCurrentSelected ? '✓ Picked' : 'Select'}
                        </button>
                      </div>

                      {meal.madeInLast3Days && (
                        <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#b45309', fontWeight: 'bold' }}>
                          ⚠️ Cooked in the last 3 days
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: '10px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f3f4f6', fontSize: '12px', color: '#6b7280' }}>
                        <span><strong>{meal.nutritionPerServing?.calories}</strong> kcal</span>
                        <span><strong>{meal.nutritionPerServing?.protein}g</strong> Protein</span>
                        <span><strong>{meal.nutritionPerServing?.carbohydrates}g</strong> Carbs</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Save Action */}
            <div style={{ marginTop: '20px' }}>
              {statusMessage && (
                <div style={{ textAlign: 'center', color: '#16a34a', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px' }}>
                  {statusMessage}
                </div>
              )}
              <button
                onClick={handleSaveDayPlan}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#16a34a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                Save {selectedDate}'s Meal Plan
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: CALENDAR OVERVIEW (10 Days History + 5 Days Ahead) */}
        {activeTab === 'calendar' && (
          <div>
            <h3 style={{ fontSize: '16px', margin: '0 0 12px' }}>Meal Calendar Schedule</h3>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 16px' }}>
              Past 10 days of meal history and up to 5 days ahead. Records automatically expire after 15 days.
            </p>

            <div style={{ display: 'grid', gap: '10px' }}>
              {calendarData.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9ca3af' }}>No saved plans in this window.</p>
              ) : (
                calendarData.map((plan) => (
                  <div key={plan._id} style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '14px' }}>{plan.planDate}</strong>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>Expires: {plan.expiresAt?.split('T')[0]}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.6' }}>
                      <div>🌅 <strong>Breakfast:</strong> {plan.breakfast?.name || 'Not set'}</div>
                      <div>☀️ <strong>Lunch:</strong> {plan.lunch?.name || 'Not set'}</div>
                      <div>🌙 <strong>Dinner:</strong> {plan.dinner?.name || 'Not set'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: REFERRAL & APP WALLET */}
        {activeTab === 'wallet' && (
          <div>
            <div style={{ background: '#2563eb', color: '#fff', padding: '18px', borderRadius: '10px', textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', opacity: 0.9 }}>Available Earnings Balance</span>
              <h1 style={{ margin: '6px 0', fontSize: '32px' }}>₹{walletData.balance}</h1>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '6px', display: 'inline-block', fontSize: '12px' }}>
                Your Referral Code: <strong>{walletData.referralCode}</strong>
              </div>
            </div>

            {/* Withdrawal Form */}
            <div style={{ background: '#fff', padding: '14px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '14px' }}>Request Payout to Bank / UPI</h4>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 12px' }}>
                Deductions applied: 2% Gateway Fee + 18% GST on Fee + ₹5 Platform Processing Fee.
              </p>

              <form onSubmit={handleWithdrawal} style={{ display: 'grid', gap: '10px' }}>
                <input
                  type="number"
                  placeholder="Amount in ₹ (Min ₹100)"
                  required
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
                <input
                  type="text"
                  placeholder="UPI ID (e.g. name@okhdfcbank)"
                  required
                  value={withdrawForm.upiId}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, upiId: e.target.value })}
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
                <button type="submit" style={{ padding: '10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Submit Withdrawal Request
                </button>
              </form>
            </div>

            {/* Transaction Ledger */}
            <h4 style={{ margin: '0 0 8px', fontSize: '14px' }}>Transaction History</h4>
            <div style={{ display: 'grid', gap: '8px' }}>
              {walletData.transactions.map((tx) => (
                <div key={tx._id} style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{tx.type.replace('_', ' ')}</span>
                    <strong style={{ color: tx.type === 'referral_credit' ? '#16a34a' : '#dc2626' }}>
                      {tx.type === 'referral_credit' ? '+' : '-'}₹{tx.requestedAmountRupees}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280', marginTop: '4px' }}>
                    <span>Status: {tx.status}</span>
                    <span>Net Paid: ₹{tx.netPayableRupees}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: UPGRADE / SUBSCRIPTION */}
        {activeTab === 'upgrade' && (
          <div>
            <h3 style={{ fontSize: '16px', margin: '0 0 8px' }}>Choose Your Plan</h3>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 16px' }}>
              Unlock dynamic family nutrition, auto-balancing, and unlimited 5-day meal scheduling.
            </p>

            <div style={{ background: '#fff', border: '2px solid #2563eb', padding: '16px', borderRadius: '8px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0 }}>Family Basic Planner</h4>
                <strong style={{ color: '#2563eb', fontSize: '18px' }}>₹299 / year</strong>
              </div>
              <p style={{ fontSize: '12px', color: '#4b5563', margin: '8px 0 14px' }}>
                Designed for mother & family (calibrated for standard 163 cm / 60 kg baseline). Includes 5-day planning and auto digestive balancing.
              </p>
              <button
                onClick={() => handleUpgradePlan('family_basic')}
                style={{ width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Activate with Razorpay
              </button>
            </div>

            <div style={{ background: '#f3f4f6', border: '1px dashed #9ca3af', padding: '16px', borderRadius: '8px', opacity: 0.8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, color: '#374151' }}>Pro Family & Gym Plan</h4>
                <span style={{ fontSize: '12px', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px' }}>Coming Soon</span>
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '8px 0 0' }}>
                Custom calorie intake per member (Diabetes, BP, Child, Senior) and target protein body-sculpting gym plans.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Sticky Bottom Navigation Bar */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '60px', background: '#fff', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 10 }}>
        {[
          { id: 'planner', label: 'Planner' },
          { id: 'calendar', label: 'Calendar' },
          { id: 'wallet', label: 'Wallet' },
          { id: 'upgrade', label: 'Upgrade' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === tab.id ? '#2563eb' : '#6b7280',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

    </div>
  );
}