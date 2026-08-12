import { test } from 'node:test';
import assert from 'node:assert/strict';

const { Plantilla } = await import('../js/plantilla.js');

function campo(valor) {
  return { value: valor };
}

function camposFalsos(s) {
  return Object.assign({
    titulo: campo(''), empresa: campo(''), franja: campo(''), desc: campo(''),
    mod: campo(''), clases: campo(''), dur: campo(''),
    horario: campo(''), fecha: campo(''), inv: campo(''),
    img: campo(''), cta: campo(''), boton: campo(''),
    wa: campo(''), msg: campo(''), asesor: campo(''), equipo: campo(''),
    color1: campo('#41b6e6'), color1hex: campo('#41b6e6'),
    color2: campo('#8de1f7'), color2hex: campo('#8de1f7')
  }, s);
}

test('escape: Plantilla.e convierte caracteres peligrosos', () => {
  assert.equal(Plantilla.e('<b>&"\'</b>'), '&lt;b&gt;&amp;&quot;\'&lt;/b&gt;');
  assert.equal(Plantilla.e(null), '');
  assert.equal(Plantilla.e(undefined), '');
});

test('colores: colorValido y normalizarColor', () => {
  assert.equal(Plantilla.colorValido('#41b6e6'), true);
  assert.equal(Plantilla.colorValido('41b6e6'), true);
  assert.equal(Plantilla.colorValido('#12345'), false);
  assert.equal(Plantilla.colorValido('#gggggg'), false);
  assert.equal(Plantilla.normalizarColor('#41B6E6'), '#41b6e6');
  assert.equal(Plantilla.normalizarColor('41b6e6'), '#41b6e6');
  assert.equal(Plantilla.normalizarColor('xyz'), null);
});

test('inversión: formatoMiles pone puntos cada 3 dígitos', () => {
  assert.equal(Plantilla.formatoMiles('1234567'), '1.234.567');
  assert.equal(Plantilla.formatoMiles('450000'), '450.000');
  assert.equal(Plantilla.formatoMiles('100'), '100');
  assert.equal(Plantilla.formatoMiles(''), '');
});

test('fecha: formatearFecha incluye día de la semana', () => {
  assert.equal(Plantilla.formatearFecha('2026-08-12'), 'Miércoles 12 de Agosto de 2026');
  assert.equal(Plantilla.formatearFecha(''), '');
  assert.equal(Plantilla.formatearFecha('no-una-fecha'), 'no-una-fecha');
});

test('+57: leerValores limpia y formatea el teléfono', () => {
  assert.equal(Plantilla.leerValores(camposFalsos({ wa: campo('3224418087') })).wa, '+573224418087');
  assert.equal(Plantilla.leerValores(camposFalsos({ wa: campo('322 441-80 87') })).wa, '+573224418087');
  assert.equal(Plantilla.leerValores(camposFalsos({ wa: campo('abc322abc441abc8087xyz') })).wa, '+573224418087');
  assert.equal(Plantilla.leerValores(camposFalsos({ wa: campo('') })).wa, '+57');
});

test('inversión: leerValores añade $ y miles, y filtra los vacíos', () => {
  const v = Plantilla.leerValores(camposFalsos({ inv: campo('1.234.567') }));
  assert.match(v.detalles, /Inversión:<\/strong> \$1\.234\.567/);
  const sinInv = Plantilla.leerValores(camposFalsos());
  assert.doesNotMatch(sinInv.detalles, /Inversión/);
});

test('detalles: solo incluye las líneas con valor, con etiquetas escapadas', () => {
  const v = Plantilla.leerValores(camposFalsos({
    mod: campo('Virtual'),
    clases: campo('3'),
    dur: campo('4 horas'),
    horario: campo('6:00 p. m.'),
    fecha: campo('2026-08-12'),
    inv: campo('450000')
  }));
  assert.match(v.detalles, /<strong>Modalidad:<\/strong> Virtual/);
  assert.match(v.detalles, /<strong>Número de clases:<\/strong> 3/);
  assert.match(v.detalles, /<strong>Duración:<\/strong> 4 horas/);
  assert.match(v.detalles, /<strong>Horario en vivo:<\/strong> 6:00 p\. m\./);
  assert.match(v.detalles, /<strong>Fecha de inicio:<\/strong> Miércoles 12 de Agosto de 2026/);
  assert.match(v.detalles, /<strong>Inversión:<\/strong> \$450\.000/);
  const sinOptional = Plantilla.leerValores(camposFalsos({ mod: campo('Presencial') }));
  assert.doesNotMatch(sinOptional.detalles, /Número de clases/);
});

test('XSS: generar() escapa el título y la URL de la imagen', () => {
  const v = Plantilla.leerValores(camposFalsos({
    titulo: campo('<img src=x onerror=alert(1)>'),
    img: campo('https://x.com/a?b=1&c=2')
  }));
  const html = Plantilla.generar(v);
  assert.doesNotMatch(html, /<img src=x onerror/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /https:\/\/x\.com\/a\?b=1&amp;c=2/);
});

test('generar(): enlace wa.me con mensaje codificado y botón', () => {
  const v = Plantilla.leerValores(camposFalsos({
    wa: campo('3224418087'),
    msg: campo('Hola, quiero información del curso'),
    boton: campo('Escríbeme')
  }));
  const html = Plantilla.generar(v);
  assert.match(html, /https:\/\/wa\.me\/\+573224418087\?text=Hola%2C%20quiero%20informaci%C3%B3n%20del%20curso/);
  assert.match(html, /Escríbeme/);
  assert.match(html, /wa\.me\/\+57/);
});

test('generar(): usa la empresa del campo en la cabecera y sin marcas fijas', () => {
  const v = Plantilla.leerValores(camposFalsos({
    titulo: campo('Curso'),
    empresa: campo('Mi Empresa'),
    img: campo('https://x.com/a.jpg')
  }));
  const html = Plantilla.generar(v);
  assert.match(html, /Mi Empresa/);
  assert.match(html, /alt="Curso Mi Empresa"/);
  assert.doesNotMatch(html, /Comfacundi/);
});

test('generar(): sin empresa, la cabecera de marca no aparece', () => {
  const html = Plantilla.generar(Plantilla.leerValores(camposFalsos()));
  assert.doesNotMatch(html, /Comfacundi/);
  assert.doesNotMatch(html, /font-size:26px/);
});