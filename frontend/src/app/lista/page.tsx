import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import MiLista from '@/components/lista/MiLista';
import { ingresarYVolver } from '@/lib/rutas';

export const metadata = { title: 'Mi lista | Qatu' };

/** La lista vive en la cuenta: sin sesión se ingresa y se vuelve aquí. */
export default async function ListaPage() {
  if (!(await cookies()).has('qatu_sesion')) redirect(ingresarYVolver('/lista'));
  return <MiLista/>;
}
