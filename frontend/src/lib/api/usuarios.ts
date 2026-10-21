export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  estado: 'activo' | 'inactivo';
  roles: string[];
}

export { ErrorApi as ErrorAcceso, apiJson as usuariosApi } from './http';
