// Địa chỉ backend — đổi lại nếu bạn deploy backend ở nơi khác
const API_BASE = 'http://localhost:4000/api';

function getToken() {
  return localStorage.getItem('roomflow_token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.error || 'Đã có lỗi xảy ra, vui lòng thử lại.');
    error.status = res.status;
    error.payload = data;
    throw error;
  }
  return data;
}

export const api = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),

  getRooms: () => request('/rooms'),

  getMeetings: (from, to) => {
    const params = from && to ? `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` : '';
    return request(`/meetings${params}`);
  },

  createMeeting: (payload) => request('/meetings', { method: 'POST', body: payload }),

  updateMeeting: (id, payload) => request(`/meetings/${id}`, { method: 'PUT', body: payload }),

  deleteMeeting: (id) => request(`/meetings/${id}`, { method: 'DELETE' }),
};

export function saveSession(token, user) {
  localStorage.setItem('roomflow_token', token);
  localStorage.setItem('roomflow_user', JSON.stringify(user));
}

export function loadSession() {
  const token = localStorage.getItem('roomflow_token');
  const userRaw = localStorage.getItem('roomflow_user');
  if (!token || !userRaw) return null;
  try {
    return { token, user: JSON.parse(userRaw) };
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem('roomflow_token');
  localStorage.removeItem('roomflow_user');
}
