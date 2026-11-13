'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Icono from '@/components/descubrimiento/Icono';
import { soles } from '@/lib/catalogo';

export type Muestra = { id: string; titulo: string; distrito: string; precio: number | null; unidad: string; imagen: string | null; proveedor: { nombre: string; iniciales: string; verificado: boolean } };

const DURACION = 6000;
const pasos = [
  { n: '01', icono: 'search', titulo: 'Busca', texto: 'Explora herramientas u oficios por categoría y distrito.' },
  { n: '02', icono: 'user', titulo: 'Conecta', texto: 'Revisa el perfil del proveedor y ponte en contacto.' },
  { n: '03', icono: 'calendar', titulo: 'Agenda', texto: 'Elige tus fechas y envía tu solicitud de reserva.' },
];

const precio = (m: Muestra) => m.precio === null ? <strong>A cotizar</strong> : <><strong>{soles(m.precio)}</strong>{m.unidad && <small> / {m.unidad}</small>}</>;
const corto = (texto: string) => texto.length > 12 ? texto.slice(0, 11) + '…' : texto;

/**
 * Tres pasos que avanzan solos, con barra de progreso; a la derecha, una vista ilustrativa de cada paso
 * con las ofertas destacadas. Se detiene al pasar el puntero, con el foco dentro o si se prefiere menos movimiento.
 */
export default function ComoFunciona({ muestras }: { muestras: Muestra[] }) {
  const [activo, setActivo] = useState(0);
  const [pausa, setPausa] = useState(false);
  const [quieto, setQuieto] = useState(false);
  const [primera] = muestras;
  const objeto = primera?.titulo.split(' ')[0].toLowerCase() ?? 'taladro';

  useEffect(() => {
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)');
    const leer = () => setQuieto(consulta.matches);
    leer(); consulta.addEventListener('change', leer);
    return () => consulta.removeEventListener('change', leer);
  }, []);
  useEffect(() => {
    if (pausa || quieto) return;
    const t = window.setTimeout(() => setActivo(a => (a + 1) % pasos.length), DURACION);
    return () => window.clearTimeout(t);
  }, [activo, pausa, quieto]);

  return <section className="q-how" id="como-funciona" aria-labelledby="como-titulo">
    <div className="section-heading">
      <div><span className="q-eyebrow-pill">Cómo funciona</span><h2 id="como-titulo">Tu proyecto empieza<br/>en <span className="q-accent">tres pasos</span></h2></div>
      <p>Menos vueltas. <strong>Más manos a la obra.</strong></p>
    </div>
    <div className="q-how-grid" onMouseEnter={() => setPausa(true)} onMouseLeave={() => setPausa(false)} onFocus={() => setPausa(true)} onBlur={() => setPausa(false)}>
      <ol className="q-how-steps">{pasos.map((p, i) => <li key={p.n}>
        <button type="button" className={'q-how-step' + (i === activo ? ' is-active' : '')} aria-expanded={i === activo} aria-controls="como-vista" onClick={() => setActivo(i)}>
          <span className="q-how-row">
            <span className="q-how-icon"><Icono nombre={p.icono} size={20}/></span>
            <strong>{p.titulo}</strong>
            <small aria-hidden="true">{p.n}</small>
          </span>
          {i === activo && <span className="q-how-desc">{p.texto}</span>}
          {i === activo && !quieto && <span className={'q-how-progress' + (pausa ? ' is-paused' : '')} style={{ animationDuration: DURACION + 'ms' }} aria-hidden="true"/>}
        </button>
      </li>)}</ol>
      <div className="q-how-demo" id="como-vista" aria-live="polite">
        {activo === 0 && <div className="q-demo-stack" key="busca">
          <div className="q-demo-search"><Icono nombre="search" size={18}/><span>{primera ? primera.titulo.split(' ')[0] : 'Taladro'}</span><i aria-hidden="true"/><b aria-hidden="true"><Icono nombre="search" size={16}/></b></div>
          <div className="q-demo-tags"><span>Herramientas</span><span>Ayacucho</span></div>
          {muestras.slice(0, 2).map(m => <div className="q-demo-row" key={m.id}>
            <span className="q-demo-thumb">{m.imagen && <Image src={m.imagen} alt="" width={40} height={40}/>}</span>
            <span className="q-demo-title"><strong>{m.titulo}</strong><small>{m.distrito} · Sin reseñas</small></span>
            <span className="q-demo-price">{precio(m)}</span>
          </div>)}
        </div>}
        {activo === 1 && <div className="q-demo-stack q-demo-chat" key="conecta">
          <div className="q-demo-card"><span className="q-demo-avatar">{primera?.proveedor.iniciales ?? 'Q'}</span><span className="q-demo-title"><strong>{corto(primera?.proveedor.nombre ?? 'Proveedor')}</strong><small>Perfil de proveedor</small></span></div>
          <p className="q-msg q-msg--yo">Hola, ¿sigue disponible el {objeto}?</p>
          <p className="q-msg">Sí, ¿para qué días lo necesitas?</p>
          <p className="q-msg q-msg--yo">Para dos días, por favor.</p>
          <p className="q-msg q-msg--escribe" aria-label="Escribiendo"><i/><i/><i/></p>
        </div>}
        {activo === 2 && <div className="q-demo-stack" key="agenda">
          <div className="q-demo-card"><span className="q-demo-avatar"><Icono nombre="calendar" size={18}/></span><span className="q-demo-title"><strong>Solicitud de reserva</strong><small>{primera?.titulo ?? 'Tu herramienta'}</small></span></div>
          <div className="q-demo-dates"><span><small>Desde</small><strong>Sáb 9:00</strong></span><span><small>Hasta</small><strong>Dom 18:00</strong></span></div>
          <div className="q-demo-send"><Icono nombre="send" size={16}/>Enviar solicitud</div>
        </div>}
        <span className="q-demo-note">Vista ilustrativa</span>
      </div>
    </div>
  </section>;
}
