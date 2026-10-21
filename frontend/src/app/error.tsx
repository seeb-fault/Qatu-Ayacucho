'use client';
export default function ErrorPage({reset}:{error:Error;reset:()=>void}){return <div className="container empty-state" role="alert"><h1>Algo interrumpió la carga</h1><p>Vuelve a intentarlo. Tus filtros permanecen en la dirección de la página.</p><button className="button primary" onClick={reset}>Reintentar</button></div>;}
