const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error((data as any).message || `API request failed with status ${response.status}`);
  }

  return data as T;
}

export async function ensureAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const existing = localStorage.getItem('accessToken');
  if (existing) {
    try {
      const parts = existing.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          // Token expired -> attempt refresh with refreshToken
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const res = await fetchApi<{ accessToken: string }>('/api/v1/auth/refresh', {
              method: 'POST',
              body: JSON.stringify({ refreshToken }),
            });
            if (res.accessToken) {
              localStorage.setItem('accessToken', res.accessToken);
              return res.accessToken;
            }
          }
          localStorage.removeItem('accessToken');
          return null;
        } else {
          return existing;
        }
      } else {
        return existing;
      }
    } catch {
      localStorage.removeItem('accessToken');
      return null;
    }
  }

  return null;
}
