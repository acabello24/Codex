# Propuesta para Comercial Aurora

## Why

Comercial Aurora atiende a 300 clientes activos y procesa unos 1.200 pedidos al mes. De unas 600 solicitudes mensuales, se estima que 60 se pierden y 180 quedan sin responsable. Una bandeja compartida permitirá saber quién atiende cada caso, cuánto tiempo lleva abierto y qué respuesta recibió el cliente. La trazabilidad ayuda a sostener la confiabilidad de la atención para los clientes que hacen pedidos recurrentes.

## What Changes

- Entregar un piloto de seis semanas con acceso simultáneo por una URL HTTPS para cuatro agentes y un coordinador, con cuentas individuales y una base de datos compartida. La interfaz usará HTML5, CSS3 y JavaScript.
- Entregar una demo autónoma en un único HTML que se pueda abrir con doble clic, incluso sin conexión. Tendrá datos ficticios, perfiles simulados, importación de clientes en CSV o JSON y exportación y restauración de datos en JSON.
- Registrar manualmente solicitudes recibidas por teléfono, correo o mensajería. Permitir la búsqueda del cliente por NIT, la clasificación del caso y una referencia de pedido opcional.
- Generar un identificador único con el formato `AUR-YYYYMM-XXXX` y asignar cada caso por turnos a un agente disponible.
- Ofrecer una bandeja con búsqueda y filtros por estado, responsable y antigüedad. Los agentes actualizarán sus casos asignados. El coordinador podrá consultar todos los casos y reasignarlos.
- Registrar el historial de cambios de estado y responsable, con usuario y fecha. Al resolver un caso se guardará la respuesta y se calculará el cumplimiento de las 48 horas corridas. El coordinador podrá identificar los casos abiertos que superen el plazo.
- Cargar el directorio inicial desde CSV o JSON, validar los registros e informar los NIT duplicados. Se propone empezar las pruebas desde la URL con datos ficticios.

## Capabilities

### New Capabilities

- `radicacion-solicitudes` — Captura manual, identificación única y asignación automática por turnos.
- `seguimiento-solicitudes` — Bandeja, cambios de estado, reasignaciones, historial y cálculo de plazos.
- `operacion-compartida` — Acceso individual, permisos por rol y actualizaciones simultáneas sobre datos compartidos.
- `directorio-clientes` — Importación validada y búsqueda de clientes por NIT.
- `demo-local` — Demostración en un único HTML con perfiles simulados y recuperación por JSON.

### Modified Capabilities

Ninguna.

## Impact

El piloto se planificará dentro de los topes de COP 12.000.000 de inversión inicial y COP 300.000 mensuales de operación para cinco usuarios. El costo se confirmará al seleccionar el alojamiento y dimensionar el soporte.

### Plan de seis semanas

1. Acordar el flujo, los permisos y los criterios de aceptación. Registrar la propuesta, las especificaciones, el diseño y las tareas en OpenSpec.
2. Entregar la primera demo HTML y probar la radicación, la bandeja y la carga de clientes.
3. Habilitar la URL de pruebas, las cinco cuentas y el almacenamiento compartido. Probar la creación simultánea de casos.
4. Completar la asignación, las transiciones de estado, el historial y el cálculo del plazo.
5. Ejecutar pruebas de aceptación con los cuatro agentes y el coordinador. Verificar permisos, ediciones simultáneas y recuperación de datos.
6. Corregir hallazgos y entregar la URL, el HTML descargable y una guía breve. Revisar los resultados del piloto.

### Criterios de aceptación y metas

- Los cinco usuarios pueden operar al mismo tiempo desde equipos distintos. Dos radicaciones simultáneas generan identificadores diferentes y se reflejan en la bandeja compartida.
- Ante dos ediciones del mismo caso, la aplicación informa el conflicto antes de sobrescribir cambios.
- Cada evento queda asociado a la cuenta correspondiente. La demo recupera sus datos al cargar un JSON previamente exportado.

Las metas de negocio son registrar y asignar el 100 % de las solicitudes, resolver al menos el 90 % en 48 horas, reducir el tiempo administrativo de 20 a 12 minutos por solicitud y bajar los sobrecostos de COP 800.000 a COP 400.000 mensuales. El piloto permitirá medir el registro, la asignación y los tiempos. Los sobrecostos se evaluarán con datos de operación posteriores.

### Hoja de ruta

- **Horizonte 2** — Captura automática desde correo y mensajería, consulta de clientes y pedidos en el ERP y avisos preventivos a las 24 y 36 horas.
- **Horizonte 3** — Consulta del estado para clientes, análisis de reclamos recurrentes y evaluación de la sincronización bidireccional con el ERP.
