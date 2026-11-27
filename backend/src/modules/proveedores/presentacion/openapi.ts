import { booleano, entero, instante, lista, motivo, nulable, objeto, opciones, ref, registrarEsquemas, respuesta, texto, uuid, versionActual } from '../../../shared/presentacion/openapi';

/** Esquemas OpenAPI de Proveedores (003). Reflejan dominio/proveedor.ts y dominio/verificacion.ts. */
const estadoVerificacion = opciones('no_solicitada', 'pendiente', 'aprobada', 'rechazada');
const estadoSolicitud = opciones('pendiente', 'aprobada', 'rechazada', 'cancelada');
const datosPerfil = {
  nombrePublico: texto(2, 100, { example: 'Herramientas Don Lucho' }),
  descripcion: texto(20, 1500, { example: 'Alquilo herramientas eléctricas revisadas, con entrega en Huamanga.' }),
  zonaId: { type: 'string', description: 'Una de GET /proveedores/zonas' },
  visiblePublicamente: { ...booleano, description: 'Si el perfil aparece en el catálogo' },
} as const;

registrarEsquemas({
  Zona: respuesta({ id: { type: 'string' }, nombre: { type: 'string', example: 'Ayacucho' } }),
  ProveedorPublico: respuesta({ id: uuid, nombrePublico: { type: 'string' }, descripcion: { type: 'string' }, zona: ref('Zona'), estadoVerificacion }),
  ProveedorPropio: respuesta({
    id: uuid, usuarioId: uuid, nombrePublico: { type: 'string' }, descripcion: { type: 'string' }, zonaId: { type: 'string' }, zona: ref('Zona'),
    visiblePublicamente: booleano, estadoVerificacion, version: entero(1), creadoEn: instante, actualizadoEn: instante,
  }),
  PoliticaDocumental: respuesta({
    habilitada: { ...booleano, description: 'false si el servidor no tiene DOCUMENTOS_KEY' },
    tipos: lista(opciones('application/pdf', 'image/jpeg', 'image/png')), maximoBytes: entero(1, undefined, { example: 5242880 }),
    maximoArchivos: entero(1, undefined, { example: 2 }), conservacion: { type: 'string' },
  }),
  SolicitudVerificacion: respuesta({
    id: uuid, estado: estadoSolicitud, motivo: nulable({ type: 'string' }), revisorId: nulable(uuid), creadoEn: instante, revisadoEn: nulable(instante),
    perfilEnviado: respuesta({ nombrePublico: { type: 'string' }, descripcion: { type: 'string' }, zonaId: { type: 'string' } }),
    documentos: lista(respuesta({ id: uuid, tipo: { type: 'string' }, bytes: entero(1), disponible: booleano })),
  }, { description: 'Nunca incluye el contenido cifrado, IV, tag, hash ni el nombre original del archivo' }),
  PaginaSolicitudesVerificacion: respuesta({ solicitudes: lista(ref('SolicitudVerificacion')), pagina: entero(1), total: entero(0), paginas: entero(0) }),
});

export const AltaPerfil = objeto({ ...datosPerfil });
export const EdicionPerfil = objeto({ ...datosPerfil, versionActual });
export const SolicitudDocumental = {
  type: 'object' as const, required: ['versionActual', 'aceptaConservacion', 'documentos'],
  properties: {
    versionActual: { type: 'string' as const, pattern: '^[1-9][0-9]*$', description: 'Versión actual del perfil, como texto' },
    aceptaConservacion: { type: 'string' as const, enum: ['true'], description: 'Consentimiento para conservar los archivos mientras la cuenta esté activa' },
    documentos: { type: 'array' as const, minItems: 1, maxItems: 2, items: { type: 'string' as const, format: 'binary' }, description: 'PDF, JPEG o PNG de hasta 5 MiB; se reconoce por su firma, no por la extensión' },
  },
};
export const Revision = objeto({ solicitudId: uuid, decision: opciones('aprobada', 'rechazada'), motivo });
