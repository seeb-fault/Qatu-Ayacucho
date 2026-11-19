import { booleano, entero, instante, nulable, objeto, opciones, registrarEsquemas, respuesta, texto, uuid } from '../../../shared/presentacion/openapi';

/** Esquemas OpenAPI de Pagos (005.8). Reflejan dominio/pagos.ts. Solo modo de prueba. */
registrarEsquemas({
  IntentoPago: respuesta({
    id: uuid, reservaId: uuid, importeCentimos: entero(1), moneda: opciones('PEN'), estado: opciones('PROCESANDO', 'APROBADO', 'RECHAZADO', 'DESCONOCIDO'),
    codigo: nulable({ type: 'string', description: 'Código de rechazo de la pasarela' }), reembolsoPendiente: booleano, creadoEn: instante,
  }, { description: 'Sin referencia externa ni datos de la tarjeta' }),
  ConfiguracionPagos: respuesta({ disponible: booleano, llavePublica: nulable({ type: 'string', example: 'pk_test_...' }), modo: opciones('prueba') }),
});

export const Pago = objeto({ tokenId: texto(10, 130, { pattern: '^(tkn|ype)_test_[A-Za-z0-9_-]{1,120}$', description: 'Token de prueba del checkout de Culqi (tarjeta o Yape). El backend nunca recibe el número de tarjeta', example: 'tkn_test_ABC123' }) });
export const AvisoPasarela = { type: 'object' as const, description: 'Evento de Culqi. Solo se usa para saber qué cargo consultar por la API autenticada de la pasarela' };
