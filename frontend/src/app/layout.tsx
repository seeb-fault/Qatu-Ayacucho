import type {Metadata} from 'next';import Navegacion,{Footer} from '@/components/descubrimiento/Navegacion';import './globals.css';
export const metadata:Metadata={title:{default:'Qatu · Herramientas y talento cerca de ti',template:'%s · Qatu'},description:'Explora herramientas de alquiler y oficios en Ayacucho. Prototipo académico con ofertas y precios de demostración.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es-PE"><body><Navegacion/><main id="contenido">{children}</main><Footer/></body></html>;}
