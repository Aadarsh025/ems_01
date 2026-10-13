
if (!Auth.token) {
  location.href = 'login.html';
}

const user = Auth.user || {};
const isAdmin = user.role === 'admin';

const state = {
  search: '',
  department: '',
  sortBy: 'createdAt',
  order: 'desc',
  page: 1,
  limit: 8,
  pages: 1,
  total: 0,
};

const $ = (id) => document.getElementById(id);

const els = {
  body: $('rows'),
  status: $('status'),
  count: $('count'),
  pageInfo: $('page-info'),
  prev: $('prev'),
  next: $('next'),
  search: $('search'),
  dept: $('department'),
  formDlg: $('form-dialog'),
  form: $('emp-form'),
  formTitle: $('form-title'),
  saveBtn: $('save'),
  delDlg: $('delete-dialog'),
  delText: $('delete-text'),
  delBtn: $('confirm-delete'),
  toast: $('toast'),
};

let editingId = null;
let deletingId = null;
let employeesById = {};
let toastTimer;

const money = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN');

const fmtDate = (d) => {
  if (!d) return '—';

  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));

/* ---------- Header and authentication ---------- */

$('user-name').textContent =
  `${user.name || 'User'} (${user.role || 'unknown'})`;

$('logout').onclick = () => {
  Auth.clear();
  location.href = 'login.html';
};

if (!isAdmin) {
  $('add-btn').classList.add('hidden');
  $('actions-th').classList.add('hidden');
}

/* ---------- Load employees ---------- */

async function load() {
  showState('loading');

  try {
    const result = await api.list({
      search: state.search,
      department: state.department,
      sortBy: state.sortBy,
      order: state.order,
      page: state.page,
      limit: state.limit,
    });

    const data = result.data || [];

    state.total = result.total ?? data.length;
    state.pages = Math.max(1, result.pages || 1);

    employeesById = Object.fromEntries(
      data.map((employee) => [employee._id, employee])
    );

    fillDepartments(result.departments || []);
    render(data);
  } catch (err) {
    showState('error', err.message);
  }
}

function fillDepartments(list) {
  const current = state.department;

  els.dept.innerHTML =
    '<option value="">All departments</option>' +
    list.map((department) => `
      <option value="${esc(department)}"
        ${department === current ? 'selected' : ''}>
        ${esc(department)}
      </option>
    `).join('');

  $('dept-list').innerHTML = list.map((department) =>
    `<option value="${esc(department)}"></option>`
  ).join('');
}

/* ---------- Render employee table ---------- */

function render(data) {
  els.count.textContent =
    `${state.total} record${state.total === 1 ? '' : 's'}`;

  els.pageInfo.textContent =
    `Page ${state.page} of ${state.pages}`;

  els.prev.disabled = state.page <= 1;
  els.next.disabled = state.page >= state.pages;

  if (!data.length) {
    showState('empty');
    return;
  }

  els.status.classList.add('hidden');
  $('table').classList.remove('hidden');

  els.body.innerHTML = data.map((employee) => {
    const id = esc(employee._id);

    return `
      <tr>
        <td class="name-cell">
          <strong>${esc(employee.name)}</strong>
        </td>

        <td data-label="Department">
          <span class="chip">${esc(employee.department)}</span>
        </td>

        <td data-label="Role">${esc(employee.role)}</td>

        <td data-label="Salary">${money(employee.salary)}</td>

        <td data-label="Join date">
          ${fmtDate(employee.joinDate)}
        </td>

        ${isAdmin ? `
          <td class="actions-cell">
            <div class="actions">
              <button class="icon-btn"
                data-edit="${id}"
                aria-label="Edit ${esc(employee.name)}">✎</button>

              <button class="icon-btn del"
                data-del="${id}"
                aria-label="Delete ${esc(employee.name)}">🗑</button>
            </div>
          </td>
        ` : ''}
      </tr>
    `;
  }).join('');
}

function showState(type, msg = '') {
  $('table').classList.add('hidden');
  els.status.classList.remove('hidden');

  if (type === 'loading') {
    els.status.textContent = 'Loading employees...';
  }

  if (type === 'empty') {
    els.status.textContent =
      'No employees found. Try another search or filter.';
  }

  if (type === 'error') {
    els.status.replaceChildren();

    const title = document.createElement('strong');
    title.textContent = 'Could not load employees';

    const message = document.createElement('p');
    message.textContent = msg;

    const retry = document.createElement('button');
    retry.id = 'retry';
    retry.className = 'btn';
    retry.textContent = 'Try again';
    retry.onclick = load;

    els.status.append(title, message, retry);
  }
}

/* ---------- Search, filter, sorting and pagination ---------- */

let debounce;

els.search.addEventListener('input', () => {
  clearTimeout(debounce);

  debounce = setTimeout(() => {
    state.search = els.search.value.trim();
    state.page = 1;
    load();
  }, 300);
});

els.dept.addEventListener('change', () => {
  state.department = els.dept.value;
  state.page = 1;
  load();
});

els.prev.onclick = () => {
  if (state.page > 1) {
    state.page--;
    load();
  }
};

els.next.onclick = () => {
  if (state.page < state.pages) {
    state.page++;
    load();
  }
};

document.querySelectorAll('th[data-sort]').forEach((th) => {
  const button = th.querySelector('button');
  if (!button) return;

  button.addEventListener('click', () => {
    const key = th.dataset.sort;

    state.order =
      state.sortBy === key && state.order === 'asc'
        ? 'desc'
        : 'asc';

    state.sortBy = key;
    state.page = 1;

    document.querySelectorAll('th[data-sort]').forEach((header) => {
      header.removeAttribute('aria-sort');

      const arrow = header.querySelector('.arrow');
      if (arrow) arrow.textContent = '↕';
    });

    th.setAttribute(
      'aria-sort',
      state.order === 'asc' ? 'ascending' : 'descending'
    );

    const arrow = th.querySelector('.arrow');
    if (arrow) arrow.textContent =
      state.order === 'asc' ? '▲' : '▼';

    load();
  });
});

/* ---------- Add and edit employees ---------- */

const fields = ['name', 'department', 'role', 'salary', 'joinDate'];

const today = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
};

function openForm(employee) {
  editingId = employee ? employee._id : null;

  els.formTitle.textContent =
    employee ? 'Edit employee' : 'Add employee';

  els.saveBtn.textContent =
    employee ? 'Save changes' : 'Add employee';

  els.form.reset();
  clearErrors();

  els.form.elements.joinDate.max = today();

  if (employee) {
    els.form.elements.name.value = employee.name || '';
    els.form.elements.department.value = employee.department || '';
    els.form.elements.role.value = employee.role || '';
    els.form.elements.salary.value = employee.salary ?? '';

    els.form.elements.joinDate.value =
      employee.joinDate
        ? String(employee.joinDate).slice(0, 10)
        : '';
  }

  els.formDlg.showModal();
  els.form.elements.name.focus();
}

function clearErrors() {
  fields.forEach((field) => {
    const input = els.form.elements[field];
    const error = $('err-' + field);

    if (input) input.classList.remove('invalid');
    if (error) error.textContent = '';
  });

  $('form-alert').classList.add('hidden');
}

function setErrors(errors = {}) {
  Object.entries(errors).forEach(([field, message]) => {
    const input = els.form.elements[field];
    const error = $('err-' + field);

    if (input) input.classList.add('invalid');
    if (error) error.textContent = message;
  });

  const first = fields.find((field) => errors[field]);

  if (first) els.form.elements[first].focus();
}

function validate(values) {
  const errors = {};

  if (values.name.length < 2 || values.name.length > 100) {
    errors.name = 'Name must be 2–100 characters';
  }

  if (!values.department) {
    errors.department = 'Department is required';
  }

  if (!values.role) {
    errors.role = 'Role is required';
  }

  if (
    values.salary === '' ||
    !Number.isFinite(Number(values.salary)) ||
    Number(values.salary) <= 0
  ) {
    errors.salary = 'Salary must be a positive number';
  }

  if (!values.joinDate) {
    errors.joinDate = 'Join date is required';
  } else if (values.joinDate > today()) {
    errors.joinDate = 'Join date cannot be in the future';
  }

  return errors;
}

els.form.addEventListener('submit', async (event) => {
  event.preventDefault();

  clearErrors();

  const values = {
    name: els.form.elements.name.value.trim(),
    department: els.form.elements.department.value.trim(),
    role: els.form.elements.role.value.trim(),
    salary: els.form.elements.salary.value,
    joinDate: els.form.elements.joinDate.value,
  };

  const errors = validate(values);

  if (Object.keys(errors).length) {
    setErrors(errors);
    return;
  }

  const wasEditing = Boolean(editingId);

  els.saveBtn.disabled = true;
  els.saveBtn.textContent = 'Saving...';

  try {
    if (wasEditing) {
      await api.update(editingId, values);
    } else {
      await api.create(values);
    }

    els.formDlg.close();
    toast(wasEditing ? 'Employee updated' : 'Employee added');

    if (!wasEditing) {
      state.sortBy = 'createdAt';
      state.order = 'desc';
      state.page = 1;
    }

    await load();
  } catch (err) {
    setErrors(err.fields || {});

    const alert = $('form-alert');
    alert.textContent = err.message;
    alert.classList.remove('hidden');
  } finally {
    els.saveBtn.disabled = false;
    els.saveBtn.textContent =
      editingId ? 'Save changes' : 'Add employee';
  }
});

$('add-btn').onclick = () => openForm(null);

$('cancel-form').onclick = () => els.formDlg.close();
$('close-form').onclick = () => els.formDlg.close();

/* ---------- Delete employees ---------- */

els.body.addEventListener('click', (event) => {
  const editButton = event.target.closest('[data-edit]');
  const deleteButton = event.target.closest('[data-del]');

  if (editButton) {
    const employee = employeesById[editButton.dataset.edit];
    if (employee) openForm(employee);
  }

  if (deleteButton) {
    deletingId = deleteButton.dataset.del;

    const employee = employeesById[deletingId];
    if (!employee) return;

    els.delText.textContent =
      `Delete ${employee.name}? This permanently removes the record and cannot be undone.`;

    els.delDlg.showModal();
  }
});

$('cancel-delete').onclick = () => els.delDlg.close();

els.delBtn.onclick = async () => {
  if (!deletingId) return;

  els.delBtn.disabled = true;
  els.delBtn.textContent = 'Deleting...';

  try {
    await api.remove(deletingId);

    els.delDlg.close();
    toast('Employee deleted');

    if (els.body.children.length === 1 && state.page > 1) {
      state.page--;
    }

    await load();
  } catch (err) {
    els.delDlg.close();
    toast(err.message, true);
  } finally {
    deletingId = null;
    els.delBtn.disabled = false;
    els.delBtn.textContent = 'Delete';
  }
};

/* ---------- Toast notifications ---------- */

function toast(message, isError = false) {
  els.toast.textContent = message;
  els.toast.className = 'toast' + (isError ? ' error' : '');

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    els.toast.classList.add('hidden');
  }, 3500);
}

/* ---------- Initial load ---------- */

load();
