const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Universal fetch wrapper with auth header injection and standardized error extraction
 */
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('sweety_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const url = `${API_BASE_URL}${endpoint}`;

  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr) {
    throw new Error('Network error. Please check if the server is running.');
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return null;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const authApi = {
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),

  getMe: () => apiRequest('/auth/me'),
};

export const readingApi = {
  getReadings: ({ page = 1, limit = 20, date, month } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (date) params.append('date', date);
    if (month) params.append('month', month);
    return apiRequest(`/readings?${params.toString()}`);
  },

  getReadingById: (id) => apiRequest(`/readings/${id}`),

  createReading: (reading) => apiRequest('/readings', {
    method: 'POST',
    body: JSON.stringify(reading),
  }),

  updateReading: (id, reading) => apiRequest(`/readings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(reading),
  }),

  deleteReading: (id) => apiRequest(`/readings/${id}`, {
    method: 'DELETE',
  }),
};

export const reportApi = {
  getReports: (date) => {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return apiRequest(`/reports${query}`);
  },
};
