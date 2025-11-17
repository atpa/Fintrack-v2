import fetchData from '../modules/api.js';
import initNavigation from '../modules/navigation.js';
import initProfileShell from '../modules/profile.js';
import { showLoading, showError, showEmpty, showToast } from '../modules/ui-components.js';
import { formatCurrency, handleApiError } from '../modules/utils.js';

initNavigation();
initProfileShell();

/**
 * Функции для страницы счётов: загрузка, отображение и добавление новых.
 */

/**
 * Отрисовывает таблицу счетов.
 */
function renderAccounts(accounts, tableBody) {
  tableBody.innerHTML = '';
  
  if (!accounts || accounts.length === 0) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = 3;
    emptyCell.className = 'empty-cell';
    emptyCell.textContent = 'У вас пока нет счетов. Добавьте первый счёт, чтобы начать отслеживать финансы.';
    emptyRow.appendChild(emptyCell);
    tableBody.appendChild(emptyRow);
    return;
  }
  
  accounts.forEach(acc => {
    const tr = document.createElement('tr');
    const nameTd = document.createElement('td');
    nameTd.textContent = acc.name;
    const currencyTd = document.createElement('td');
    currencyTd.textContent = acc.currency;
    const balanceTd = document.createElement('td');
    balanceTd.textContent = formatCurrency(acc.balance, acc.currency);
    balanceTd.className = acc.balance < 0 ? 'status-expense' : 'status-income';
    tr.append(nameTd, currencyTd, balanceTd);
    tableBody.appendChild(tr);
  });
}

async function initAccountsPage() {
  const tableBody = document.querySelector('#accountsTable tbody');
  if (!tableBody) return;
  
  const tableContainer = tableBody.closest('table').parentElement;
  
  // Show loading state
  showLoading(tableContainer, 'Загрузка счетов...');
  
  try {
    let accounts = await fetchData('/api/accounts');
    
    // Hide loading, show table
    tableContainer.innerHTML = '';
    const table = document.createElement('table');
    table.id = 'accountsTable';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Название</th>
          <th>Валюта</th>
          <th>Баланс</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    tableContainer.appendChild(table);
    
    const newTableBody = table.querySelector('tbody');
    renderAccounts(accounts, newTableBody);
    const form = document.getElementById('addAccountForm');
    if (form) {
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        try {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Добавление...';
          
          const newAccount = {
            name: document.getElementById('accName').value,
            currency: document.getElementById('accCurrency').value,
            balance: parseFloat(document.getElementById('accBalance').value) || 0
          };
          
          const resp = await fetch('/api/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAccount)
          });
          
          if (!resp.ok) {
            const err = await resp.json();
            throw new Error(err.error || 'Не удалось добавить счёт');
          }
          
          const created = await resp.json();
          accounts.push(created);
          renderAccounts(accounts, newTableBody);
          form.reset();
          showToast('Счёт успешно добавлен', 'success');
        } catch (err) {
          console.error(err);
          showToast(handleApiError(err), 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      });
    }
  } catch (error) {
    console.error('Error loading accounts:', error);
    showError(tableContainer, handleApiError(error), () => {
      window.location.reload();
    });
  }
}

if (document.readyState !== 'loading') {
  initAccountsPage();
} else {
  document.addEventListener('DOMContentLoaded', initAccountsPage);
}