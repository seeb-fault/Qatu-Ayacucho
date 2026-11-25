/**
 * Jest (Sprint 2): pruebas unitarias y de integración del backend, con reporte de cobertura.
 * - Sin base de datos corren las pruebas de dominio; con TEST_DATABASE_URL (una base _test) también las de
 *   integración contra PostgreSQL real, como en el CI.
 * - Una prueba a la vez (maxWorkers 1): muchas comparten la base y levantan la API.
 * - SWC compila TypeScript con decoradores; Nest no depende de emitDecoratorMetadata (usa @Inject explícito).
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['@swc/jest', {
      jsc: { parser: { syntax: 'typescript', decorators: true }, transform: { legacyDecorator: true, decoratorMetadata: true }, target: 'es2023' },
      module: { type: 'commonjs' },
    }],
  },
  setupFiles: ['<rootDir>/test/entorno-pruebas.ts'],
  // Las pruebas usan node:assert/strict; este adaptador evita falsos negativos entre contextos vm (ver el archivo).
  moduleNameMapper: { '^node:assert/strict$': '<rootDir>/test/assert-jest.ts' },
  maxWorkers: 1,
  // Las pruebas de integración levantan la API y recorren flujos completos: algunas tardan más de un minuto.
  testTimeout: 600000,
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'],
  coverageProvider: 'v8',
  coverageDirectory: 'coverage',
  coverageReporters: ['text-summary', 'text', 'html', 'lcov', 'json-summary'],
};
