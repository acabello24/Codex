# Diseño del piloto

## Contexto

La demo debe funcionar desde el sistema de archivos. El piloto comparte datos entre cinco cuentas mediante una URL HTTPS.

## Decisiones

- Un módulo JavaScript contiene las reglas de atención y se incorpora a ambos modos. Un script genera el HTML autónomo con CSS y JavaScript embebidos. El modo compartido usa una API del mismo origen y valida permisos en cada operación.
- El historial, los consecutivos, el cursor de rotación y los cambios de caso se guardan como una unidad. La versión del caso detecta ediciones simultáneas. La revisión del almacenamiento permite reintentar operaciones sobre casos distintos sin perder actualizaciones.
- La demo maneja datos en memoria y exporta un respaldo JSON versionado. Los errores de importación se muestran antes de reemplazar el estado.
- Se usa SQLite localmente y D1 para alojamiento compatible. El servidor Node usa códigos individuales de acceso y sesiones con cookies HttpOnly. Sites usa el inicio de sesión de la plataforma y un mapa privado de cuentas a perfiles. Las credenciales y los permisos de acceso se configuran fuera del código.

## Operación

La base se inicializa con clientes y solicitudes ficticios. El directorio se puede ampliar desde el perfil coordinador. Las integraciones y notificaciones de horizontes posteriores requieren cambios de OpenSpec separados.
