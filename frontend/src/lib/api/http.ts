export class ErrorApi extends Error {
  constructor(public readonly status: number, mensaje: string) { super(mensaje); }
}

async function solicitar<T>(ruta: string, opciones: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${ruta}`, {
      ...opciones, credentials: 'same-origin', cache: 'no-store',
      signal: opciones.signal ?? AbortSignal.timeout(10000),
    });
  } catch { throw new ErrorApi(503, 'No se pudo conectar. Intenta nuevamente.'); }
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new ErrorApi(response.status, error?.mensaje ?? 'El servicio no está disponible. Intenta nuevamente.');
  }
  return response.status === 204 ? undefined as T : response.json();
}

export function apiJson<T>(ruta: string, method = 'GET', body?: unknown): Promise<T> {
  return solicitar(ruta,{ method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
}

export function apiFormulario<T>(ruta: string, body: FormData): Promise<T> {
  return solicitar(ruta,{ method: 'POST', body, signal: AbortSignal.timeout(120000) });
}
