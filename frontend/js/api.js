
// const API = 'http://localhost:5000/api';
const API =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://ems-qh9r.onrender.com/api';

    
const Auth = {
  get token() {
    return localStorage.getItem('token');
  },

  get user() {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  },

  save(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  clear() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

class ApiError extends Error {
  constructor(message, status, fields = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
  }
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (Auth.token) {
    headers.Authorization = `Bearer ${Auth.token}`;
  }

  let response;

  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      'Cannot connect to the backend. Check that the server is running on port 5000.',
      0
    );
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/')) {
      Auth.clear();

      if (!location.pathname.endsWith('/login.html')) {
        location.href = 'login.html';
      }
    }

    throw new ApiError(
      body.message || `Request failed (${response.status})`,
      response.status,
      body.errors || {}
    );
  }

  return body;
}

const api = {
  login(data) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  list(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/employees${query ? `?${query}` : ''}`);
  },

  create(data) {
    return request('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id, data) {
    return request(`/employees/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  remove(id) {
    return request(`/employees/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
