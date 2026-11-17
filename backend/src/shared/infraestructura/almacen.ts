import { createHash, createHmac } from 'node:crypto';

/**
 * Almacén de objetos para archivos cifrados (013). Qatu cifra antes de guardar: el almacén solo ve bytes cifrados,
 * y el IV y la etiqueta de autenticación quedan en PostgreSQL.
 */
export interface AlmacenObjetos {
  readonly nombre: 'r2' | 'memoria';
  guardar(clave: string, datos: Uint8Array): Promise<void>;
  /** null si el objeto no existe. */
  leer(clave: string): Promise<Buffer | null>;
  /** Idempotente: borrar un objeto que no existe no es un error. */
  borrar(clave: string): Promise<void>;
}

export class ErrorAlmacen extends Error {}

const CLAVE = /^[a-z0-9-]+\/[a-z0-9-]+\/[0-9a-f-]{36}$/;
export const claveObjeto = (modulo: 'proveedores' | 'resenas', tipo: 'documentos' | 'evidencias', id: string) => {
  const clave = `${modulo}/${tipo}/${id}`;
  if (!CLAVE.test(clave)) throw new ErrorAlmacen('Clave de objeto inválida.');
  return clave;
};

/** Solo para pruebas: guarda en memoria, compartida por todo el proceso. */
export class AlmacenMemoria implements AlmacenObjetos {
  readonly nombre = 'memoria' as const;
  static readonly objetos = new Map<string, Buffer>();
  /** Permite simular caídas del almacén en las pruebas. */
  static fallar: ((operacion: 'guardar' | 'leer' | 'borrar', clave: string) => boolean) | null = null;
  private revisar(operacion: 'guardar' | 'leer' | 'borrar', clave: string) {
    if (AlmacenMemoria.fallar?.(operacion, clave)) throw new ErrorAlmacen(`Fallo simulado al ${operacion}.`);
  }
  async guardar(clave: string, datos: Uint8Array) { this.revisar('guardar', clave); AlmacenMemoria.objetos.set(clave, Buffer.from(datos)); }
  async leer(clave: string) { this.revisar('leer', clave); const d = AlmacenMemoria.objetos.get(clave); return d ? Buffer.from(d) : null; }
  async borrar(clave: string) { this.revisar('borrar', clave); AlmacenMemoria.objetos.delete(clave); }
}

const sha256 = (d: Uint8Array | string) => createHash('sha256').update(d).digest('hex');
const hmac = (k: Uint8Array | string, d: string) => createHmac('sha256', k).update(d).digest();

/**
 * Cloudflare R2 por su API compatible con S3, firmada con AWS Signature V4 (región «auto»).
 * Sin SDK: solo PUT, GET y DELETE de un objeto, con fetch y node:crypto.
 */
export class AlmacenR2 implements AlmacenObjetos {
  readonly nombre = 'r2' as const;
  private readonly base: URL;

  constructor(endpoint: string, private readonly claveAcceso: string, private readonly secreto: string, private readonly bucket: string,
    private readonly peticion: typeof fetch = fetch, private readonly ahora = () => new Date(), private readonly timeoutMs = 20_000) {
    this.base = new URL(endpoint.replace(/\/$/, ''));
  }

  /** Cabeceras firmadas de una petición. Pública para poder probar la firma. */
  firmar(metodo: string, url: URL, cuerpo: Uint8Array) {
    const fecha = this.ahora().toISOString().replace(/[:-]|\.\d{3}/g, ''), dia = fecha.slice(0, 8);
    const hashCuerpo = sha256(cuerpo);
    const cabeceras: Record<string, string> = { host: url.host, 'x-amz-content-sha256': hashCuerpo, 'x-amz-date': fecha };
    const firmadas = Object.keys(cabeceras).sort();
    const ruta = url.pathname.split('/').map(s => encodeURIComponent(decodeURIComponent(s))).join('/');
    const canonica = [metodo, ruta, '', firmadas.map(h => `${h}:${cabeceras[h]}\n`).join(''), firmadas.join(';'), hashCuerpo].join('\n');
    const alcance = `${dia}/auto/s3/aws4_request`;
    const aFirmar = ['AWS4-HMAC-SHA256', fecha, alcance, sha256(canonica)].join('\n');
    const llave = hmac(hmac(hmac(hmac('AWS4' + this.secreto, dia), 'auto'), 's3'), 'aws4_request');
    const firma = createHmac('sha256', llave).update(aFirmar).digest('hex');
    const { host: _host, ...resto } = cabeceras;
    return { ...resto, authorization: `AWS4-HMAC-SHA256 Credential=${this.claveAcceso}/${alcance}, SignedHeaders=${firmadas.join(';')}, Signature=${firma}` };
  }

  private async llamar(metodo: 'PUT' | 'GET' | 'DELETE', clave: string, cuerpo: Uint8Array = new Uint8Array()) {
    const url = new URL(`/${this.bucket}/${clave}`, this.base);
    try {
      return await this.peticion(url, { method: metodo, headers: this.firmar(metodo, url, cuerpo), body: metodo === 'PUT' ? new Blob([new Uint8Array(cuerpo)]) : undefined, signal: AbortSignal.timeout(this.timeoutMs) });
    } catch {
      throw new ErrorAlmacen(`No se pudo conectar con el almacén (${metodo}).`);
    }
  }

  async guardar(clave: string, datos: Uint8Array) {
    const r = await this.llamar('PUT', clave, datos);
    if (r.status !== 200) throw new ErrorAlmacen(`El almacén respondió ${r.status} al guardar.`);
  }

  async leer(clave: string) {
    const r = await this.llamar('GET', clave);
    if (r.status === 404) return null;
    if (r.status !== 200) throw new ErrorAlmacen(`El almacén respondió ${r.status} al leer.`);
    return Buffer.from(await r.arrayBuffer());
  }

  async borrar(clave: string) {
    const r = await this.llamar('DELETE', clave);
    if (r.status !== 204 && r.status !== 200 && r.status !== 404) throw new ErrorAlmacen(`El almacén respondió ${r.status} al borrar.`);
  }
}

/**
 * Elige dónde guardar los archivos según QATU_ALMACEN:
 * - vacío o `postgres`: dentro de PostgreSQL, como antes de 013 (null: sin almacén externo);
 * - `r2`: Cloudflare R2, con QATU_R2_ENDPOINT, QATU_R2_ACCESS_KEY_ID, QATU_R2_SECRET_ACCESS_KEY y QATU_R2_BUCKET_PRIVADO;
 * - `memoria`: solo pruebas; prohibido en producción.
 * Tener las llaves de R2 en el .env no basta: hay que pedirlo, para que las pruebas nunca salgan a internet.
 */
export function crearAlmacen(env: NodeJS.ProcessEnv = process.env): AlmacenObjetos | null {
  const modo = env.QATU_ALMACEN?.trim() || 'postgres';
  if (modo === 'postgres') return null;
  if (modo === 'memoria') {
    if (env.NODE_ENV === 'production') throw new Error('QATU_ALMACEN=memoria no se puede usar en producción.');
    return new AlmacenMemoria();
  }
  if (modo !== 'r2') throw new Error('QATU_ALMACEN admite postgres, r2 o memoria.');
  const v = (k: string) => env[k]?.trim() ?? '';
  const endpoint = v('QATU_R2_ENDPOINT'), clave = v('QATU_R2_ACCESS_KEY_ID'), secreto = v('QATU_R2_SECRET_ACCESS_KEY'), bucket = v('QATU_R2_BUCKET_PRIVADO');
  if (!/^https:\/\/[a-f0-9]{32}\.r2\.cloudflarestorage\.com\/?$/.test(endpoint)) throw new Error('QATU_R2_ENDPOINT debe ser https://<id de cuenta>.r2.cloudflarestorage.com.');
  if (!clave || !secreto) throw new Error('Configura QATU_R2_ACCESS_KEY_ID y QATU_R2_SECRET_ACCESS_KEY.');
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)) throw new Error('QATU_R2_BUCKET_PRIVADO no es un nombre de bucket válido.');
  return new AlmacenR2(endpoint, clave, secreto, bucket);
}

let compartido: AlmacenObjetos | null | undefined;
/** Una sola instancia por proceso (todas las partes deben ver el mismo almacén en memoria). */
export function almacenDelProceso() {
  if (compartido === undefined) compartido = crearAlmacen();
  return compartido;
}
/** Solo pruebas: vuelve a leer la configuración. */
export function reiniciarAlmacenDelProceso() { compartido = undefined; }
