const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details: { field: string; issue: string }[];
}

function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'status' in e;
}

export { isApiError };

export class ApiException extends Error {
  constructor(public readonly error: ApiError) {
    super(error.message);
  }
}

function getToken(): string | null {
  return sessionStorage.getItem('token');
}

export function clearSession(): void {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('role');
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  isFormData?: boolean,
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !isFormData) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${BASE}/api/v1${path}`, {
      method,
      headers,
      body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiException({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Error de conexión. Comprueba tu red e inténtalo de nuevo.',
      details: [],
    });
  }

  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err: ApiError = {
      status: res.status,
      code: json.code ?? 'UNKNOWN_ERROR',
      message: json.message ?? 'Ocurrió un error inesperado.',
      details: json.details ?? [],
    };
    if (res.status === 401) {
      clearSession();
      window.location.href = '/login';
    }
    throw new ApiException(err);
  }

  return json as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  upload: <T>(path: string, formData: FormData) =>
    request<T>('PUT', path, formData, true),
};

export async function fetchBlob(path: string): Promise<Blob | null> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(`${BASE}/api/v1${path}`, { headers });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}