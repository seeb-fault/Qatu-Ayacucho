# Contratos operativos propuestos

GET /health/live: vida del proceso. GET /health/ready: capacidad básica con PostgreSQL; la caída de IA no invalida reservas si sus dependencias están sanas. No incluir secretos ni datos internos en respuesta pública. Congelar rutas/estado HTTP al implementar.

HTTPS /api/v1 para cliente y webhook; web/API/BD en red privada. Puertos BD no publicados. Logs JSON: correlationId, ruta, estado, duración y fallo clasificado, sin token, PAN/CVV ni texto sensible.

Backup y restore usan procesos documentados y verificados, no endpoints públicos de administración de archivos.
