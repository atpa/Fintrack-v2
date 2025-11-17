/**
 * Reusable UI Components
 * Common components for tables, forms, cards, loading, error, and empty states
 */

/**
 * Create a loading spinner element
 * @param {string} message - Optional loading message
 * @returns {HTMLElement}
 */
export function createLoadingSpinner(message = 'Загрузка...') {
  const container = document.createElement('div');
  container.className = 'loading-container';
  container.innerHTML = `
    <div class="loading-spinner"></div>
    <p class="loading-message">${message}</p>
  `;
  return container;
}

/**
 * Create an error message element
 * @param {string} message - Error message
 * @param {Function} onRetry - Optional retry callback
 * @returns {HTMLElement}
 */
export function createErrorMessage(message = 'Произошла ошибка', onRetry = null) {
  const container = document.createElement('div');
  container.className = 'error-container';
  
  const errorIcon = document.createElement('div');
  errorIcon.className = 'error-icon';
  errorIcon.innerHTML = '⚠️';
  
  const errorText = document.createElement('p');
  errorText.className = 'error-message';
  errorText.textContent = message;
  
  container.appendChild(errorIcon);
  container.appendChild(errorText);
  
  if (onRetry) {
    const retryButton = document.createElement('button');
    retryButton.className = 'btn-primary';
    retryButton.textContent = 'Повторить';
    retryButton.onclick = onRetry;
    container.appendChild(retryButton);
  }
  
  return container;
}

/**
 * Create an empty state element
 * @param {string} message - Empty state message
 * @param {string} actionText - Optional action button text
 * @param {Function} onAction - Optional action callback
 * @returns {HTMLElement}
 */
export function createEmptyState(message = 'Нет данных', actionText = null, onAction = null) {
  const container = document.createElement('div');
  container.className = 'empty-state';
  
  const emptyIcon = document.createElement('div');
  emptyIcon.className = 'empty-icon';
  emptyIcon.innerHTML = '📭';
  
  const emptyText = document.createElement('p');
  emptyText.className = 'empty-message';
  emptyText.textContent = message;
  
  container.appendChild(emptyIcon);
  container.appendChild(emptyText);
  
  if (actionText && onAction) {
    const actionButton = document.createElement('button');
    actionButton.className = 'btn-primary';
    actionButton.textContent = actionText;
    actionButton.onclick = onAction;
    container.appendChild(actionButton);
  }
  
  return container;
}

/**
 * Create a card component
 * @param {Object} options - Card options
 * @returns {HTMLElement}
 */
export function createCard({ title, subtitle, content, footer, className = '' }) {
  const card = document.createElement('div');
  card.className = `card ${className}`;
  
  if (title || subtitle) {
    const header = document.createElement('div');
    header.className = 'card-header';
    
    if (title) {
      const titleEl = document.createElement('h3');
      titleEl.className = 'card-title';
      titleEl.textContent = title;
      header.appendChild(titleEl);
    }
    
    if (subtitle) {
      const subtitleEl = document.createElement('p');
      subtitleEl.className = 'card-subtitle';
      subtitleEl.textContent = subtitle;
      header.appendChild(subtitleEl);
    }
    
    card.appendChild(header);
  }
  
  if (content) {
    const body = document.createElement('div');
    body.className = 'card-body';
    if (typeof content === 'string') {
      body.innerHTML = content;
    } else {
      body.appendChild(content);
    }
    card.appendChild(body);
  }
  
  if (footer) {
    const footerEl = document.createElement('div');
    footerEl.className = 'card-footer';
    if (typeof footer === 'string') {
      footerEl.innerHTML = footer;
    } else {
      footerEl.appendChild(footer);
    }
    card.appendChild(footerEl);
  }
  
  return card;
}

/**
 * Create a table with data
 * @param {Array} headers - Table headers
 * @param {Array} rows - Table rows data
 * @param {Object} options - Table options
 * @returns {HTMLElement}
 */
export function createTable(headers, rows, options = {}) {
  const {
    className = '',
    emptyMessage = 'Нет данных',
    rowRenderer = null
  } = options;
  
  const table = document.createElement('table');
  table.className = `data-table ${className}`;
  
  // Create header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headers.forEach(header => {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Create body
  const tbody = document.createElement('tbody');
  
  if (rows.length === 0) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = headers.length;
    emptyCell.className = 'empty-cell';
    emptyCell.textContent = emptyMessage;
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
  } else {
    rows.forEach(rowData => {
      const row = rowRenderer ? rowRenderer(rowData) : createDefaultTableRow(rowData);
      tbody.appendChild(row);
    });
  }
  
  table.appendChild(tbody);
  return table;
}

/**
 * Create a default table row from array data
 * @param {Array} data - Row data
 * @returns {HTMLElement}
 */
function createDefaultTableRow(data) {
  const tr = document.createElement('tr');
  data.forEach(cellData => {
    const td = document.createElement('td');
    td.textContent = cellData;
    tr.appendChild(td);
  });
  return tr;
}

/**
 * Show loading state in a container
 * @param {HTMLElement} container - Container element
 * @param {string} message - Loading message
 */
export function showLoading(container, message = 'Загрузка...') {
  container.innerHTML = '';
  container.appendChild(createLoadingSpinner(message));
}

/**
 * Show error state in a container
 * @param {HTMLElement} container - Container element
 * @param {string} message - Error message
 * @param {Function} onRetry - Retry callback
 */
export function showError(container, message, onRetry = null) {
  container.innerHTML = '';
  container.appendChild(createErrorMessage(message, onRetry));
}

/**
 * Show empty state in a container
 * @param {HTMLElement} container - Container element
 * @param {string} message - Empty message
 * @param {string} actionText - Action button text
 * @param {Function} onAction - Action callback
 */
export function showEmpty(container, message, actionText = null, onAction = null) {
  container.innerHTML = '';
  container.appendChild(createEmptyState(message, actionText, onAction));
}

/**
 * Create a stat card for dashboard
 * @param {Object} options - Stat card options
 * @returns {HTMLElement}
 */
export function createStatCard({ label, value, trend, icon, className = '' }) {
  const card = document.createElement('div');
  card.className = `stat-card ${className}`;
  
  if (icon) {
    const iconEl = document.createElement('div');
    iconEl.className = 'stat-icon';
    iconEl.textContent = icon;
    card.appendChild(iconEl);
  }
  
  const content = document.createElement('div');
  content.className = 'stat-content';
  
  const labelEl = document.createElement('div');
  labelEl.className = 'stat-label';
  labelEl.textContent = label;
  content.appendChild(labelEl);
  
  const valueEl = document.createElement('div');
  valueEl.className = 'stat-value';
  valueEl.textContent = value;
  content.appendChild(valueEl);
  
  if (trend) {
    const trendEl = document.createElement('div');
    trendEl.className = `stat-trend ${trend > 0 ? 'positive' : 'negative'}`;
    trendEl.textContent = `${trend > 0 ? '+' : ''}${trend}%`;
    content.appendChild(trendEl);
  }
  
  card.appendChild(content);
  return card;
}

/**
 * Create a modal dialog
 * @param {Object} options - Modal options
 * @returns {HTMLElement}
 */
export function createModal({ title, content, actions = [], className = '' }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  
  const modal = document.createElement('div');
  modal.className = `modal ${className}`;
  
  const header = document.createElement('div');
  header.className = 'modal-header';
  
  const titleEl = document.createElement('h2');
  titleEl.textContent = title;
  header.appendChild(titleEl);
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.innerHTML = '×';
  closeBtn.onclick = () => overlay.remove();
  header.appendChild(closeBtn);
  
  modal.appendChild(header);
  
  const body = document.createElement('div');
  body.className = 'modal-body';
  if (typeof content === 'string') {
    body.innerHTML = content;
  } else {
    body.appendChild(content);
  }
  modal.appendChild(body);
  
  if (actions.length > 0) {
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    
    actions.forEach(action => {
      const btn = document.createElement('button');
      btn.className = action.className || 'btn-primary';
      btn.textContent = action.text;
      btn.onclick = () => {
        if (action.onClick) action.onClick();
        if (action.closeOnClick !== false) overlay.remove();
      };
      footer.appendChild(btn);
    });
    
    modal.appendChild(footer);
  }
  
  overlay.appendChild(modal);
  
  // Close on overlay click
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
  
  return overlay;
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type (success, error, info, warning)
 * @param {number} duration - Duration in milliseconds
 */
export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove after duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
