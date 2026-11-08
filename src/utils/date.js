// "YYYY-MM-DD" in the device's local timezone
export const todayKey = () => new Date().toLocaleDateString('en-CA');

export function addDays(key, n) {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const formatDay = (key) =>
  new Date(`${key}T00:00:00Z`).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC'
  });