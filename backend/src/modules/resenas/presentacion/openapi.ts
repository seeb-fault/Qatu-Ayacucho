import { booleano, entero, instante, motivo, nulable, objeto, opciones, ref, registrarEsquemas, respuesta, texto, uuid } from '../../../shared/presentacion/openapi';

/** Esquemas OpenAPI de Reseñas, Evidencias, Incidencias (006) y Libro de Reclamaciones (012). */
const etapa = opciones('entrega', 'devolucion', 'trabajo');
const autor = opciones('cliente', 'proveedor');
const tipoDocumento = opciones('DNI', 'CE', 'PASAPORTE', 'RUC');
const medio = opciones('correo', 'carta');

registrarEsquemas({
  Resena: respuesta({ id: uuid, titulo: { type: 'string', description: 'Título de la oferta reseñada' }, puntuacion: entero(1, 5), texto: nulable({ type: 'string' }), creadaEn: instante }, { description: 'Vista pública: sin cliente ni reserva' }),
  ResenaModerable: respuesta({ id: uuid, titulo: { type: 'string' }, puntuacion: entero(1, 5), texto: nulable({ type: 'string' }), creadaEn: instante, oculta: booleano }),
  Reputacion: respuesta({ promedio: nulable({ type: 'number', description: 'Redondeado a un decimal; null sin reseñas visibles', example: 4.5 }), total: entero(0) }),
  Evidencia: respuesta({ id: uuid, etapa, autor, tipo: opciones('image/jpeg', 'image/png'), bytes: entero(1), sha256: { type: 'string' }, creadaEn: instante, disponible: { ...booleano, description: 'false si se borró por retención (90 días tras el cierre)' } }),
  Incidencia: respuesta({
    id: uuid, tipo: opciones('dano', 'faltante', 'servicio', 'otro'), descripcion: { type: 'string' }, estado: opciones('abierta', 'resuelta'),
    resultado: nulable(opciones('a_favor_cliente', 'a_favor_proveedor', 'sin_acuerdo')), motivo: nulable({ type: 'string' }),
    creadaEn: instante, resueltaEn: nulable(instante), autor, propia: { ...booleano, description: 'Solo en la vista de los participantes' },
  }),
  Garantia: nulable(respuesta({ condiciones: { type: 'string' }, registradaEn: instante, conformidadClienteEn: nulable(instante), version: entero(1) }, { description: 'Acuerdo documental: no es un depósito ni un monto' })),
  Titular: respuesta({ razonSocial: nulable({ type: 'string' }), ruc: nulable({ type: 'string' }), direccion: nulable({ type: 'string' }), correo: nulable({ type: 'string' }), telefono: nulable({ type: 'string' }) }, { description: 'Proveedor del servicio que figura en cada hoja; null si aún no se configuró' }),
  HojaReclamacion: respuesta({
    numero: { type: 'string', pattern: '^LR-\\d{4}-\\d{6}$', example: 'LR-2026-000001' }, tipo: opciones('reclamo', 'queja'), titular: ref('Titular'),
    presentadaEn: instante, venceEn: { type: 'string', format: 'date', description: 'Último día para responder: 15 días hábiles' },
    consumidor: respuesta({ nombre: { type: 'string' }, tipoDocumento, numeroDocumento: { type: 'string' }, domicilio: { type: 'string' }, telefono: nulable({ type: 'string' }), email: { type: 'string' }, menorDeEdad: booleano, apoderadoNombre: nulable({ type: 'string' }), apoderadoDocumento: nulable({ type: 'string' }) }),
    medioRespuesta: medio, bien: respuesta({ tipo: opciones('producto', 'servicio'), descripcion: { type: 'string' }, montoCentimos: nulable(entero(0)) }),
    detalle: { type: 'string' }, pedido: { type: 'string' },
    respuesta: nulable(respuesta({ texto: { type: 'string' }, medio, respondidaEn: instante })),
  }, { description: 'Constancia de la hoja; no incluye identificadores internos' }),
});

export const NuevaResena = objeto({ puntuacion: entero(1, 5), texto: nulable(texto(0, 600, { description: 'Comentario opcional' })) }, ['puntuacion']);
export const ModeracionResena = objeto({ oculta: booleano, motivo });
export const SubidaEvidencia = {
  type: 'object' as const, required: ['etapa', 'fotos'],
  properties: {
    etapa: { ...etapa, description: 'Debe estar abierta según el estado de la reserva' },
    fotos: { type: 'array' as const, minItems: 1, maxItems: 4, items: { type: 'string' as const, format: 'binary' }, description: 'JPEG o PNG de hasta 5 MiB, reconocidos por su firma; hasta 4 por etapa' },
  },
};
export const NuevaIncidencia = objeto({ tipo: opciones('dano', 'faltante', 'servicio', 'otro'), descripcion: texto(20, 1000) });
export const Resolucion = objeto({ resultado: opciones('a_favor_cliente', 'a_favor_proveedor', 'sin_acuerdo'), motivo });
export const DocumentoGarantia = objeto({ condiciones: texto(20, 1000, { description: 'Condiciones de la garantía; sin montos ni instrucciones de transferencia' }) });
export const Conformidad = objeto({ version: entero(1, undefined, { description: 'Versión vigente de la garantía' }) });
export const NuevaHoja = objeto({
  tipo: { ...opciones('reclamo', 'queja'), description: 'reclamo: disconformidad con el producto o servicio; queja: con la atención' },
  nombre: texto(3, 150), tipoDocumento, numeroDocumento: { type: 'string', description: 'DNI 8 dígitos; CE 9–12; pasaporte 6–12; RUC 11', example: '12345678' },
  domicilio: texto(5, 200), telefono: nulable({ type: 'string', description: 'Celular de 9 dígitos que empieza con 9', example: '987654321' }),
  email: texto(6, 254, { format: 'email' }), medioRespuesta: medio,
  menorDeEdad: { ...booleano, default: false }, apoderadoNombre: texto(3, 150, { description: 'Solo si es menor de edad' }), apoderadoDocumento: { type: 'string', description: 'DNI del apoderado; solo si es menor de edad' },
  bienTipo: opciones('producto', 'servicio'), bienDescripcion: texto(5, 300), montoCentimos: nulable(entero(0, 100000000)),
  detalle: texto(20, 2000), pedido: texto(10, 1000),
}, ['tipo', 'nombre', 'tipoDocumento', 'numeroDocumento', 'domicilio', 'email', 'medioRespuesta', 'bienTipo', 'bienDescripcion', 'detalle', 'pedido']);
export const RespuestaHoja = objeto({ respuesta: texto(20, 4000), medio });
export const paginaPublica = { esquema: entero(1, 9999, { default: 1 }), descripcion: 'Página, de 20 en 20' };
