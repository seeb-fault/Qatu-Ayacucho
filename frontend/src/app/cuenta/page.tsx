import Perfil from '@/components/usuarios/Perfil';

export const metadata = { title: 'Mi cuenta' };

// La cookie de sesión solo viaja a /api/v1, así que la página no la ve: Perfil consulta la API
// y, si responde 401, lleva directo a Ingresar.
export default function CuentaPage() { return <Perfil/>; }
