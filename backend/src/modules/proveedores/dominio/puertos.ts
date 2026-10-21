import type { DatosPerfil, Proveedor, ZonaProveedor } from './proveedor';
import type { DocumentoCifrado, DocumentoPrivado, Verificacion } from './verificacion';

export interface IdentidadActores {
  resolver(token: string): Promise<{ id: string; roles: string[] }>;
  cuentaActiva(usuarioId: string): Promise<boolean>;
}

export interface RepositorioProveedores {
  zonas(): Promise<ZonaProveedor[]>;
  crear(usuarioId: string, datos: DatosPerfil): Promise<Proveedor>;
  porUsuario(usuarioId: string): Promise<Proveedor | null>;
  porId(id: string): Promise<Proveedor | null>;
  editar(usuarioId: string, versionActual: number, datos: DatosPerfil): Promise<Proveedor>;
  solicitar(proveedorId: string, versionActual: number, documentos: DocumentoCifrado[]): Promise<Verificacion>;
  historial(proveedorId: string): Promise<Verificacion[]>;
  documento(id: string): Promise<DocumentoPrivado | null>;
  pendientes(pagina: number, estado?: Verificacion['estado']): Promise<{ solicitudes: (Verificacion & { proveedor: Proveedor })[]; pagina: number; paginas: number; total: number }>;
  resolverVerificacion(proveedorId: string, solicitudId: string, revisorId: string, decision: 'aprobada' | 'rechazada', motivo: string): Promise<Verificacion>;
  conDocumentos(): Promise<{ id: string; usuarioId: string }[]>;
  purgarDocumentos(proveedorId: string): Promise<number>;
}

export interface CifradoDocumentos {
  habilitado(): boolean;
  cifrar(archivo: { buffer: Uint8Array; mimetype: string; size: number }): DocumentoCifrado;
  descifrar(documento: DocumentoCifrado): Uint8Array;
}
