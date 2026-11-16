import { ErrorResena } from './resenas';

/**
 * Libro de Reclamaciones virtual (012). Ley 29571 y Reglamento DS 011-2011-PCM, modificado por DS 101-2022-PCM:
 * respuesta por escrito en un plazo no mayor a 15 días hábiles, por el medio que elija el consumidor.
 */
export const DIAS_HABILES_PARA_RESPONDER = 15;

export type TipoHoja = 'reclamo' | 'queja';
export type TipoDocumento = 'DNI' | 'CE' | 'PASAPORTE' | 'RUC';
export type MedioRespuesta = 'correo' | 'carta';

/** Datos de Qatu como proveedor. Vienen de la configuración; null mientras no se definan. */
export interface Titular { razonSocial: string | null; ruc: string | null; direccion: string | null; correo: string | null; telefono: string | null }

export interface EntradaHoja {
  tipo: TipoHoja;
  nombre: string; tipoDocumento: TipoDocumento; numeroDocumento: string; domicilio: string; telefono: string | null; email: string;
  medioRespuesta: MedioRespuesta;
  menorDeEdad: boolean; apoderadoNombre: string | null; apoderadoDocumento: string | null;
  bienTipo: 'producto' | 'servicio'; bienDescripcion: string; montoCentimos: number | null;
  detalle: string; pedido: string;
}

export interface Hoja extends EntradaHoja {
  id: string; numero: string; titular: Titular; usuarioId: string | null;
  presentadaEn: string; venceEn: string;
  respuesta: string | null; respuestaMedio: MedioRespuesta | null; respondidaEn: string | null;
}

const invalida = (mensaje: string): never => { throw new ErrorResena('ENTRADA_INVALIDA', 400, mensaje); };
const CAMPOS = ['tipo', 'nombre', 'tipoDocumento', 'numeroDocumento', 'domicilio', 'telefono', 'email', 'medioRespuesta',
  'menorDeEdad', 'apoderadoNombre', 'apoderadoDocumento', 'bienTipo', 'bienDescripcion', 'montoCentimos', 'detalle', 'pedido'];

function objeto(value: unknown, campos: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !campos.includes(k))) invalida('Revisa los datos enviados.');
  return value as Record<string, unknown>;
}
function texto(value: unknown, min: number, max: number, mensaje: string): string {
  const t = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  if (Array.from(t).length < min || Array.from(t).length > max || /[\u0000-\u001f\u007f]/.test(t)) invalida(mensaje);
  return t;
}
/** Igual que `texto`, pero conserva los saltos de línea de los textos largos. */
function parrafo(value: unknown, min: number, max: number, mensaje: string): string {
  const t = typeof value === 'string' ? value.trim().replace(/\r\n?/g, '\n') : '';
  if (Array.from(t).length < min || Array.from(t).length > max || /[\u0000-\u0009\u000b-\u001f\u007f]/.test(t)) invalida(mensaje);
  return t;
}

const DOCUMENTOS: Record<TipoDocumento, RegExp> = {
  DNI: /^\d{8}$/, CE: /^[A-Z0-9]{9,12}$/, PASAPORTE: /^[A-Z0-9]{6,12}$/, RUC: /^(10|15|17|20)\d{9}$/,
};
export function documento(tipo: unknown, numero: unknown): { tipoDocumento: TipoDocumento; numeroDocumento: string } {
  if (typeof tipo !== 'string' || !(tipo in DOCUMENTOS)) invalida('Elige el tipo de documento.');
  const n = typeof numero === 'string' ? numero.replace(/[\s-]/g, '').toUpperCase() : '';
  if (!DOCUMENTOS[tipo as TipoDocumento].test(n)) invalida(tipo === 'DNI' ? 'El DNI tiene 8 dígitos.' : tipo === 'RUC' ? 'El RUC tiene 11 dígitos.' : 'Revisa el número de documento.');
  return { tipoDocumento: tipo as TipoDocumento, numeroDocumento: n };
}

export function entradaHoja(value: unknown): EntradaHoja {
  const d = objeto(value, CAMPOS);
  if (d.tipo !== 'reclamo' && d.tipo !== 'queja') invalida('Elige si es un reclamo o una queja.');
  if (d.bienTipo !== 'producto' && d.bienTipo !== 'servicio') invalida('Indica si es un producto o un servicio.');
  if (d.medioRespuesta !== 'correo' && d.medioRespuesta !== 'carta') invalida('Elige cómo quieres recibir la respuesta.');
  const email = texto(d.email, 6, 254, 'Ingresa un correo válido.').toLowerCase();
  if (!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email)) invalida('Ingresa un correo válido.');
  let telefono: string | null = null;
  if (d.telefono !== undefined && d.telefono !== null && d.telefono !== '') {
    const t = typeof d.telefono === 'string' ? d.telefono.replace(/[\s-]/g, '').replace(/^\+?51/, '') : '';
    if (!/^9\d{8}$/.test(t)) invalida('El celular tiene 9 dígitos y empieza con 9.');
    telefono = t;
  }
  let montoCentimos: number | null = null;
  if (d.montoCentimos !== undefined && d.montoCentimos !== null) {
    if (!Number.isInteger(d.montoCentimos) || (d.montoCentimos as number) < 0 || (d.montoCentimos as number) > 100_000_000) invalida('Revisa el monto reclamado.');
    montoCentimos = d.montoCentimos as number;
  }
  if (d.menorDeEdad !== undefined && typeof d.menorDeEdad !== 'boolean') invalida('Revisa los datos enviados.');
  const menorDeEdad = d.menorDeEdad === true;
  const apoderado = menorDeEdad
    ? { apoderadoNombre: texto(d.apoderadoNombre, 3, 150, 'Escribe el nombre del padre, madre o apoderado.'),
        apoderadoDocumento: documento('DNI', d.apoderadoDocumento).numeroDocumento }
    : { apoderadoNombre: null, apoderadoDocumento: null };
  if (!menorDeEdad && (d.apoderadoNombre || d.apoderadoDocumento)) invalida('Los datos del apoderado solo van si el consumidor es menor de edad.');
  return {
    tipo: d.tipo as TipoHoja,
    nombre: texto(d.nombre, 3, 150, 'Escribe tu nombre completo.'),
    ...documento(d.tipoDocumento, d.numeroDocumento),
    domicilio: texto(d.domicilio, 5, 200, 'Escribe tu domicilio.'),
    telefono, email, medioRespuesta: d.medioRespuesta as MedioRespuesta,
    menorDeEdad, ...apoderado,
    bienTipo: d.bienTipo as 'producto' | 'servicio',
    bienDescripcion: texto(d.bienDescripcion, 5, 300, 'Describe el producto o servicio en 5 a 300 caracteres.'),
    montoCentimos,
    detalle: parrafo(d.detalle, 20, 2000, 'Cuenta lo ocurrido en 20 a 2000 caracteres.'),
    pedido: parrafo(d.pedido, 10, 1000, 'Indica tu pedido en 10 a 1000 caracteres.'),
  };
}

export function entradaRespuesta(value: unknown): { respuesta: string; medio: MedioRespuesta } {
  const d = objeto(value, ['respuesta', 'medio']);
  if (d.medio !== 'correo' && d.medio !== 'carta') invalida('Indica por qué medio enviaste la respuesta.');
  return { respuesta: parrafo(d.respuesta, 20, 4000, 'Escribe la respuesta en 20 a 4000 caracteres.'), medio: d.medio as MedioRespuesta };
}

/**
 * Último día para responder: 15 días hábiles contados desde el día siguiente a la presentación, en hora de Lima.
 * Solo descuenta sábados y domingos. Los feriados no se descuentan: el plazo resulta igual o más corto que el legal,
 * nunca más largo, así que es seguro para cumplirlo.
 */
export function venceEn(presentadaEn: Date, dias = DIAS_HABILES_PARA_RESPONDER): string {
  const lima = new Date(presentadaEn.getTime() - 5 * 3_600_000);
  const d = new Date(Date.UTC(lima.getUTCFullYear(), lima.getUTCMonth(), lima.getUTCDate()));
  for (let contados = 0; contados < dias;) {
    d.setUTCDate(d.getUTCDate() + 1);
    const dia = d.getUTCDay();
    if (dia !== 0 && dia !== 6) contados++;
  }
  return d.toISOString().slice(0, 10);
}

export const numeroHoja = (anio: number, correlativo: number) => `LR-${anio}-${String(correlativo).padStart(6, '0')}`;
export const anioLima = (fecha: Date) => new Date(fecha.getTime() - 5 * 3_600_000).getUTCFullYear();

/** Titular configurado por variables de entorno; los campos vacíos quedan en null. */
export function titularConfigurado(env: NodeJS.ProcessEnv = process.env): Titular {
  const v = (k: string) => env[k]?.trim() || null;
  return { razonSocial: v('QATU_TITULAR_RAZON_SOCIAL'), ruc: v('QATU_TITULAR_RUC'), direccion: v('QATU_TITULAR_DIRECCION'),
    correo: v('QATU_TITULAR_CORREO'), telefono: v('QATU_TITULAR_TELEFONO') };
}
