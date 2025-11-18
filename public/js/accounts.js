/**
 * Accounts management module
 * @module accounts
 */
import API from './utils/api.js';
import { setFieldError, validateRequired } from './utils/validation.js';
import Pagination from './utils/pagination.js';

const accountState = {
  all: [],
  filtered: [],
};

function getWorkspaceCurrency() {
  if (typeof window.getBalanceCurrency === 'function') {
    return window.getBalanceCurrency();
  }
  if (typeof window.getReportCurrency === 'function') {
    return window.getReportCurrency();
  }
  return 'USD';
}

function convertToWorkspace(amount, currency) {
  const target = getWorkspaceCurrency();
  const value = Number(amount) || 0;
  if (typeof window.convertAmount === 'function') {
    return window.convertAmount(value, currency || target, target);
  }
  return value;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// Инициализация пагинации с помощью утилиты
const pagination = new Pagination({
  currentPage: 1,
  pageSize: 10,
  containerId: 'accountsPagination',
  onPageChange: (page) => {
    pagination.currentPage = page;
    renderAccounts();
  }
});

function renderAccounts() {
  const list = document.getElementById('accountsList');
  const items = pagination.paginate(accountState.filtered);

  if (!list) return;
  list.innerHTML = '';
  setText('accountsFilteredCount', accountState.filtered.length);
  
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<div class="empty-icon">💼</div><p class="empty-text">Пока нет кошельков</p><p class="empty-hint">Добавьте первый счёт выше</p>';
    list.appendChild(empty);
    pagination.render(accountState.filtered.length);
    return;
  }
  
  items.forEach((acc) => {
    const card = document.createElement('div');
    card.className = 'wallet-card';
    const balance = Number(acc.balance) || 0;
    const balanceClass = balance < 0 ? 'negative' : '';
    
    // XSS FIX: Use textContent for user-provided data (acc.name)
    const header = document.createElement('div');
    header.className = 'wallet-header';
    const icon = document.createElement('div');
    icon.className = 'wallet-icon';
    icon.textContent = '💳';
    const name = document.createElement('div');
    name.className = 'wallet-name';
    name.textContent = acc.name || 'Без названия';
    header.append(icon, name);
    
    const balanceDiv = document.createElement('div');
    balanceDiv.className = `wallet-balance ${balanceClass}`;
    balanceDiv.textContent = `${balance.toFixed(2)} `;
    const currencySpan = document.createElement('span');
    currencySpan.className = 'currency';
    currencySpan.textContent = acc.currency || 'USD';
    balanceDiv.appendChild(currencySpan);
    
    const meta = document.createElement('div');
    meta.className = 'wallet-meta';
    meta.textContent = `ID: ${acc.id || '—'}`;
    
    card.append(header, balanceDiv, meta);
    list.appendChild(card);
  });

  pagination.render(accountState.filtered.length);
}

function applyFilters() {
  const search = document.getElementById('accountSearch')?.value.trim().toLowerCase() || '';
  const currency = document.getElementById('accountCurrencyFilter')?.value || '';
  accountState.filtered = accountState.all.filter((acc) => {
    const matchesSearch = !search || acc.name.toLowerCase().includes(search);
    const matchesCurrency = !currency || acc.currency === currency;
    return matchesSearch && matchesCurrency;
  });
  pagination.goToPage(1);
  renderAccounts();
  updateAccountsSummary();
}

function bindFilters() {
  const searchInput = document.getElementById('accountSearch');
  const currencySelect = document.getElementById('accountCurrencyFilter');
  const pageSizeSelect = document.getElementById('accountsPageSize');
  searchInput?.addEventListener('input', () => {
    pagination.goToPage(1);
    applyFilters();
  });
  currencySelect?.addEventListener('change', () => {
    pagination.goToPage(1);
    applyFilters();
  });
  pageSizeSelect?.addEventListener('change', () => {
    pagination.setPageSize(Number(pageSizeSelect.value) || 10);
    renderAccounts();
  });
}

function bindForm() {
  const form = document.getElementById('addAccountForm');
  if (!form) return;
  const nameInput = document.getElementById('accName');
  const currencySelect = document.getElementById('accCurrency');
  const balanceInput = document.getElementById('accBalance');

  nameInput?.addEventListener('input', () => setFieldError(nameInput, ''));
  currencySelect?.addEventListener('change', () => setFieldError(currencySelect, ''));
  balanceInput?.addEventListener('input', () => setFieldError(balanceInput, ''));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = nameInput?.value.trim();
    const currency = currencySelect?.value;
    const balanceRaw = balanceInput?.value;
    const balance = balanceRaw ? Number(balanceRaw) : 0;
    let valid = true;
    if (!name) {
      setFieldError(nameInput, 'Введите название счёта');
      valid = false;
    }
    if (!currency) {
      setFieldError(currencySelect, 'Выберите валюту');
      valid = false;
    }
    if (balanceRaw && !isFinite(balance)) {
      setFieldError(balanceInput, 'Введите корректное число');
      valid = false;
    }
    if (!valid) return;

    try {
      const resp = await API.accounts.create({ name, currency, balance });
      if (!resp.ok) {
        UI.showToast({ type: 'danger', message: resp.error || 'Не удалось добавить счёт' });
        return;
      }
      const created = resp.data;
      if (created) accountState.all.push(created);
      UI.showToast({ type: 'success', message: 'Счёт добавлен' });
      form.reset();
      applyFilters();
    } catch (error) {
      console.error(error);
      UI.showToast({ type: 'danger', message: 'Ошибка сети. Попробуйте позже.' });
    }
  });
}

async function initAccountsPage() {
  const list = document.getElementById('accountsList');
  if (!list) return;
  
  list.innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div><p class="empty-text">Загрузка...</p></div>';
  
  try {
    const resp = await API.accounts.list();
    if (!resp.ok) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p class="empty-text">Ошибка загрузки: ${resp.error}</p></div>`;
      return;
    }
    const accounts = resp.data || [];
    accountState.all = Array.isArray(accounts) ? accounts : [];
    accountState.filtered = accountState.all.slice();
    bindFilters();
    bindForm();
    applyFilters();
  } catch (error) {
    console.error('Не удалось загрузить счета:', error);
    if (list) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p class="empty-text">Ошибка сети</p></div>';
    }
  }
}

function updateAccountsSummary() {
  const totalAccounts = accountState.all.length;
  const targetCurrency = getWorkspaceCurrency();
  const totalBalance = accountState.all.reduce(
    (sum, acc) => sum + convertToWorkspace(acc.balance, acc.currency),
    0
  );
  const positive = accountState.all.filter((acc) => Number(acc.balance) > 0).length;
  const negative = accountState.all.filter((acc) => Number(acc.balance) < 0).length;
  const average = totalAccounts ? totalBalance / totalAccounts : 0;

  setText('accountsHeroBalance', totalBalance.toFixed(2));
  setText('accountsHeroCurrency', targetCurrency);
  setText('accountsHeroCurrencyTag', `Валюта: ${targetCurrency}`);
  setText(
    'accountsHeroHint',
    totalAccounts ? `Счета: ${totalAccounts}` : 'Добавьте первый счёт'
  );

  setText('accountsMetricCount', totalAccounts);
  setText('accountsMetricPositive', positive);
  setText('accountsMetricNegative', negative);
  setText('accountsMetricAverage', average.toFixed(2));
  setText('accountsMetricCurrency', targetCurrency);
}
// Auto-init on DOM ready
if (document.readyState !== 'loading') {
  initAccountsPage();
} else {
  document.addEventListener('DOMContentLoaded', initAccountsPage);
}

export { initAccountsPage };
