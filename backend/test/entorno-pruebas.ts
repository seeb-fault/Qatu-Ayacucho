// Se carga antes de cada archivo de prueba (npm test). Aunque el .env de desarrollo pida R2, las pruebas nunca salen
// a internet: usan PostgreSQL salvo que una prueba elija otro almacén de forma explícita (por ejemplo, memoria).
process.env.QATU_ALMACEN = process.env.QATU_ALMACEN_PRUEBAS ?? 'postgres';
