/* Employee page: read-only company directory + own profile.
   - No add / edit / delete.
   - Other people's salaries are NOT shown.
   NOTE: the server must also strip salary from list responses for the
   employee role; hiding a column in the UI is not security. */

if (!Auth.token) location.href = 'login.html';

const user = Auth.user || {};
if (user.role === 'admin') location.href = 'app.html';
else if (user.role === 'manager') location.href = 'manager.html';

const state = {
  search: '',
  department: '',
  sortBy: 'name',
  order: 'asc',
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
};

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

$('user-name').textContent = `${user.name || 'User'} (employee)`;

$('logout').onclick = () => {
  Auth.clear();
  location.href = 'login.html';
};

/* ---------- Directory ---------- */

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
    list.map((d) => `<option value="${esc(d)}" ${d === current ? 'selected' : ''}>${esc(d)}</option>`).join('');
}

function render(data) {
  els.count.textContent = `${state.total} colleague${state.total === 1 ? '' : 's'}`;
  els.pageInfo.textContent = `Page ${state.page} of ${state.pages}`;
  els.prev.disabled = state.page <= 1;
  els.next.disabled = state.page >= state.pages;

  if (!data.length) { showState('empty'); return; }

  els.status.classList.add('hidden');
  $('table').classList.remove('hidden');

  els.body.innerHTML = data.map((e) => `
    <tr>
      <td class="name-cell"><strong>${esc(e.name)}</strong></td>
      <td data-label="Department"><span class="chip">${esc(e.department)}</span></td>
      <td data-label="Role">${esc(e.role)}</td>
      <td data-label="Join date">${fmtDate(e.joinDate)}</td>
    </tr>`).join('');
}

function showState(type, msg = '') {
  $('table').classList.add('hidden');
  els.status.classList.remove('hidden');

  if (type === 'loading') els.status.textContent = 'Loading directory...';
  if (type === 'empty') els.status.textContent = 'No colleagues found. Try another search or filter.';

  if (type === 'error') {
    els.status.replaceChildren();
    const title = document.createElement('strong');
    title.textContent = 'Could not load the directory';
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

/* ---------- My profile ---------- */

function setProfile(p) {
  $('p-name').textContent = p.name || '—';
  $('p-dept').textContent = p.department || '—';
  $('p-role').textContent = p.role || '—';
  $('p-salary').textContent = p.salary != null ? money(p.salary) : '—';
  $('p-date').textContent = fmtDate(p.joinDate);
}

async function loadProfile() {
  // Start with what the login session already knows
  setProfile(user);

  // Then try to find the full record (prefers user.employeeId, falls back to exact name)
  try {
    const res = await api.list({ search: user.name || '', limit: 50, page: 1 });
    const match = (res.data || []).find((e) =>
      (user.employeeId && e._id === user.employeeId) ||
      (e.name || '').toLowerCase() === (user.name || '').toLowerCase()
    );
    if (match) setProfile(match);
  } catch (_) { /* keep session data */ }
}

loadProfile();
load();
