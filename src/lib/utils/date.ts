/**
 * Date utilities for the Weekly General Awareness application.
 * All logic is strictly tied to the Asia/Kolkata timezone.
 */

// Month abbreviations for formatting
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Returns a Date object shifted to represent the local time in Asia/Kolkata.
 * If no date is provided, uses current time.
 */
export function getKolkataDate(dateInput?: string | Date): Date {
  const d = dateInput ? new Date(dateInput) : new Date();
  const tzString = d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  return new Date(tzString);
}

/**
 * Formats a date object to YYYY-MM-DD.
 */
export function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Calculates the ISO week number and year.
 * An ISO week starts on Monday, and the first week of the year is the one
 * containing the first Thursday.
 */
export function getISOWeekInfo(d: Date): { year: number; week: number } {
  // Use UTC to perform math without daylight saving time issues
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = target.getUTCDay() || 7; // 1 (Mon) to 7 (Sun)
  
  // Set to nearest Thursday: current date + 4 - current day number
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  
  const year = target.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  
  return { year, week: weekNo };
}

/**
 * Returns the start (Monday) and end (Sunday) dates for the week containing dateInput.
 */
export function getWeekRange(dateInput?: string | Date) {
  const d = getKolkataDate(dateInput);
  const day = d.getDay() || 7; // 1 (Mon) to 7 (Sun)
  
  const start = new Date(d);
  start.setDate(d.getDate() - day + 1);
  
  const end = new Date(d);
  end.setDate(d.getDate() - day + 7);
  
  return {
    start: formatDate(start),
    end: formatDate(end),
    startObj: start,
    endObj: end,
  };
}

/**
 * Generates the deterministic unique week key (e.g. 2026-W40).
 */
export function getWeekKey(dateInput?: string | Date): string {
  const d = getKolkataDate(dateInput);
  const { year, week } = getISOWeekInfo(d);
  const wStr = String(week).padStart(2, '0');
  return `${year}-W${wStr}`;
}

/**
 * Generates the year-safe title for the week.
 * Example: 2026-W40 • 28 Sep – 04 Oct
 */
export function getWeekTitle(dateInput?: string | Date): string {
  const d = getKolkataDate(dateInput);
  const weekKey = getWeekKey(d);
  const { startObj, endObj } = getWeekRange(d);
  
  const sDay = String(startObj.getDate()).padStart(2, '0');
  const sMon = MONTHS[startObj.getMonth()];
  const eDay = String(endObj.getDate()).padStart(2, '0');
  const eMon = MONTHS[endObj.getMonth()];
  
  return `${weekKey} • ${sDay} ${sMon} – ${eDay} ${eMon}`;
}

/**
 * Determines logical status of the week based on current date.
 */
export function getWeekStatus(dateInput?: string | Date): 'Active' | 'Archived' | 'Draft' {
  const targetWeek = getWeekKey(dateInput);
  const currentWeek = getWeekKey();
  
  if (targetWeek === currentWeek) return 'Active';
  
  const targetStart = getWeekRange(dateInput).start;
  const currentStart = getWeekRange().start;
  
  if (targetStart < currentStart) return 'Archived';
  return 'Draft'; // Upcoming
}
