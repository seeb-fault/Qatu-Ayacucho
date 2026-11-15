export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  estado: 'activo' | 'inactivo';
  roles: string[];
  /** Solo en el perfil propio (010). */
  whatsapp?: string | null;
  whatsappVisible?: boolean;
}

export { ErrorApi as ErrorAcceso, apiJson as usuariosApi } from './http';
