# Documentación para desarrolladores

## Tecnologías

- HTML5, CSS3 y JavaScript modular (**ES Modules**: `import`/`export` en todos los archivos, activado con `"type": "module"` en el `package.json` de la raíz y con `<script type="module">` en `index.html`), sin frameworks ni librerías.
- Sin dependencias de paquetes ni CDN en la aplicación: la única fuente externa es el Google Fonts de la plantilla del email generado (Nunito), igual que en la versión original.
- El único `package.json` del proyecto vive en la raíz (`email-generator/package.json`)
- No hay `node_modules` y no se necesita: el proyecto tiene cero dependencias y todos los scripts usan solo módulos nativos de Node (verificado ejecutando `node --test` con la carpeta ausente, resultado correcto).
- Los tests usan el runner nativo de Node (`node --test`), disponible a partir de Node 18. Cargar un módulo del navegador en Node funciona con `await import(...)` (los tests preparan los mocks de `document`/cookies antes y el boot de `ui.js` se protege solo). Ya no se usa `vm.runInThisContext` ni CommonJS (`require`).
- Consecuencia de ESM: la app ya no funciona abriendo `index.html` por `file://` (doble clic); los navegadores bloquean los módulos por CORS. Debe servirse (ver README).

## Arquitectura por capas

Cada capa tiene una responsabilidad única y se comunica con `import`/`export` (importante: `plantilla.js` y `prompt.js` importan `Config` de `config.js`; `ui.js` importa a las otras cuatro). Con ESM el orden de los `<script type="module">` en `index.html` no importa: lo resuelve el grafo de imports:

| Archivo | Capa | Responsabilidad |
| --- | --- | --- |
| `index.html` | Vista | Formulario, vista previa, panel de prompt. Sin lógica. |
| `css/main.css` | Vista | Todos los estilos. No tocar los colores neutros de la interfaz. |
| `js/config.js` | Configuración | Clave de cookie, duración, valores por defecto, campos requeridos y opciones (sede/modalidad/clases). Datos, no lógica. Exporta `Config`. |
| `js/plantilla.js` | Domínio | Funciones puras: escapes, colores, miles, fecha con día de semana, `+57`, y `generar()` que convierte datos en el HTML del email. Exporta `Plantilla`. |
| `js/prompt.js` | Domínio | `Prompt.construir()` genera el prompt genérico para la IA. Exporta `Prompt`. |
| `js/almacenamiento.js` | Persistencia | Guardar, cargar y borrar la cookie (`document.cookie`). No manipula el DOM. Exporta `Almacenamiento`. |
| `js/ui.js` | Interacción | Orquesta los campos del formulario, la vista previa, la validación, la descarga, el toast y conecta todo en `iniciar()`. Exporta `UI`. El arranque (boot) queda protegido: solo llama `iniciar()` si existe `document`. |

## Funciones clave

### `Plantilla.e(s)` — escape HTML (anti-XSS)
Convierte `& < > "` en entidades. Toda entrada de usuario que se inserte en el HTML del email debe pasar por aquí (títulos, descripciones, URLs, firmas…).

### `Plantilla.colorValido(hex)` / `Plantilla.normalizarColor(hex)`
Valida `#rrggbb` y normaliza a minúsculas con `#`. Devuelve `null` si no es válido.

### `Plantilla.formatoMiles(n)`
Inserta puntos como separador de miles: `1234567` → `1.234.567`.

### `Plantilla.formatearFecha(v)`
Recibe `AAAA-MM-DD` (input `date`) y devuelve "Miércoles 12 de Agosto de 2026". Usa `T12:00:00` para evitar saltos de zona horaria. Si no se puede parsear, devuelve el valor original.

### `Plantilla.leerValores(campos)`
Convierte el mapa de elementos del formulario en el objeto de datos del email. Espera `.value`. Normaliza colores, limpia la inversión a dígitos y le añade el separador de miles con `$`, filtra los detalles vacíos y formatea el teléfono `+57` + últimos 10 dígitos.

### `Plantilla.generar(v)`
Recibe el objeto de `leerValores()` y devuelve el HTML completo del email (tablas email-compatibles, estilos inline).

### `Prompt.construir(titulo, desc)`
Devuelve el prompt con estilo fotográfico profesional, los DATOS del curso (título, descripción, dimensiones 1376×768 px 16:9) y las reglas (sin texto ni marca de agua, dimensiones exactas).

### `Almacenamiento.guardar(datos)` / `Almacenamiento.cargar()` / `Almacenamiento.borrar()`
- `guardar`: serializa a JSON, `encodeURIComponent`, cookie con expiración a 1 mes (`Config.COOKIE_DIAS`), `path=/` y `SameSite=Lax`.
- `cargar`: busca la cookie por `Config.CLAVE`, la decodifica y la parsea. Devuelve `null` si no existe o está corrupta.
- `borrar`: expira la cookie (la vacía y la caduca), usado por "Restaurar valores".

### `UI.validar()`
Recorre `Config.requeridos` (id + etiqueta). Si un campo está vacío añade la clase `falta` (borde rojo) y lo agrega a la lista de faltantes. Devuelve la lista de etiquetas.

### `UI.descargar()`
Valida, genera el HTML, lo empaqueta en un `Blob` y dispara la descarga con nombre `slug(título).html`.

### `UI.aplicar(origen)`
Vuelca un objeto de datos en el formulario, repitiendo la limpieza de inversión y WhatsApp (por eso "Restaurar valores" y la carga de la cookie siempre dejan formato consistente).

## Proceso paso a paso: agregar un campo nuevo

<details>
<summary><b>Pasos para añadir un campo</b> — ejemplo: "Ubicación" obligatorio que aparezca en los detalles del email</summary>

**Pasos:**

1. **`index.html`**: agregar el input con id `f-ubicacion` y `*` en el label si es obligatorio:
   ```html
   <div class="campo">
     <label for="f-ubicacion">Ubicación <span class="req">*</span></label>
     <input type="text" id="f-ubicacion">
   </div>
   ```
2. **`js/config.js`**:
   - Añadir `ubicacion: ''` a `valoresDefecto` (para que "Restaurar valores" y la carga inicial funcionen).
   - Añadir `['f-ubicacion', 'Ubicación']` a `requeridos` si es obligatorio.
   - Si es un select, añadir las opciones a `opcionesSede`/`opcionesModalidad` (o una lista nueva). Los `<option>` no se escriben en `index.html`: `UI.poblarOpciones()` los genera desde `config.js` al iniciar (al igual que los colores por defecto y los placeholders de WhatsApp).
3. **`js/ui.js`**: añadir la referencia `ubicacion: document.getElementById('f-ubicacion')` en `UI.referenciar()` y, si el valor necesita limpieza al cargar/restaurar, su línea en `UI.aplicar()`.
4. **`js/plantilla.js`**: si el campo va al email, añadirlo a `leerValores()` (recuerda `Plantilla.e()` si se concatena en HTML) y a `generar()` en el lugar correcto de la maqueta.
5. **`js/prompt.js`**: solo si el campo debe alimentar el prompt de la imagen; las dimensiones y reglas no cambian.
6. **`tests/`**: añadir (o ampliar) los tests de la capa afectada y ejecutar `node --test`.

**Notas:**
- Los campos opcionales no se agregan a `requeridos`; las líneas vacías de `detalles` ya se filtran solas en `leerValores()`.
- Nunca insertar texto de usuario sin `Plantilla.e()`.

</details>

## Decisiones de seguridad

- **Anti-XSS**: todo dato de usuario que entra al HTML del email pasa por `Plantilla.e()`. El prompt es texto plano en un `textarea` de solo lectura.
- **Cookies**: solo se guarda el estado del formulario. El valor va URL-encoded (`encodeURIComponent`) y con `SameSite=Lax` (mitiga CSRF en navegadores modernos). Expiración de 1 mes.
- **Sin secretos**: la app no maneja contraseñas, API keys ni datos personales sensibles. No introducir claves ni tokens en el código.
- **Sin dependencias**: el proyecto no usa paquetes de npm/pnpm, CDN ni frameworks para no ampliar la superficie de ataque ni romper el despliegue estático. Única excepción: el Google Fonts que ya existía en la plantilla generada.
- **Descarga local**: el email se genera y descarga en el navegador; no hay servidor ni almacenamiento remoto.
- **Enlaces externos**: el único enlace externo en la interfaz (Cloudinary) usa `rel="noopener"`.
