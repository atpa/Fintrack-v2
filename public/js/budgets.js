/**
 * Хелперы для отображения и расчётов по страницe бюджетов.
 */

function calculateMonthlyIncomes(transactions, targetCurrency = 'USD') {
  const incomesByMonth = new Map();
  if (!Array.isArray(transactions)) return incomesByMonth;

  transactions.forEach((tx) => {
    if (tx.type === 'income') {
      const dt = new Date(tx.date);
      const month = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      const amount = typeof convertAmount === 'function'
        ? convertAmount(Number(tx.amount), tx.currency || 'USD', targetCurrency)
        : Number(tx.amount);
      incomesByMonth.set(month, (incomesByMonth.get(month) || 0) + amount);
    }
  });

  return incomesByMonth;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = value;
  }
}

function renderBudgets(budgets, categories, tbody, transactions) {
  const workspaceCurrency = typeof getBalanceCurrency === 'function' ? getBalanceCurrency() : 'USD';
  const stats = {
    count: budgets.length,
    overspent: 0,
    percentBased: 0,
    ratioSum: 0,
    ratioCount: 0,
    allocated: 0,
    spent: 0,
    uniqueMonths: new Set(),
  };

  tbody.innerHTML = '';

  if (!budgets.length) {
    const emptyRow = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.textContent = 'Нет активных бюджетов';
    emptyRow.appendChild(td);
    tbody.appendChild(emptyRow);
    updateBudgetsInsights({
      ...stats,
      workspaceCurrency,
      avgUtilization: 0,
      percentShare: 0,
      uniqueMonthsCount: 0,
    });
    setText('budgetsTableHint', 'Записей: 0');
    return;
  }

  const incomesCacheByCur = new Map();

  budgets.forEach((budget) => {
    const tr = document.createElement('tr');
    const cat = categories.find((c) => c.id === budget.category_id);
    const categoryTd = document.createElement('td');
    categoryTd.textContent = cat ? cat.name : '-';
    const monthTd = document.createElement('td');
    monthTd.textContent = budget.month || '-';
    const limitTd = document.createElement('td');
    const spentTd = document.createElement('td');
    const progressTd = document.createElement('td');
    let displayLimit;
    let dynamicLimit = Number(budget.limit) || 0;
    const bCur = budget.currency || 'USD';
    stats.uniqueMonths.add(budget.month);

    if (budget.type === 'percent' && budget.percent != null) {
      stats.percentBased += 1;
      if (!incomesCacheByCur.has(bCur)) {
        incomesCacheByCur.set(bCur, calculateMonthlyIncomes(transactions, bCur));
      }
      const incomesMap = incomesCacheByCur.get(bCur);
      const monthlyIncome = incomesMap.get(budget.month) || 0;
      dynamicLimit = monthlyIncome * (Number(budget.percent) / 100);
      const limText = typeof formatCurrency === 'function'
        ? formatCurrency(dynamicLimit, bCur)
        : `${dynamicLimit.toFixed(2)} ${bCur}`;
      displayLimit = `${Number(budget.percent).toFixed(1)}% (${limText})`;
    } else {
      displayLimit = typeof formatCurrency === 'function'
        ? formatCurrency(budget.limit, bCur)
        : `${Number(budget.limit).toFixed(2)} ${bCur}`;
    }
    limitTd.textContent = displayLimit;

    const spentValue = Number(budget.spent) || 0;
    const spentText = typeof formatCurrency === 'function'
      ? formatCurrency(spentValue, bCur)
      : `${spentValue.toFixed(2)} ${bCur}`;
    spentTd.textContent = spentText;

    const percentage = dynamicLimit > 0 ? Math.min(100, (spentValue / dynamicLimit) * 100) : 0;
    const barContainer = document.createElement('div');
    barContainer.style.backgroundColor = '#e2e8f0';
    barContainer.style.borderRadius = '4px';
    barContainer.style.height = '12px';
    barContainer.style.width = '100%';
    const bar = document.createElement('div');
    bar.style.height = '100%';
    bar.style.borderRadius = '4px';
    bar.style.width = `${percentage}%`;
    bar.style.backgroundColor = percentage > 100 ? 'var(--danger)' : 'var(--primary)';
    barContainer.appendChild(bar);
    progressTd.appendChild(barContainer);
    tr.append(categoryTd, monthTd, limitTd, spentTd, progressTd);
    tbody.appendChild(tr);

    if (dynamicLimit > 0) {
      const ratio = spentValue / dynamicLimit;
      stats.ratioSum += ratio;
      stats.ratioCount += 1;
      if (ratio > 1) {
        stats.overspent += 1;
      }
    }

    const convertedLimit = typeof convertAmount === 'function'
      ? convertAmount(dynamicLimit, bCur, workspaceCurrency)
      : dynamicLimit;
    const convertedSpent = typeof convertAmount === 'function'
      ? convertAmount(spentValue, bCur, workspaceCurrency)
      : spentValue;
    stats.allocated += convertedLimit;
    stats.spent += convertedSpent;
  });

  setText('budgetsTableHint', `Записей: ${stats.count}`);
  const avgUtilization = stats.ratioCount ? stats.ratioSum / stats.ratioCount : 0;
  const percentShare = stats.count ? stats.percentBased / stats.count : 0;
  updateBudgetsInsights({
    ...stats,
    avgUtilization,
    percentShare,
    uniqueMonthsCount: stats.uniqueMonths.size,
    workspaceCurrency,
  });
}

function updateBudgetsInsights(stats) {
  const currency = stats.workspaceCurrency || 'USD';
  const utilizationValue = Math.round((stats.avgUtilization || 0) * 100);
  const percentShareValue = Math.round((stats.percentShare || 0) * 100);
  const formattedAllocated = typeof formatCompactCurrency === 'function'
    ? formatCompactCurrency(stats.allocated, currency)
    : formatCurrency(stats.allocated, currency);
  const formattedSpent = typeof formatCurrency === 'function'
    ? formatCurrency(stats.spent, currency)
    : `${Number(stats.spent || 0).toFixed(2)} ${currency}`;

  setText('budgetsHeroAllocated', formattedAllocated);
  setText('budgetsHeroCurrency', currency);
  setText('budgetsHeroNote', `Израсходовано ${formattedSpent} (${utilizationValue}% от лимитов)`);
  setText('budgetsHeroPeriodTag', `${stats.uniqueMonthsCount || 0} мес.`);
  setText('budgetsHeroPercentTag', `${percentShareValue}% процентных`);

  setText('budgetsMetricCount', stats.count || 0);
  setText('budgetsMetricOverspent', stats.overspent || 0);
  setText('budgetsMetricUtilization', `${utilizationValue}%`);
  setText('budgetsMetricPercentShare', `${percentShareValue}%`);
}

async function initBudgetsPage() {
  const tbody = document.querySelector('#budgetsTable tbody');
  if (!tbody) return;
  const [budgets, categories, transactions] = await Promise.all([
    fetchData('/api/budgets'),
    fetchData('/api/categories'),
    fetchData('/api/transactions'),
  ]);
  let transactionsCache = transactions;
  renderBudgets(budgets, categories, tbody, transactionsCache);

  const catSelect = document.getElementById('budgetCategory');
  if (catSelect) {
    catSelect.innerHTML = '';
    categories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      catSelect.appendChild(opt);
    });
  }

  const form = document.getElementById('addBudgetForm');
  if (form) {
    const typeSelect = document.getElementById('budgetType');
    const limitContainer = document.getElementById('limitContainer');
    const percentContainer = document.getElementById('percentContainer');
    if (typeSelect && limitContainer && percentContainer) {
      const toggleFields = () => {
        if (typeSelect.value === 'percent') {
          percentContainer.style.display = '';
          limitContainer.style.display = 'none';
        } else {
          percentContainer.style.display = 'none';
          limitContainer.style.display = '';
        }
      };
      typeSelect.addEventListener('change', toggleFields);
      toggleFields();
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const catSel = document.getElementById('budgetCategory');
      const monthInput = document.getElementById('budgetMonth');
      const typeSel = document.getElementById('budgetType');
      const limitInput = document.getElementById('budgetLimit');
      const percentInput = document.getElementById('budgetPercent');

      const payload = {
        category_id: Number(catSel.value),
        month: monthInput.value,
        limit: parseFloat(limitInput.value),
        type: typeSel?.value || 'fixed',
        percent: percentInput?.value ? parseFloat(percentInput.value) : null,
        currency: document.getElementById('budgetCurrency')?.value || 'USD',
      };

      if (!payload.month) {
        monthInput.setCustomValidity('Укажите месяц');
        monthInput.reportValidity();
        setTimeout(() => monthInput.setCustomValidity(''), 1500);
        return;
      }
      if (!payload.category_id) {
        catSel.setCustomValidity('Выберите категорию');
        catSel.reportValidity();
        setTimeout(() => catSel.setCustomValidity(''), 1500);
        return;
      }
      if (payload.type === 'percent') {
        const p = Number(payload.percent);
        if (!Number.isFinite(p) || p < 0 || p > 100) {
          percentInput.setCustomValidity('Процент должен быть от 0 до 100');
          percentInput.reportValidity();
          setTimeout(() => percentInput.setCustomValidity(''), 1500);
          return;
        }
        payload.limit = 0;
      } else {
        const l = Number(payload.limit);
        if (!Number.isFinite(l) || l < 0) {
          limitInput.setCustomValidity('Сумма должна быть не меньше 0');
          limitInput.reportValidity();
          setTimeout(() => limitInput.setCustomValidity(''), 1500);
          return;
        }
        payload.percent = null;
      }

      try {
        const resp = await fetch('/api/budgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!resp.ok) {
          const err = await resp.json();
          alert('Ошибка: ' + (err.error || 'Не удалось сохранить бюджет'));
          return;
        }
        const updated = await resp.json();
        const idx = budgets.findIndex((b) => b.id === updated.id);
        if (idx !== -1) {
          budgets[idx] = updated;
        } else {
          budgets.push(updated);
        }
        renderBudgets(budgets, categories, tbody, transactionsCache);
        form.reset();
      } catch (err) {
        console.error(err);
        alert('Ошибка сети');
      }
    });
  }
}

if (document.readyState !== 'loading') {
  initBudgetsPage();
} else {
  document.addEventListener('DOMContentLoaded', initBudgetsPage);
}
