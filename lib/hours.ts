import { HoursJson, HoursInterval } from '@/types';

// Convert "HH:MM" string to minutes from midnight
const parseTimeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Check if a specific time (in minutes) is within an open-close interval
const isTimeInInterval = (timeMin: number, openMin: number, closeMin: number): boolean => {
  if (closeMin < openMin) {
    // Overlap past midnight, e.g., 22:00 to 06:00
    return timeMin >= openMin || timeMin <= closeMin;
  }
  return timeMin >= openMin && timeMin <= closeMin;
};

export const isShopOpenNow = (hoursJson: HoursJson, testDate?: Date): boolean => {
  const date = testDate || new Date();

  // Format current date as YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  // 1. Check Holiday Override
  if (hoursJson.holidays && hoursJson.holidays[dateStr] !== undefined) {
    const holidayIntervals = hoursJson.holidays[dateStr];
    if (holidayIntervals === null || holidayIntervals.length === 0) {
      return false; // Closed all day
    }

    // Check holiday specific hours
    const currentMinutes = date.getHours() * 60 + date.getMinutes();
    return holidayIntervals.some((interval) => {
      const openMin = parseTimeToMinutes(interval.open);
      const closeMin = parseTimeToMinutes(interval.close);
      return isTimeInInterval(currentMinutes, openMin, closeMin);
    });
  }

  // 2. Check Regular Weekly Hours
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = daysOfWeek[date.getDay()] as keyof typeof hoursJson.regular;

  const intervals: HoursInterval[] | undefined = hoursJson.regular[currentDay];
  if (!intervals || intervals.length === 0) {
    return false; // Closed today
  }

  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  return intervals.some((interval) => {
    const openMin = parseTimeToMinutes(interval.open);
    const closeMin = parseTimeToMinutes(interval.close);
    return isTimeInInterval(currentMinutes, openMin, closeMin);
  });
};
