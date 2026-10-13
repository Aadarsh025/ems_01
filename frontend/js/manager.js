/* Manager page: manage employees in your own department.
   - Can view, add and edit (no delete).
   - Department is locked to the manager's own (user.department).
   NOTE: enforce the same rules on the server; the UI is not security. */

if (!Auth.token) location.href = 'login.html';

const user = Auth.user || {};
if (user.role === 'admin') location.href = 'app.html';
else if (user.role !== 'manager') location.href = 'employee.html';

const teamDept = user.department || '';   // '' = not scoped (filter stays visible)

const state = {
  search: '',
  department: teamDept,
  sortBy: 'createdAt',
  order: 'desc',
  page: 1,
  limit: 8,
  pages: 1,
  total: 0,
};

const $ = (id) => document.getElementById(id);

const els = {
  body: $('rows'), status: $('status'), count: $('count'),
  pageInfo: $('page-info'), prev: $('prev'), next: $('next'),
  search: $('search'), dept: $('department'),
  formDlg: $('form-dialog'), form: $('emp-form'),
  formTitle: $('form-title'), saveBtn: $('save'), toast: $('toast'),
};

let editingId = null;
let employeesById = {};
let toastTimer;

const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

/* ---------- Header ---------- */

$('user-name').textContent = `${user.name || 'User'} (manager)`;

$('logout').onclick = () => {
  Auth.clear();
  location.href = 'login.html';
};

if (teamDept) {
  $('dept-wrap').classList.add('hidden');
  $('team-banner').classList.remove('hidden');
  $('team-name').textContent = teamDept;
}

/* ---------- Load ---------- */

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
    employeesById = Object.fromEntries(data.map((e) => [e._id, e]));

    if (!teamDept) fillDepartments(result.departments || []);
    render(data);
  } catch (err) {
    showState('error', err.message);
  }
}

function fillDepartments(list) {
  const current = state.department;
  els.dept.innerHTML =
    '<option value="">All departments</option>' +
    list.map((d) => `<option value="${esc(d)}" ${d === current ? 'selected' : ''}>${esc(d)}</option>`).join('');
  $('dept-list').innerHTML = list.map((d) => `<option value="${esc(d)}"></option>`).join('');
}

/* ---------- Render ---------- */

function render(data) {
  els.count.textContent = `${state.total} team member${state.total === 1 ? '' : 's'}`;
  els.pageInfo.textContent = `Page ${state.page} of ${state.pages}`;
  els.prev.disabled = state.page <= 1;
  els.next.disabled = state.page >= state.pages;

  if (!data.length) { showState('empty'); return; }

  els.status.classList.add('hidden');
  $('table').classList.remove('hidden');

  els.body.innerHTML = data.map((e) => {
    const id = esc(e._id);
    return `
      <tr>
        <td class="name-cell"><strong>${esc(e.name)}</strong></td>
        <td data-label="Department"><span class="chip">${esc(e.department)}</span></td>
        <td data-label="Role">${esc(e.role)}</td>
        <td data-label="Salary">${money(e.salary)}</td>
        <td data-label="Join date">${fmtDate(e.joinDate)}</td>
        <td class="actions-cell">
          <div class="actions">
            <button class="icon-btn" data-edit="${id}" aria-label="Edit ${esc(e.name)}">✎</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function showState(type, msg = '') {
  $('table').classList.add('hidden');
  els.status.classList.remove('hidden');

  if (type === 'loading') els.status.textContent = 'Loading team...';
  if (type === 'empty') els.status.textContent = 'No team members found. Try another search, or add one.';

  if (type === 'error') {
    els.status.replaceChildren();
    const title = document.createElement('strong');
    title.textContent = 'Could not load your team';
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

/* ---------- Search, filter, sort, paging ---------- */

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

els.prev.onclick = () => { if (state.page > 1) { state.page--; load(); } };
els.next.onclick = () => { if (state.page < state.pages) { state.page++; load(); } };

document.querySelectorAll('th[data-sort]').forEach((th) => {
  const button = th.querySelector('button');
  if (!button) return;

  button.addEventListener('click', () => {
    const key = th.dataset.sort;
    state.order = state.sortBy === key && state.order === 'asc' ? 'desc' : 'asc';
    state.sortBy = key;
    state.page = 1;

    document.querySelectorAll('th[data-sort]').forEach((h) => {
      h.removeAttribute('aria-sort');
      const a = h.querySelector('.arrow');
      if (a) a.textContent = '↕';
    });

    th.setAttribute('aria-sort', state.order === 'asc' ? 'ascending' : 'descending');
    const arrow = th.querySelector('.arrow');
    if (arrow) arrow.textContent = state.order === 'asc' ? '▲' : '▼';

    load();
  });
});

/* ---------- Add / edit ---------- */

const fields = ['name', 'department', 'role', 'salary', 'joinDate'];

const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

function openForm(employee) {
  editingId = employee ? employee._id : null;
  els.formTitle.textContent = employee ? 'Edit team member' : 'Add team member';
  els.saveBtn.textContent = employee ? 'Save changes' : 'Add team member';

  els.form.reset();
  clearErrors();
  els.form.elements.joinDate.max = today();

  // Lock department to the manager's own
  els.form.elements.department.readOnly = Boolean(teamDept);
  els.form.elements.department.value = teamDept;

  if (employee) {
    els.form.elements.name.value = employee.name || '';
    if (!teamDept) els.form.elements.department.value = employee.department || '';
    els.form.elements.role.value = employee.role || '';
    els.form.elements.salary.value = employee.salary ?? '';
    els.form.elements.joinDate.value = employee.joinDate ? String(employee.joinDate).slice(0, 10) : '';
  }

  els.formDlg.showModal();
  els.form.elements.name.focus();
}

function clearErrors() {
  fields.forEach((f) => {
    const input = els.form.elements[f];
    const error = $('err-' + f);
    if (input) input.classList.remove('invalid');
    if (error) error.textContent = '';
  });
  $('form-alert').classList.add('hidden');
}

function setErrors(errors = {}) {
  Object.entries(errors).forEach(([f, message]) => {
    const input = els.form.elements[f];
    const error = $('err-' + f);
    if (input) input.classList.add('invalid');
    if (error) error.textContent = message;
  });
  const first = fields.find((f) => errors[f]);
  if (first) els.form.elements[first].focus();
}

function validate(v) {
  const errors = {};
  if (v.name.length < 2 || v.name.length > 100) errors.name = 'Name must be 2–100 characters';
  if (!v.department) errors.department = 'Department is required';
  if (!v.role) errors.role = 'Role is required';
  if (v.salary === '' || !Number.isFinite(Number(v.salary)) || Number(v.salary) <= 0)
    errors.salary = 'Salary must be a positive number';
  if (!v.joinDate) errors.joinDate = 'Join date is required';
  else if (v.joinDate > today()) errors.joinDate = 'Join date cannot be in the future';
  return errors;
}

els.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors();

  const values = {
    name: els.form.elements.name.value.trim(),
    // Always force the manager's department
    department: teamDept || els.form.elements.department.value.trim(),
    role: els.form.elements.role.value.trim(),
    salary: els.form.elements.salary.value,
    joinDate: els.form.elements.joinDate.value,
  };

  const errors = validate(values);
  if (Object.keys(errors).length) { setErrors(errors); return; }

  const wasEditing = Boolean(editingId);
  els.saveBtn.disabled = true;
  els.saveBtn.textContent = 'Saving...';

  try {
    if (wasEditing) await api.update(editingId, values);
    else await api.create(values);

    els.formDlg.close();
    toast(wasEditing ? 'Team member updated' : 'Team member added');

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
    els.saveBtn.textContent = editingId ? 'Save changes' : 'Add team member';
  }
});

$('add-btn').onclick = () => openForm(null);
$('cancel-form').onclick = () => els.formDlg.close();
$('close-form').onclick = () => els.formDlg.close();

els.body.addEventListener('click', (event) => {
  const editButton = event.target.closest('[data-edit]');
  if (editButton) {
    const employee = employeesById[editButton.dataset.edit];
    if (employee) openForm(employee);
  }
});

/* ---------- Toast ---------- */

function toast(message, isError = false) {
  els.toast.textContent = message;
  els.toast.className = 'toast' + (isError ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.add('hidden'), 3500);
}

load();
