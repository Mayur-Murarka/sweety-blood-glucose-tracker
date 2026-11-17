/**
 * Validation utilities for Sweety - Blood Glucose Tracker
 * Adheres strictly to the specification rules and error messages:
 * 1. Value is required: "Please enter a glucose value."
 * 2. Value must be a whole number between 40 and 600: "Value must be between 40 and 600 mg/dl."
 * 3. Only one reading per slot per day: "You already have an After lunch reading for this date."
 * 4. Maximum 4 readings per day: "You can add only 4 readings per day."
 * 5. Date cannot be in the future: "Date cannot be in the future."
 */

const ALLOWED_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner',
];

/**
 * Checks if a string date is in YYYY-MM-DD format
 */
function isValidDateFormat(dateStr) {
  if (typeof dateStr !== 'string') return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12) return false;
  const dateObj = new Date(year, month - 1, day);
  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  );
}

/**
 * Checks if date is in the future compared to today's local date
 */
function isDateInFuture(dateStr) {
  const today = new Date();
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
  return dateStr > todayStr;
}

/**
 * Returns formatted duplicate slot error message
 * Example: "You already have an After lunch reading for this date."
 */
function getDuplicateSlotMessage(slot) {
  const article = /^[aeiou]/i.test(slot.trim()) ? 'an' : 'a';
  return `You already have ${article} ${slot} reading for this date.`;
}

/**
 * Validates glucose value according to specs
 * Returns { valid: boolean, error?: string, parsedValue?: number }
 */
function validateGlucoseValue(value) {
  if (value === undefined || value === null || value === '' || (typeof value === 'string' && value.trim() === '')) {
    return { valid: false, error: 'Please enter a glucose value.' };
  }

  const num = Number(value);
  // Must be a whole number between 40 and 600
  if (isNaN(num) || !Number.isInteger(num) || num < 40 || num > 600) {
    return { valid: false, error: 'Value must be between 40 and 600 mg/dl.' };
  }

  return { valid: true, parsedValue: num };
}

/**
 * Validates reading input for create / update
 */
function validateReadingInput({ date, slot, value }) {
  // 1. Date validation
  if (!date || typeof date !== 'string' || !isValidDateFormat(date)) {
    return { valid: false, error: 'Please provide a valid date in YYYY-MM-DD format.' };
  }

  if (isDateInFuture(date)) {
    return { valid: false, error: 'Date cannot be in the future.' };
  }

  // 2. Slot validation
  if (!slot || !ALLOWED_SLOTS.includes(slot)) {
    return {
      valid: false,
      error: `Invalid slot. Must be one of: ${ALLOWED_SLOTS.join(', ')}.`,
    };
  }

  // 3. Glucose value validation
  const valueCheck = validateGlucoseValue(value);
  if (!valueCheck.valid) {
    return valueCheck;
  }

  return {
    valid: true,
    data: {
      date,
      slot,
      value: valueCheck.parsedValue,
    },
  };
}

module.exports = {
  ALLOWED_SLOTS,
  isValidDateFormat,
  isDateInFuture,
  getDuplicateSlotMessage,
  validateGlucoseValue,
  validateReadingInput,
};
