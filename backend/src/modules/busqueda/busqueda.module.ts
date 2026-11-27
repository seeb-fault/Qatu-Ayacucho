import { Module } from '@nestjs/common';
import { CatalogoModule, ConsultaCatalogo } from '../catalogo';
import { IdentidadUsuarios, UsuariosModule } from '../usuarios';
import { BuscarEnLenguajeNatural } from './aplicacion/busqueda';
import { InterpreteOpenRouter, MODELO_POR_DEFECTO, URL_OPENROUTER } from './infraestructura/openrouter';
import { BusquedaController } from './presentacion/busqueda.controller';

/** La IA se activa solo con OPENROUTER_API_KEY. Sin ella, la búsqueda funciona en modo convencional. */
export function crearInterprete(entorno: NodeJS.ProcessEnv = process.env) {
  const llave = entorno.OPENROUTER_API_KEY?.trim();
  return llave ? new InterpreteOpenRouter(llave, entorno.QATU_IA_MODELO?.trim() || MODELO_POR_DEFECTO, entorno.QATU_IA_URL?.trim() || URL_OPENROUTER) : null;
}

@Module({
  imports: [CatalogoModule, UsuariosModule],
  controllers: [BusquedaController],
  providers: [{
    provide: BuscarEnLenguajeNatural, inject: [ConsultaCatalogo, IdentidadUsuarios],
    useFactory: (catalogo: ConsultaCatalogo, identidad: IdentidadUsuarios) => new BuscarEnLenguajeNatural(catalogo, identidad, crearInterprete()),
  }],
})
export class BusquedaModule {}
