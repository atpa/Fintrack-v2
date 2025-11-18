function setRecurringText(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = value;
  }
}

async function loadRecurring() {
  try {
    const res = await fetch('/api/recurring');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    const tbody = document.querySelector('#recurringTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const currency = data.currency || items[0]?.currency || '?';

    if (!items.length) {
      const row = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 4;
      td.textContent = '��� recurring �����';
      row.appendChild(td);
      tbody.appendChild(row);
    } else {
      items.forEach(r => {
        const tr = document.createElement('tr');
        const tdName = document.createElement('td');
        tdName.textContent = r.name;
        const tdPeriod = document.createElement('td');
        tdPeriod.textContent = Number(r.avgPeriodDays || 0).toFixed(0);
        const tdSample = document.createElement('td');
        tdSample.textContent = `${Number(r.sampleAmount || 0).toFixed(2)} ${r.currency || currency}`;
        const tdMonthly = document.createElement('td');
        tdMonthly.textContent = `${Number(r.estimatedMonthly || 0).toFixed(2)} ${r.currency || currency}`;
        tr.append(tdName, tdPeriod, tdSample, tdMonthly);
        tbody.appendChild(tr);
      });
    }

    const total = items.length;
    const fast = items.filter(r => Number(r.avgPeriodDays || 0) <= 30).length;
    const avgPeriod = total
      ? Math.round(
          items.reduce((sum, r) => sum + (Number(r.avgPeriodDays) || 0), 0) / total
        )
      : 0;
    const topItem = items.reduce((acc, item) => {
      const val = Number(item.estimatedMonthly) || 0;
      if (val > (acc.value || 0)) {
        return { value: val, currency: item.currency || currency };
      }
      return acc;
    }, { value: 0, currency });

    const monthlyTotal = typeof formatCurrency === 'function'
      ? formatCurrency(data.monthly || 0, currency)
      : `${Number(data.monthly || 0).toFixed(2)} ${currency}`;

    setRecurringText('recurringMonthlySummary', `�㬬� �� 横���� ���⥦�� � �����: ${monthlyTotal}`);
    setRecurringText('recurringHeroMonthly', Number(data.monthly || 0).toFixed(2));
    setRecurringText('recurringHeroCurrency', currency);
    setRecurringText('recurringHeroNote', `���������: ${total}`);
    setRecurringText('recurringHeroCountTag', `${total} ���� �ண����`);
    setRecurringText('recurringHeroFastTag', `${fast} �� �� 30 ����`);

    setRecurringText('recurringMetricCount', total);
    setRecurringText('recurringMetricMonthly', fast);
    setRecurringText('recurringMetricAvgPeriod', avgPeriod);
    setRecurringText(
      'recurringMetricTop',
      `${Number(topItem.value || 0).toFixed(2)} ${topItem.currency || currency}`
    );
  } catch (error) {
    console.error('Failed to load recurring data', error);
    setRecurringText('recurringMonthlySummary', '�� 㤠���� �������� �������騥�� ����ы');
  }
}

document.addEventListener('DOMContentLoaded', loadRecurring);
