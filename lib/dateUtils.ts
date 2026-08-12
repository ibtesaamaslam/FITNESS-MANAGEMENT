/**
 * Returns the current date in YYYY-MM-DD format based on local time.
 */
export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns the current month in YYYY-MM format based on local time.
 */
export const getLocalMonthString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Safely parses a YYYY-MM-DD string into a local Date object.
 */
export const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Returns whether a member is archived (inactive/absent for 5+ months).
 */
export const isMemberArchived = (member: { joinDate: string; attendance?: { [date: string]: boolean } }, todayStr: string = getLocalDateString()): boolean => {
  const attendance = member.attendance || {};
  const attendanceDates = Object.entries(attendance)
    .filter(([_, present]) => present)
    .map(([date]) => date);
  
  let lastActivityDateStr = member.joinDate;
  if (attendanceDates.length > 0) {
    const sorted = attendanceDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    lastActivityDateStr = sorted[0];
  }
  
  const lastActivity = new Date(lastActivityDateStr);
  const today = new Date(todayStr);
  const diffTime = Math.abs(today.getTime() - lastActivity.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 150; // 5 months threshold
};
