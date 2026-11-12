export interface ResenaPublica { id: string; titulo: string; puntuacion: number; texto: string | null; creadaEn: string }
export interface EstadoResena { resena: (ResenaPublica & { oculta: boolean }) | null; puedeResenar: boolean; plazo: string | null }
export interface ResenasProveedor { items: ResenaPublica[]; total: number; promedio: number | null; page: number; limit: number }
export interface ResenaAdministrada extends ResenaPublica {
  reservaId: string; proveedorId: string; oculta: boolean;
  ultimaModeracion: { oculta: boolean; motivo: string; creadaEn: string } | null;
}
export interface PaginaResenasAdmin { items: ResenaAdministrada[]; total: number; page: number; limit: number }

/** Estados de la reserva en los que el cliente ya puede reseñar. */
export const ESTADOS_CERRADOS = ['DEVUELTA', 'SERVICIO_CERRADO'];
export const estrellas = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);
