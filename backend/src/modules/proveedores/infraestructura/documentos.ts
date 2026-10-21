import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { ErrorProveedor } from '../dominio/proveedor';
import type { ArchivoRecibido, DocumentoCifrado } from '../dominio/verificacion';
import type { CifradoDocumentos } from '../dominio/puertos';

export class DocumentosPrivados implements CifradoDocumentos {
  habilitado() { return /^[a-f0-9]{64}$/i.test(process.env.DOCUMENTOS_KEY ?? ''); }

  private clave() {
    if (!this.habilitado()) throw new ErrorProveedor('DOCUMENTOS_NO_DISPONIBLES', 503, 'La recepción de documentos todavía no está disponible.');
    return Buffer.from(process.env.DOCUMENTOS_KEY!, 'hex');
  }

  cifrar(archivo: ArchivoRecibido): DocumentoCifrado {
    const clave = this.clave();
    const buffer = Buffer.from(archivo.buffer);
    if (!buffer.length || buffer.length !== archivo.size || buffer.length > 5 * 1024 * 1024) throw new ErrorProveedor('ARCHIVO_INVALIDO', 400, 'Cada archivo debe tener contenido y ocupar como máximo 5 MiB.');
    const png = buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const jpeg = buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255 && buffer.subarray(-2).equals(Buffer.from([255,217]));
    const pdf = /^%PDF-[12]\.[0-9]/.test(buffer.subarray(0,8).toString('ascii')) && buffer.subarray(-1024).includes(Buffer.from('%%EOF'));
    const tipo = png ? 'image/png' : jpeg ? 'image/jpeg' : pdf ? 'application/pdf' : null;
    if (!tipo || tipo !== archivo.mimetype) throw new ErrorProveedor('ARCHIVO_INVALIDO', 400, 'Solo se admiten PDF, JPG o PNG con formato y tipo compatibles.');
    const id = randomUUID();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', clave, iv);
    cipher.setAAD(Buffer.from(id));
    const contenido = Buffer.concat([cipher.update(buffer), cipher.final()]);
    return { id, tipo, bytes: buffer.length, sha256: createHash('sha256').update(buffer).digest('hex'), contenido, iv, tag: cipher.getAuthTag() };
  }

  descifrar(documento: DocumentoCifrado) {
    const cipher = createDecipheriv('aes-256-gcm', this.clave(), documento.iv);
    cipher.setAAD(Buffer.from(documento.id));
    cipher.setAuthTag(documento.tag);
    return Buffer.concat([cipher.update(documento.contenido), cipher.final()]);
  }
}
