# Comercial Aurora

El piloto proporciona una bandeja compartida para cuatro agentes y un coordinador, y una demo autónoma para probar el flujo con datos ficticios.

## Demo sin conexión

Ejecuta `npm run build` y abre `dist/demo.html` con doble clic. Usa el selector de perfil para probar las capacidades de cada cuenta. Exporta un respaldo JSON antes de cerrar y cárgalo al volver a abrir el HTML. Desde la aplicación compartida también se puede descargar la demo.

Para importar clientes, usa un CSV con columnas `nit,razon_social` o un JSON como `[{"nit":"900111222","razon_social":"Cliente de prueba"}]`. En la bandeja puedes buscar, radicar y abrir el historial. Desde Equipo, el coordinador puede cambiar la disponibilidad de los agentes.

## Aplicación compartida en desarrollo

Con Node.js 22.20 o posterior, ejecuta `npm ci` y `npm run dev`. Abre `http://127.0.0.1:3000`. Los códigos individuales de desarrollo se crean en `.aurora/dev-access.json`, que Git ignora. La base SQLite se conserva en `.aurora/pilot.sqlite`.

Para alojar el servidor Node, compila primero y configura `AURORA_ACCOUNTS` con un objeto JSON que asocie `coordinador` y `agente1` a `agente4` a códigos aleatorios distintos de al menos 16 caracteres. Configura `AURORA_SESSION_SECRET` con un secreto aleatorio de 32 caracteres o más y `AURORA_DB` en un volumen persistente. Inicia con `npm start` detrás de un proxy HTTPS y fija `AURORA_ORIGIN` al origen HTTPS completo. `HOST` y `PORT` controlan la escucha.

En Sites, la aplicación utiliza la identidad de la plataforma y la base D1. El valor secreto `AURORA_SITE_USERS` asocia los correos de las cuentas permitidas a los perfiles del piloto. Cada persona también necesita permiso de acceso al sitio.

## Validación de OpenSpec

```sh
npm exec -- openspec validate piloto-solicitudes-aurora --strict
```
