import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Perfil from '@/components/usuarios/Perfil';

export const metadata = { title: 'Mi cuenta' };

/** Sin sesión no hay perfil que mostrar: se va directo al ingreso. */
export default async function CuentaPage() {
  if (!(await cookies()).has('qatu_sesion')) redirect('/ingresar');
  return <Perfil/>;
}
