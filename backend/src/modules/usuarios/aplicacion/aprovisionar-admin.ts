import { emailValido, motivoValido, nombreValido, passwordValido } from '../dominio/usuario';
import type { HashPasswords, RepositorioUsuarios } from '../dominio/puertos';

export async function aprovisionarAdmin(repo: RepositorioUsuarios, passwords: HashPasswords, datos: Record<string, string | undefined>) {
  const email = emailValido(datos.QATU_ADMIN_EMAIL);
  const nombre = nombreValido(datos.QATU_ADMIN_NOMBRE);
  const password = passwordValido(datos.QATU_ADMIN_PASSWORD);
  const motivo = motivoValido(datos.QATU_ADMIN_MOTIVO);
  return repo.crearAdministrador(email, nombre, await passwords.crear(password), motivo);
}
