/**
 * Caso con nombre dentro de una prueba de Jest. Las pruebas de integración preparan una vez la base, la API y
 * las cuentas, y recorren varios casos en orden sobre ese mismo estado; cada caso se ejecuta con esta función. Si un caso falla,
 * el mensaje de Jest empieza con su nombre.
 */
export async function caso(nombre: string, cuerpo: () => unknown | Promise<unknown>): Promise<void> {
  try {
    await cuerpo();
  } catch (error) {
    if (error instanceof Error) error.message = `[${nombre}] ${error.message}`;
    throw error;
  }
}
