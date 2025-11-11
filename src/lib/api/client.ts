const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

console.log('API Base URL:', API_BASE);

const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
};

// Fetch wrapper with automatic credentials: 'include', auth header injection, and 401 handling
interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined> | { [key: string]: unknown };
}

async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<{ data: T; status: number; headers: Headers }> {
  const { params, headers: customHeaders, ...fetchOptions } = options;

  // Build URL with query params if provided
  let url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, String(value));
    });
    const queryString = searchParams.toString();
    if (queryString) url += `?${queryString}`;
  }

  // Merge headers
  const headers = new Headers(customHeaders);
  if (!headers.has('Content-Type') && fetchOptions.body && typeof fetchOptions.body === 'string') {
    // Default to JSON if sending string body (unless already set, e.g., form-urlencoded)
    headers.set('Content-Type', 'application/json');
  }

  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Security: Never send cookies/credentials. This app uses token-based auth via Authorization header.
  // Credentials are explicitly omitted to prevent CSRF and other cookie-based attacks.
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'omit', // Hard-coded for security - auth is via Authorization header only
  });

  // Handle 401 Unauthorized -> redirect to login
  if (response.status === 401) {
    removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  // Parse response
  let data: T;
  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = (await response.text()) as T;
  }

  if (!response.ok) {
    throw {
      response: {
        data,
        status: response.status,
        statusText: response.statusText,
      },
      message: `HTTP ${response.status}`,
    };
  }

  return { data, status: response.status, headers: response.headers };
}

// Axios-compatible API client for minimal migration impact
export const api = {
  async get<T = unknown>(url: string, config?: RequestOptions) {
    return apiFetch<T>(url, { ...config, method: 'GET' });
  },

  async post<T = unknown>(url: string, body?: unknown, config?: RequestOptions) {
    const finalBody = body instanceof URLSearchParams ? body.toString() : JSON.stringify(body);
    const headers = new Headers(config?.headers);
    
    // Preserve form-urlencoded if URLSearchParams passed
    if (body instanceof URLSearchParams) {
      headers.set('Content-Type', 'application/x-www-form-urlencoded');
    }

    return apiFetch<T>(url, {
      ...config,
      method: 'POST',
      body: finalBody,
      headers,
    });
  },

  async put<T = unknown>(url: string, body?: unknown, config?: RequestOptions) {
    return apiFetch<T>(url, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  async delete<T = unknown>(url: string, config?: RequestOptions) {
    return apiFetch<T>(url, { ...config, method: 'DELETE' });
  },
};
