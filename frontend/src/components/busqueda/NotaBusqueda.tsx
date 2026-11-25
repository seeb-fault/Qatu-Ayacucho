import { categorias } from '@/lib/catalogo';
import estilos from './busqueda.module.css';

const MOTIVOS: Record<string, string> = {
  sin_configurar: 'La búsqueda inteligente no está activada',
  cuota: 'Se alcanzó el límite de búsquedas inteligentes por ahora',
  tiempo: 'La búsqueda inteligente tardó demasiado',
  respuesta_invalida: 'No pudimos interpretar tu frase',
  error: 'La búsqueda inteligente no respondió',
};
const PRECISAR: Record<string, string> = { zona: 'el distrito', categoria: 'la categoría', presupuesto: 'el presupuesto', tipo: 'si buscas una herramienta o un oficio' };
const fecha = (iso: string) => new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(iso + 'T00:00:00Z'));
const texto = (v: string | string[] | undefined) => typeof v === 'string' ? v : '';

/** Explica una búsqueda que vino de la IA: qué se interpretó, qué falta precisar o por qué se buscó tal cual. */
export default function NotaBusqueda({ params }: { params: Record<string, string | string[] | undefined> }) {
  const modo = texto(params.ia), consulta = texto(params.consulta).slice(0, 500);
  if (modo !== 'natural' && modo !== 'convencional') return null;
  if (modo === 'convencional') {
    return <div className={`${estilos.nota} ${estilos.convencional}`} role="status">
      <span><strong>{MOTIVOS[texto(params.motivo)] ?? MOTIVOS.error}.</strong> Buscamos tus palabras tal cual{consulta ? <> («{consulta}»)</> : null}. Ajusta los filtros para afinar.</span>
    </div>;
  }
  const precisar = texto(params.precisar).split(',').filter(c => c in PRECISAR);
  const desde = /^\d{4}-\d{2}-\d{2}$/.test(texto(params.desde)) ? texto(params.desde) : '', hasta = /^\d{4}-\d{2}-\d{2}$/.test(texto(params.hasta)) ? texto(params.hasta) : '';
  const categoria = categorias.find(c => c.id === texto(params.categoria))?.nombre;
  return <div className={`${estilos.nota} ${estilos.natural}`} role="status">
    <span><strong>✦ Interpretamos tu búsqueda</strong>{consulta ? <> «{consulta}»</> : null}{categoria ? <> como {categoria}</> : null}. Los filtros aplicados aparecen abajo: quita o cambia los que no correspondan.</span>
    {(precisar.length > 0 || desde || texto(params.nota) === 'sin-palabras') && <ul>
      {desde && <li>Mencionaste {hasta && hasta !== desde ? <>del {fecha(desde)} al {fecha(hasta)}</> : <>el {fecha(desde)}</>}: confirma la disponibilidad al elegir fechas en la oferta.</li>}
      {precisar.length > 0 && <li>No pudimos precisar {precisar.map(c => PRECISAR[c]).join(', ')}: elígelo en los filtros si te importa.</li>}
      {texto(params.nota) === 'sin-palabras' && <li>No encontramos esas palabras exactas; te mostramos ofertas de la misma categoría.</li>}
    </ul>}
  </div>;
}
