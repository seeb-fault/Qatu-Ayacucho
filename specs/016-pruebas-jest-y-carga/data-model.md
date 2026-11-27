# Modelo de datos — Pruebas automatizadas con Jest y carga hasta 2 000 usuarios

Sin cambios en la base. Datos sintéticos de carga (`backend/test/carga/datos-carga.ts`): 100 proveedores aprobados, 1 000 publicaciones en todas las categorías y distritos, 5 clientes y 5 000 reservas, en una base `_test` exclusiva.

| Variable | Dónde | Efecto |
|---|---|---|
| `TEST_DATABASE_URL` | Jest | Sin ella se omiten las pruebas de integración |
| `PERFIL=2000`, `RAPIDO=1` | k6 | Escalones hasta 2 000 usuarios; corrida corta de 20 s por escalón |
