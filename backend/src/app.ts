import 'reflect-metadata';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { UsuariosModule } from './modules/usuarios';
import { ErrorUsuario } from './modules/usuarios/dominio/usuario';

@Module({ imports: [UsuariosModule] })
class AppModule {}

@Catch()
class Errores implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = error instanceof ErrorUsuario ? error.status : error instanceof HttpException ? error.getStatus() : 503;
    const code = error instanceof ErrorUsuario ? error.code : status === 503 ? 'SERVICIO_NO_DISPONIBLE' : 'SOLICITUD_INVALIDA';
    const mensaje = error instanceof ErrorUsuario ? error.message : status === 503 ? 'El servicio no está disponible. Intenta nuevamente.' : 'No se pudo procesar la solicitud.';
    response.status(status).json({ code, mensaje, correlationId: response.getHeader('X-Correlation-Id') });
  }
}

export async function crearApp() {
  if (!process.env.DATABASE_URL || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.includes('replace-with')) {
    throw new Error('Configura DATABASE_URL y un JWT_SECRET aleatorio de al menos 32 caracteres.');
  }
  const origin = process.env.APP_ORIGIN ?? 'http://127.0.0.1:3000';
  const parsedOrigin = new URL(origin);
  if (parsedOrigin.origin !== origin || (process.env.NODE_ENV === 'production' && parsedOrigin.protocol !== 'https:')) throw new Error('APP_ORIGIN debe ser un origen válido; en producción requiere HTTPS.');
  const app = await NestFactory.create(AppModule, { logger: false });
  app.enableShutdownHooks();
  app.setGlobalPrefix('api/v1');
  app.use((request: Request, response: Response, next: NextFunction) => {
    response.setHeader('X-Correlation-Id', randomUUID());
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      if (request.headers.origin !== origin || !request.is('application/json') || request.headers['sec-fetch-site'] === 'cross-site') {
        response.status(403).json({ code: 'ORIGEN_INVALIDO', mensaje: 'Solicitud no permitida.', correlationId: response.getHeader('X-Correlation-Id') });
        return;
      }
    }
    next();
  });
  app.useGlobalFilters(new Errores());
  return app;
}
