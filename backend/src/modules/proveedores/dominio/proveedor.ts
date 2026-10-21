import { ErrorAplicacion } from '../../../shared/dominio/error-aplicacion';

export class ErrorProveedor extends ErrorAplicacion {}
export type EstadoVerificacion = 'no_solicitada' | 'pendiente' | 'aprobada' | 'rechazada';

export interface ZonaProveedor {
  id: string;
  nombre: string;
}

export interface DatosPerfil {
  nombrePublico: string;
  descripcion: string;
  zonaId: string;
  visiblePublicamente: boolean;
}

export interface Proveedor extends DatosPerfil {
  id: string;
  usuarioId: string;
  zona: ZonaProveedor;
  estadoVerificacion: EstadoVerificacion;
  version: number;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ProveedorPublico {
  id: string;
  nombrePublico: string;
  descripcion: string;
  zona: ZonaProveedor;
  estadoVerificacion: EstadoVerificacion;
}

export function entradaPerfil(value: unknown, editar: boolean): { datos: DatosPerfil; versionActual?: number } {
  const campos = ['nombrePublico', 'descripcion', 'zonaId', 'visiblePublicamente', ...(editar ? ['versionActual'] : [])];
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(campo => !campos.includes(campo))) {
    throw new ErrorProveedor('ENTRADA_INVALIDA', 400, 'Revisa los campos del perfil.');
  }
  const datos = value as Record<string, unknown>;
  if (typeof datos.nombrePublico !== 'string' || Array.from(datos.nombrePublico.trim()).length < 2 || Array.from(datos.nombrePublico.trim()).length > 100) {
    throw new ErrorProveedor('ENTRADA_INVALIDA', 400, 'El nombre público debe tener entre 2 y 100 caracteres.');
  }
  if (typeof datos.descripcion !== 'string' || Array.from(datos.descripcion.trim()).length < 20 || Array.from(datos.descripcion.trim()).length > 1500) {
    throw new ErrorProveedor('ENTRADA_INVALIDA', 400, 'La descripción debe tener entre 20 y 1500 caracteres.');
  }
  if (typeof datos.zonaId !== 'string' || !/^[a-z-]{2,50}$/.test(datos.zonaId)) {
    throw new ErrorProveedor('ZONA_INVALIDA', 400, 'Selecciona un distrito disponible.');
  }
  if (typeof datos.visiblePublicamente !== 'boolean') throw new ErrorProveedor('ENTRADA_INVALIDA', 400, 'Indica si deseas mostrar tu perfil públicamente.');
  if (editar && (typeof datos.versionActual !== 'number' || !Number.isSafeInteger(datos.versionActual) || datos.versionActual < 1 || datos.versionActual > 2147483646)) {
    throw new ErrorProveedor('ENTRADA_INVALIDA', 400, 'Actualiza el perfil antes de editarlo.');
  }
  return {
    datos: { nombrePublico: datos.nombrePublico.trim(), descripcion: datos.descripcion.trim(), zonaId: datos.zonaId, visiblePublicamente: datos.visiblePublicamente },
    versionActual: editar ? datos.versionActual as number : undefined,
  };
}

export function proveedorIdValido(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new ErrorProveedor('ENTRADA_INVALIDA', 400, 'Identificador inválido.');
  return id;
}
