/**
 * Formats a date string (YYYY-MM-DD or ISO timestamp) for display
 * Handles timezone issues by parsing as local date
 */
export function formatTripDate(dateString: string): string {
  if (!dateString) {
    console.warn('Empty date string provided to formatTripDate');
    return 'Invalid Date';
  }
  
  try {
    let date: Date;
    
    // Handle ISO timestamps (2025-09-03T00:00:00Z) or date strings (2025-09-03)
    if (dateString.includes('T')) {
      // ISO timestamp - extract date part and parse as local
      const datePart = dateString.split('T')[0];
      if (!isValidDateString(datePart)) {
        console.warn('Invalid ISO date string:', dateString);
        return 'Invalid Date';
      }
      const [year, month, day] = datePart.split('-').map(Number);
      date = new Date(year, month - 1, day); // month is 0-indexed
    } else {
      // Regular date string
      if (!isValidDateString(dateString)) {
        console.warn('Invalid date string:', dateString);
        return 'Invalid Date';
      }
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day); // month is 0-indexed
    }
    
    // Additional validation: check if date creation was successful
    if (isNaN(date.getTime())) {
      console.warn('Date parsing resulted in invalid date:', dateString);
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'Invalid Date';
  }
}

/**
 * Formats a date string (YYYY-MM-DD or ISO timestamp) with relative terms (Today, Yesterday) when appropriate
 */
export function formatTripDateRelative(dateString: string): string {
  if (!dateString) {
    console.warn('Empty date string provided to formatTripDateRelative');
    return 'Invalid Date';
  }
  
  try {
    let date: Date;
    
    // Handle ISO timestamps (2025-09-03T00:00:00Z) or date strings (2025-09-03)
    if (dateString.includes('T')) {
      // ISO timestamp - extract date part and parse as local
      const datePart = dateString.split('T')[0];
      if (!isValidDateString(datePart)) {
        console.warn('Invalid ISO date string:', dateString);
        return 'Invalid Date';
      }
      const [year, month, day] = datePart.split('-').map(Number);
      date = new Date(year, month - 1, day); // month is 0-indexed
    } else {
      // Regular date string
      if (!isValidDateString(dateString)) {
        console.warn('Invalid date string:', dateString);
        return 'Invalid Date';
      }
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day); // month is 0-indexed
    }
    
    // Additional validation: check if date creation was successful
    if (isNaN(date.getTime())) {
      console.warn('Date parsing resulted in invalid date:', dateString);
      return 'Invalid Date';
    }
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Compare dates by resetting time to avoid timezone issues
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    
    if (dateOnly.getTime() === todayOnly.getTime()) {
      return 'Today';
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  } catch (error) {
    console.error('Error formatting relative date:', dateString, error);
    return 'Invalid Date';
  }
}

/**
 * Gets time ago string for a timestamp
 */
export function getTimeAgo(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp:', timestamp);
      return 'unknown time';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  } catch (error) {
    console.error('Error calculating time ago:', timestamp, error);
    return 'unknown time';
  }
}

/**
 * Validates if a date string is in the correct YYYY-MM-DD format
 */
export function isValidDateString(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Check if the date components match what was parsed
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
  } catch {
    return false;
  }
}

/**
 * Extracts date string (YYYY-MM-DD) from ISO timestamp or returns as-is
 */
export function extractDateString(dateInput: string): string {
  if (dateInput.includes('T')) {
    // ISO timestamp - extract date part
    return dateInput.split('T')[0];
  }
  return dateInput;
}

/**
 * Gets today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}