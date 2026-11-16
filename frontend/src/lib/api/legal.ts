/** Datos de Qatu como proveedor (titular del sitio). Se configuran en el backend: QATU_TITULAR_*. */
export interface Titular { razonSocial: string | null; ruc: string | null; direccion: string | null; correo: string | null; telefono: string | null }

export const TITULAR_VACIO: Titular = { razonSocial: null, ruc: null, direccion: null, correo: null, telefono: null };
export const FECHA_LEGAL = '16 de noviembre de 2026';

/** Lee el titular desde el servidor de Next. Si la API no responde, las páginas igual se muestran con «Por definir». */
export async function titular(): Promise<Titular> {
  try {
    const r = await fetch(`${process.env.QATU_API_URL ?? 'http://127.0.0.1:3001'}/api/v1/reclamaciones/titular`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    return r.ok ? await r.json() : TITULAR_VACIO;
  } catch { return TITULAR_VACIO; }
}

export type TipoHoja = 'reclamo' | 'queja';
export interface Constancia {
  numero: string; tipo: TipoHoja; titular: Titular; presentadaEn: string; venceEn: string;
  consumidor: { nombre: string; tipoDocumento: string; numeroDocumento: string; domicilio: string; telefono: string | null; email: string;
    menorDeEdad: boolean; apoderadoNombre: string | null; apoderadoDocumento: string | null };
  medioRespuesta: 'correo' | 'carta';
  bien: { tipo: 'producto' | 'servicio'; descripcion: string; montoCentimos: number | null };
  detalle: string; pedido: string;
  respuesta: { texto: string; medio: 'correo' | 'carta'; respondidaEn: string } | null;
  codigoConsulta?: string;
}

export const fechaHora = (iso: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Lima' }).format(new Date(iso));
export const fechaLarga = (dia: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(dia + 'T00:00:00Z'));
