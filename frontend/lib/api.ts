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
  if (existing) return existing;

  try {
    const res = await fetchApi<{ accessToken: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'runner1@naver.com', password: 'password123' }),
    });
    if (res.accessToken) {
      localStorage.setItem('accessToken', res.accessToken);
      return res.accessToken;
    }
  } catch (err) {
    console.warn('Auto-login test account failed:', err);
  }
  return null;
}
