import { format, isValid } from 'date-fns';

/**
 * Safely formats a date with fallback for invalid dates
 */
export const safeFormatDate = (
  date: string | number | Date | null | undefined, 
  formatString: string = 'dd/MM/yyyy HH:mm',
  fallback: string = 'Invalid date'
): string => {
  if (!date) return fallback;
  
  try {
    const dateObj = new Date(date);
    if (isValid(dateObj)) {
      return format(dateObj, formatString);
    }
    return fallback;
  } catch (error) {
    console.warn('Invalid date value:', date, error);
    return fallback;
  }
};

/**
 * Safely converts a value to Date with validation
 */
export const safeToDate = (date: string | number | Date | null | undefined): Date | null => {
  if (!date) return null;
  
  try {
    const dateObj = new Date(date);
    if (isValid(dateObj)) {
      return dateObj;
    }
    return null;
  } catch (error) {
    console.warn('Invalid date value:', date, error);
    return null;
  }
};

/**
 * Formats date using toLocaleString with safe fallback
 */
export const safeLocaleDateString = (
  date: string | number | Date | null | undefined,
  locale: string = 'id-ID',
  options?: Intl.DateTimeFormatOptions,
  fallback: string = 'Invalid date'
): string => {
  const safeDate = safeToDate(date);
  if (!safeDate) return fallback;
  
  try {
    return safeDate.toLocaleString(locale, options);
  } catch (error) {
    console.warn('Error formatting date:', date, error);
    return fallback;
  }
};