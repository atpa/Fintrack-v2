/**
 * ���ᮢ뢠�� ⠡���� �������� ����権.
 * @param {Array} plans
 * @param {Array} accounts
 * @param {Array} categories
 * @param {HTMLElement} tbody
 */
function renderPlannedTable(plans, accounts, categories, tbody) {
  tbody.innerHTML = '';
  if (!plans.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 7;
    td.textContent = '��� �������஢����� ����権';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  plans.forEach(plan => {
    const tr = document.createElement('tr');
    const startTd = document.createElement('td');
    startTd.textContent = plan.start_date;
    const freqTd = document.createElement('td');
    // �ਢ���� ���祭�� ����� � ����� ����⭮�� ����
    const freqMap = { daily: '���������', weekly: '��������쭮', monthly: '�������筮', yearly: '��������' };
    freqTd.textContent = freqMap[plan.frequency] || plan.frequency;
    const accTd = document.createElement('td');
    const acc = accounts.find(a => a.id === plan.account_id);
    accTd.textContent = acc ? acc.name : '-';
    const catTd = document.createElement('td');
    const cat = categories.find(c => c.id === plan.category_id);
    catTd.textContent = cat ? cat.name : '-';
    const typeTd = document.createElement('td');
    typeTd.textContent = plan.type === 'income' ? '��室' : '���室';
    typeTd.className = plan.type === 'income' ? 'status-income' : 'status-expense';
    const amtTd = document.createElement('td');
    amtTd.textContent = Number(plan.amount).toFixed(2) + ' ' + plan.currency;
    amtTd.className = plan.type === 'income' ? 'status-income' : 'status-expense';
    const noteTd = document.createElement('td');
    noteTd.textContent = plan.note || '';
    tr.append(startTd, freqTd, accTd, catTd, typeTd, amtTd, noteTd);
    tbody.appendChild(tr);
  });
}

function updatePlannedStats(plans) {
  const total = plans.length;
  const workspaceCurrency = typeof getBalanceCurrency === 'function' ? getBalanceCurrency() : 'USD';
  const freqMultiplier = {
    daily: 30,
    weekly: 4,
    monthly: 1,
    yearly: 1 / 12,
  };
  const stats = plans.reduce(
    (acc, plan) => {
      if (plan.type === 'income') {
        acc.income += 1;
      } else {
        acc.expense += 1;
      }
      acc.accounts.add(plan.account_id);
      const baseAmount = Number(plan.amount) || 0;
      const mult = freqMultiplier[plan.frequency] ?? 1;
      const monthlyAmount = baseAmount * mult;
      const converted = typeof convertAmount === 'function'
        ? convertAmount(monthlyAmount, plan.currency || 'USD', workspaceCurrency)
        : monthlyAmount;
      acc.monthly += converted;
      if (plan.start_date) {
        const date = new Date(plan.start_date);
        if (!Number.isNaN(date.getTime())) {
          acc.dates.push(date);
        }
      }
      return acc;
    },
    { income: 0, expense: 0, accounts: new Set(), monthly: 0, dates: [] }
  );

  const incomeShare = total ? Math.round((stats.income / total) * 100) : 0;
  stats.dates.sort((a, b) => a.getTime() - b.getTime());
  const nextDate = stats.dates.find(d => d.getTime() >= Date.now()) || stats.dates[0];

  const nextLabel = nextDate
    ? nextDate.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
    : '���';

  const formattedMonthly =
    typeof formatCompactCurrency === 'function'
      ? formatCompactCurrency(stats.monthly, workspaceCurrency)
      : formatCurrency(stats.monthly, workspaceCurrency);

  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  set('plannedHeroMonthly', formattedMonthly);
  set('plannedHeroCurrency', workspaceCurrency);
  set('plannedHeroNote', `����室: ${stats.income} / ���室: ${stats.expense}`);
  set('plannedHeroNextTag', `����.: ${nextLabel}`);
  set('plannedHeroSplitTag', `${incomeShare}% ��室`);

  set('plannedMetricTotal', total);
  set('plannedMetricIncome', stats.income);
  set('plannedMetricExpense', stats.expense);
  set('plannedMetricAccounts', stats.accounts.size);
}

async function initPlannedPage() {
  const tbody = document.querySelector('#plannedTable tbody');
  if (!tbody) return;
  const [plansRaw, accounts, categories] = await Promise.all([
    fetchData('/api/planned'),
    fetchData('/api/accounts'),
    fetchData('/api/categories')
  ]);
  const plans = Array.isArray(plansRaw) ? plansRaw : [];
  renderPlannedTable(plans, accounts, categories, tbody);
  updatePlannedStats(plans);
  // ������塞 ᥫ����
  const accSelect = document.getElementById('plannedAccount');
  const catSelect = document.getElementById('plannedCategory');
  if (accSelect) {
    accSelect.innerHTML = '';
    accounts.forEach(acc => {
      const opt = document.createElement('option');
      opt.value = acc.id;
      opt.textContent = acc.name;
      accSelect.appendChild(opt);
    });
  }
  if (catSelect) {
    catSelect.innerHTML = '';
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      catSelect.appendChild(opt);
    });
  }
  // ��⠭�������� ���� ��砫� �� 㬮�砭�� ᥣ����
  const startDateInput = document.getElementById('plannedStart');
  if (startDateInput) {
    const today = new Date().toISOString().slice(0, 10);
    startDateInput.value = today;
  }
  // ��ࠡ��稪 ���
  const form = document.getElementById('addPlannedForm');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const payload = {
        account_id: Number(accSelect.value),
        category_id: Number(catSelect.value),
        type: document.getElementById('plannedType').value,
        amount: parseFloat(document.getElementById('plannedAmount').value),
        currency: document.getElementById('plannedCurrency').value,
        start_date: document.getElementById('plannedStart').value,
        frequency: document.getElementById('plannedFrequency').value,
        note: document.getElementById('plannedNote').value
      };
      try {
        const resp = await fetch('/api/planned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!resp.ok) {
          const err = await resp.json();
          alert('�訡��: ' + (err.error || '�� 㤠���� �������� �������� ������'));
          return;
        }
        const created = await resp.json();
        plans.push(created);
        renderPlannedTable(plans, accounts, categories, tbody);
        updatePlannedStats(plans);
        form.reset();
        // ������ ���� ��砫� � ᥣ����譥�� ���
        if (startDateInput) startDateInput.value = new Date().toISOString().slice(0, 10);
      } catch (err) {
        console.error(err);
        alert('�訡�� ��');
      }
    });
  }
}

if (document.readyState !== 'loading') {
  initPlannedPage();
} else {
  document.addEventListener('DOMContentLoaded', initPlannedPage);
}
