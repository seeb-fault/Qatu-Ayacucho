'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icono from '@/components/descubrimiento/Icono';
import { apiJson, ErrorApi } from '@/lib/api/http';
import { dinero, fechaReserva } from '@/lib/api/reservas';
import { avisarCambioLista, type ItemLista, type ResultadoEnvio } from '@/lib/api/lista';
import { ingresarYVolver } from '@/lib/rutas';
import styles from './lista.module.css';

const DIA = 86_400_000;
/** Igual que el alquiler diario: cada bloque de 24 horas iniciado cuenta como un día. */
const dias = (i: ItemLista) => Math.max(1, Math.ceil((Date.parse(i.fin) - Date.parse(i.inicio)) / DIA));
const estimado = (i: ItemLista) => i.tipo === 'herramienta' && i.tarifaActualCentimos !== null ? dias(i) * i.tarifaActualCentimos : null;
const otraFecha = (i: ItemLista) => `/reservas/nueva?publicacion=${i.publicacionId}&lista=1`;

const estados: Record<ItemLista['estado'], { texto: string; clase: string }> = {
  listo: { texto: 'Listo para enviar', clase: 'listo' },
  tarifa_cambiada: { texto: 'La tarifa cambió', clase: 'aviso' },
  fechas_vencidas: { texto: 'Las fechas ya pasaron', clase: 'error' },
  no_disponible: { texto: 'Ocupada en esas fechas', clase: 'error' },
  inactiva: { texto: 'Ya no está disponible', clase: 'error' },
};

type Envio = { resultados: ResultadoEnvio[]; titulos: Map<string, string> };

export default function MiLista() {
  const router = useRouter();
  const [items, setItems] = useState<ItemLista[] | null>(null);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState('');
  const [envio, setEnvio] = useState<Envio | null>(null);

  const cargar = useCallback(async () => {
    try { setItems((await apiJson<{ items: ItemLista[] }>('/lista')).items); setError(''); }
    catch (e) {
      if (e instanceof ErrorApi && e.status === 401) { router.replace(ingresarYVolver('/lista')); return; }
      setError(e instanceof Error ? e.message : 'No pudimos cargar tu lista.');
    }
  }, [router]);
  useEffect(() => { void cargar(); }, [cargar]);

  async function operar(id: string, accion: () => Promise<unknown>) {
    setOcupado(id); setError('');
    try { await accion(); await cargar(); avisarCambioLista(); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo completar la acción.'); }
    finally { setOcupado(''); }
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!items) return;
    const listos = items.filter(i => i.estado === 'listo');
    const titulos = new Map(items.map(i => [i.id, i.titulo]));
    setOcupado('envio'); setError('');
    try {
      const r = await apiJson<{ resultados: ResultadoEnvio[] }>('/lista/envio', 'POST',
        { ids: listos.map(i => i.id), aceptaCondiciones: listos.some(i => i.tipo === 'herramienta') }, { 'Idempotency-Key': crypto.randomUUID() });
      setEnvio({ resultados: r.resultados, titulos });
      await cargar(); avisarCambioLista();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { setError(e instanceof Error ? e.message : 'No pudimos enviar tu lista. Revisa tus solicitudes antes de repetirlo.'); }
    finally { setOcupado(''); }
  }

  if (!items && !error) return <div className={styles.pagina}><p className={styles.cargando} role="status">Cargando tu lista…</p></div>;

  const lista = items ?? [];
  const listos = lista.filter(i => i.estado === 'listo');
  const herramientas = listos.filter(i => i.tipo === 'herramienta');
  const total = herramientas.reduce((s, i) => s + (estimado(i) ?? 0), 0);
  const grupos = [...lista.reduce((m, i) => m.set(i.proveedor || 'Proveedor no disponible', [...(m.get(i.proveedor || 'Proveedor no disponible') ?? []), i]), new Map<string, ItemLista[]>())];
  const enviados = envio?.resultados.filter(r => r.estado === 'enviado') ?? [];
  const rechazados = envio?.resultados.filter(r => r.estado === 'rechazado') ?? [];

  return <div className={styles.pagina}>
    <header className={styles.cabecera}>
      <div><span className={styles.pill}>Mi lista</span><h1>Tu lista</h1><p>Guarda lo que necesitas y envía todas las solicitudes en un solo paso. Nada se aparta ni se cobra hasta que el proveedor acepte.</p></div>
      <Link className="button outline" href="/buscar">Seguir explorando</Link>
    </header>

    {error && <p role="alert" className={styles.error}>{error}</p>}
    {envio && <section className={styles.resultado} aria-labelledby="resultado-titulo" role="status">
      <h2 id="resultado-titulo">{enviados.length ? `Enviaste ${enviados.length} ${enviados.length === 1 ? 'solicitud' : 'solicitudes'}` : 'No se envió ninguna solicitud'}</h2>
      {enviados.length > 0 && <ul>{enviados.map(r => <li key={r.itemId}><Icono nombre="check" size={16}/>{envio.titulos.get(r.itemId)}</li>)}</ul>}
      {rechazados.length > 0 && <><p>Quedaron en tu lista:</p><ul className={styles.rechazos}>{rechazados.map(r => <li key={r.itemId}><Icono nombre="info" size={16}/><span><strong>{envio.titulos.get(r.itemId)}</strong> {r.motivo}</span></li>)}</ul></>}
      {enviados.length > 0 && <Link className="button primary" href="/reservas">Ver mis solicitudes</Link>}
    </section>}

    {lista.length === 0 ? <div className={styles.vacia}>
      <span aria-hidden="true"><Icono nombre="lista" size={34}/></span>
      <h2>Tu lista está vacía</h2>
      <p>En cada publicación toca «Agregar a mi lista», elige tus fechas y vuelve aquí para enviar todo junto.</p>
      <Link className="button primary" href="/buscar">Explorar herramientas y oficios</Link>
    </div> : <div className={styles.columnas}>
      <div className={styles.grupos}>
        {grupos.map(([proveedor, del]) => <section key={proveedor} className={styles.grupo} aria-label={'Proveedor ' + proveedor}>
          <h2><span aria-hidden="true">{proveedor.split(/\s+/).slice(0, 2).map(p => p[0]).join('')}</span>{proveedor}</h2>
          <ul>{del.map(i => {
            const e = estados[i.estado], monto = estimado(i);
            return <li key={i.id}>
              <article className={styles.item} aria-label={i.titulo}>
                <div className={styles.itemCabecera}>
                  <span className={styles.tipo + (i.tipo === 'servicio' ? ' ' + styles.servicio : '')}><Icono nombre={i.tipo === 'herramienta' ? 'drill' : 'hammer'} size={14}/>{i.tipo === 'herramienta' ? 'Alquiler' : 'Oficio'}</span>
                  <span className={styles.estado + ' ' + styles[e.clase]}>{e.texto}</span>
                </div>
                <h3><Link href={'/publicaciones/' + i.publicacionId}>{i.titulo}</Link></h3>
                <p className={styles.fechas}><Icono nombre="calendar" size={15}/>{fechaReserva(i.inicio)} → {fechaReserva(i.fin)}{i.recurso && <span> · {i.recurso}</span>}</p>
                {i.descripcion && <p className={styles.descripcion}>{i.descripcion}</p>}
                {i.estado === 'tarifa_cambiada' && i.tarifaVistaCentimos !== null && i.tarifaActualCentimos !== null && <p className={styles.nota}>Guardaste {dinero(i.tarifaVistaCentimos)} por día; ahora es {dinero(i.tarifaActualCentimos)}.</p>}
                <div className={styles.itemPie}>
                  <strong>{monto !== null ? <>{dinero(monto)} <small>· {dias(i)} {dias(i) === 1 ? 'día' : 'días'}</small></> : i.tipo === 'servicio' ? 'A cotizar' : '—'}</strong>
                  <div className={styles.acciones}>
                    {i.estado === 'tarifa_cambiada' && <button type="button" className="button small primary" disabled={!!ocupado} onClick={() => void operar(i.id, () => apiJson('/lista/items/' + i.id + '/tarifa', 'POST', {}))}>Aceptar nueva tarifa</button>}
                    {(i.estado === 'fechas_vencidas' || i.estado === 'no_disponible') && <Link className="button small outline" href={otraFecha(i)}>Elegir otras fechas</Link>}
                    <button type="button" className={styles.quitar} disabled={!!ocupado} aria-label={'Quitar ' + i.titulo} onClick={() => void operar(i.id, () => apiJson('/lista/items/' + i.id, 'DELETE', {}))}>{ocupado === i.id ? 'Quitando…' : 'Quitar'}</button>
                  </div>
                </div>
              </article>
            </li>;
          })}</ul>
        </section>)}
      </div>

      <aside className={styles.resumen} aria-labelledby="resumen-lista">
        <h2 id="resumen-lista">Resumen</h2>
        <dl>
          <div><dt>Ítems en tu lista</dt><dd>{lista.length}</dd></div>
          <div><dt>Listos para enviar</dt><dd>{listos.length}</dd></div>
          {herramientas.length > 0 && <div><dt>Alquileres estimados</dt><dd>{dinero(total)}</dd></div>}
        </dl>
        <form onSubmit={enviar}>
          {herramientas.length > 0 && <label className={styles.acepto}><input type="checkbox" required/>Acepto el horario, el importe y las condiciones de alquiler de cada herramienta.</label>}
          <button type="submit" className={'button primary ' + styles.enviar} disabled={!listos.length || !!ocupado}>{ocupado === 'envio' ? 'Enviando…' : listos.length ? `Enviar ${listos.length} ${listos.length === 1 ? 'solicitud' : 'solicitudes'}` : 'Nada listo para enviar'}<Icono nombre="send" size={17}/></button>
        </form>
        <ul className={styles.garantias}><li><Icono nombre="check" size={15}/>No se cobra nada al enviar</li><li><Icono nombre="check" size={15}/>Cada proveedor responde por separado</li><li><Icono nombre="check" size={15}/>Lo que falle se queda en tu lista</li></ul>
      </aside>
    </div>}
  </div>;
}
