const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

type RequestOptions = RequestInit & { token?: string };

async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.detail || data?.message || 'Something went wrong with the API request.');
  return data;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) => apiRequest<T>(endpoint, { method: 'GET', ...options }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => apiRequest<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined, ...options }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => apiRequest<T>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined, ...options }),
  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => apiRequest<T>(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined, ...options }),
  delete: <T>(endpoint: string, options?: RequestOptions) => apiRequest<T>(endpoint, { method: 'DELETE', ...options }),
};
