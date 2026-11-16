'use client';

import { useRef, useState, type FormEvent } from 'react';
import { apiJson, ErrorApi } from '@/lib/api/http';
import { fechaHora, fechaLarga, type Constancia } from '@/lib/api/legal';
import catalogo from '@/components/catalogo/catalogo.module.css';
import styles from './legal.module.css';

const DOCUMENTOS = [['DNI', 'DNI'], ['CE', 'Carné de extranjería'], ['PASAPORTE', 'Pasaporte'], ['RUC', 'RUC']] as const;
const soles = (c: number) => 'S/ ' + (c / 100).toFixed(2);

function aCentimos(texto: string): number | null | undefined {
  const t = texto.trim().replace(',', '.');
  if (!t) return null;
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(t)) return undefined;
  return Math.round(Number(t) * 100);
}

/** Hoja presentada: es la constancia que el consumidor guarda o imprime. */
export function HojaPresentada({ h, nueva = false }: { h: Constancia; nueva?: boolean }) {
  const titular = h.titular, c = h.consumidor;
  return <section className={styles.constancia} aria-labelledby="titulo-constancia" tabIndex={-1} id="constancia">
    <h2 id="titulo-constancia">{nueva ? 'Recibimos tu hoja de reclamación' : 'Hoja de reclamación'}</h2>
    <p className={styles.numero}>{h.numero}</p>
    {nueva && h.codigoConsulta && <p>Código de consulta: <span className={styles.codigo}>{h.codigoConsulta}</span>. Guárdalo: con el número y este código puedes ver el estado y la respuesta. No lo volveremos a mostrar.</p>}
    <p>Presentada el {fechaHora(h.presentadaEn)}. {h.respuesta
      ? <>Respondida el {fechaHora(h.respuesta.respondidaEn)} por {h.respuesta.medio === 'correo' ? 'correo electrónico' : 'carta'}.</>
      : <>Te responderemos por {h.medioRespuesta === 'correo' ? 'correo electrónico' : 'carta a tu domicilio'} a más tardar el <strong>{fechaLarga(h.venceEn)}</strong> (15 días hábiles).</>}</p>
    <dl className={styles.datos}>
      <dt>Proveedor</dt><dd>{[titular.razonSocial ?? 'Qatu', titular.ruc && 'RUC ' + titular.ruc, titular.direccion].filter(Boolean).join(' · ')}</dd>
      <dt>Tipo</dt><dd>{h.tipo === 'reclamo' ? 'Reclamo' : 'Queja'}</dd>
      <dt>Consumidor</dt><dd>{c.nombre} · {c.tipoDocumento} {c.numeroDocumento}</dd>
      {c.menorDeEdad && <><dt>Padre, madre o apoderado</dt><dd>{c.apoderadoNombre} · DNI {c.apoderadoDocumento}</dd></>}
      <dt>Domicilio</dt><dd>{c.domicilio}</dd>
      <dt>Contacto</dt><dd>{[c.email, c.telefono].filter(Boolean).join(' · ')}</dd>
      <dt>{h.bien.tipo === 'producto' ? 'Producto' : 'Servicio'}</dt><dd>{h.bien.descripcion}</dd>
      <dt>Monto reclamado</dt><dd>{h.bien.montoCentimos === null ? 'No indicado' : soles(h.bien.montoCentimos)}</dd>
      <dt>Detalle</dt><dd>{h.detalle}</dd>
      <dt>Pedido</dt><dd>{h.pedido}</dd>
      {h.respuesta && <><dt>Respuesta de Qatu</dt><dd>{h.respuesta.texto}</dd></>}
    </dl>
    <div className={`${styles.botones} ${styles.noImprimir}`}><button type="button" className="button primary" onClick={() => window.print()}>Imprimir o guardar en PDF</button></div>
  </section>;
}

export default function LibroReclamaciones() {
  const [tipo, setTipo] = useState<'reclamo' | 'queja'>('reclamo');
  const [menor, setMenor] = useState(false);
  const [error, setError] = useState(''), [ocupado, setOcupado] = useState(false);
  const [constancia, setConstancia] = useState<Constancia | null>(null);
  const formulario = useRef<HTMLFormElement>(null);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError('');
    const f = new FormData(e.currentTarget), v = (k: string) => String(f.get(k) ?? '').trim();
    const montoCentimos = aCentimos(v('monto'));
    if (montoCentimos === undefined) { setError('Escribe el monto en soles, por ejemplo 35.50, o déjalo vacío.'); return; }
    setOcupado(true);
    try {
      const h = await apiJson<Constancia>('/reclamaciones', 'POST', {
        tipo, nombre: v('nombre'), tipoDocumento: v('tipoDocumento'), numeroDocumento: v('numeroDocumento'), domicilio: v('domicilio'),
        telefono: v('telefono') || null, email: v('email'), medioRespuesta: v('medioRespuesta'),
        menorDeEdad: menor, ...(menor ? { apoderadoNombre: v('apoderadoNombre'), apoderadoDocumento: v('apoderadoDocumento') } : {}),
        bienTipo: v('bienTipo'), bienDescripcion: v('bienDescripcion'), montoCentimos, detalle: v('detalle'), pedido: v('pedido'),
      });
      setConstancia(h);
      requestAnimationFrame(() => document.getElementById('constancia')?.focus());
    } catch (err) {
      setError(err instanceof ErrorApi && err.status === 429 ? 'Ya registraste varias hojas en pocos minutos. Espera 15 minutos e inténtalo de nuevo.' : err instanceof Error ? err.message : 'No pudimos registrar tu hoja. Intenta nuevamente.');
    } finally { setOcupado(false); }
  }

  if (constancia) return <>
    <HojaPresentada h={constancia} nueva/>
    <p className={styles.noImprimir}><button type="button" className="button outline" onClick={() => { setConstancia(null); setMenor(false); }}>Presentar otra hoja</button></p>
  </>;

  return <form ref={formulario} method="post" onSubmit={enviar} className={catalogo.fields} aria-label="Hoja de reclamación">
    <fieldset className={styles.seccion}>
      <legend>1. Tipo</legend>
      <div className={styles.opciones} role="radiogroup" aria-label="Tipo de hoja">
        <label><input type="radio" name="tipo" value="reclamo" checked={tipo === 'reclamo'} onChange={() => setTipo('reclamo')}/>Reclamo</label>
        <label><input type="radio" name="tipo" value="queja" checked={tipo === 'queja'} onChange={() => setTipo('queja')}/>Queja</label>
      </div>
      <p className={styles.definicion}><strong>Reclamo:</strong> disconformidad con el producto o servicio contratado. <strong>Queja:</strong> disconformidad que no se relaciona con el producto o servicio, o malestar por la atención recibida.</p>
    </fieldset>

    <fieldset className={styles.seccion}>
      <legend>2. Tus datos</legend>
      <label>Nombre completo<input name="nombre" required minLength={3} maxLength={150} autoComplete="name"/></label>
      <div className={catalogo.columns}>
        <label>Tipo de documento<select name="tipoDocumento" defaultValue="DNI" required>{DOCUMENTOS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
        <label>Número de documento<input name="numeroDocumento" required minLength={6} maxLength={14} autoComplete="off"/></label>
      </div>
      <label>Domicilio<input name="domicilio" required minLength={5} maxLength={200} autoComplete="street-address"/></label>
      <div className={catalogo.columns}>
        <label>Correo electrónico<input name="email" type="email" required maxLength={254} autoComplete="email"/></label>
        <label>Celular (opcional)<input name="telefono" type="tel" inputMode="numeric" maxLength={15} autoComplete="tel" placeholder="9XXXXXXXX"/></label>
      </div>
      <label className={catalogo.check}><input type="checkbox" checked={menor} onChange={e => setMenor(e.target.checked)}/>Soy menor de edad</label>
      {menor && <div className={catalogo.columns}>
        <label>Nombre del padre, madre o apoderado<input name="apoderadoNombre" required minLength={3} maxLength={150}/></label>
        <label>DNI del padre, madre o apoderado<input name="apoderadoDocumento" required inputMode="numeric" pattern="\d{8}" maxLength={8}/></label>
      </div>}
    </fieldset>

    <fieldset className={styles.seccion}>
      <legend>3. Producto o servicio</legend>
      <div className={styles.opciones} role="radiogroup" aria-label="Producto o servicio">
        <label><input type="radio" name="bienTipo" value="servicio" defaultChecked/>Servicio</label>
        <label><input type="radio" name="bienTipo" value="producto"/>Producto</label>
      </div>
      <p className={styles.definicion}>El alquiler de una herramienta, la contratación de un oficio y el uso de la plataforma Qatu son servicios.</p>
      <label>¿Qué contrataste?<input name="bienDescripcion" required minLength={5} maxLength={300} placeholder="Por ejemplo: alquiler de taladro, reserva del 10 de noviembre"/></label>
      <label>Monto reclamado en soles (opcional)<input name="monto" inputMode="decimal" maxLength={10} placeholder="35.00"/></label>
    </fieldset>

    <fieldset className={styles.seccion}>
      <legend>4. Detalle</legend>
      <label>¿Qué ocurrió?<textarea name="detalle" required minLength={20} maxLength={2000} rows={5}/></label>
      <label>¿Qué pides?<textarea name="pedido" required minLength={10} maxLength={1000} rows={3}/></label>
      <label>¿Cómo quieres recibir la respuesta?<select name="medioRespuesta" defaultValue="correo" required><option value="correo">Por correo electrónico</option><option value="carta">Por carta a mi domicilio</option></select></label>
    </fieldset>

    <p className={catalogo.hint}>Te responderemos en un plazo máximo de 15 días hábiles. Presentar esta hoja no impide acudir a otras vías de solución de controversias ni es requisito previo para presentar una denuncia ante el INDECOPI. La atención no está condicionada a ningún pago.</p>
    {error && <p role="alert" className={catalogo.error}>{error}</p>}
    <button type="submit" className="button primary" disabled={ocupado}>{ocupado ? 'Enviando…' : 'Enviar hoja de reclamación'}</button>
  </form>;
}

/** Consulta pública del estado con el número de hoja y el código de consulta. */
export function ConsultaHoja() {
  const [hoja, setHoja] = useState<Constancia | null>(null), [error, setError] = useState(''), [ocupado, setOcupado] = useState(false);
  async function consultar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(''); setHoja(null); setOcupado(true);
    const f = new FormData(e.currentTarget);
    try { setHoja(await apiJson<Constancia>(`/reclamaciones/consulta?numero=${encodeURIComponent(String(f.get('numero') ?? ''))}&codigo=${encodeURIComponent(String(f.get('codigo') ?? ''))}`)); }
    catch (err) { setError(err instanceof Error ? err.message : 'No pudimos consultar la hoja.'); }
    finally { setOcupado(false); }
  }
  return <>
    <form onSubmit={consultar} className={`${catalogo.fields} ${styles.noImprimir}`} aria-label="Consultar una hoja">
      <div className={catalogo.columns}>
        <label>Número de hoja<input name="numero" required placeholder="LR-2026-000001" maxLength={14} autoComplete="off"/></label>
        <label>Código de consulta<input name="codigo" required maxLength={12} autoComplete="off"/></label>
      </div>
      {error && <p role="alert" className={catalogo.error}>{error}</p>}
      <button type="submit" className="button outline" disabled={ocupado}>Consultar</button>
    </form>
    {hoja && <HojaPresentada h={hoja}/>}
  </>;
}
