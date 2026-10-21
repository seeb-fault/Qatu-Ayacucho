export interface ZonaProveedor { id: string; nombre: string; }

export interface ProveedorPublico {
  id: string;
  nombrePublico: string;
  descripcion: string;
  zona: ZonaProveedor;
  estadoVerificacion: 'no_solicitada' | 'pendiente' | 'aprobada' | 'rechazada';
}

export const estadosVerificacion = { no_solicitada: 'Sin verificación solicitada', pendiente: 'En revisión documental', aprobada: 'Verificación documental aprobada', rechazada: 'Verificación rechazada' };

export interface VerificacionProveedor {
  id: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';
  motivo: string | null;
  revisorId: string | null;
  creadoEn: string;
  revisadoEn: string | null;
  perfilEnviado: { nombrePublico: string; descripcion: string; zonaId: string };
  documentos: { id: string; tipo: string; bytes: number; disponible: boolean }[];
}

export interface Proveedor extends ProveedorPublico {
  usuarioId: string;
  zonaId: string;
  visiblePublicamente: boolean;
  version: number;
  creadoEn: string;
  actualizadoEn: string;
}
