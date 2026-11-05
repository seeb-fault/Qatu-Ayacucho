import type {Metadata,Viewport} from 'next';import {Plus_Jakarta_Sans} from 'next/font/google';import Navegacion,{Footer} from '@/components/descubrimiento/Navegacion';import ProveedorUI from '@/components/ui/ProveedorUI';import './globals.css';import './marketplace.css';import './qatu.css';
const sans=Plus_Jakarta_Sans({subsets:['latin'],variable:'--font-sans',display:'swap'});
export const metadata:Metadata={title:{default:'Qatu · Encuentra, alquila y contrata en Ayacucho',template:'%s · Qatu'},description:'Explora herramientas de alquiler y oficios en Ayacucho. Prototipo académico con ofertas y precios de demostración.'};
export const viewport:Viewport={themeColor:'#FFFFFF'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es-PE" className={sans.variable}><body><ProveedorUI><Navegacion/><main id="contenido">{children}</main><Footer/></ProveedorUI></body></html>;}

export const dynamic='force-dynamic';
