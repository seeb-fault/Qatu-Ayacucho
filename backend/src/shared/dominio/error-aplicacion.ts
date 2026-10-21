export class ErrorAplicacion extends Error {
  constructor(public readonly code: string, public readonly status: number, mensaje: string) {
    super(mensaje);
  }
}
