/**
 * Sorting Utilities
 * Client-side sorting functions for different data types
 */

/**
 * Sort an array of objects by a specified column and direction
 * @param {Array} data - The array of objects to sort
 * @param {string} column - The column/key to sort by
 * @param {string} direction - 'asc' for ascending, 'desc' for descending, null for no sort
 * @returns {Array} - The sorted array
 */
export function sortData(data, column, direction) {
  if (!direction || !column) {
    return data;
  }

  const sortedData = [...data].sort((a, b) => {
    let aValue = getNestedValue(a, column);
    let bValue = getNestedValue(b, column);

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return direction === 'asc' ? -1 : 1;
    if (bValue == null) return direction === 'asc' ? 1 : -1;

    // Determine the type of values and compare accordingly
    if (isDateValue(aValue) || isDateValue(bValue)) {
      return compareDates(aValue, bValue, direction);
    } else if (isNumericValue(aValue) && isNumericValue(bValue)) {
      return compareNumbers(aValue, bValue, direction);
    } else {
      return compareStrings(aValue, bValue, direction);
    }
  });

  return sortedData;
}

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - The object to get value from
 * @param {string} path - The path to the value (e.g., 'user.name')
 * @returns {*} - The value at the specified path
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

/**
 * Check if a value represents a date
 * @param {*} value - The value to check
 * @returns {boolean} - True if the value is a date
 */
function isDateValue(value) {
  if (value instanceof Date) return true;
  if (typeof value === 'string') {
    // Check for common date formats
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    ];
    return datePatterns.some(pattern => pattern.test(value)) || !isNaN(Date.parse(value));
  }
  return false;
}

/**
 * Check if a value is numeric
 * @param {*} value - The value to check
 * @returns {boolean} - True if the value is numeric
 */
function isNumericValue(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Compare two date values
 * @param {*} a - First date value
 * @param {*} b - Second date value
 * @param {string} direction - Sort direction
 * @returns {number} - Comparison result
 */
function compareDates(a, b, direction) {
  const dateA = a instanceof Date ? a : new Date(a);
  const dateB = b instanceof Date ? b : new Date(b);
  
  const comparison = dateA.getTime() - dateB.getTime();
  return direction === 'asc' ? comparison : -comparison;
}

/**
 * Compare two numeric values
 * @param {*} a - First numeric value
 * @param {*} b - Second numeric value
 * @param {string} direction - Sort direction
 * @returns {number} - Comparison result
 */
function compareNumbers(a, b, direction) {
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  
  const comparison = numA - numB;
  return direction === 'asc' ? comparison : -comparison;
}

/**
 * Compare two string values
 * @param {*} a - First string value
 * @param {*} b - Second string value
 * @param {string} direction - Sort direction
 * @returns {number} - Comparison result
 */
function compareStrings(a, b, direction) {
  const strA = String(a).toLowerCase();
  const strB = String(b).toLowerCase();
  
  const comparison = strA.localeCompare(strB);
  return direction === 'asc' ? comparison : -comparison;
}

/**
 * Specialized sort functions for specific data types
 */

/**
 * Sort students by name (handles first name and last name)
 * @param {Array} students - Array of student objects
 * @param {string} direction - Sort direction
 * @returns {Array} - Sorted students array
 */
export function sortStudentsByName(students, direction) {
  return [...students].sort((a, b) => {
    const nameA = a.name || '';
    const nameB = b.name || '';
    
    // Split names to handle "First Last" format
    const partsA = nameA.trim().split(' ');
    const partsB = nameB.trim().split(' ');
    
    // Use last name for primary sort, first name for secondary
    const lastNameA = partsA.length > 1 ? partsA[partsA.length - 1] : partsA[0];
    const lastNameB = partsB.length > 1 ? partsB[partsB.length - 1] : partsB[0];
    
    const firstNameA = partsA[0];
    const firstNameB = partsB[0];
    
    const lastNameComparison = lastNameA.localeCompare(lastNameB);
    if (lastNameComparison !== 0) {
      return direction === 'asc' ? lastNameComparison : -lastNameComparison;
    }
    
    const firstNameComparison = firstNameA.localeCompare(firstNameB);
    return direction === 'asc' ? firstNameComparison : -firstNameComparison;
  });
}

/**
 * Sort sessions by date
 * @param {Array} sessions - Array of session objects
 * @param {string} direction - Sort direction
 * @returns {Array} - Sorted sessions array
 */
export function sortSessionsByDate(sessions, direction) {
  return [...sessions].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    const comparison = dateA.getTime() - dateB.getTime();
    return direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * Sort books by title
 * @param {Array} books - Array of book objects
 * @param {string} direction - Sort direction
 * @returns {Array} - Sorted books array
 */
export function sortBooksByTitle(books, direction) {
  return [...books].sort((a, b) => {
    const titleA = (a.title || '').toLowerCase();
    const titleB = (b.title || '').toLowerCase();
    
    // Remove articles like "The", "A", "An" from the beginning for better sorting
    const cleanTitleA = titleA.replace(/^(the|a|an)\s+/i, '');
    const cleanTitleB = titleB.replace(/^(the|a|an)\s+/i, '');
    
    const comparison = cleanTitleA.localeCompare(cleanTitleB);
    return direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * Determine if server-side sorting should be used based on data size
 * @param {number} dataSize - Size of the dataset
 * @returns {boolean} - True if server-side sorting should be used
 */
export function shouldUseServerSideSorting(dataSize) {
  return dataSize > 500;
}

/**
 * Generate sort parameters for API requests
 * @param {string} column - Column to sort by
 * @param {string} direction - Sort direction
 * @returns {Object} - Sort parameters object
 */
export function generateSortParams(column, direction) {
  if (!column || !direction) {
    return {};
  }
  
  return {
    sortBy: column,
    sortOrder: direction
  };
}