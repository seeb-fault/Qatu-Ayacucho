/** Transacción abierta por otro módulo: permite participar en ella sin conocer el driver. */
export interface Transaccion {
  query(sql: string, params?: unknown[]): Promise<{ rows: any[]; rowCount: number | null }>;
}
