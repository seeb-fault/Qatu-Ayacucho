export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  estado: 'activo' | 'inactivo';
  roles: string[];
}

export class ErrorAcceso extends Error {
  constructor(public readonly status: number, mensaje: string) { super(mensaje); }
}

export async function usuariosApi<T>(ruta: string, method = 'GET', body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${ruta}`, {
      method, credentials: 'same-origin', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
  } catch { throw new ErrorAcceso(503, 'No se pudo conectar. Intenta nuevamente.'); }
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new ErrorAcceso(response.status, error?.mensaje ?? 'El servicio no está disponible. Intenta nuevamente.');
  }
  return response.status === 204 ? undefined as T : response.json();
}
