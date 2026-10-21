import { ErrorProveedor } from './proveedor';

export interface ArchivoRecibido { buffer: Uint8Array; mimetype: string; size: number; }
export interface DocumentoCifrado {
  id: string;
  tipo: string;
  bytes: number;
  sha256: string;
  contenido: Uint8Array;
  iv: Uint8Array;
  tag: Uint8Array;
}
export interface DocumentoResumen { id: string; tipo: string; bytes: number; disponible: boolean; }
export interface Verificacion {
  id: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';
  motivo: string | null;
  revisorId: string | null;
  creadoEn: string;
  revisadoEn: string | null;
  perfilEnviado: { nombrePublico: string; descripcion: string; zonaId: string };
  documentos: DocumentoResumen[];
}
export interface DocumentoPrivado extends DocumentoCifrado { usuarioId: string; eliminadoEn: string | null; }

export function entradaVerificacion(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(campo => !['versionActual','aceptaConservacion'].includes(campo))) throw new ErrorProveedor('ENTRADA_INVALIDA', 400, 'Revisa los datos de la solicitud.');
  const datos = value as Record<string, unknown>;
  if (datos.aceptaConservacion !== 'true' || typeof datos.versionActual !== 'string' || !/^[1-9]\d{0,8}$/.test(datos.versionActual)) throw new ErrorProveedor('ENTRADA_INVALIDA', 400, 'Acepta la política de conservación y actualiza tu perfil.');
  return Number(datos.versionActual);
}

export function entradaRevision(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(campo => !['solicitudId','decision','motivo'].includes(campo))) throw new ErrorProveedor('ENTRADA_INVALIDA', 400, 'Revisa los datos de la revisión.');
  const datos = value as Record<string, unknown>;
  if (typeof datos.solicitudId !== 'string' || (datos.decision !== 'aprobada' && datos.decision !== 'rechazada') || typeof datos.motivo !== 'string' || Array.from(datos.motivo.trim()).length < 10 || Array.from(datos.motivo.trim()).length > 500) throw new ErrorProveedor('ENTRADA_INVALIDA', 400, 'Indica solicitud, decisión y motivo de 10–500 caracteres.');
  return { solicitudId: datos.solicitudId, decision: datos.decision, motivo: datos.motivo.trim() };
}
