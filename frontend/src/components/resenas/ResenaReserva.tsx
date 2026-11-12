'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiJson } from '@/lib/api/http';
import { fechaReserva } from '@/lib/api/reservas';
import { estrellas, type EstadoResena } from '@/lib/api/resenas';
import styles from './resenas.module.css';

const ETIQUETAS = ['Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente'];

/** Reseña de una reserva cerrada: el cliente califica y ambos participantes ven el resultado. */
export default function ResenaReserva({ reservaId, esCliente }: { reservaId: string; esCliente: boolean }) {
  const [estado, setEstado] = useState<EstadoResena | null>(null);
  const [puntuacion, setPuntuacion] = useState(0);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    apiJson<EstadoResena>(`/reservas/${reservaId}/resena`).then(e => { if (vigente) setEstado(e); }).catch(() => { if (vigente) setEstado(null); });
    return () => { vigente = false; };
  }, [reservaId]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!puntuacion) { setError('Elige de 1 a 5 estrellas.'); return; }
    setEnviando(true); setError('');
    try {
      const resena = await apiJson<NonNullable<EstadoResena['resena']>>(`/reservas/${reservaId}/resena`, 'POST', { puntuacion, ...(texto.trim() ? { texto: texto.trim() } : {}) });
      setEstado({ resena, puedeResenar: false, plazo: estado?.plazo ?? null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la reseña.');
    } finally { setEnviando(false); }
  }

  if (!estado) return null;
  if (estado.resena) return <div className={styles.resena}>
    <p className={styles.titulo}>{esCliente ? 'Tu reseña' : 'Reseña del cliente'}</p>
    <p><span className={styles.estrellas} aria-label={`${estado.resena.puntuacion} de 5 estrellas`}>{estrellas(estado.resena.puntuacion)}</span></p>
    {estado.resena.texto && <p className={styles.texto}>{estado.resena.texto}</p>}
    {estado.resena.oculta && <p className={styles.nota}>Oculta por moderación: no aparece en el perfil público.</p>}
  </div>;
  if (!esCliente || !estado.puedeResenar) return null;

  return <form className={styles.resena} onSubmit={enviar} aria-label="Calificar esta operación">
    <fieldset className={styles.puntuacion}>
      <legend>¿Cómo fue tu experiencia?</legend>
      {ETIQUETAS.map((etiqueta, i) => <label key={etiqueta} className={i < puntuacion ? styles.activa : undefined}>
        <input type="radio" name={`puntuacion-${reservaId}`} value={i + 1} checked={puntuacion === i + 1} onChange={() => setPuntuacion(i + 1)}/>
        <span aria-hidden="true">★</span><span className={styles.oculto}>{i + 1} {i === 0 ? 'estrella' : 'estrellas'}: {etiqueta}</span>
      </label>)}
      {puntuacion > 0 && <span className={styles.etiqueta}>{ETIQUETAS[puntuacion - 1]}</span>}
    </fieldset>
    <label className={styles.campo}>Comentario (opcional)
      <textarea value={texto} onChange={e => setTexto(e.target.value)} maxLength={600} rows={3} placeholder="Cuenta cómo te fue con la herramienta o el servicio."/>
    </label>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.acciones}>
      <button className="button primary" disabled={enviando}>{enviando ? 'Publicando…' : 'Publicar reseña'}</button>
      {estado.plazo && <small>Puedes reseñar hasta el {fechaReserva(estado.plazo)}.</small>}
    </div>
  </form>;
}
