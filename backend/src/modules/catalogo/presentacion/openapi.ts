import { booleano, entero, instante, lista, motivo, nulable, objeto, opciones, ref, registrarEsquemas, respuesta, texto, uuid, versionActual } from '../../../shared/presentacion/openapi';
import { categorias, zonas } from '../dominio/oferta';
import { LIMITES } from '../dominio/ubicacion';

/** Esquemas OpenAPI de Catálogo (004, 011). Las categorías y zonas salen del dominio: no se desalinean. */
const categoriaId = opciones(...categorias.map(c => c.id));
const zonaId = opciones(...zonas.map(z => z.id));
const tipo = opciones('herramienta', 'servicio');
const textos = lista(texto(2, 200), { minItems: 1, maxItems: 10 });
const punto = { lat: { type: 'number' as const, minimum: LIMITES.latMin, maximum: LIMITES.latMax, example: -13.1588 }, lng: { type: 'number' as const, minimum: LIMITES.lngMin, maximum: LIMITES.lngMax, example: -74.2232 } };
const precision = opciones('exacta', 'aproximada');

registrarEsquemas({
  Recurso: respuesta({ id: uuid, identificador: { type: 'string', example: 'Taladro 1' }, activo: booleano }, { description: 'Unidad física de una herramienta o agenda de un servicio' }),
  ProveedorEnCatalogo: respuesta({ id: uuid, nombrePublico: { type: 'string' }, estadoVerificacion: { type: 'string', example: 'aprobada' } }),
  UbicacionPublica: nulable(respuesta({ ...punto, precision }, { description: 'Punto público: exacto o desplazado 50–100 m según elija el proveedor' })),
  Publicacion: respuesta({
    id: uuid, proveedorId: uuid, tipo, categoriaId, zonaId, zona: ref('Zona'), titulo: { type: 'string' }, descripcion: { type: 'string' },
    incluye: lista({ type: 'string' }), condiciones: lista({ type: 'string' }), modalidadPrecio: opciones('fija', 'cotizacion'),
    tarifaCentimos: nulable(entero(1, 99999999, { description: 'null si se cotiza' })), unidad: nulable(opciones('día', 'servicio')), moneda: opciones('PEN'),
    recursos: lista(ref('Recurso'), { description: 'Solo las unidades activas' }), proveedor: ref('ProveedorEnCatalogo'),
    imagen: { type: 'string', example: '/ilustraciones/drill.svg' }, ubicacion: ref('UbicacionPublica'), creadoEn: instante, actualizadoEn: instante,
  }, { description: 'Vista pública: nunca incluye usuarioId, correo ni documentos' }),
  PublicacionPropia: respuesta({
    id: uuid, proveedorId: uuid, tipo, categoriaId, zonaId, titulo: { type: 'string' }, descripcion: { type: 'string' },
    incluye: lista({ type: 'string' }), condiciones: lista({ type: 'string' }), modalidadPrecio: opciones('fija', 'cotizacion'),
    tarifaCentimos: nulable(entero()), unidad: nulable(opciones('día', 'servicio')), recursos: lista(ref('Recurso'), { description: 'Incluye las inactivas' }),
    activa: booleano, estadoModeracion: opciones('permitida', 'retirada'), version: entero(1), ubicacion: ref('UbicacionPublica'), creadoEn: instante, actualizadoEn: instante,
  }, { description: 'Vista del dueño o del administrador' }),
  PaginaPublicaciones: respuesta({ items: lista(ref('Publicacion')), total: entero(0), page: entero(1), limit: entero(1, 50) }),
  PaginaPublicacionesPropias: respuesta({ items: lista(ref('PublicacionPropia')), total: entero(0), page: entero(1), limit: entero(1, 50) }),
  OpcionesCatalogo: respuesta({
    categorias: lista(respuesta({ id: categoriaId, nombre: { type: 'string' }, tipo, imagen: { type: 'string' } })),
    zonas: lista(ref('Zona')),
  }),
  UbicacionGuardada: respuesta({ ...punto, precision, publica: respuesta(punto, { description: 'Punto que ve el público' }) }, { description: 'Punto exacto guardado (solo lo ve el dueño)' }),
  UbicacionPropia: respuesta({ ubicacion: nulable(respuesta({ ...punto, precision, publica: respuesta(punto) }, { description: 'Punto exacto guardado y el que ve el público; null si no hay' })) }),
  EventoModeracion: respuesta({ actorId: uuid, estadoAnterior: opciones('permitida', 'retirada'), estadoNuevo: opciones('permitida', 'retirada'), motivo: { type: 'string' }, version: entero(1), creadoEn: instante }),
});

const datosOferta = {
  tipo, categoriaId, zonaId,
  titulo: texto(5, 120, { example: 'Taladro percutor 800 W' }),
  descripcion: texto(20, 3000, { example: 'Taladro percutor con juego de brocas para concreto y madera.' }),
  incluye: { ...textos, example: ['Juego de brocas', 'Maletín'] },
  condiciones: { ...textos, example: ['Devolver limpio'] },
  modalidadPrecio: { ...opciones('fija', 'cotizacion'), description: 'Herramienta: siempre fija. Servicio: fija o cotización' },
  tarifaCentimos: nulable(entero(1, 99999999, { description: 'En céntimos de PEN; null si se cotiza', example: 3500 })),
  unidad: nulable({ ...opciones('día', 'servicio'), description: 'día para herramientas, servicio para oficios con precio fijo, null si se cotiza' }),
  activa: booleano,
};
const recursoNuevo = objeto({ identificador: texto(1, 80), activo: booleano });
const recursoEditado = objeto({ id: uuid, identificador: texto(1, 80), activo: booleano }, ['identificador', 'activo']);

export const AltaPublicacion = objeto({ ...datosOferta, recursos: lista(recursoNuevo, { minItems: 1, maxItems: 20, description: '1–20 unidades de una herramienta, o una agenda de servicio; etiquetas únicas' }) });
export const EdicionPublicacion = objeto({ ...datosOferta, recursos: lista(recursoEditado, { minItems: 1, maxItems: 20, description: 'Conserva todos los id previos; para retirar una unidad, activo: false' }), versionActual });
export const Ubicacion = objeto({ ...punto, precision: { ...precision, description: 'exacta: un local abierto al público; aproximada: se muestra desplazada 50–100 m' } });
export const Moderacion = objeto({ estado: opciones('permitida', 'retirada'), motivo, versionActual });
export const filtrosCatalogo = {
  q: { esquema: texto(0, 200), descripcion: 'Texto a buscar, sin importar tildes' },
  tipo: { esquema: tipo }, categoriaId: { esquema: categoriaId }, zonaId: { esquema: zonaId },
  precioMaximoCentimos: { esquema: entero(0, 99999999), descripcion: 'Excluye las ofertas que se cotizan' },
  page: { esquema: entero(1, 10000, { default: 1 }) }, limit: { esquema: entero(1, 50, { default: 20 }) },
  orden: { esquema: { ...opciones('recomendados', 'precio', 'nombre'), default: 'recomendados' } },
};
