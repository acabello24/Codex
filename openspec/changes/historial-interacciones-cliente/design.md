# Diseño

## Contexto

El directorio muestra NIT y razón social. El detalle de solicitud ya muestra el historial de eventos. El servicio entrega al navegador una lista de solicitudes autorizadas para el perfil en uso. La demo obtiene esa misma vista a partir de su estado local.

## Decisiones

- Agregar una acción **Ver interacciones** a cada fila del directorio. Presentar una vista con la identidad del cliente y una lista por fecha de recepción. Reutilizar el detalle de solicitud para que al cerrarlo el usuario siga en el historial del cliente.
- Derivar la lista del estado autorizado por el servidor y filtrar con el NIT exacto. En la demo, usar la vista filtrada del perfil simulado. Los recuentos se calculan después del filtro. Se reutiliza el estado existente porque ya incluye las solicitudes y sus eventos, y evita duplicar el historial o introducir una migración.
- Al actualizar la vista o abrir un ticket desde ella, comprobar el acceso con el estado actual. Si el acceso se pierde tras una reasignación, quitar el ticket de la lista y cerrar su detalle si estaba abierto. En caso de error de consulta, informar que no se pudo actualizar y evitar abrir un detalle cuya autorización ya no se pueda confirmar.
