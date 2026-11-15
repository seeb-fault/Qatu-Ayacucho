/**
 * Ruta de regreso segura tras el ingreso: solo rutas internas de Qatu.
 * Rechaza `//sitio`, `/\sitio`, esquemas (`https:`, `javascript:`) y caracteres de control.
 */
export function rutaInterna(valor: string | null | undefined): string | null {
  if (!valor || valor.length > 512 || !valor.startsWith('/') || valor.startsWith('//')) return null;
  if (/[\u0000-\u001f\u007f\\]/.test(valor)) return null;
  try {
    const url = new URL(valor, 'http://qatu.local');
    return url.origin === 'http://qatu.local' ? url.pathname + url.search + url.hash : null;
  } catch { return null; }
}

/** Enlace a Ingresar que vuelve a `ruta` después de iniciar sesión. */
export const ingresarYVolver = (ruta: string) => '/ingresar?siguiente=' + encodeURIComponent(ruta);
