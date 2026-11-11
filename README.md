# hola Francesca · Mi aventura en español

Plataforma estática de aprendizaje para GitHub Pages, creada a partir de `roadmap.md` y `config.json`. Funciona con HTML, CSS y JavaScript nativos, sin compilación, Node, frameworks ni dependencias externas. Toda la información del roadmap se conserva en el archivo Markdown original.

## 1. Publicar en GitHub Pages

1. **Descomprime** el ZIP. Aparecerán directamente `index.html`, `style.css`, `app.js`, `parser.js`, `markdown.js`, `config.json`, `roadmap.md`, `.nojekyll`, `favicon.svg`, `README.md` y la carpeta `materiales/`.
2. En [GitHub](https://github.com/) inicia sesión y crea un repositorio nuevo (por ejemplo, `espanol-francesca`). Para GitHub Pages en un repositorio gratuito, el repositorio normalmente debe ser **público**.
3. En el repositorio, selecciona **Add file → Upload files**, y sube **los archivos descomprimidos y la carpeta `materiales/`**, no el archivo ZIP. Comprueba que `index.html`, `app.js`, `style.css` y `roadmap.md` queden **en la raíz**, no dentro de una carpeta extra.
4. Pulsa **Commit changes**.
5. Ve a **Settings → Pages → Build and deployment**. En **Source**, selecciona **Deploy from a branch**; en **Branch**, escoge **main** y **/(root)**; pulsa **Save**.
6. Cuando finalice el despliegue, en **Settings → Pages** aparecerá **Visit site** o la URL publicada: `https://TU-USUARIO.github.io/NOMBRE-REPOSITORIO/`.
7. Si la web aún no carga, entra en **Actions** o **Settings → Pages** para consultar el estado del despliegue antes de cambiar archivos. No hace falta añadir rutas especiales para el nombre del repositorio.

**Importante:** no subas solamente el ZIP. GitHub Pages necesita ver `index.html` dentro del repositorio. El archivo `.nojekyll` es oculto y puede no verse en algunos exploradores locales; queda incluido en el ZIP.

## 2. Actualizar el nombre y los colores

Abre `config.json` en GitHub (icono de lápiz) y modifica `studentName`, `siteTitle`, `welcomeMessage` y otros campos. `studentName` se utiliza automáticamente en la marca de la barra lateral, encabezado, pie, avatar y título de la pestaña: `hola Francesca`. No necesitas editar HTML ni JavaScript.

Paleta predeterminada:

- Hunyadi Yellow: `#E0A03F`
- Auburn: `#9F2B2C`
- Vanilla: `#FEF3B1`
- Slate Gray: `#355D67`

Solo cambia los valores `themeColors` cuando quieras reutilizar el diseño con otra identidad; el sitio leerá sus colores de la configuración.

## 3. Actualizar una clase después de una sesión

1. Abre `roadmap.md` en el repositorio y pulsa **Edit** (icono del lápiz).
2. Busca el encabezado de la clase, por ejemplo `##### CLASE N.º 47 — ...`.
3. En su línea **Estado**, cambia únicamente la etiqueta real que corresponda: `✅ VISTO`, `🟡 EN PROGRESO`, `⬜ PENDIENTE` o `🔄 REPASO PENDIENTE`.
4. En el registro al final de esa clase, sustituye `_sin registrar_` por la **fecha real** y añade materiales, tarea y observaciones si los hay.
5. Pulsa **Commit changes**. La siguiente versión publicada lee de nuevo `roadmap.md`, actualiza el historial y recalcula el progreso sin cambiar el código.

Ejemplo de modificación en el encabezado de una ficha existente:

```markdown
##### CLASE N.º 47 — Contraste entre indefinido e imperfecto

**Estado:** ✅ VISTO · **Nivel de referencia:** A2 · **Tema principal:** Contraste entre indefinido e imperfecto.
```

Y dentro de esa ficha, puedes registrar un ejemplo **solo cuando realmente ocurra**, así:

```markdown
**Registro real:**
- Fecha: 2027-02-15
- Contenido trabajado: narración de una historia en pasado.
- Material utilizado: [Ejercicios](materiales/pdf/ejercicios-clase-47.pdf)
- Imagen: ![Línea de tiempo](materiales/imagenes/linea-tiempo.png)
- Tarea: Escribir un relato breve.
```

La fecha y los recursos anteriores **son ejemplos ficticios**: no representan clases realizadas. El historial inicial solo confirma los temas señalados en el roadmap fuente, no las fechas ni las actividades reales. Se recomienda conservar los identificadores `CLASE N.º X` para no romper la navegación.

### Añadir imágenes, PDF y enlaces

- Sube la imagen a `materiales/imagenes/` y añade a la ficha `![Descripción](materiales/imagenes/archivo.png)`.
- Sube el PDF a `materiales/pdf/` y enlaza `[Abrir ejercicios](materiales/pdf/ejercicios.pdf)`.
- Para un vídeo o recurso externo, utiliza `[Ver vídeo](https://ejemplo.org/video)`.
- Para varias imágenes, añade varias líneas de imagen Markdown; al pulsarlas, se abrirán ampliadas.
- Para compartir una explicación o una tabla de conjugación, puedes escribir Markdown normal dentro de esa clase.
- No añadas enlaces a archivos todavía inexistentes: mostrarían un error 404.

Los recursos con enlaces en las fichas se recopilan automáticamente en la biblioteca. Las rutas son relativas: no pongas `/materiales/imagenes/...` con una barra inicial. Usa exactamente las mayúsculas/minúsculas de los nombres de archivo.

### Ejercicios con respuestas desplegables

Dentro de una clase, puedes escribir:

```markdown
**Ejercicio:** Completa: Ayer nosotros ______ (comer) pasta.

:::respuesta
Ayer nosotros **comimos** pasta.
:::

:::explicacion
El pretérito indefinido indica un acontecimiento terminado.
:::
```

La web mostrará botones desplegables **Mostrar respuesta** y **Ver explicación**. También puedes usar `:::pista`. **No se generan respuestas automáticamente**: solo se mostrarán las que escribas.

## 4. Cómo funciona la plataforma

- **Inicio**: bienvenida, indicadores y etapas.
- **Mi perfil**: análisis inicial y control del historial del documento fuente.
- **Mi roadmap**: etapas desplegables, clases, búsqueda por palabra clave y filtros por estado y nivel.
- **Clases vistas**: solo contenidos confirmados como estudiados.
- **Próximas clases**: contenidos por trabajar, en progreso y repasos.
- **Materiales**: imágenes, PDFs y enlaces presentes en las fichas.
- **Mi progreso**: cálculo automático a partir del estado de las clases, con resumen por etapa.

En el detalle de cada clase puedes usar **Anterior** y **Siguiente**. Se conservan las secciones del documento fuente. La aplicación **no permite** que la estudiante cambie desde la interfaz el progreso oficial.

**Importante:** `VISTO` significa «tema trabajado», no «competencia demostrada». En el roadmap fuente aparecen 160 clases, de las cuales 13 tienen temas vistos, 1 es repaso y 146 están pendientes. El progreso inicial es del 8 % redondeado por temas vistos.

## 5. Si no funciona

| Problema | Comprobación |
| --- | --- |
| Error 404 en la página | Comprueba la URL exacta, Settings → Pages, rama `main`, `/(root)` y `index.html` en la raíz. |
| Página blanca o mensaje de carga | Confirma que `app.js`, `parser.js`, `markdown.js`, `roadmap.md` y `config.json` existen en la raíz con esos nombres exactos. |
| No se ve el diseño | `index.html` debe enlazar `./style.css`. No uses carpetas inexistentes `assets/css` o `assets/js`. |
| No cargan las clases | Revisa que las cabeceras estén escritas `##### CLASE N.º 1 — Título` y que `roadmap.md` esté disponible. |
| No aparecen imágenes o PDF | Revisa que el archivo exista en `materiales/`, que el enlace sea relativo y que coincidan mayúsculas, extensiones y espacios. |
| No cambia el contenido | Confirma que guardaste con **Commit changes**, espera al despliegue y actualiza el navegador (Ctrl+F5). |
| No funciona al abrir `index.html` desde el disco | Es normal en navegadores que bloquean `fetch` con el esquema `file://`. Utiliza GitHub Pages o un servidor HTTP local. |
| Error durante el despliegue | Consulta los detalles del intento de publicación en la pestaña **Actions** o la sección **Pages**. |

## 6. Probar localmente (opcional)

No necesitas este paso para publicar. Si deseas probarlo antes en tu ordenador, abre una terminal **dentro de la carpeta descomprimida** y ejecuta `python -m http.server 8000` (si tienes Python). Entra en `http://localhost:8000/`. También puedes utilizar cualquier servidor local estático. **No basta** con hacer doble clic en `index.html`, porque utiliza lectura de archivos mediante `fetch`.

## 7. Privacidad

**GitHub Pages en un repositorio público no es privado.** Tanto la página como `roadmap.md` y `config.json` pueden ser accesibles a cualquier persona con la URL o que encuentre el repositorio. El documento inicial contiene detalles del perfil de aprendizaje de Francesca. Antes de compartir o publicar, revisa si quieres eliminar datos personales. No incluyas contactos, fechas privadas, información médica, conversaciones particulares ni detalles sensibles de las clases. Una URL poco conocida **no** protege el contenido.

## 8. Archivos y mantenimiento

```text
index.html            → estructura visual
style.css             → diseño responsive y colores
app.js                → interfaz y funcionalidades
parser.js             → extrae etapas, clases y estados del Markdown
markdown.js           → renderiza texto, tablas, imágenes y ejercicios desplegables
config.json           → nombre, preferencias y colores
roadmap.md            → única fuente de verdad del aprendizaje
favicon.svg           → icono de la pestaña
.nojekyll             → GitHub Pages sin procesar Jekyll
README.md             → guía de publicación y mantenimiento
materiales/imagenes/  → imágenes e infografías
materiales/pdf/       → PDFs compartidos
```

Puedes reutilizar el proyecto para otros estudiantes duplicando el repositorio y cambiando **solo** `config.json` y `roadmap.md` por uno con el mismo sistema de encabezados de clase. No necesitas modificar el diseño. Si el documento nuevo usa encabezados diferentes, habrá que ampliar el parser; la plantilla reconoce principalmente el formato entregado (`##### CLASE N.º X — Título`).

---

Preparado para publicación estática en GitHub Pages. El archivo original `roadmap.md` se conserva sin modificación.
