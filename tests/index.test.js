import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(DIR, '..', 'index.html'), 'utf8');

const CAMPOS = ['f-titulo', 'f-empresa', 'f-franja', 'f-desc', 'f-mod', 'f-clases', 'f-dur',
  'f-horario', 'f-fecha', 'f-inv', 'f-img', 'f-cta', 'f-boton', 'f-wa',
  'f-msg', 'f-asesor', 'f-equipo', 'f-color1', 'f-color1hex', 'f-color2', 'f-color2hex'];

test('index.html: título y encabezado del editor', () => {
  assert.match(html, /<title>Generador de email<\/title>/);
  assert.match(html, /<h1>Generador de email<\/h1>/);
});

test('index.html: sin estilos inline (todo vive en css/main.css)', () => {
  assert.doesNotMatch(html, /<style>/);
  assert.match(html, /<link rel="stylesheet" href="css\/main\.css">/);
});

test('index.html: los 21 campos siguen presentes', () => {
  for (const id of CAMPOS) {
    assert.ok(html.includes('id="' + id + '"'), 'falta el campo ' + id);
  }
});

test('index.html: 13 campos marcados como requeridos', () => {
  const req = (html.match(/<span class="req">\*<\/span>/g) || []).length;
  assert.equal(req, 13);
});

test('index.html: interfaz con miniatura, hint de Cloudinary, preview y prompt', () => {
  assert.match(html, /id="img-mini"/);
  assert.match(html, /Cloudinary/);
  assert.match(html, /rel="noopener"/);
  assert.match(html, /id="vista"/);
  assert.match(html, /id="f-prompt"/);
  assert.match(html, /btnDescargar/);
  assert.match(html, /btnCopiar/);
  assert.match(html, /btnRestaurar/);
  assert.match(html, /id="toast"/);
});

test('index.html: scripts por capa como módulos ES ordenados', () => {
  const orden = (html.match(/<script type="module" src="js\/(config|plantilla|prompt|almacenamiento|ui)\.js"><\/script>/g) || []);
  assert.deepEqual(orden, [
    '<script type="module" src="js/config.js"></script>',
    '<script type="module" src="js/plantilla.js"></script>',
    '<script type="module" src="js/prompt.js"></script>',
    '<script type="module" src="js/almacenamiento.js"></script>',
    '<script type="module" src="js/ui.js"></script>'
  ]);
});

test('index.html: assets/ queda vacía (sin referencias a marcas)', () => {
  assert.doesNotMatch(html, /assets\//);
  assert.doesNotMatch(html, /logo/i);
});