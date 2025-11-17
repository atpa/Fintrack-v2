/**
 * Categories management module
 * @module categories
 */
import API from './utils/api.js';
import { setFieldError, clearAllFieldErrors, validateRequired } from './utils/validation.js';
import Pagination from './utils/pagination.js';

const categoryState = {
  categories: [],
  filtered: [],
};

const pagination = new Pagination({
  currentPage: 1,
  pageSize: 10,
  containerId: 'categoriesPagination',
  onPageChange: (page) => {
    pagination.currentPage = page;
    renderCategories();
  }
});

function renderCategories() {
  const tbody = document.querySelector('#categoriesTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const pageItems = pagination.paginate(categoryState.filtered);
  if (!pageItems.length) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = 3;
    emptyCell.innerHTML =
      '<div class="table-empty-state">Категории ещё не созданы. Добавьте первую категорию, чтобы начать классифицировать операции.</div>';
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
    pagination.render(categoryState.filtered.length);
    return;
  }

  pageItems.forEach((cat) => {
    const tr = document.createElement('tr');
    
    const nameTd = document.createElement('td');
    nameTd.setAttribute('data-label', 'Название');
    nameTd.textContent = cat.name;
    
    const kindTd = document.createElement('td');
    kindTd.setAttribute('data-label', 'Тип');
    kindTd.textContent = cat.kind === 'income' ? 'Доход' : 'Расход';
    
    const actionsTd = document.createElement('td');
    actionsTd.setAttribute('data-label', 'Действие');
    actionsTd.style.display = 'flex';
    actionsTd.style.gap = '0.5rem';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn-secondary';
    editBtn.textContent = 'Редактировать';
    editBtn.addEventListener('click', () => openEditModal(cat));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-danger';
    deleteBtn.textContent = 'Удалить';
    deleteBtn.addEventListener('click', () => confirmDelete(cat));

    actionsTd.append(editBtn, deleteBtn);
    tr.append(nameTd, kindTd, actionsTd);
    tbody.appendChild(tr);
  });

  pagination.render(categoryState.filtered.length);
}

function applyFilters() {
  const searchValue = document.getElementById('categorySearch')?.value.trim().toLowerCase() || '';
  const kindFilter = document.getElementById('categoryFilterKind')?.value || '';
  categoryState.filtered = categoryState.categories.filter((cat) => {
    const matchesSearch = !searchValue || cat.name.toLowerCase().includes(searchValue);
    const matchesKind = !kindFilter || cat.kind === kindFilter;
    return matchesSearch && matchesKind;
  });
  pagination.goToPage(1);
  renderCategories();
}

async function loadCategories() {
  const tbody = document.querySelector('#categoriesTable tbody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="3">Загрузка...</td></tr>';
  }
  const resp = await API.categories.list();
  if (!resp.ok) {
    categoryState.categories = [];
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="3">Ошибка загрузки категорий: ${resp.error}</td></tr>`;
    }
    return;
  }
  const categories = resp.data || [];
  categoryState.categories = Array.isArray(categories) ? categories : [];
  applyFilters();
}

function bindFilters() {
  const searchInput = document.getElementById('categorySearch');
  const kindSelect = document.getElementById('categoryFilterKind');
  const pageSizeSelect = document.getElementById('categoriesPageSize');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      pagination.goToPage(1);
      applyFilters();
    });
  }
  if (kindSelect) {
    kindSelect.addEventListener('change', () => {
      pagination.goToPage(1);
      applyFilters();
    });
  }
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener('change', () => {
      pagination.setPageSize(Number(pageSizeSelect.value) || 10);
      renderCategories();
    });
  }
}

function bindForm() {
  const form = document.getElementById('addCategoryForm');
  if (!form) return;
  const nameInput = document.getElementById('catName');
  const kindSelect = document.getElementById('catKind');

  function clearErrors() {
    setFieldError(nameInput, '');
    setFieldError(kindSelect, '');
  }

  nameInput?.addEventListener('input', () => setFieldError(nameInput, ''));
  kindSelect?.addEventListener('change', () => setFieldError(kindSelect, ''));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors();
    const name = nameInput?.value.trim();
    const kind = kindSelect?.value;
    let valid = true;
    if (!name) {
      setFieldError(nameInput, 'Введите название категории');
      valid = false;
    }
    if (!kind) {
      setFieldError(kindSelect, 'Выберите тип категории');
      valid = false;
    }
    if (!valid) return;

    try {
      const resp = await API.categories.create({ name, kind });
      if (!resp.ok) {
        UI.showToast({
          type: 'danger',
          message: resp.error || 'Не удалось добавить категорию',
        });
        return;
      }
      const created = resp.data;
      if (created) categoryState.categories.push(created);
      UI.showToast({ type: 'success', message: 'Категория добавлена' });
      form.reset();
      applyFilters();
    } catch (error) {
      console.error(error);
      UI.showToast({ type: 'danger', message: 'Ошибка сети. Попробуйте позже.' });
    }
  });
}

async function confirmDelete(cat) {
  const confirmed = await UI.confirmModal({
    title: 'Удалить категорию',
    description: `Категория «${cat.name}» будет удалена. Связанные операции сохранятся без категории. Продолжить?`,
    confirmText: 'Удалить',
    variant: 'danger',
  });
  if (!confirmed) return;
  try {
    const resp = await API.categories.remove(cat.id);
    if (!resp.ok) {
      UI.showToast({
        type: 'danger',
        message: resp.error || 'Не удалось удалить категорию',
      });
      return;
    }
    categoryState.categories = categoryState.categories.filter((c) => c.id !== cat.id);
    UI.showToast({ type: 'success', message: 'Категория удалена' });
    applyFilters();
  } catch (error) {
    console.error(error);
    UI.showToast({ type: 'danger', message: 'Ошибка сети. Попробуйте позже.' });
  }
}

function openEditModal(cat) {
  const form = document.createElement('form');
  form.className = 'form-grid';

  const nameField = document.createElement('div');
  nameField.className = 'form-field';
  const nameLabel = document.createElement('label');
  nameLabel.textContent = 'Название';
  nameLabel.setAttribute('for', 'modalCatName');
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.id = 'modalCatName';
  nameInput.value = cat.name;
  const nameError = document.createElement('span');
  nameError.className = 'form-error';
  nameError.dataset.errorFor = 'modalCatName';
  nameField.append(nameLabel, nameInput, nameError);

  const kindField = document.createElement('div');
  kindField.className = 'form-field';
  kindField.style.flex = '0 0 200px';
  const kindLabel = document.createElement('label');
  kindLabel.textContent = 'Тип';
  kindLabel.setAttribute('for', 'modalCatKind');
  const kindSelect = document.createElement('select');
  kindSelect.id = 'modalCatKind';
  const incomeOpt = new Option('Доход', 'income', cat.kind === 'income', cat.kind === 'income');
  const expenseOpt = new Option('Расход', 'expense', cat.kind === 'expense', cat.kind === 'expense');
  kindSelect.append(incomeOpt, expenseOpt);
  const kindError = document.createElement('span');
  kindError.className = 'form-error';
  kindError.dataset.errorFor = 'modalCatKind';
  kindField.append(kindLabel, kindSelect, kindError);

  form.append(nameField, kindField);

  function setModalError(inputEl, message) {
    const field = inputEl.closest('.form-field');
    const error = field ? field.querySelector('.form-error') : null;
    if (error) error.textContent = message || '';
    if (message) inputEl.classList.add('has-error');
    else inputEl.classList.remove('has-error');
  }

  nameInput.addEventListener('input', () => setModalError(nameInput, ''));
  kindSelect.addEventListener('change', () => setModalError(kindSelect, ''));

  const modal = UI.openModal({
    title: 'Редактирование категории',
    content: form,
    actions: [
      {
        label: 'Отмена',
        variant: 'secondary',
        onClick: () => UI.closeModal(),
      },
      {
        label: 'Сохранить',
        variant: 'primary',
        type: 'submit',
        onClick: async (event) => {
          event.preventDefault();
          const newName = nameInput.value.trim();
          const newKind = kindSelect.value;
          let valid = true;
          if (!newName) {
            setModalError(nameInput, 'Введите название');
            valid = false;
          }
          if (!newKind) {
            setModalError(kindSelect, 'Выберите тип');
            valid = false;
          }
          if (!valid) return;
          try {
            const resp = await API.categories.update(cat.id, { name: newName, kind: newKind });
            if (!resp.ok) {
              UI.showToast({
                type: 'danger',
                message: resp.error || 'Не удалось обновить категорию',
              });
              return;
            }
            const updated = resp.data;
            const idx = categoryState.categories.findIndex((item) => item.id === updated.id);
            if (idx > -1) {
              categoryState.categories[idx] = updated;
            }
            UI.showToast({ type: 'success', message: 'Категория обновлена' });
            UI.closeModal();
            applyFilters();
          } catch (error) {
            console.error(error);
            UI.showToast({ type: 'danger', message: 'Ошибка сети. Попробуйте позже.' });
          }
        },
      },
    ],
  });

  if (modal?.element) {
    modal.element.querySelector('form')?.addEventListener('submit', (event) => {
      event.preventDefault();
    });
  }
}

async function initCategoriesPage() {
  await loadCategories();
  bindFilters();
  bindForm();
}

// Auto-init on DOM ready
if (document.readyState !== 'loading') {
  initCategoriesPage();
} else {
  document.addEventListener('DOMContentLoaded', initCategoriesPage);
}

export { initCategoriesPage };
