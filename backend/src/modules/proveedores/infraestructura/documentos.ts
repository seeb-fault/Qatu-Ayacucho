import { ArchivoRechazado, ArchivosCifrados } from '../../../shared/infraestructura/archivos-cifrados';
import { ErrorProveedor } from '../dominio/proveedor';
import type { ArchivoRecibido, DocumentoCifrado } from '../dominio/verificacion';
import type { CifradoDocumentos } from '../dominio/puertos';

const PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png'] as const;

/** Documentos de verificación: PDF, JPG o PNG cifrados con el adapter compartido. */
export class DocumentosPrivados implements CifradoDocumentos {
  private readonly archivos = new ArchivosCifrados();

  habilitado() { return this.archivos.habilitado(); }

  private traducir(error: unknown): never {
    if (error instanceof ArchivoRechazado) {
      if (error.motivo === 'NO_DISPONIBLE') throw new ErrorProveedor('DOCUMENTOS_NO_DISPONIBLES', 503, 'La recepción de documentos todavía no está disponible.');
      if (error.motivo === 'TAMANO') throw new ErrorProveedor('ARCHIVO_INVALIDO', 400, 'Cada archivo debe tener contenido y ocupar como máximo 5 MiB.');
      throw new ErrorProveedor('ARCHIVO_INVALIDO', 400, 'Solo se admiten PDF, JPG o PNG con formato y tipo compatibles.');
    }
    throw error;
  }

  cifrar(archivo: ArchivoRecibido): DocumentoCifrado {
    try { return this.archivos.cifrar(archivo, PERMITIDOS); } catch (error) { return this.traducir(error); }
  }

  descifrar(documento: DocumentoCifrado) {
    try { return this.archivos.descifrar(documento); } catch (error) { return this.traducir(error); }
  }
}
