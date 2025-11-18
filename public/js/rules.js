// Управление автоматическими правилами категоризации
const rulesState = {
  categories: [],
  rules: [],
};

function setRulesText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function updateRulesStats() {
  const total = rulesState.rules.length;
  const uniqueCategories = new Set(rulesState.rules.map((rule) => rule.category_id));
  const coverage = rulesState.categories.length
    ? Math.round((uniqueCategories.size / rulesState.categories.length) * 100)
    : 0;

  setRulesText('rulesHeroStatus', `${total} правил`);
  setRulesText('rulesHeroCoverage', `${uniqueCategories.size} категорий`);
  setRulesText('rulesHeroAutomation', `${coverage}%`);
  setRulesText('rulesHeroNote', total ? 'Категоризация работает автоматически' : 'Добавьте правило для автоподстановки');

  setRulesText('rulesMetricCount', total.toString());
  setRulesText('rulesMetricCategories', uniqueCategories.size.toString());
  setRulesText('rulesMetricCoverage', `${coverage}%`);
}

async function loadCategories() {
  try {
    const resp = await fetch('/api/categories');
    rulesState.categories = await resp.json();
    const select = document.getElementById('ruleCategorySelect');
    if (select) {
      select.innerHTML = '';
      rulesState.categories.forEach((cat) => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        select.appendChild(opt);
      });
    }
  } catch (err) {
    console.error('Не удалось загрузить категории', err);
  }
}

async function loadRules() {
  try {
    const resp = await fetch('/api/rules');
    rulesState.rules = await resp.json();
    const tbody = document.querySelector('#rulesTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!rulesState.rules.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 3;
      td.textContent = 'Правил пока нет';
      tr.appendChild(td);
      tbody.appendChild(tr);
      updateRulesStats();
      return;
    }
    rulesState.rules.forEach((rule) => {
      const tr = document.createElement('tr');
      const tdKeyword = document.createElement('td');
      tdKeyword.textContent = rule.keyword;
      const tdCategory = document.createElement('td');
      const categoryName = rulesState.categories.find((c) => c.id === rule.category_id)?.name || rule.category_id;
      tdCategory.textContent = categoryName;
      const tdActions = document.createElement('td');
      const btn = document.createElement('button');
      btn.textContent = 'Удалить';
      btn.className = 'btn-danger';
      btn.addEventListener('click', async () => {
        if (!confirm('Удалить правило?')) return;
        try {
          const res = await fetch(`/api/rules/${rule.id}`, { method: 'DELETE' });
          if (res.ok) {
            await loadRules();
          } else {
            alert('Не удалось удалить правило');
          }
        } catch (err) {
          console.error(err);
          alert('Ошибка сети');
        }
      });
      tdActions.appendChild(btn);
      tr.append(tdKeyword, tdCategory, tdActions);
      tbody.appendChild(tr);
    });
    updateRulesStats();
  } catch (err) {
    console.error('Не удалось загрузить правила', err);
  }
}

async function initRulesPage() {
  await loadCategories();
  await loadRules();

  const form = document.getElementById('addRuleForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const keyword = document.getElementById('ruleKeyword').value.trim();
      const categoryId = Number(document.getElementById('ruleCategorySelect').value);
      if (!keyword || !categoryId) return;
      try {
        const resp = await fetch('/api/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword, category_id: categoryId }),
        });
        if (resp.ok) {
          document.getElementById('ruleKeyword').value = '';
          await loadRules();
        } else {
          alert('Не удалось сохранить правило');
        }
      } catch (err) {
        console.error(err);
        alert('Ошибка сети');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initRulesPage);
