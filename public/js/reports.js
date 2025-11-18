function setReportsText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function formatCurrencyValue(amount, currency) {
  return `${Number(amount || 0).toFixed(2)} ${currency}`;
}

function formatPeriodLabel(period, monthValue, yearValue) {
  if (period === 'month' && monthValue) {
    const [year, month] = monthValue.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
  }
  if (period === 'year' && yearValue) {
    return `${yearValue} год`;
  }
  return '—';
}

function renderTopCategories(labels, values, currency) {
  const tbody = document.getElementById('reportTopCategories');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!labels.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 2;
    td.textContent = 'Нет данных';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  labels.forEach((label, idx) => {
    const tr = document.createElement('tr');
    const tdName = document.createElement('td');
    tdName.textContent = label;
    const tdValue = document.createElement('td');
    tdValue.textContent = formatCurrencyValue(values[idx], currency);
    tr.append(tdName, tdValue);
    tbody.appendChild(tr);
  });
}

function updateReportsStats(stats) {
  setReportsText('reportsHeroPeriodTag', `Период: ${stats.periodLabel}`);
  setReportsText('reportsHeroCurrency', `Валюта: ${stats.currency}`);
  setReportsText('reportsHeroBalance', formatCurrencyValue(stats.net, stats.currency));
  setReportsText('reportsHeroNote', stats.topCategoryLabel
    ? `Топ расход: ${stats.topCategoryLabel}`
    : 'Нет активных категорий');

  setReportsText('reportsMetricIncome', formatCurrencyValue(stats.totalIncome, stats.currency));
  setReportsText('reportsMetricExpense', formatCurrencyValue(stats.totalExpense, stats.currency));
  setReportsText('reportsMetricCategories', stats.categoriesCount.toString());
  setReportsText('reportsMetricAverage', formatCurrencyValue(stats.avgExpense, stats.currency));
}

function renderSummary(totalIncome, totalExpense, topCategory, currency, periodType) {
  const container = document.getElementById('reportSummary');
  if (!container) return;
  container.innerHTML = '';

  const incomeP = document.createElement('p');
  incomeP.textContent = `Доходы: ${formatCurrencyValue(totalIncome, currency)}`;
  container.appendChild(incomeP);

  const expenseP = document.createElement('p');
  expenseP.textContent = `Расходы: ${formatCurrencyValue(totalExpense, currency)}`;
  container.appendChild(expenseP);

  if (topCategory) {
    const topP = document.createElement('p');
    topP.textContent = `Пиковая категория: ${topCategory.label} (${formatCurrencyValue(topCategory.value, currency)})`;
    container.appendChild(topP);
  }

  const hint = document.createElement('p');
  hint.className = 'muted-label';
  hint.textContent = periodType === 'month'
    ? 'Совет: сравните текущий месяц с предыдущим, чтобы скорректировать лимиты.'
    : 'Совет: разбейте годовой расход на кварталы и пересмотрите план.';
  container.appendChild(hint);
}

async function generateReport() {
  const period = document.getElementById('reportPeriod').value;
  const monthInput = document.getElementById('reportMonth');
  const yearInput = document.getElementById('reportYear');
  const reportCurrency = typeof getReportCurrency === 'function' ? getReportCurrency() : 'USD';

  const [transactions, categories] = await Promise.all([
    fetchData('/api/transactions'),
    fetchData('/api/categories'),
  ]);

  const filtered = transactions.filter((tx) => {
    const dt = new Date(tx.date);
    if (period === 'month') {
      if (!monthInput.value) return false;
      const [year, month] = monthInput.value.split('-').map(Number);
      return dt.getFullYear() === year && dt.getMonth() + 1 === month;
    }
    if (!yearInput.value) return false;
    return dt.getFullYear() === Number(yearInput.value);
  });

  const grouped = new Map();
  filtered.forEach((tx) => {
    if (tx.type === 'expense') {
      const cat = categories.find((c) => c.id === tx.category_id);
      const key = cat ? cat.name : 'Прочее';
      const converted = typeof convertAmount === 'function'
        ? convertAmount(Number(tx.amount), tx.currency || 'USD', reportCurrency)
        : Number(tx.amount);
      grouped.set(key, (grouped.get(key) || 0) + converted);
    }
  });

  const entries = Array.from(grouped.entries()).sort((a, b) => b[1] - a[1]);
  const trimmed = entries.slice(0, 8);
  const others = entries.slice(8).reduce((sum, [, value]) => sum + value, 0);
  if (others > 0) trimmed.push(['Прочее', others]);
  const labels = trimmed.map((item) => item[0]);
  const values = trimmed.map((item) => item[1]);

  if (document.getElementById('reportChart')) {
    drawBarChart(document.getElementById('reportChart'), labels, values);
  }
  if (document.getElementById('reportPie')) {
    drawPieChart(document.getElementById('reportPie'), labels, values);
  }

  renderTopCategories(labels, values, reportCurrency);

  let totalIncome = 0;
  let totalExpense = 0;
  filtered.forEach((tx) => {
    const converted = typeof convertAmount === 'function'
      ? convertAmount(Number(tx.amount), tx.currency || 'USD', reportCurrency)
      : Number(tx.amount);
    if (tx.type === 'income') totalIncome += converted;
    if (tx.type === 'expense') totalExpense += converted;
  });

  const categoriesCount = grouped.size;
  const avgExpense = categoriesCount ? totalExpense / categoriesCount : 0;
  const periodLabel = formatPeriodLabel(period, monthInput.value, yearInput.value);

  updateReportsStats({
    periodLabel,
    currency: reportCurrency,
    net: totalIncome - totalExpense,
    topCategoryLabel: labels[0] || '',
    topCategoryValue: values[0] || 0,
    totalIncome,
    totalExpense,
    categoriesCount,
    avgExpense,
  });

  renderSummary(totalIncome, totalExpense, labels[0] ? { label: labels[0], value: values[0] } : null, reportCurrency, period);
}

function initReportsPage() {
  const periodSelect = document.getElementById('reportPeriod');
  const monthInput = document.getElementById('reportMonth');
  const yearInput = document.getElementById('reportYear');
  const monthLabel = document.getElementById('reportMonthLabel');
  const yearLabel = document.getElementById('reportYearLabel');

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  if (monthInput) monthInput.value = `${yyyy}-${mm}`;
  if (yearInput) yearInput.value = `${yyyy}`;

  if (periodSelect) {
    periodSelect.addEventListener('change', () => {
      if (periodSelect.value === 'month') {
        monthLabel.style.display = '';
        yearLabel.style.display = 'none';
      } else {
        monthLabel.style.display = 'none';
        yearLabel.style.display = '';
      }
    });
  }

  const btn = document.getElementById('generateReport');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      generateReport();
    });
  }

  generateReport();
}

if (document.readyState !== 'loading') {
  initReportsPage();
} else {
  document.addEventListener('DOMContentLoaded', initReportsPage);
}
