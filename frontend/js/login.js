const HOME = { admin: 'app.html', manager: 'manager.html', employee: 'employee.html' };
const homeFor = (role) => HOME[role] || HOME.employee;

// Already signed in: go straight to the page for this user's role
if (Auth.token) location.href = homeFor((Auth.user || {}).role);

const form = document.getElementById('login-form');
const alertBox = document.getElementById('alert');
const submitBtn = document.getElementById('submit');
const LABELS = { admin: 'HR Admin', manager: 'Manager', employee: 'Employee' };

const selectedRole = () => form.querySelector('input[name="role"]:checked').value;
const syncButton = () => { submitBtn.textContent = 'Sign in as ' + LABELS[selectedRole()]; };
form.querySelectorAll('input[name="role"]').forEach((r) => r.addEventListener('change', syncButton));
syncButton();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  alertBox.classList.add('hidden');

  const email = form.email.value.trim();
  const password = form.password.value;
  if (!/^\S+@\S+\.\S+$/.test(email)) return showError('Enter a valid work email');
  if (!password) return showError('Enter your password');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in...';
  try {
    const { token, user } = await api.login({ email, password, role: selectedRole() });
    Auth.save(token, user);
    // Use the role the server confirmed, not the radio button
    location.href = homeFor(user && user.role);
  } catch (err) {
    showError(err.message);
    submitBtn.disabled = false;
    syncButton();
  }
});

function showError(msg) {
  alertBox.textContent = msg;
  alertBox.classList.remove('hidden');
}
