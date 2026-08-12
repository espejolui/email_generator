# Reglas para modelos de IA que trabajen en este proyecto

## 1. Respeta la arquitectura por capas

- `js/config.js`: datos (clave de cookie, valores por defecto, requeridos, opciones). Sin lógica.
- `js/plantilla.js`: motor del email (funciones puras + `generar()`). Sin manipulación del DOM.
- `js/prompt.js`: `Prompt.construir()`, genérico, sin logo ni mención de marcas.
- `js/ui.js`: interacción con el DOM. Sin lógica de negocio nueva.
- `js/almacenamiento.js`: única capa que toca `document.cookie`.
- No mover lógica entre capas ni duplicar funciones.

## 1b. Usa ES Modules, no CommonJS ni globales

- El proyecto es **ESM** (`"type": "module"` en el `package.json` de la raíz y `<script type="module">` en `index.html`): los módulos se comunican con `import`/`export` explícitos (`plantilla.js`, `prompt.js` y `almacenamiento.js` importan `Config`; `ui.js` importa a las otras cuatro).
- Prohibido usar `require`, `module.exports` o variables globales compartidas (`window.X`, `var X` suelto) para conectar capas: cada capa exporta su objeto con `export { X }`.
- Consecuencia: al abrir `index.html` por `file://` (doble clic) los módulos fallan por CORS; la app debe servirse.

## 2. No alteres el diseño

- Los colores, tamaños y estilos actuales de la interfaz son la versión aprobada. No cambies colores, fuentes, bordes ni medidas de `css/main.css` ni del `index.html` sin pedirlo explícitamente.
- Los cambios visuales funcionales (mensajes de error, estados) deben usar las clases existentes (`.falta`, `#toast.visible`, `.mini-img`, etc.).

## 3. Mantén los escapes anti-XSS

- Toda entrada de usuario que entre al HTML del email debe pasar por `Plantilla.e()`.
- No insertar texto de usuario en el HTML fuera de `Plantilla.generar()`/`leerValores()`.
- El prompt se muestra como texto plano en un `textarea` de solo lectura.

## 4. Prohibido inyectar dependencias sin autorización

- No agregar frameworks, librerías de npm, CDNs (scripts, estilos, fuentes), ni cambiar la estructura de archivos, sin autorización explícita del usuario.
- El proyecto solo tiene UN `package.json` (en la raíz). No crear `package.json` en ningún otro subdirectorio.
- El proyecto no usa ni necesita `node_modules`: tiene cero dependencias y todo corre con módulos nativos de Node (`node server.js`, `node --test`).
- La única dependencia externa permitida y existente es el Google Fonts dentro del HTML que genera `Plantilla.generar()`. No la dupliques.
- Los tests deben seguir usando el runner nativo de Node (`node --test`), sin dependencias.

## 5. No introduzcas secretos

- No agregar claves de API, tokens, contraseñas ni datos personales al código ni a los archivos de configuración.

## 6. Verificación

- Después de tocar código, ejecuta `node --test` desde la raíz del proyecto y asegúrate de que todo pasa (emplea siempre Node directamente, nunca pnpm ni npm).
