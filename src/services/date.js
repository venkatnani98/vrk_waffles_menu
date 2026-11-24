// Shop-local date as YYYY-MM-DD.
// (toISOString() is UTC and flips the day at 5:30 AM IST.)
export function localDate(d = new Date()) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}