'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { apiJson, ErrorApi } from '@/lib/api/http';
import { fechaHora, fechaLarga, type Constancia } from '@/lib/api/legal';
import catalogo from '@/components/catalogo/catalogo.module.css';
import styles from './legal.module.css';

type Hoja = Constancia & { id: string; vencida: boolean };

function Atencion({ hoja, onCambio }: { hoja: Hoja; onCambio: () => void }) {
  const [respuesta, setRespuesta] = useState(''), [medio, setMedio] = useState(hoja.medioRespuesta), [error, setError] = useState(''), [ocupado, setOcupado] = useState(false);
  const c = hoja.consumidor;
  async function responder(e: FormEvent) {
    e.preventDefault(); setOcupado(true); setError('');
    try { await apiJson(`/admin/reclamaciones/${hoja.id}/respuesta`, 'PATCH', { respuesta, medio }); onCambio(); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo registrar la respuesta.'); } finally { setOcupado(false); }
  }
  return <article className={catalogo.item} aria-label={`Hoja ${hoja.numero}`}>
    <h3>{hoja.numero} · {hoja.tipo === 'reclamo' ? 'Reclamo' : 'Queja'}</h3>
    <p>Presentada el {fechaHora(hoja.presentadaEn)} · {hoja.respuesta ? <>Respondida el {fechaHora(hoja.respuesta.respondidaEn)}</> : <strong>{hoja.vencida ? 'Plazo vencido el ' : 'Vence el '}{fechaLarga(hoja.venceEn)}</strong>}</p>
    <dl className={styles.datos}>
      <dt>Consumidor</dt><dd>{c.nombre} · {c.tipoDocumento} {c.numeroDocumento}{c.menorDeEdad ? ` · Menor de edad; apoderado: ${c.apoderadoNombre} (DNI ${c.apoderadoDocumento})` : ''}</dd>
      <dt>Responder por</dt><dd>{hoja.medioRespuesta === 'correo' ? `Correo: ${c.email}` : `Carta: ${c.domicilio}`}{c.telefono ? ` · Celular ${c.telefono}` : ''}</dd>
      <dt>{hoja.bien.tipo === 'producto' ? 'Producto' : 'Servicio'}</dt><dd>{hoja.bien.descripcion}{hoja.bien.montoCentimos !== null ? ` · S/ ${(hoja.bien.montoCentimos / 100).toFixed(2)}` : ''}</dd>
      <dt>Detalle</dt><dd>{hoja.detalle}</dd>
      <dt>Pedido</dt><dd>{hoja.pedido}</dd>
      {hoja.respuesta && <><dt>Respuesta ({hoja.respuesta.medio})</dt><dd>{hoja.respuesta.texto}</dd></>}
    </dl>
    {!hoja.respuesta && <form onSubmit={responder}>
      <p className={catalogo.hint}>Envía primero la respuesta al consumidor por el medio que eligió y luego regístrala aquí. Una vez registrada no se puede cambiar.</p>
      <label>Respuesta enviada<textarea value={respuesta} onChange={e => setRespuesta(e.target.value)} required minLength={20} maxLength={4000} rows={4}/></label>
      <label>Medio de envío<select value={medio} onChange={e => setMedio(e.target.value as 'correo' | 'carta')}><option value="correo">Correo electrónico</option><option value="carta">Carta</option></select></label>
      {error && <p role="alert" className={catalogo.error}>{error}</p>}
      <button type="submit" className="button primary" disabled={ocupado}>Registrar respuesta</button>
    </form>}
  </article>;
}

export default function AtencionReclamaciones() {
  const [estado, setEstado] = useState<'pendiente' | 'respondida'>('pendiente');
  const [datos, setDatos] = useState<{ items: Hoja[]; total: number } | null>(null);
  const [cargando, setCargando] = useState(true), [error, setError] = useState(''), [sinSesion, setSinSesion] = useState(false);
  async function cargar(e = estado) {
    setCargando(true); setError('');
    try { setDatos(await apiJson(`/admin/reclamaciones?estado=${e}`)); setSinSesion(false); }
    catch (err) { setDatos(null); setError(err instanceof Error ? err.message : 'No se pudieron cargar.'); setSinSesion(err instanceof ErrorApi && err.status === 401); }
    finally { setCargando(false); }
  }
  useEffect(() => { void cargar(estado); }, [estado]);
  return <section className={catalogo.panel} aria-labelledby="titulo-reclamaciones">
    <h1 id="titulo-reclamaciones">Libro de Reclamaciones</h1>
    <p>Atiende cada hoja dentro de los 15 días hábiles. Las pendientes aparecen ordenadas por vencimiento. Las hojas no se editan ni se borran.</p>
    <div className={catalogo.toolbar} aria-label="Filtro de hojas">
      <button type="button" className="button outline" aria-pressed={estado === 'pendiente'} onClick={() => setEstado('pendiente')}>Pendientes</button>
      <button type="button" className="button outline" aria-pressed={estado === 'respondida'} onClick={() => setEstado('respondida')}>Respondidas</button>
    </div>
    {cargando && <p role="status">Cargando hojas…</p>}
    {error && <p role="alert" className={catalogo.error}>{error}{sinSesion && <> <Link href="/ingresar?siguiente=/admin/reclamaciones">Iniciar sesión</Link></>}</p>}
    {datos && (datos.items.length === 0
      ? <p>{estado === 'pendiente' ? 'No hay hojas pendientes.' : 'Aún no hay hojas respondidas.'}</p>
      : <div className={catalogo.list}>{datos.items.map(h => <Atencion key={h.id} hoja={h} onCambio={() => cargar()}/>)}</div>)}
  </section>;
}
