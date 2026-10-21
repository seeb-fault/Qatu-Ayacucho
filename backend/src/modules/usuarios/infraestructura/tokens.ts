import { JwtService } from '@nestjs/jwt';
import type { TokensSesion } from '../dominio/puertos';

export class JwtTokens implements TokensSesion {
  constructor(private readonly jwt: JwtService) {}

  emitir(usuarioId: string, sesionId: string) {
    return this.jwt.signAsync({ sub: usuarioId, sid: sesionId }, { expiresIn: '15m', issuer: 'qatu-api', audience: 'qatu-web', algorithm: 'HS256' });
  }

  async leer(token: string) {
    const claims = await this.jwt.verifyAsync(token, { issuer: 'qatu-api', audience: 'qatu-web', algorithms: ['HS256'] });
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof claims.sub !== 'string' || typeof claims.sid !== 'string' || !uuid.test(claims.sub) || !uuid.test(claims.sid)) throw new Error('JWT inválido');
    return { sub: claims.sub as string, sid: claims.sid as string };
  }
}
