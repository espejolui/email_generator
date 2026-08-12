import { test } from 'node:test';
import assert from 'node:assert/strict';

const { Prompt } = await import('../js/prompt.js');

test('prompt genérico: sin Comfacundi, sin marca y sin logotipo', () => {
  const p = Prompt.construir('Fotografía Básica', 'Aprende a tomar fotos');
  assert.doesNotMatch(p, /Comfacundi/i);
  assert.doesNotMatch(p, /logotipo/i);
  assert.doesNotMatch(p, /comfacundi\.com\.co/);
  assert.doesNotMatch(p, /caja de compensación/i);
});

test('prompt genérico: primera línea unificada, sin repetición de la empresa', () => {
  const p = Prompt.construir('Fotografía', 'Curso');
  assert.match(p, /^Crea una imagen publicitaria para un email marketing con los estilos: fotografía publicitaria profesional, personas realizando la actividad del curso, luz natural, colores vibrantes, composición equilibrada\./);
  assert.doesNotMatch(p, /ofrecido por la empresa/);
  assert.match(p, /Empresa: "a definir"/);
});

test('prompt: incluye el nombre de la empresa en los datos', () => {
  const p = Prompt.construir('Fotografía', 'Curso', 'Cesap');
  assert.match(p, /Empresa: "Cesap"/);
  assert.doesNotMatch(p, /ofrecido por/);
});

test('prompt: estilo fotográfico profesional', () => {
  const p = Prompt.construir('x', 'y');
  assert.match(p, /fotografía publicitaria profesional/);
  assert.match(p, /luz natural/);
});

test('prompt: DATOS con título, descripción y dimensiones exactas', () => {
  const p = Prompt.construir('Fotografía', 'Curso de fotografía');
  assert.match(p, /DATOS DEL CURSO/);
  assert.match(p, /Título: "Fotografía"/);
  assert.match(p, /Descripción del curso: "Curso de fotografía"/);
  assert.match(p, /1376 x 768 píxeles \(horizontal, 16:9\)/);
});

test('prompt: usa "a definir" cuando faltan datos', () => {
  const p = Prompt.construir('', '');
  assert.match(p, /Título: "a definir"/);
  assert.match(p, /Descripción del curso: "a definir"/);
});

test('prompt: reglas de sin texto/marca de agua y dimensiones exactas', () => {
  const p = Prompt.construir('a', 'b');
  assert.match(p, /REGLAS IMPORTANTES/);
  assert.match(p, /NO incluyas ningún texto, palabra, letra, número ni marca de agua/);
  assert.match(p, /ancho 1376 píxeles, alto 768 píxeles/);
  assert.doesNotMatch(p, /1\. NO incluyas ningún texto[\s\S]*2\. NO/);
});