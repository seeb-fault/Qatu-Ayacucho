import MiLista from '@/components/lista/MiLista';

export const metadata = { title: 'Mi lista | Qatu' };

// La cookie de sesión solo viaja a /api/v1: MiLista consulta la API y, sin sesión,
// lleva a Ingresar con regreso a /lista.
export default function ListaPage() { return <MiLista/>; }
