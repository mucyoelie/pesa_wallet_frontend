const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '');

/** Emitted when the API rejects a request because the session is gone. */
export const UNAUTHORIZED_EVENT = 'pesa:unauthorized';

/** Error thrown by the API client; `fieldError` maps validation details to a form field. */
export class ApiError extends Error {
  constructor(message, { status = 0, details = [] } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }

  fieldError(field) {
    return this.details.find((detail) => detail.field === field)?.message ?? null;
  }
}

function queryString(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

async function request(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      signal,
      // The session lives in an httpOnly cookie, so every call must carry it.
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Cannot reach the server. Check that the API is running.');
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    // A 401 outside the auth endpoints means the session expired mid-session; the
    // auth context listens for this and sends the user back to the sign-in screen.
    if (response.status === 401 && !path.startsWith('/auth/')) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    throw new ApiError(payload?.error?.message ?? `Request failed with status ${response.status}`, {
      status: response.status,
      details: payload?.error?.details ?? [],
    });
  }

  return payload;
}

export const api = {
  get: request,

  auth: {
    me: () => request('/auth/me'),
    login: (body) => request('/auth/login', { method: 'POST', body }),
    register: (body) => request('/auth/register', { method: 'POST', body }),
    logout: () => request('/auth/logout', { method: 'POST' }),
  },

  accounts: {
    list: () => request('/accounts'),
    create: (body) => request('/accounts', { method: 'POST', body }),
    update: (id, body) => request(`/accounts/${id}`, { method: 'PUT', body }),
    remove: (id) => request(`/accounts/${id}`, { method: 'DELETE' }),
  },

  categories: {
    list: () => request('/categories'),
    create: (body) => request('/categories', { method: 'POST', body }),
    update: (id, body) => request(`/categories/${id}`, { method: 'PUT', body }),
    remove: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
  },

  transactions: {
    list: (params) => request(`/transactions${queryString(params)}`),
    create: (body) => request('/transactions', { method: 'POST', body }),
    update: (id, body) => request(`/transactions/${id}`, { method: 'PUT', body }),
    remove: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),
  },

  budgets: {
    get: (period) => request(`/budgets${queryString({ period })}`),
    save: (body) => request('/budgets', { method: 'POST', body }),
    remove: (id) => request(`/budgets/${id}`, { method: 'DELETE' }),
  },

  summary: (params) => request(`/summary${queryString(params)}`),
  report: (params) => request(`/reports${queryString(params)}`),
  /** Direct download URL for the CSV export (the browser sends the session cookie). */
  reportCsvUrl: (params) => `${BASE_URL}/reports/export${queryString(params)}`,
};
