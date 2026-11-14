// A new random value each time the app is opened (page loaded). It is sent with recommendation requests so the
// meals shown first change from one visit to the next, while the list stays steady during one visit.
export const APP_SEED = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
