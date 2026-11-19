import { booleano, entero, instante, lista, motivo, nulable, objeto, opciones, ref, registrarEsquemas, respuesta, texto, uuid } from '../../../shared/presentacion/openapi';

/** Esquemas OpenAPI de Usuarios (002, 010). Reflejan las validaciones de dominio/usuario.ts y aplicacion/usuarios.ts. */
const email = texto(3, 254, { format: 'email', description: 'Se guarda sin espacios y en minúsculas', example: 'cliente@ejemplo.pe' });
const password = texto(12, 128, { format: 'password', description: 'De 12 a 128 caracteres; no se transforma', example: 'una frase larga y segura' });
const nombre = texto(2, 100, { description: 'De 2 a 100 caracteres, sin espacios en los bordes', example: 'Rosa Quispe' });
const estadoCuenta = opciones('activo', 'inactivo');

registrarEsquemas({
  Usuario: respuesta({
    id: uuid, email: { type: 'string', format: 'email' }, nombre: { type: 'string' }, estado: estadoCuenta,
    roles: lista(opciones('cliente', 'proveedor', 'admin')),
    whatsapp: nulable({ type: 'string', example: '+51987654321', description: 'Solo en el perfil propio' }),
    whatsappVisible: { type: 'boolean', description: 'Si la otra parte de una reserva puede ver el WhatsApp' },
  }, { required: ['id', 'email', 'nombre', 'estado', 'roles'] }),
  Sesion: respuesta({ usuario: ref('Usuario'), expiraEn: instante }, { required: ['usuario', 'expiraEn'], description: 'El token va solo en la cookie qatu_sesion, nunca en este JSON' }),
  PaginaUsuarios: respuesta({ usuarios: lista(ref('Usuario')), pagina: entero(1), total: entero(0), paginas: entero(0) }),
  EventoAuditoriaUsuario: respuesta({
    id: uuid, actorId: nulable(uuid), usuarioId: uuid, accion: { type: 'string', example: 'cambiar_estado' },
    estadoAnterior: nulable(estadoCuenta), estadoNuevo: estadoCuenta, motivo: { type: 'string' }, creadoEn: instante,
  }),
  PaginaAuditoriaUsuario: respuesta({ eventos: lista(ref('EventoAuditoriaUsuario')), pagina: entero(1), total: entero(0), paginas: entero(0) }),
});

export const Registro = objeto({ email, password, nombre });
export const Login = objeto({ email, password });
export const EdicionPerfil = objeto({
  nombre,
  whatsapp: nulable(texto(0, 20, { description: '9 dígitos que empiezan con 9, con o sin +51; vacío o null lo borra. Omitirlo conserva el valor', example: '987 654 321' })),
  whatsappVisible: booleano,
}, ['nombre']);
export const CambioEstado = objeto({ estadoActual: estadoCuenta, estado: estadoCuenta, motivo });
export const paginaAdmin = { esquema: entero(1, 99999, { default: 1 }), descripcion: 'Página, de 20 en 20' };
