export interface Aviso {
  id: string; reservaId: string; tipo: string; mensaje: string; titulo: string;
  vista: 'cliente' | 'proveedor'; creadoEn: string; leidoEn: string | null;
}
export interface PaginaAvisos { items: Aviso[]; total: number; noLeidos: number; page: number; limit: number }
/** Avisa a la campana de la cabecera que el contador cambió. */
export const EVENTO_AVISOS = 'qatu:avisos';
