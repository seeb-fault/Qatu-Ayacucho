'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiJson } from '@/lib/api/http';
import { fechaReserva } from '@/lib/api/reservas';
import styles from './resenas.module.css';

interface Garantia { condiciones: string; registradaEn: string; conformidadClienteEn: string | null; version: number }
const DOCUMENTA = ['ACEPTADA', 'APARTADO_PAGADO', 'ENTREGA_POR_CONFIRMAR'];
const CONFIRMA = ['ENTREGA_POR_CONFIRMAR', 'EN_CURSO'];

/** Garantía documental: el proveedor escribe el estado de la herramienta y el cliente da conformidad al recibirla. No es un depósito. */
export default function GarantiaReserva({ reservaId, estado, esCliente }: { reservaId: string; estado: string; esCliente: boolean }) {
  const [garantia, setGarantia] = useState<Garantia | null | undefined>(undefined);
  const [texto, setTexto] = useState('');
  const [editando, setEditando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    apiJson<{ aplica: boolean; garantia: Garantia | null }>(`/reservas/${reservaId}/garantia`)
      .then(r => { if (vigente) setGarantia(r.aplica ? r.garantia : undefined); }).catch(() => { if (vigente) setGarantia(undefined); });
    return () => { vigente = false; };
  }, [reservaId, estado]);

  async function guardar(e: FormEvent) {
    e.preventDefault(); setOcupado(true); setError('');
    try { setGarantia(await apiJson<Garantia>(`/reservas/${reservaId}/garantia`, 'PUT', { condiciones: texto })); setEditando(false); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar.'); } finally { setOcupado(false); }
  }
  async function confirmar() {
    if (!garantia) return;
    setOcupado(true); setError('');
    try { setGarantia(await apiJson<Garantia>(`/reservas/${reservaId}/garantia/conformidad`, 'POST', { version: garantia.version })); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo confirmar.'); } finally { setOcupado(false); }
  }

  if (garantia === undefined) return null;
  const puedeDocumentar = !esCliente && DOCUMENTA.includes(estado) && !garantia?.conformidadClienteEn;
  if (!garantia && !puedeDocumentar) return null;

  return <section className={styles.resena} aria-label="Garantía documental">
    <p className={styles.titulo}>Estado de la herramienta al entregar</p>
    <p className={styles.nota}>Acuerdo escrito entre ambos. No es un depósito: Qatu no retiene dinero.</p>
    {garantia && !editando && <>
      <p className={styles.texto}>{garantia.condiciones}</p>
      <p className={styles.meta}>{garantia.conformidadClienteEn ? `Conformidad del cliente: ${fechaReserva(garantia.conformidadClienteEn)}` : 'Pendiente de conformidad del cliente.'}</p>
    </>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {esCliente && garantia && !garantia.conformidadClienteEn && CONFIRMA.includes(estado) &&
      <div className={styles.acciones}><button className="button primary" disabled={ocupado} onClick={() => void confirmar()}>Recibí la herramienta en este estado</button></div>}
    {puedeDocumentar && (editando || !garantia
      ? <form className={styles.campo} onSubmit={guardar} aria-label="Registrar estado de la herramienta">
          <label>Estado y accesorios que entregas
            <textarea value={texto} onChange={e => setTexto(e.target.value)} minLength={20} maxLength={1000} rows={3} required placeholder="Ejemplo: funciona bien, sin golpes; incluye maletín, dos brocas y cargador."/>
          </label>
          <div className={styles.acciones}><button className="button outline" disabled={ocupado}>Guardar estado</button></div>
        </form>
      : <div className={styles.acciones}><button className="button outline" onClick={() => { setTexto(garantia.condiciones); setEditando(true); }}>Corregir texto</button></div>)}
  </section>;
}
