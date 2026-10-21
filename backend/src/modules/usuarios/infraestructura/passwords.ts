import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import type { HashPasswords } from '../dominio/puertos';

function derivar(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key));
  });
}

export class ScryptPasswords implements HashPasswords {
  async crear(password: string) {
    const salt = randomBytes(16).toString('hex');
    return `scrypt$${salt}$${(await derivar(password, salt)).toString('hex')}`;
  }

  async verificar(password: string, hash: string) {
    const [algoritmo, salt, valor] = hash.split('$');
    if (algoritmo !== 'scrypt' || !/^[a-f0-9]{32}$/.test(salt ?? '') || !/^[a-f0-9]{128}$/.test(valor ?? '')) return false;
    return timingSafeEqual(await derivar(password, salt), Buffer.from(valor, 'hex'));
  }
}
