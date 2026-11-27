import { booleano, entero, instante, lista, motivo, nulable, objeto, opciones, ref, registrarEsquemas, respuesta, texto, uuid, versionActual } from '../../../shared/presentacion/openapi';

/** Esquemas OpenAPI de Reservas (005, 009, 010, 011). Reflejan dominio/solicitud.ts, alquiler.ts, cotizacion.ts y lista.ts. */
const ESTADOS = ['PENDIENTE', 'RECHAZADA', 'VISITA_ACORDADA', 'ACEPTADA', 'VENCIDA', 'CANCELADA', 'APARTADO_PAGADO', 'ENTREGA_POR_CONFIRMAR', 'EN_CURSO',
  'DEVOLUCION_PENDIENTE', 'DEVUELTA', 'SERVICIO_CONFIRMADO', 'SERVICIO_EN_CURSO', 'SERVICIO_POR_PAGAR', 'SERVICIO_POR_CONFIRMAR', 'SERVICIO_CERRADO'];
const fechaUtc = { ...instante, description: 'Instante UTC futuro, formato YYYY-MM-DDTHH:mm:ss[.sss]Z', example: '2026-12-05T14:00:00Z' };
const descripcionTrabajo = texto(20, 1500, { description: 'Obligatoria en oficios (20–1500 caracteres); no se usa en herramientas' });

registrarEsquemas({
  Cotizacion: respuesta({
    version: entero(1), alcance: { type: 'string' }, materiales: { type: 'string' }, importeCentimos: entero(1), moneda: opciones('PEN'),
    vigenteHasta: instante, creadaEn: instante,
    respuesta: nulable(respuesta({ decision: opciones('ACEPTADA', 'RECHAZADA'), motivo: nulable({ type: 'string' }), respondidaEn: instante })),
  }),
  Reserva: respuesta({
    id: uuid, proveedorId: uuid, publicacionId: uuid, recursoId: uuid, inicio: instante, fin: instante, descripcionTrabajo: { type: 'string' },
    tipoSolicitud: opciones('alquiler', 'visita'), estado: opciones(...ESTADOS), version: entero(1), creadoEn: instante,
    participacion: { ...opciones('cliente', 'proveedor'), description: 'Tu papel en esta reserva' },
    snapshot: respuesta({ titulo: { type: 'string' }, tipo: opciones('herramienta', 'servicio'), proveedor: { type: 'string' }, recurso: { type: 'string' }, tarifaReferenciaCentimos: nulable(entero()), unidad: nulable({ type: 'string' }) }, { description: 'Datos de la oferta al solicitar; no es una cotización' }),
    condiciones: nulable(respuesta({ politica: { type: 'string', example: 'diaria-24h-v1' }, tarifaCentimos: entero(1), dias: entero(1), importeCentimos: entero(1), toleranciaMinutos: entero(0), comisionCentimos: entero(0), medioPago: { type: 'string' } }, { description: 'Solo en alquileres de herramientas' })),
    cotizaciones: lista(ref('Cotizacion'), { description: 'Solo en oficios' }),
    venceEn: nulable({ ...instante, description: 'Fin del apartado de 60 minutos' }), motivoRechazo: nulable({ type: 'string' }), motivoOperacion: nulable({ type: 'string' }),
    pagoEstado: opciones('PENDIENTE', 'REGISTRADO_PROVEEDOR', 'CONFIRMADO_PARTICIPANTES', 'PAGADO_EN_LINEA'),
    pagadoEnLineaCentimos: entero(0), efectivoCentimos: entero(0), importeFinalCentimos: nulable(entero(0)), saldoCentimos: entero(), diasExtra: entero(0),
    entregadoEn: nulable(instante), recibidoEn: nulable(instante), devolucionInformadaEn: nulable(instante), devueltoEn: nulable(instante),
    servicioIniciadoEn: nulable(instante), servicioTerminadoEn: nulable(instante), servicioCerradoEn: nulable(instante),
    ultimoPago: nulable(respuesta({ estado: { type: 'string' }, codigo: nulable({ type: 'string' }), reembolsoPendiente: booleano })),
  }, { description: 'Solo la ven sus participantes. No expone los identificadores de las cuentas' }),
  PaginaReservas: respuesta({ items: lista(ref('Reserva')), total: entero(0), vista: opciones('cliente', 'proveedor'), page: entero(1) }),
  Disponibilidad: respuesta({ franjas: lista(respuesta({ inicio: instante, fin: instante }), { description: 'Rangos ocupados, sin datos de quién' }), enUso: { ...booleano, description: 'La herramienta está ahora en manos de un cliente' } }),
  Contacto: respuesta({
    rol: { ...opciones('cliente', 'proveedor'), description: 'Papel de la otra persona' }, nombre: { type: 'string' },
    whatsapp: nulable({ type: 'string', description: 'null si la otra parte no permitió mostrarlo' }),
    ubicacion: nulable(respuesta({ lat: { type: 'number' }, lng: { type: 'number' } }, { description: 'Punto exacto de la oferta' })),
  }),
  ItemLista: respuesta({
    id: uuid, publicacionId: uuid, titulo: { type: 'string' }, tipo: opciones('herramienta', 'servicio'), proveedor: { type: 'object' }, recurso: { type: 'object', nullable: true },
    inicio: instante, fin: instante, descripcion: { type: 'string', nullable: true }, tarifaVistaCentimos: nulable(entero()), tarifaActualCentimos: nulable(entero()),
    estado: opciones('listo', 'tarifa_cambiada', 'fechas_vencidas', 'no_disponible', 'inactiva'),
  }),
  Aviso: respuesta({ id: uuid, reservaId: uuid, tipo: { type: 'string' }, titulo: { type: 'string' }, mensaje: { type: 'string' }, vista: opciones('cliente', 'proveedor'), creadoEn: instante, leidoEn: nulable(instante) }),
});

export const Solicitud = objeto({
  publicacionId: uuid, recursoId: uuid, inicio: fechaUtc, fin: fechaUtc, descripcionTrabajo,
  tipoSolicitud: { ...opciones('alquiler', 'visita'), default: 'alquiler' },
  aceptaCondiciones: { ...booleano, description: 'Obligatorio (true) en alquileres de herramientas' },
  tarifaEsperadaCentimos: entero(1, undefined, { description: 'Tarifa que vio el cliente; si cambió, 409. El precio lo calcula el servidor' }),
}, ['publicacionId', 'recursoId', 'inicio', 'fin']);
export const SoloVersion = objeto({ versionActual });
export const VersionYMotivo = objeto({ versionActual, motivo });
export const Propuesta = objeto({
  versionActual, alcance: texto(20, 1500), materiales: texto(10, 1000), importeCentimos: entero(1, 99999999),
  vigenteHasta: { ...fechaUtc, description: 'Futura y no posterior al inicio del servicio' },
});
export const RespuestaCotizacion = objeto({ versionActual, versionCotizacion: entero(1) });
export const RechazoCotizacion = objeto({ versionActual, versionCotizacion: entero(1), motivo });
export const NuevoItem = objeto({ publicacionId: uuid, recursoId: uuid, inicio: fechaUtc, fin: fechaUtc, descripcionTrabajo }, ['publicacionId', 'recursoId', 'inicio', 'fin']);
export const Envio = objeto({ ids: lista(uuid, { description: 'Si se omite, se envían todos' }), aceptaCondiciones: booleano }, []);
