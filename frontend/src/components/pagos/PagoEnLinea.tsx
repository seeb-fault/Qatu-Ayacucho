'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { apiJson } from '@/lib/api/http';
import { dinero, type SolicitudReserva } from '@/lib/api/reservas';
import styles from '../reservas/reservas.module.css';

const SCRIPT = 'https://js.culqi.com/checkout-js';
interface Checkout { open(): void; close(): void; culqi?: () => void; token?: { id: string }; error?: unknown }
declare global { interface Window { CulqiCheckout?: new (llave: string, config: unknown) => Checkout } }
export interface ConfiguracionPagos { disponible: boolean; llavePublica: string | null }
export type MetodoEnLinea = 'tarjeta' | 'yape';

export function useConfiguracionPagos() {
  const [config, setConfig] = useState<ConfiguracionPagos | null>(null);
  useEffect(() => {
    let vigente = true;
    apiJson<ConfiguracionPagos>('/pagos/configuracion').then(c => { if (vigente) setConfig(c); }).catch(() => { if (vigente) setConfig(null); });
    return () => { vigente = false; };
  }, []);
  return config;
}

function cargarScript(): Promise<void> {
  if (window.CulqiCheckout) return Promise.resolve();
  return new Promise((resolver, rechazar) => {
    const s = document.createElement('script');
    s.src = SCRIPT; s.async = true;
    s.onload = () => resolver();
    s.onerror = () => rechazar(new Error('No se pudo cargar el pago en línea. Inténtalo de nuevo.'));
    document.body.appendChild(s);
  });
}

const motivos: Record<string, string> = {
  AUTENTICACION_3DS_REQUERIDA: 'Tu banco pide una verificación adicional que todavía no está disponible. Prueba con otra tarjeta o paga en efectivo.',
  SIN_CARGO_CONFIRMADO: 'No se confirmó ningún cobro. Puedes intentarlo de nuevo.',
};

/** Reservas que el cliente puede pagar en línea, con su importe; null si no hay nada que pagar. */
export function importePendiente(s: SolicitudReserva): number | null {
  if (s.participacion !== 'cliente' || ['PROCESANDO', 'DESCONOCIDO'].includes(s.ultimoPago?.estado ?? '')) return null;
  if (s.estado === 'ACEPTADA' && s.condiciones) return s.condiciones.importeCentimos;
  const acordada = s.cotizaciones?.find(c => c.respuesta?.decision === 'ACEPTADA');
  if (s.estado === 'SERVICIO_POR_PAGAR' && acordada) return acordada.importeCentimos;
  return null;
}

/** Estado del último intento, visible para ambos participantes. */
export function EstadoPago({ solicitud: s }: { solicitud: SolicitudReserva }) {
  const p = s.ultimoPago;
  if (!p) return null;
  if (p.reembolsoPendiente) return <p className={styles.notice}><strong>Pago pendiente de reembolso.</strong> La reserva ya no admite este pago y no se reactiva. El reembolso se gestiona manualmente.</p>;
  if (p.estado === 'PROCESANDO' || p.estado === 'DESCONOCIDO') return <p className={styles.notice} role="status"><strong>Estamos confirmando el pago.</strong> {s.participacion === 'cliente' ? 'No vuelvas a pagar: revisa tu estado de cuenta antes de cualquier otro intento.' : 'Espera la confirmación antes de entregar o cobrar.'}</p>;
  if (p.estado === 'RECHAZADO' && s.participacion === 'cliente' && ['ACEPTADA','SERVICIO_POR_PAGAR'].includes(s.estado)) return <p className={styles.error}>{(p.codigo && motivos[p.codigo]) ?? 'El pago no se completó y no se hizo ningún cobro. Puedes intentarlo con otra tarjeta.'}</p>;
  return null;
}

/**
 * Abre el checkout de Culqi con un solo método y envía el token de un solo uso al backend.
 * Los datos de la tarjeta o de Yape se ingresan en Culqi: nunca pasan por Qatu.
 */
export function usePagoCulqi(reservaId: string, importe: number, llave: string | null, alTerminar: () => Promise<void> | void) {
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const montado = useRef(true);
  useEffect(() => { montado.current = true; return () => { montado.current = false; }; }, []);

  async function recibir(checkout: Checkout) {
    if (!checkout.token) { setError('El pago no se completó. Puedes intentarlo de nuevo.'); return; }
    const tokenId = checkout.token.id;
    checkout.close();
    setProcesando(true); setError('');
    try {
      await apiJson('/reservas/' + reservaId + '/pagos', 'POST', { tokenId }, { 'Idempotency-Key': crypto.randomUUID() });
      await alTerminar();
    } catch (e) {
      if (montado.current) setError(e instanceof Error ? e.message : 'No se pudo confirmar el pago. Revisa tus reservas antes de repetirlo.');
    } finally { if (montado.current) setProcesando(false); }
  }

  async function pagar(metodo: MetodoEnLinea) {
    if (!llave) return;
    setError(''); setProcesando(true);
    try {
      await cargarScript();
      if (!window.CulqiCheckout) throw new Error('No se pudo cargar el pago en línea. Inténtalo de nuevo.');
      const checkout = new window.CulqiCheckout(llave, {
        settings: { title: 'Qatu', currency: 'PEN', amount: importe },
        options: { lang: 'auto', installments: false, paymentMethods: { tarjeta: metodo === 'tarjeta', yape: metodo === 'yape', billetera: false, bancaMovil: false, agente: false, cuotealo: false } },
      });
      checkout.culqi = () => { void recibir(checkout); };
      checkout.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo abrir el pago en línea.');
    } finally { if (montado.current) setProcesando(false); }
  }

  return { pagar, procesando, error };
}

/** En la tarjeta de la reserva: lleva a la página de pago. */
export default function IrAPagar({ solicitud: s, config }: { solicitud: SolicitudReserva; config: ConfiguracionPagos | null }) {
  const importe = importePendiente(s);
  if (!config?.disponible || !config.llavePublica || importe === null) return null;
  return <div className={styles.notice} aria-label="Pago en línea">
    <p><strong>Modo de prueba:</strong> no se realizan cobros reales. Usa solo tarjetas de prueba.</p>
    <Link className="button primary" href={`/reservas/${s.id}/pago`}>Ir a pagar {dinero(importe)}</Link>
  </div>;
}
