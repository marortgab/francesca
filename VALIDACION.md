# Comprobaciones de la entrega

Se comprobó el proyecto de **hola Francesca** antes del empaquetado.

## Verificado

- `roadmap.md` se conservó sin alteraciones respecto al archivo facilitado.
- El lector detecta **8 etapas y 160 fichas**: 13 temas vistos, 1 repaso pendiente, 146 clases pendientes.
- JavaScript: `node --check` satisfactorio para `app.js`, `parser.js` y `markdown.js`.
- Pruebas de interacción en Chromium con DOM y datos cargados en memoria: pantalla principal, nombre dinámico, tarjetas, lista de etapas, búsqueda por «imperfecto», filtro de clases vistas, apertura y cierre del detalle, biblioteca vacía, progreso y perfil.
- El nombre dinámico se obtuvo de `config.json`; no se incluyó nombre fijo en los componentes de la aplicación.
- Las vistas de escritorio (1440 px) y móvil (390 px) se renderizaron sin errores de JavaScript ni desbordamiento horizontal. En móvil se probó la apertura del menú, navegación y detalle de clase.
- Los recursos esenciales están referenciados por rutas relativas a la ubicación del módulo JavaScript y del archivo HTML; la web no depende de la raíz del dominio.
- Todos los archivos esperados se incluyen directamente en la raíz del ZIP (sin carpeta contenedora); el ZIP fue vuelto a abrir para verificar su contenido.

## Alcance de las pruebas

En este entorno, una política del navegador bloqueó la navegación automatizada mediante HTTP o `file://`, por lo que las pruebas de interacción se realizaron **cargando el HTML/CSS y el JavaScript en memoria y simulando las respuestas de `config.json` y `roadmap.md`**. Se verificó por separado la respuesta HTTP local para archivos estáticos, pero **no se verificó la publicación real en GitHub Pages ni un ciclo completo de red en navegador**. En consecuencia, no se afirma que se haya comprobado un despliegue real.

Al publicarlo, comprueba la URL definitiva desde **Settings → Pages** y revisa la pestaña **Actions** si el despliegue aún no está disponible.
