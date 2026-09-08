# Nero, Jamendo PWA para iPhone

Archivos:
- index.html
- style.css
- app.js
- manifest.json
- service-worker.js
- icons/

## Uso
1. Sube todos los archivos a un hosting HTTPS.
2. Abre la URL en Safari en el iPhone.
3. Busca una canción, artista o término.
4. Toca una canción para reproducir el audio real de Jamendo.
5. Para instalarla: Safari > Compartir > Añadir a pantalla de inicio.

## API
Usa exclusivamente el Client ID indicado:
330d8f2d

La búsqueda usa GET /v3.0/tracks con `search`, `audioformat=mp32`, `imagesize=200` y `order=relevance`.
La reproducción usa el campo `audio` devuelto por Jamendo.

El service worker no cachea la API de Jamendo ni los streams MP3.

## Importante
El Client ID es una credencial pública para las consultas de lectura según la documentación de Jamendo. No se incluye ningún client_secret ni token privado.
