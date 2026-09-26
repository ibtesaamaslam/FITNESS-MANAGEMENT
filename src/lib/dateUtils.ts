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
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

/**
 * Returns whether a member is archived (inactive/absent for 5+ months).
 */
export const isMemberArchived = (member: { joinDate: string; attendance?: { [date: string]: boolean } }, todayStr: string = getLocalDateString()): boolean => {
  if (!member) return false;
  const attendance = member.attendance || {};
  const attendanceDates = Object.entries(attendance)
    .filter(([_, present]) => Boolean(present))
    .map(([date]) => date);
  
  let lastActivityDateStr = member.joinDate;
  if (attendanceDates.length > 0) {
    const sorted = attendanceDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    lastActivityDateStr = sorted[0];
  }
  
  if (!lastActivityDateStr) return false;
  const lastActivity = new Date(lastActivityDateStr);
  const today = new Date(todayStr);
  const diffTime = Math.abs(today.getTime() - lastActivity.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 150; // 5 months threshold
};

/**
 * Checks if a customer has been consistently coming to the gym for the past 5-6 months.
 * A customer qualifies if:
 * 1. Their membership tenure (from joinDate or earliest attendance) spans at least 5-6 months (>= 140 days).
 * 2. They have consistent gym attendance across at least 5 distinct months (or 4 of the last 5-6 months with recent activity).
 * 3. They are not inactive/archived (they are currently attending).
 */
export const isConsistentMember = (
  member?: {
    joinDate?: string;
    attendance?: { [date: string]: boolean };
    expiryDate?: string;
  } | null,
  todayStr: string = getLocalDateString()
): boolean => {
  if (!member) return false;

  // If archived (no activity for 5+ months), cannot be considered currently consistent
  if (isMemberArchived({ joinDate: member.joinDate || '', attendance: member.attendance }, todayStr)) {
    return false;
  }

  const attendance = member.attendance || {};
  const presentDates = Object.entries(attendance)
    .filter(([_, present]) => Boolean(present))
    .map(([date]) => date);

  const today = parseLocalDate(todayStr);

  // Extract unique YYYY-MM months where member attended
  const attendedMonthsSet = new Set(presentDates.map(d => d.slice(0, 7)));

  // Generate the list of month keys for the past 6 months (inclusive of current month)
  const past6Months: string[] = [];
  const curYear = today.getFullYear();
  const curMonth = today.getMonth(); // 0-indexed
  for (let i = 0; i < 6; i++) {
    const d = new Date(curYear, curMonth - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    past6Months.push(`${y}-${m}`);
  }

  // Count how many of the past 6 months have attendance check-ins
  const attendedPast6MonthsCount = past6Months.filter(monthKey => attendedMonthsSet.has(monthKey)).length;

  // Determine earliest start date (joinDate or earliest attendance)
  let earliestDateStr = member.joinDate;
  if (presentDates.length > 0) {
    const sortedDatesAsc = [...presentDates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    if (!earliestDateStr || new Date(sortedDatesAsc[0]).getTime() < new Date(earliestDateStr).getTime()) {
      earliestDateStr = sortedDatesAsc[0];
    }
  }

  if (!earliestDateStr) return false;

  const earliestDate = parseLocalDate(earliestDateStr);
  const diffDaysSinceStart = Math.floor((today.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24));

  // Must have joined/started at least ~140 days ago (~5 months)
  if (diffDaysSinceStart < 140) {
    return false;
  }

  // Check recent activity (last attendance should be within 45 days, or membership active)
  let daysSinceLastAtt = 0;
  if (presentDates.length > 0) {
    const sortedDesc = [...presentDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const lastAttDate = parseLocalDate(sortedDesc[0]);
    daysSinceLastAtt = Math.floor((today.getTime() - lastAttDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastAtt > 50) {
      return false; // Inactive recently
    }
  }

  // Case 1: Attended in at least 5 of the past 6 months
  if (attendedPast6MonthsCount >= 5) {
    return true;
  }

  // Case 2: Attended in at least 4 of the past 6 months AND attended in 5+ distinct months overall
  if (attendedPast6MonthsCount >= 4 && attendedMonthsSet.size >= 5) {
    return true;
  }

  // Case 3: Joined >= 150 days ago, attended across at least 4 distinct months in the past 6 months, and active recently (<= 35 days)
  if (diffDaysSinceStart >= 145 && attendedPast6MonthsCount >= 4 && daysSinceLastAtt <= 35) {
    return true;
  }

  // Case 4: Attended in at least 5 distinct months overall, and attended recently (<= 35 days)
  if (attendedMonthsSet.size >= 5 && daysSinceLastAtt <= 35) {
    return true;
  }

  return false;
};

/**
 * Returns detailed consistency metadata for tooltips and badges
 */
export const getMemberConsistencyDetails = (
  member?: {
    joinDate?: string;
    attendance?: { [date: string]: boolean };
    expiryDate?: string;
  } | null,
  todayStr: string = getLocalDateString()
) => {
  const isConsistent = isConsistentMember(member, todayStr);
  const attendance = member?.attendance || {};
  const presentDates = Object.entries(attendance)
    .filter(([_, present]) => Boolean(present))
    .map(([date]) => date);
  const attendedMonthsSet = new Set(presentDates.map(d => d.slice(0, 7)));

  return {
    isConsistent,
    distinctMonthsCount: attendedMonthsSet.size,
    totalCheckIns: presentDates.length,
    tooltip: isConsistent 
      ? `⭐ Consistent Gym Member (Attending regularly for 5-6+ months • ${attendedMonthsSet.size} active months)`
      : undefined
  };
};
