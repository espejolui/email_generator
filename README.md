# Generador de email

Herramienta web para crear emails de cursos: se llenan los datos, se ve la vista previa en vivo y se descarga un HTML listo para enviar. Incluye un panel con el prompt para generar la imagen del curso con IA.

## Funciones

- 13 campos obligatorios con validación visual (borde rojo + toast con los faltantes).
- Formulario con selects para sede, modalidad y número de clases.
- Fecha de inicio con día de semana (ej. "Miércoles 12 de Agosto de 2026").
- Inversión con `$` y separador de miles (ej. `$1.234.567`).
- Número de WhatsApp con prefijo `+57` y enlace `wa.me` con mensaje predeterminado.
- Miniatura de la imagen pegada desde un link (con hint de Cloudinary).
- Vista previa en vivo del email dentro de un iframe.
- Panel de prompt para generar la imagen con IA (copiable), en dimensiones exactas 1376×768 px (16:9), sin texto ni marca de agua.
- Descarga del email como archivo HTML (nombre basado en el título).
- Los datos se guardan automáticamente en una cookie (1 mes, `SameSite=Lax`) y se restauran al volver a abrir la página. "Restaurar valores" borra la cookie.

## Estructura

```
email-generator/             ← raíz del proyecto (es también el sitio desplegable)
├── index.html               # formulario + vista previa + panel de prompt
├── css/main.css             # todos los estilos
├── js/
│   ├── config.js            # clave de cookie, valores por defecto, requeridos, opciones
│   ├── plantilla.js         # motor del email: datos → HTML (escapes, fechas, miles, +57)
│   ├── prompt.js            # construirPrompt() genérico, sin logo ni marca
│   ├── ui.js                # interacción: preview, miniatura, validación, descarga, toast
│   └── almacenamiento.js    # persistencia con cookies
├── server.js                # servidor estático local (solo Node, sin dependencias)
├── dev.sh                    # ejecuta server o tests: ./dev.sh start | ./dev.sh test
├── tests/                   # pruebas por capa (node --test, sin dependencias)
├── package.json             # único package.json ("type": "module", sin scripts ni dependencias)
├── docs/DOCUMENTATION.md    # documentación de desarrollo
└── AGENTS.md                # instrucciones para agentes de IA
```

## Abrir localmente

> Los scripts son **ES Modules** (`import`/`export`): abrir `index.html` con doble clic (`file://`) no funciona porque los navegadores bloquean los módulos por CORS. Hay que servirlo:

```
./dev.sh start   # o: node server.js   (puerto configurable con PORT=8080 ./dev.sh start)
```

Sirve el proyecto en `http://localhost:8000` (no hace falta `node_modules` ni instalar nada). También puede servir la carpeta con cualquier servidor estático (`python3 -m http.server 8000`), sin diferencias.

## Tests

```
./dev.sh test
```

Ejecuta las pruebas por capa (validador, `+57`, fecha, inversión, prompt genérico, cookies y estructura del HTML) con el runner nativo de Node. No instala ninguna dependencia.

> **Sin dependencias**: el proyecto no declara ni instala dependencias de paquetes (`package.json` no tiene `dependencies` ni `scripts`). Todo corre con `node` vía `./dev.sh start` y `./dev.sh test`; no hay nada que instalar y nunca aparece `node_modules`.

## Documentación

- [Documentación de desarrollo](docs/DOCUMENTATION.md): arquitectura por capas, funciones clave, cómo añadir campos, decisiones de seguridad y despliegue estático.
