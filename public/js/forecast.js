function setForecastText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function formatForecastValue(amount, currency) {
  return `${Number(amount || 0).toFixed(2)} ${currency}`;
}

async function initForecastPage() {
  let forecast;
  try {
    forecast = await fetchData('/api/forecast');
  } catch (err) {
    console.error('Ошибка прогноза', err);
    forecast = { predicted_income: 0, predicted_expense: 0 };
  }

  const [transactions, budgets, categories] = await Promise.all([
    fetchData('/api/transactions'),
    fetchData('/api/budgets'),
    fetchData('/api/categories'),
  ]);

  const currency = typeof getReportCurrency === 'function' ? getReportCurrency() : 'USD';

  const income30 = typeof convertAmount === 'function'
    ? convertAmount(Number(forecast.predicted_income || 0), 'USD', currency)
    : Number(forecast.predicted_income || 0);
  const expense30 = typeof convertAmount === 'function'
    ? convertAmount(Number(forecast.predicted_expense || 0), 'USD', currency)
    : Number(forecast.predicted_expense || 0);

  const income7 = income30 / 30 * 7;
  const expense7 = expense30 / 30 * 7;
  const income90 = income30 / 30 * 90;
  const expense90 = expense30 / 30 * 90;

  setForecastText('forecastIncome7', income7.toFixed(2));
  setForecastText('forecastExpense7', expense7.toFixed(2));
  setForecastText('forecastIncome30', income30.toFixed(2));
  setForecastText('forecastExpense30', expense30.toFixed(2));
  setForecastText('forecastIncome90', income90.toFixed(2));
  setForecastText('forecastExpense90', expense90.toFixed(2));

  const chart = document.getElementById('forecastChart');
  if (chart) {
    drawBarChart(chart, ['Доходы 30д', 'Расходы 30д'], [income30, expense30]);
  }

  const net = income30 - expense30;
  const trend = net >= 0 ? 'Профицит' : 'Дефицит';
  setForecastText('forecastHeroCurrency', `Валюта: ${currency}`);
  setForecastText('forecastHeroTrend', trend);
  setForecastText('forecastHeroBalance', formatForecastValue(net, currency));
  setForecastText('forecastHeroNote', net >= 0 ? 'Можно увеличить отчисления на цели' : 'Пересмотрите крупные расходы');

  const riskList = document.getElementById('riskList');
  if (riskList) {
    riskList.innerHTML = '';
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const risky = budgets
      .filter((b) => b.month === currentMonth)
      .map((budget) => {
        const spent = Number(budget.spent) || 0;
        const limit = Number(budget.limit) || 0;
        const ratio = limit > 0 ? spent / limit : 0;
        return { budget, ratio };
      })
      .filter((item) => item.ratio >= 0.8);
    if (!risky.length) {
      const li = document.createElement('li');
      li.textContent = 'Все категории в безопасной зоне';
      riskList.appendChild(li);
    } else {
      risky.forEach((item) => {
        const cat = categories.find((c) => c.id === item.budget.category_id);
        const li = document.createElement('li');
        li.textContent = `${cat ? cat.name : 'Категория'} — ${Math.round(item.ratio * 100)}% от лимита`;
        li.style.color = item.ratio >= 1 ? 'var(--danger)' : 'var(--accent)';
        riskList.appendChild(li);
      });
    }
  }
}

if (document.readyState !== 'loading') {
  initForecastPage();
} else {
  document.addEventListener('DOMContentLoaded', initForecastPage);
}
