Nero, Jamendo PWA para iPhone

Esta versión está preparada para GitHub Pages.

La búsqueda utiliza la API oficial de Jamendo v3 /tracks con:
- search: búsqueda libre sobre título de track, álbum, artista, tags y artistas similares
- type=single albumtrack: incluye singles y pistas de álbum
- limit=100
- order=relevance
- audioformat=mp32
- imagesize=200

El audio se reproduce desde la URL `audio` devuelta por Jamendo.
No se cachean respuestas de la API ni streams de audio.

Client ID utilizado:
330d8f2d

Instalación en GitHub Pages:
1. Sube el contenido de esta carpeta a la raíz de un repositorio.
2. Settings > Pages > Deploy from a branch > main > / (root).
3. Abre la URL de GitHub Pages en Safari.
4. Compartir > Añadir a pantalla de inicio.
