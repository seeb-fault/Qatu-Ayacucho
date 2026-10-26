import { ErrorAplicacion } from '../../../shared/dominio/error-aplicacion';
export class ErrorCatalogo extends ErrorAplicacion {}
export type Tipo = 'herramienta' | 'servicio';
export const categorias = [
  {id:'perforacion',nombre:'Perforación',tipo:'herramienta',imagen:'drill'}, {id:'corte',nombre:'Corte y lijado',tipo:'herramienta',imagen:'saw'},
  {id:'pintura',nombre:'Pintura',tipo:'herramienta',imagen:'paint'}, {id:'jardineria',nombre:'Jardinería',tipo:'herramienta',imagen:'mower'},
  {id:'limpieza',nombre:'Limpieza',tipo:'herramienta',imagen:'washer'}, {id:'gasfiteria',nombre:'Gasfitería',tipo:'servicio',imagen:'plumber'},
  {id:'electricidad',nombre:'Electricidad',tipo:'servicio',imagen:'electrician'}, {id:'carpinteria',nombre:'Carpintería',tipo:'servicio',imagen:'carpenter'},
  {id:'pintor',nombre:'Pintores',tipo:'servicio',imagen:'painter'}, {id:'jardinero',nombre:'Jardineros',tipo:'servicio',imagen:'gardener'},
] as const;
export const zonas = [{id:'ayacucho',nombre:'Ayacucho'},{id:'san-juan-bautista',nombre:'San Juan Bautista'},{id:'carmen-alto',nombre:'Carmen Alto'},{id:'jesus-nazareno',nombre:'Jesús Nazareno'}];
export interface Recurso { id?: string; identificador: string; activo: boolean }
export interface DatosOferta {
  tipo: Tipo; categoriaId: string; zonaId: string; titulo: string; descripcion: string; incluye: string[]; condiciones: string[];
  modalidadPrecio: 'fija' | 'cotizacion'; tarifaCentimos: number | null; unidad: 'día' | 'servicio' | null; activa: boolean; recursos: Recurso[];
}
export interface Publicacion extends DatosOferta { id: string; proveedorId: string; version: number; estadoModeracion: 'permitida' | 'retirada'; creadoEn: string; actualizadoEn: string }
export interface FiltrosCatalogo { q: string; tipo: string; categoriaId: string; zonaId: string; precioMaximoCentimos?: number; page: number; limit: number; orden: 'recomendados'|'precio'|'nombre' }
export interface ProveedorCatalogo { id: string; nombrePublico: string; estadoVerificacion: string }
export function fallo(mensaje = 'Revisa los datos de la oferta.'): never { throw new ErrorCatalogo('ENTRADA_INVALIDA',400,mensaje); }
export function objeto(value: unknown, campos: string[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(c => !campos.includes(c))) fallo();
  return value as Record<string, unknown>;
}
export function texto(value: unknown, min: number, max: number): string {
  if (typeof value !== 'string' || Array.from(value.trim()).length < min || Array.from(value.trim()).length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) fallo();
  return value.trim();
}
export function uuid(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) fallo('Identificador inválido.');
  return value;
}
export function version(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1 || value > 2147483646) fallo('Recarga la oferta antes de guardar.');
  return value;
}
function lista(value: unknown): string[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 10) fallo('Incluye entre uno y diez puntos en cada lista.');
  return value.map(v => texto(v,2,200));
}
export function entradaOferta(value: unknown, editar = false): {datos: DatosOferta; versionActual?: number} {
  const d = objeto(value,['tipo','categoriaId','zonaId','titulo','descripcion','incluye','condiciones','modalidadPrecio','tarifaCentimos','unidad','activa','recursos',...(editar?['versionActual']:[])]);
  if (!['herramienta','servicio'].includes(String(d.tipo)) || !categorias.some(c=>c.id===d.categoriaId && c.tipo===d.tipo) || !zonas.some(z=>z.id===d.zonaId)) fallo('Selecciona tipo, categoría y distrito compatibles.');
  if (typeof d.activa !== 'boolean' || !['fija','cotizacion'].includes(String(d.modalidadPrecio))) fallo();
  if (d.modalidadPrecio === 'fija') {
    if (typeof d.tarifaCentimos !== 'number' || !Number.isSafeInteger(d.tarifaCentimos) || d.tarifaCentimos < 1 || d.tarifaCentimos > 99999999 || d.unidad !== (d.tipo==='herramienta'?'día':'servicio')) fallo('Indica una tarifa positiva en céntimos y su unidad.');
  } else if (d.tipo !== 'servicio' || d.tarifaCentimos !== null || d.unidad !== null) fallo('Solo los servicios pueden tener precio a cotizar.');
  if (!Array.isArray(d.recursos) || d.recursos.length < 1 || d.recursos.length > 20 || (d.tipo==='servicio' && d.recursos.length !== 1)) fallo('Indica de una a veinte unidades, o una agenda para servicios.');
  const recursos = d.recursos.map(v => {
    const r = objeto(v,editar?['id','identificador','activo']:['identificador','activo']);
    if (typeof r.activo !== 'boolean') fallo();
    return { ...(r.id === undefined ? {} : {id:uuid(r.id)}), identificador:texto(r.identificador,1,80), activo:r.activo };
  });
  if (new Set(recursos.map(r=>r.identificador.toLocaleLowerCase('es'))).size !== recursos.length || new Set(recursos.filter(r=>r.id).map(r=>r.id)).size !== recursos.filter(r=>r.id).length) fallo('Las unidades deben tener identificadores únicos.');
  if (d.activa && !recursos.some(r=>r.activo)) fallo('Una oferta activa necesita al menos un recurso activo.');
  return {datos:{tipo:d.tipo as Tipo,categoriaId:d.categoriaId as string,zonaId:d.zonaId as string,titulo:texto(d.titulo,5,120),descripcion:texto(d.descripcion,20,3000),incluye:lista(d.incluye),condiciones:lista(d.condiciones),modalidadPrecio:d.modalidadPrecio as 'fija'|'cotizacion',tarifaCentimos:d.tarifaCentimos as number|null,unidad:d.unidad as DatosOferta['unidad'],activa:d.activa,recursos},...(editar?{versionActual:version(d.versionActual)}:{})};
}
export function filtros(value: unknown): FiltrosCatalogo {
  const d = objeto(value,['q','tipo','categoriaId','zonaId','precioMaximoCentimos','page','limit','orden']);
  if (Object.values(d).some(v=>typeof v!=='string')) fallo('Filtros inválidos.');
  const numero = (v: unknown, base: number, max: number) => { if (v===undefined) return base; if (!/^\d{1,8}$/.test(String(v)) || Number(v)<1 || Number(v)>max) fallo('Paginación inválida.');return Number(v); };
  const tipo = String(d.tipo??''), categoriaId = String(d.categoriaId??''), zonaId = String(d.zonaId??'');
  if ((tipo && !['herramienta','servicio'].includes(tipo)) || (categoriaId && !categorias.some(c=>c.id===categoriaId && (!tipo || c.tipo===tipo))) || (zonaId && !zonas.some(z=>z.id===zonaId)) || (d.q!==undefined && String(d.q).length>200) || (d.orden!==undefined && !['recomendados','precio','nombre'].includes(String(d.orden)))) fallo('Filtros inválidos.');
  if (d.precioMaximoCentimos!==undefined && (!/^\d{1,8}$/.test(String(d.precioMaximoCentimos)))) fallo('Presupuesto inválido.');
  return {q:String(d.q??'').trim(),tipo,categoriaId,zonaId,page:numero(d.page,1,10000),limit:numero(d.limit,20,50),orden:(d.orden??'recomendados') as FiltrosCatalogo['orden'],...(d.precioMaximoCentimos===undefined?{}:{precioMaximoCentimos:Number(d.precioMaximoCentimos)})};
}
export function editarRecursos(actual: Publicacion, datos: DatosOferta) {
  if (actual.tipo !== datos.tipo) fallo('El tipo de una oferta no se puede cambiar. Crea otra publicación.');
  const ids = new Set(actual.recursos.map(r=>r.id));
  if (datos.recursos.some(r=>r.id && !ids.has(r.id)) || actual.recursos.some(r=>!datos.recursos.some(n=>n.id===r.id))) fallo('Conserva las unidades existentes; puedes desactivarlas sin borrar su historial.');
  if (actual.estadoModeracion==='retirada' && datos.activa) throw new ErrorCatalogo('OFERTA_RETIRADA',409,'La oferta fue retirada por moderación. No puedes reactivarla.');
}
