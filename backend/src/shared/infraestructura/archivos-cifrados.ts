import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';

/** Formato detectado por la firma del contenido, no por el nombre ni por lo que declara el navegador. */
export type TipoArchivo = 'image/png' | 'image/jpeg' | 'application/pdf';
export interface ArchivoEntrante { buffer: Uint8Array; mimetype: string; size: number }
export interface ArchivoCifrado { id: string; tipo: TipoArchivo; bytes: number; sha256: string; contenido: Uint8Array; iv: Uint8Array; tag: Uint8Array }
export const MAXIMO_BYTES = 5 * 1024 * 1024;

export class ArchivoRechazado extends Error {
  constructor(readonly motivo: 'NO_DISPONIBLE' | 'TAMANO' | 'FORMATO') { super(motivo); }
}

export function detectarTipo(buffer: Buffer): TipoArchivo | null {
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255 && buffer.subarray(-2).equals(Buffer.from([255, 217]))) return 'image/jpeg';
  if (/^%PDF-[12]\.[0-9]/.test(buffer.subarray(0, 8).toString('ascii')) && buffer.subarray(-1024).includes(Buffer.from('%%EOF'))) return 'application/pdf';
  return null;
}

/**
 * AES-256-GCM con IV aleatorio de 12 bytes y el id del archivo como dato autenticado.
 * La clave es DOCUMENTOS_KEY (hex de 32 bytes), externa al repositorio y a la base de datos.
 */
export class ArchivosCifrados {
  habilitado() { return /^[a-f0-9]{64}$/i.test(process.env.DOCUMENTOS_KEY ?? ''); }

  private clave() {
    if (!this.habilitado()) throw new ArchivoRechazado('NO_DISPONIBLE');
    return Buffer.from(process.env.DOCUMENTOS_KEY!, 'hex');
  }

  cifrar(archivo: ArchivoEntrante, permitidos: readonly TipoArchivo[]): ArchivoCifrado {
    const clave = this.clave(), buffer = Buffer.from(archivo.buffer);
    if (!buffer.length || buffer.length !== archivo.size || buffer.length > MAXIMO_BYTES) throw new ArchivoRechazado('TAMANO');
    const tipo = detectarTipo(buffer);
    if (!tipo || !permitidos.includes(tipo) || tipo !== archivo.mimetype) throw new ArchivoRechazado('FORMATO');
    const id = randomUUID(), iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', clave, iv);
    cipher.setAAD(Buffer.from(id));
    const contenido = Buffer.concat([cipher.update(buffer), cipher.final()]);
    return { id, tipo, bytes: buffer.length, sha256: createHash('sha256').update(buffer).digest('hex'), contenido, iv, tag: cipher.getAuthTag() };
  }

  descifrar(archivo: Pick<ArchivoCifrado, 'id' | 'contenido' | 'iv' | 'tag'>) {
    const cipher = createDecipheriv('aes-256-gcm', this.clave(), archivo.iv);
    cipher.setAAD(Buffer.from(archivo.id));
    cipher.setAuthTag(archivo.tag);
    return Buffer.concat([cipher.update(archivo.contenido), cipher.final()]);
  }
}
