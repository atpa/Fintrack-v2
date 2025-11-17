/**
 * Common Utility Functions
 * Shared utilities for formatting, validation, and common operations
 */

/**
 * Format currency with amount and symbol
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (USD, EUR, PLN, RUB)
 * @returns {string}
 */
export function formatCurrency(amount, currency = 'USD') {
  const symbols = {
    USD: '$',
    EUR: '€',
    PLN: 'zł',
    RUB: '₽'
  };
  
  const value = Number(amount) || 0;
  const symbol = symbols[currency] || currency;
  
  return `${value.toFixed(2)} ${symbol}`;
}

/**
 * Format date to locale string
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type ('short', 'long', 'medium')
 * @returns {string}
 */
export function formatDate(date, format = 'short') {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'short') {
    return d.toLocaleDateString('ru-RU');
  } else if (format === 'long') {
    return d.toLocaleDateString('ru-RU', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } else if (format === 'medium') {
    return d.toLocaleDateString('ru-RU', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  return d.toLocaleDateString();
}

/**
 * Format number with thousands separator
 * @param {number} num - Number to format
 * @returns {string}
 */
export function formatNumber(num) {
  return Number(num).toLocaleString('ru-RU');
}

/**
 * Calculate percentage
 * @param {number} value - Current value
 * @param {number} total - Total value
 * @returns {number}
 */
export function calculatePercentage(value, total) {
  if (total === 0) return 0;
  return ((value / total) * 100).toFixed(1);
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate required fields
 * @param {Object} data - Data object to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} - {valid: boolean, errors: Array}
 */
export function validateRequired(data, requiredFields) {
  const errors = [];
  
  requiredFields.forEach(field => {
    if (!data[field] || data[field] === '') {
      errors.push(`Поле "${field}" обязательно для заполнения`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function}
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function}
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object}
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Group array of objects by key
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {Object}
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
}

/**
 * Sort array of objects by key
 * @param {Array} array - Array to sort
 * @param {string} key - Key to sort by
 * @param {string} order - Sort order ('asc' or 'desc')
 * @returns {Array}
 */
export function sortBy(array, key, order = 'asc') {
  return [...array].sort((a, b) => {
    if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Filter array by search query
 * @param {Array} array - Array to filter
 * @param {string} query - Search query
 * @param {Array} fields - Fields to search in
 * @returns {Array}
 */
export function searchFilter(array, query, fields) {
  if (!query) return array;
  
  const lowerQuery = query.toLowerCase();
  return array.filter(item => {
    return fields.some(field => {
      const value = item[field];
      return value && String(value).toLowerCase().includes(lowerQuery);
    });
  });
}

/**
 * Get query parameter from URL
 * @param {string} name - Parameter name
 * @returns {string|null}
 */
export function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

/**
 * Set query parameter in URL
 * @param {string} name - Parameter name
 * @param {string} value - Parameter value
 */
export function setQueryParam(name, value) {
  const url = new URL(window.location);
  url.searchParams.set(name, value);
  window.history.pushState({}, '', url);
}

/**
 * Save to localStorage with error handling
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {boolean} - Success status
 */
export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
}

/**
 * Load from localStorage with error handling
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if not found
 * @returns {*}
 */
export function loadFromStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
}

/**
 * Convert currency amount
 * @param {number} amount - Amount to convert
 * @param {string} from - Source currency
 * @param {string} to - Target currency
 * @returns {number}
 */
export function convertCurrency(amount, from, to) {
  // Exchange rates (should be fetched from API in production)
  const rates = {
    USD: { USD: 1, EUR: 0.94, PLN: 4.5, RUB: 90 },
    EUR: { USD: 1.06, EUR: 1, PLN: 4.8, RUB: 95 },
    PLN: { USD: 0.22, EUR: 0.21, PLN: 1, RUB: 20 },
    RUB: { USD: 0.011, EUR: 0.0105, PLN: 0.05, RUB: 1 }
  };
  
  if (!rates[from] || !rates[from][to]) {
    console.warn(`Exchange rate not found for ${from} to ${to}`);
    return amount;
  }
  
  return amount * rates[from][to];
}

/**
 * Get month name in Russian
 * @param {number} monthIndex - Month index (0-11)
 * @returns {string}
 */
export function getMonthName(monthIndex) {
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  return months[monthIndex] || '';
}

/**
 * Get current month in YYYY-MM format
 * @returns {string}
 */
export function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Calculate days until date
 * @param {string|Date} date - Target date
 * @returns {number}
 */
export function daysUntil(date) {
  const target = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = target - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string}
 */
export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Capitalize first letter
 * @param {string} text - Text to capitalize
 * @returns {string}
 */
export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Generate random color
 * @returns {string}
 */
export function randomColor() {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Handle API errors consistently
 * @param {Error} error - Error object
 * @returns {string} - User-friendly error message
 */
export function handleApiError(error) {
  if (error.message === 'Failed to fetch') {
    return 'Ошибка сети. Проверьте подключение к интернету.';
  }
  
  if (error.status === 401) {
    return 'Требуется авторизация. Пожалуйста, войдите в систему.';
  }
  
  if (error.status === 403) {
    return 'Доступ запрещен.';
  }
  
  if (error.status === 404) {
    return 'Ресурс не найден.';
  }
  
  if (error.status >= 500) {
    return 'Ошибка сервера. Попробуйте позже.';
  }
  
  return error.message || 'Произошла неизвестная ошибка.';
}
