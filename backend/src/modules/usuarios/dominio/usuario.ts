import { ErrorAplicacion } from '../../../shared/dominio/error-aplicacion';

export type Rol = 'cliente' | 'proveedor' | 'admin';
export type EstadoUsuario = 'activo' | 'inactivo';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  estado: EstadoUsuario;
  roles: Rol[];
}

export interface Credenciales {
  usuario: Usuario;
  passwordHash: string;
}

export interface FiltrosUsuarios {
  pagina: number;
  q: string;
  estado?: EstadoUsuario;
}

export interface PaginaUsuarios {
  usuarios: Usuario[];
  pagina: number;
  total: number;
  paginas: number;
}

export interface EventoUsuario {
  id: string;
  actorId: string | null;
  usuarioId: string;
  accion: 'crear_admin' | 'cambiar_estado';
  estadoAnterior: EstadoUsuario | null;
  estadoNuevo: EstadoUsuario;
  motivo: string;
  creadoEn: string;
}

export interface PaginaAuditoria {
  eventos: EventoUsuario[];
  pagina: number;
  total: number;
  paginas: number;
}

export function estadoValido(value: unknown): EstadoUsuario {
  if (value !== 'activo' && value !== 'inactivo') throw new ErrorUsuario('ENTRADA_INVALIDA', 400, 'Estado inválido.');
  return value;
}

export function motivoValido(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length < 10 || value.trim().length > 500) {
    throw new ErrorUsuario('ENTRADA_INVALIDA', 400, 'El motivo debe tener entre 10 y 500 caracteres.');
  }
  return value.trim();
}

export function idValido(value: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new ErrorUsuario('ENTRADA_INVALIDA', 400, 'Identificador inválido.');
  return value;
}

export function paginaValida(value: unknown): number {
  if (value === undefined) return 1;
  if (typeof value !== 'string' || !/^[1-9]\d{0,4}$/.test(value)) throw new ErrorUsuario('ENTRADA_INVALIDA', 400, 'Página inválida.');
  return Number(value);
}

export class ErrorUsuario extends ErrorAplicacion {}

export function entrada(value: unknown, campos: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(campo => !campos.includes(campo))) {
    throw new ErrorUsuario('ENTRADA_INVALIDA', 400, 'Revisa los campos enviados.');
  }
  return value as Record<string, unknown>;
}

/** WhatsApp de Perú: acepta 9 dígitos que empiezan con 9, con o sin +51 y espacios; se guarda como +519XXXXXXXX. */
export function whatsappValido(value: unknown): string | null {
  if (value === null || value === '') return null;
  const limpio = typeof value === 'string' ? value.replace(/[\s-]/g, '') : '';
  const numero = /^(?:\+?51)?(9\d{8})$/.exec(limpio)?.[1];
  if (!numero) throw new ErrorUsuario('ENTRADA_INVALIDA', 400, 'Escribe un celular de Perú de 9 dígitos que empiece con 9.');
  return '+51' + numero;
}

export interface ContactoUsuario { whatsapp: string | null; whatsappVisible: boolean }

export function nombreValido(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length < 2 || value.trim().length > 100) {
    throw new ErrorUsuario('ENTRADA_INVALIDA', 400, 'El nombre debe tener entre 2 y 100 caracteres.');
  }
  return value.trim();
}

export function emailValido(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length > 254 || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value.trim())) {
    throw new ErrorUsuario('ENTRADA_INVALIDA', 400, 'Ingresa un correo válido.');
  }
  return value.trim().toLowerCase();
}

export function passwordValido(value: unknown): string {
  if (typeof value !== 'string' || value.length < 12 || value.length > 128) {
    throw new ErrorUsuario('ENTRADA_INVALIDA', 400, 'La contraseña debe tener entre 12 y 128 caracteres.');
  }
  return value;
}
