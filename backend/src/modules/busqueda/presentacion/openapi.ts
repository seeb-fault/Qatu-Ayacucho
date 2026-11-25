import { entero, lista, nulable, objeto, opciones, ref, registrarEsquemas, respuesta, texto } from '../../../shared/presentacion/openapi';
import { CAMPOS_PRECISOS, MAXIMO_TEXTO } from '../dominio/intencion';

/** Esquemas OpenAPI de Búsqueda (007). */
const criterios = {
  tipo: opciones('herramienta', 'servicio'),
  // Búsqueda no importa el dominio de Catálogo: los ids válidos están en GET /publicaciones/opciones.
  categoriaId: texto(1, 50, { description: 'Id de categoría de GET /publicaciones/opciones', example: 'perforacion' }),
  zonaId: texto(1, 50, { description: 'Id de distrito de GET /publicaciones/opciones', example: 'ayacucho' }),
  precioMaximoCentimos: entero(0, 99999999),
};

registrarEsquemas({
  ResultadoBusquedaInteligente: respuesta({
    modo: { ...opciones('natural', 'convencional'), description: 'natural: la IA interpretó la consulta; convencional: se buscaron las palabras tal cual' },
    motivo: nulable({ ...opciones('sin_configurar', 'cuota', 'tiempo', 'error', 'respuesta_invalida'), description: 'Por qué no se usó la IA' }),
    criterios: respuesta({ q: nulable({ type: 'string' }), tipo: nulable(criterios.tipo), categoriaId: nulable(criterios.categoriaId), zonaId: nulable(criterios.zonaId), precioMaximoCentimos: nulable(criterios.precioMaximoCentimos) }, { description: 'Criterios aplicados (validados; los manuales prevalecen). Editables en la web' }),
    fechas: nulable(respuesta({ inicio: { type: 'string', format: 'date' }, fin: nulable({ type: 'string', format: 'date' }) }, { description: 'Fechas mencionadas, a confirmar al reservar' })),
    camposQueRequierenPrecision: lista(opciones(...CAMPOS_PRECISOS)),
    aviso: nulable({ type: 'string' }),
    resultados: respuesta({ items: lista(ref('Publicacion')), total: entero(0), page: entero(1), limit: entero(1, 50) }),
  }),
});

export const ConsultaNatural = objeto({
  texto: texto(1, MAXIMO_TEXTO, { example: 'taladro en el centro por menos de 40 soles para el sábado' }),
  filtros: objeto({ ...criterios }, [], { description: 'Filtros elegidos a mano: prevalecen sobre lo interpretado' }),
  page: entero(1, 10000, { default: 1 }),
}, ['texto']);
