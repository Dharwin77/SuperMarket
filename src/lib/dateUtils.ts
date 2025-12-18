/**
 * Date/Time Utilities for Indian Standard Time (IST)
 * Ensures consistent timezone handling across the application
 */

/**
 * Format date and time to IST for display
 * @param dateString - ISO date string or Date object
 * @returns Object with datePart, timePart (IST), and timePartUTC
 */
export const formatISTDateTime = (dateString: string | Date) => {
  // Ensure the date string has a timezone indicator (Z for UTC)
  let dateStr = typeof dateString === 'string' ? dateString : dateString.toISOString();
  
  // If the timestamp doesn't have a timezone indicator, assume it's UTC and add 'Z'
  if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('T')) {
    dateStr = dateStr + 'Z';
  } else if (typeof dateStr === 'string' && dateStr.includes('T') && !dateStr.endsWith('Z') && !dateStr.includes('+')) {
    // Has 'T' but no timezone, assume UTC
    dateStr = dateStr + 'Z';
  }
  
  const date = new Date(dateStr);
  
  console.log('🔍 Input date:', dateString);
  console.log('🔍 Fixed date string:', dateStr);
  console.log('🔍 Parsed date:', date.toISOString());

  const datePart = date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const timePart = date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const timePartUTC = date.toLocaleTimeString("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  
  console.log('🔍 IST Result:', timePart);
  console.log('🔍 UTC Result:', timePartUTC);

  return { datePart, timePart, timePartUTC };
};

/**
 * Format date to IST for display
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "17 December 2025")
 */
export const formatISTDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format time to IST for display
 * @param date - Date string or Date object
 * @returns Formatted time string (e.g., "09:45 AM")
 */
export const formatISTTime = (date: string | Date): string => {
  return new Date(date).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format date/time for reports/exports
 * @param date - Date string or Date object
 * @returns Formatted date/time string (e.g., "17/12/2025, 09:45:21 AM")
 */
export const formatISTForReports = (date: string | Date): string => {
  return new Date(date).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: true
  });
};

/**
 * Get ISO string for database storage (stores in UTC)
 * @returns ISO string
 */
export const getISTISOString = (): string => {
  return new Date().toISOString();
};
