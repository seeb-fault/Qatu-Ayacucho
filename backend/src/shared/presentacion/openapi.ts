import { RequestMethod } from '@nestjs/common';
import { HTTP_CODE_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { ApiBody, ApiConsumes, ApiCookieAuth, ApiHeader, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { SchemaObject, ReferenceObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

/**
 * Documentación OpenAPI de la API (014). Cada endpoint lleva un solo @Doc({...}) encima de @Get/@Post/...:
 * el decorador lee el método y el código de éxito que ya declara Nest, y agrega por su cuenta la sesión,
 * los errores comunes y la regla de Origin de las escrituras. Así el contrato no se desalinea del código.
 */
export type Esquema = SchemaObject | ReferenceObject;
export type Acceso = 'publico' | 'opcional' | 'sesion' | 'admin' | 'pasarela';

/** Nombre del esquema de seguridad (cookie qatu_sesion) en el documento. */
export const SEGURIDAD_SESION = 'sesion';

const esquemas: Record<string, SchemaObject> = {};
/** Registra esquemas reutilizables (components.schemas). Cada módulo registra los suyos al cargar su archivo openapi. */
export function registrarEsquemas(nuevos: Record<string, SchemaObject>) {
  for (const [nombre, esquema] of Object.entries(nuevos)) {
    if (esquemas[nombre]) throw new Error(`Esquema OpenAPI duplicado: ${nombre}`);
    esquemas[nombre] = esquema;
  }
}
export const esquemasRegistrados = () => ({ ...esquemas });
export const ref = (nombre: string): ReferenceObject => ({ $ref: `#/components/schemas/${nombre}` });

// Atajos para escribir esquemas cortos y legibles.
export const texto = (min?: number, max?: number, extra: SchemaObject = {}): SchemaObject => ({ type: 'string', ...(min !== undefined && { minLength: min }), ...(max !== undefined && { maxLength: max }), ...extra });
export const entero = (min?: number, max?: number, extra: SchemaObject = {}): SchemaObject => ({ type: 'integer', ...(min !== undefined && { minimum: min }), ...(max !== undefined && { maximum: max }), ...extra });
export const uuid: SchemaObject = { type: 'string', format: 'uuid' };
export const instante: SchemaObject = { type: 'string', format: 'date-time', description: 'Instante UTC en ISO 8601' };
export const booleano: SchemaObject = { type: 'boolean' };
export const opciones = (...valores: string[]): SchemaObject => ({ type: 'string', enum: valores });
export const lista = (items: Esquema, extra: SchemaObject = {}): SchemaObject => ({ type: 'array', items, ...extra });
export const nulable = (esquema: SchemaObject): SchemaObject => ({ ...esquema, nullable: true });
/** Referencia que puede ser null (OpenAPI 3.0 no admite nullable junto a $ref). */
export const nulableRef = (nombre: string): SchemaObject => ({ allOf: [ref(nombre)], nullable: true });
/** Objeto estricto: la API rechaza con 400 cualquier campo que no esté aquí. */
export function objeto(propiedades: Record<string, Esquema>, requeridos: string[] = Object.keys(propiedades), extra: SchemaObject = {}): SchemaObject {
  return { type: 'object', properties: propiedades, ...(requeridos.length && { required: requeridos }), additionalProperties: false, ...extra };
}
/** Objeto de respuesta: describe los campos principales sin prometer que no se agreguen otros. */
export function respuesta(propiedades: Record<string, Esquema>, extra: SchemaObject = {}): SchemaObject {
  return { type: 'object', properties: propiedades, ...extra };
}
/** Página de resultados: { items, total, page, limit }. */
export const pagina = (item: Esquema, extra: Record<string, Esquema> = {}): SchemaObject =>
  respuesta({ items: lista(item), total: entero(0), page: entero(1), limit: entero(1, 50), ...extra });
export const motivo: SchemaObject = texto(10, 500, { description: 'Motivo, de 10 a 500 caracteres' });
/** Cabecera Idempotency-Key de pagos y del envío de Mi lista. */
export const cabeceraIdempotencia = { 'Idempotency-Key': { descripcion: 'Clave única de 16 a 64 caracteres. Repetirla con el mismo cuerpo devuelve el mismo resultado; con otro cuerpo, 409.', requerido: true, esquema: texto(16, 64, { example: 'b1c9f0e2-5d4a-4c3e-9a77-0f6c2d1e8a90' }) } };
export const versionActual: SchemaObject = entero(1, undefined, { description: 'Versión que el cliente vio por última vez; si cambió, 409' });

const ERRORES: Record<number, string> = {
  400: 'Entrada inválida o campos desconocidos (ENTRADA_INVALIDA)',
  401: 'Sin sesión activa (cookie qatu_sesion ausente, vencida o revocada)',
  403: 'Sin permiso para esta acción',
  404: 'No existe o no es visible para quien consulta',
  409: 'Conflicto: versión desactualizada, estado incompatible o duplicado',
  410: 'El archivo se eliminó por la política de conservación',
  413: 'El archivo supera el tamaño máximo',
  429: 'Se superó el límite de intentos; espera antes de reintentar',
  503: 'Servicio no disponible (base de datos, almacén o pasarela)',
};

export interface DocOperacion {
  /** Grupo de Swagger, si el controlador no declara @ApiTags (o mezcla grupos). */
  etiqueta?: string;
  /** Resumen corto que aparece en la lista de Swagger. */
  resumen: string;
  /** Explicación: quién puede, qué cambia, reglas de negocio. */
  detalle?: string;
  /** publico (sin sesión), opcional (con o sin sesión), sesion (cualquier cuenta activa), admin, pasarela (webhook). Por defecto, sesion. */
  acceso?: Acceso;
  /** Cuerpo JSON. */
  cuerpo?: Esquema;
  /** Cuerpo multipart/form-data (subida de archivos). */
  multipart?: SchemaObject;
  /** Esquema de la respuesta exitosa; null si no tiene cuerpo (204). */
  devuelve?: Esquema | null;
  /** Descripción de la respuesta exitosa. */
  exito?: string;
  /** Respuesta binaria (descarga de un archivo). */
  archivo?: string[];
  /** Otros códigos de éxito posibles, por ejemplo 202 en pagos. */
  otrosExitos?: Record<number, string>;
  /** Errores propios de la operación, además de los que se agregan solos. */
  errores?: number[] | Record<number, string>;
  consultas?: Record<string, { esquema: SchemaObject; descripcion?: string; requerido?: boolean }>;
  cabeceras?: Record<string, { descripcion: string; requerido?: boolean; esquema?: SchemaObject }>;
}

const errorRef = ref('Error');
const ESCRITURAS = new Set([RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.DELETE]);

/** Documenta un endpoint. Debe ir encima de @Get/@Post/@Patch/@Put/@Delete (y de @HttpCode, si lo hay). */
export function Doc(doc: DocOperacion): MethodDecorator {
  return (destino, clave, descriptor) => {
    const metodo: RequestMethod | undefined = Reflect.getMetadata(METHOD_METADATA, descriptor.value as object);
    if (metodo === undefined) throw new Error(`@Doc de ${String(clave)} debe ir encima de @Get/@Post/@Patch/@Put/@Delete.`);
    const codigo: number = Reflect.getMetadata(HTTP_CODE_METADATA, descriptor.value as object) ?? (metodo === RequestMethod.POST ? 201 : 200);
    const acceso = doc.acceso ?? 'sesion';
    const escritura = ESCRITURAS.has(metodo) && acceso !== 'pasarela';
    const decoradores: MethodDecorator[] = [];

    const notas: string[] = [];
    if (doc.detalle) notas.push(doc.detalle);
    notas.push({
      publico: '**Acceso:** público.',
      opcional: '**Acceso:** público; si hay sesión, se asocia a la cuenta.',
      sesion: '**Acceso:** cuenta activa (cookie `qatu_sesion`).',
      admin: '**Acceso:** administrador activo (cookie `qatu_sesion`).',
      pasarela: '**Acceso:** pasarela de pago; no usa sesión ni Origin.',
    }[acceso]);
    if (escritura) notas.push(doc.multipart
      ? '**Escritura:** exige `Origin` igual a `APP_ORIGIN` y `multipart/form-data`.'
      : '**Escritura:** exige `Origin` igual a `APP_ORIGIN` y `Content-Type: application/json`' + (doc.cuerpo ? '.' : ', con el cuerpo vacío `{}`.'));
    if (doc.etiqueta) decoradores.push(ApiTags(doc.etiqueta));
    decoradores.push(ApiOperation({ summary: doc.resumen, description: notas.join('\n\n') }));

    if (acceso === 'sesion' || acceso === 'admin' || acceso === 'opcional') decoradores.push(ApiCookieAuth(SEGURIDAD_SESION));
    if (doc.cuerpo) decoradores.push(ApiBody({ schema: doc.cuerpo, required: true }));
    else if (escritura && !doc.multipart) decoradores.push(ApiBody({ schema: objeto({}, [], { description: 'Cuerpo vacío: envía {}' }), required: false }));
    if (doc.multipart) decoradores.push(ApiConsumes('multipart/form-data'), ApiBody({ schema: doc.multipart, required: true }));
    for (const [nombre, q] of Object.entries(doc.consultas ?? {})) decoradores.push(ApiQuery({ name: nombre, schema: q.esquema, description: q.descripcion, required: q.requerido ?? false }));
    for (const [nombre, h] of Object.entries(doc.cabeceras ?? {})) decoradores.push(ApiHeader({ name: nombre, description: h.descripcion, required: h.requerido ?? false, schema: h.esquema ?? { type: 'string' } }));

    if (doc.archivo) decoradores.push(ApiResponse({ status: codigo, description: doc.exito ?? 'Archivo descargable', content: Object.fromEntries(doc.archivo.map(tipo => [tipo, { schema: { type: 'string', format: 'binary' } }])) }));
    else if (doc.devuelve === null || codigo === 204) decoradores.push(ApiResponse({ status: codigo, description: doc.exito ?? 'Hecho, sin contenido' }));
    else decoradores.push(ApiResponse({ status: codigo, description: doc.exito ?? 'Operación exitosa', ...(doc.devuelve && { schema: doc.devuelve }) }));
    for (const [estado, descripcion] of Object.entries(doc.otrosExitos ?? {})) decoradores.push(ApiResponse({ status: Number(estado), description: descripcion, ...(doc.devuelve && { schema: doc.devuelve }) }));

    // Errores: los que implica el acceso y la escritura, más los propios de la operación.
    const errores = new Map<number, string>();
    if (doc.cuerpo || doc.multipart || doc.consultas || escritura) errores.set(400, ERRORES[400]);
    if (acceso === 'sesion' || acceso === 'admin') errores.set(401, ERRORES[401]);
    if (acceso === 'admin') errores.set(403, 'La cuenta no es administradora');
    if (escritura) errores.set(403, (errores.has(403) ? errores.get(403) + '; o ' : '') + 'Origin distinto de APP_ORIGIN o Content-Type no permitido (ORIGEN_INVALIDO)');
    const propios = Array.isArray(doc.errores) ? Object.fromEntries(doc.errores.map(c => [c, ERRORES[c]])) : doc.errores ?? {};
    for (const [estado, descripcion] of Object.entries(propios)) {
      const previo = errores.get(Number(estado));
      errores.set(Number(estado), previo && previo !== descripcion ? `${descripcion}; o ${previo}` : descripcion ?? ERRORES[Number(estado)]);
    }
    for (const [estado, descripcion] of [...errores].sort(([a], [b]) => a - b)) decoradores.push(ApiResponse({ status: estado, description: descripcion, schema: errorRef }));

    for (const decorador of decoradores) decorador(destino, clave, descriptor);
  };
}
