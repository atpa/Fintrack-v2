/**
 * Categories management page
 */
import API from './utils/api.js';
import { setFieldError } from './utils/validation.js';
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
  },
});

function renderCategories() {
  const tbody = document.querySelector('#categoriesTable tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  const pageItems = pagination.paginate(categoryState.filtered);

  if (!pageItems.length) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = 2;
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
    tr.append(nameTd, actionsTd);
    tbody.appendChild(tr);
  });

  pagination.render(categoryState.filtered.length);
}

function applyFilters() {
  const searchValue = document.getElementById('categorySearch')?.value.trim().toLowerCase() || '';
  categoryState.filtered = categoryState.categories.filter((cat) =>
    !searchValue || cat.name.toLowerCase().includes(searchValue)
  );
  pagination.goToPage(1);
  renderCategories();
}

async function loadCategories() {
  const tbody = document.querySelector('#categoriesTable tbody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="2">Загрузка...</td></tr>';
  }

  const resp = await API.categories.list();
  if (!resp.ok) {
    categoryState.categories = [];
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="2">Ошибка загрузки категорий: ${resp.error}</td></tr>`;
    }
    return;
  }

  const categories = resp.data || [];
  categoryState.categories = Array.isArray(categories) ? categories : [];
  applyFilters();
}

function bindFilters() {
  const searchInput = document.getElementById('categorySearch');
  const pageSizeSelect = document.getElementById('categoriesPageSize');

  searchInput?.addEventListener('input', () => {
    pagination.goToPage(1);
    applyFilters();
  });

  pageSizeSelect?.addEventListener('change', () => {
    pagination.setPageSize(Number(pageSizeSelect.value) || 10);
    renderCategories();
  });
}

function bindForm() {
  const form = document.getElementById('addCategoryForm');
  if (!form) return;

  const nameInput = document.getElementById('catName');
  nameInput?.addEventListener('input', () => setFieldError(nameInput, ''));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = nameInput?.value.trim();
    if (!name) {
      setFieldError(nameInput, 'Укажите название категории');
      return;
    }

    try {
      const resp = await API.categories.create({ name });
      if (!resp.ok) {
        UI.showToast({
          type: 'danger',
          message: resp.error || 'Не удалось добавить категорию',
        });
        return;
      }

      if (resp.data) {
        categoryState.categories.push(resp.data);
      }

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
    description: `Категория «${cat.name}» будет удалена. Связанные операции останутся без категории. Продолжить?`,
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

    categoryState.categories = categoryState.categories.filter((item) => item.id !== cat.id);
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
  nameLabel.htmlFor = 'modalCatName';
  nameLabel.textContent = 'Название';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.id = 'modalCatName';
  nameInput.value = cat.name;

  const nameError = document.createElement('span');
  nameError.className = 'form-error';
  nameError.dataset.errorFor = 'modalCatName';

  nameField.append(nameLabel, nameInput, nameError);
  form.append(nameField);

  function setModalError(inputEl, message) {
    const field = inputEl.closest('.form-field');
    const error = field ? field.querySelector('.form-error') : null;
    if (error) error.textContent = message || '';
    if (message) inputEl.classList.add('has-error');
    else inputEl.classList.remove('has-error');
  }

  nameInput.addEventListener('input', () => setModalError(nameInput, ''));

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
          if (!newName) {
            setModalError(nameInput, 'Укажите название');
            return;
          }

          try {
            const resp = await API.categories.update(cat.id, { name: newName });
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

if (document.readyState !== 'loading') {
  initCategoriesPage();
} else {
  document.addEventListener('DOMContentLoaded', initCategoriesPage);
}

export { initCategoriesPage };
