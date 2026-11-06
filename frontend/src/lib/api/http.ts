export class ErrorApi extends Error {
  constructor(public readonly status: number, mensaje: string) { super(mensaje); }
}

const ESPERA_REINTENTO_MS = 200;
const esperar = () => new Promise(resolver => setTimeout(resolver, ESPERA_REINTENTO_MS));

async function solicitar<T>(ruta: string, opciones: RequestInit, reintentar = (opciones.method ?? 'GET') === 'GET'): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${ruta}`, {
      ...opciones, credentials: 'same-origin', cache: 'no-store',
      signal: opciones.signal ?? AbortSignal.timeout(10000),
    });
  } catch (error) {
    // Una lectura cortada se repite una vez; una que agotó el tiempo no, para no alargar más la espera.
    if (reintentar && !(error instanceof DOMException && error.name === 'TimeoutError') && !opciones.signal?.aborted) { await esperar(); return solicitar(ruta, opciones, false); }
    throw new ErrorApi(503, 'No se pudo conectar. Intenta nuevamente.');
  }
  // El backend responde sus errores con 4xx o 503. Un 500 viene del proxy, que perdió la conexión con él.
  // Las escrituras nunca se repiten aquí: podrían haberse aplicado, como un pago.
  if (reintentar && response.status === 500) { await esperar(); return solicitar(ruta, opciones, false); }
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new ErrorApi(response.status, error?.mensaje ?? 'El servicio no está disponible. Intenta nuevamente.');
  }
  return response.status === 204 ? undefined as T : response.json();
}

export function apiJson<T>(ruta: string, method = 'GET', body?: unknown, cabeceras: Record<string, string> = {}): Promise<T> {
  return solicitar(ruta,{ method, headers: { 'Content-Type': 'application/json', ...cabeceras }, body: body === undefined ? undefined : JSON.stringify(body) });
}

export function apiFormulario<T>(ruta: string, body: FormData): Promise<T> {
  return solicitar(ruta,{ method: 'POST', body, signal: AbortSignal.timeout(120000) });
}
