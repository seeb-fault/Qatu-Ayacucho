# Contrato HTTP — Información legal y Libro de Reclamaciones

| Método | Ruta | Cuerpo / respuesta | Errores |
|---|---|---|---|
| GET | /reclamaciones/titular | `{ razonSocial, ruc, direccion, correo, telefono }`; cada campo puede ser `null` | — |
| POST | /reclamaciones | `{ tipo, nombre, tipoDocumento, numeroDocumento, domicilio, telefono?, email, medioRespuesta, menorDeEdad?, apoderadoNombre?, apoderadoDocumento?, bienTipo, bienDescripcion, montoCentimos?, detalle, pedido }` → 201 con la constancia y `codigoConsulta` (solo esta vez). Sesión opcional | 400 datos inválidos o campos desconocidos; 403 origen ajeno; 429 más de 3 por documento en 15 min |
| GET | /reclamaciones/consulta?numero=&codigo= | La constancia, con `respuesta: { texto, medio, respondidaEn } \| null` | 400 formato inválido; 404 número o código incorrecto; 429 |
| GET | /admin/reclamaciones?estado=pendiente\|respondida&page= | `{ items: [{ id, ...constancia, vencida }], total, page, limit }` | 401; 403 sin rol de administrador; 400 estado inválido |
| PATCH | /admin/reclamaciones/:id/respuesta | `{ respuesta, medio: 'correo' \| 'carta' }` → la hoja con su respuesta | 400; 401; 403; 404; 409 ya respondida |

La constancia no incluye ids internos. Páginas web: `/libro-de-reclamaciones`, `/terminos`, `/devoluciones`, `/privacidad`, `/contacto` y `/admin/reclamaciones`.
