'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { interpretar, urlDesdeIA, urlSinIA } from '@/lib/api/busqueda';
import estilos from './busqueda.module.css';

const MAXIMO = 500;

/**
 * Búsqueda en lenguaje natural (007). La IA convierte la frase en filtros; los resultados salen del catálogo real.
 * Si la IA o la API no responden, se buscan las palabras tal cual: nunca se queda sin buscar.
 */
export default function BuscadorIA({ inicial = '' }: { inicial?: string }) {
  const [texto, setTexto] = useState(inicial);
  const [buscando, setBuscando] = useState(false);
  const router = useRouter();

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    const consulta = texto.trim().replace(/\s+/g, ' ');
    if (!consulta || buscando) return;
    setBuscando(true);
    try {
      router.push(urlDesdeIA(consulta, await interpretar(consulta)));
    } catch {
      router.push(urlSinIA(consulta));
    } finally {
      setBuscando(false);
    }
  }

  return <form className={estilos.form} onSubmit={enviar} role="search" aria-label="Búsqueda inteligente">
    <label htmlFor="consulta-ia" className={estilos.etiqueta}><span className={estilos.chispa} aria-hidden="true">✦</span>Describe lo que necesitas</label>
    <div className={estilos.fila}>
      <textarea id="consulta-ia" name="consulta" rows={1} maxLength={MAXIMO} value={texto} onChange={e => setTexto(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
        placeholder="Por ejemplo: «un taladro en el centro por menos de 40 soles para el sábado»" aria-describedby="consulta-ia-ayuda"/>
      <button className={estilos.boton} type="submit" disabled={buscando || !texto.trim()}>{buscando ? 'Interpretando…' : 'Buscar con IA'}</button>
    </div>
    <p id="consulta-ia-ayuda" className={estilos.ayuda}>La IA solo traduce tu frase a filtros que puedes editar; precios y ofertas salen del catálogo. No escribas datos personales.</p>
  </form>;
}
