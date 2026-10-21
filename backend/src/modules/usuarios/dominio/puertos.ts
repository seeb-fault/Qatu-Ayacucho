import type { Credenciales, EstadoUsuario, FiltrosUsuarios, PaginaAuditoria, PaginaUsuarios, Usuario } from './usuario';

export interface RepositorioUsuarios {
  crear(email: string, nombre: string, passwordHash: string): Promise<Usuario>;
  credenciales(email: string): Promise<Credenciales | null>;
  porId(id: string): Promise<Usuario | null>;
  cambiarNombre(id: string, nombre: string): Promise<Usuario | null>;
  crearSesion(id: string, usuarioId: string, expira: Date): Promise<void>;
  sesionActiva(id: string, usuarioId: string): Promise<boolean>;
  revocarSesion(id: string): Promise<void>;
  limitar(clave: string, maximo: number): Promise<void>;
  crearAdministrador(email: string, nombre: string, passwordHash: string, motivo: string): Promise<Usuario>;
  listar(filtros: FiltrosUsuarios): Promise<PaginaUsuarios>;
  auditoria(usuarioId: string, pagina: number): Promise<PaginaAuditoria>;
  cambiarEstado(actorId: string, usuarioId: string, estadoActual: EstadoUsuario, estado: EstadoUsuario, motivo: string): Promise<Usuario>;
}

export interface HashPasswords {
  crear(password: string): Promise<string>;
  verificar(password: string, hash: string): Promise<boolean>;
}

export interface TokensSesion {
  emitir(usuarioId: string, sesionId: string): Promise<string>;
  leer(token: string): Promise<{ sub: string; sid: string }>;
}
