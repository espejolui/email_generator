import { test } from 'node:test';
import assert from 'node:assert/strict';

const { Config } = await import('../js/config.js');
const { UI } = await import('../js/ui.js');

test('Config.requeridos: 13 campos obligatorios con sus ids', () => {
  assert.equal(Config.requeridos.length, 13);
  const ids = Config.requeridos.map((r) => r[0]);
  for (const id of ['f-empresa', 'f-titulo', 'f-franja', 'f-desc', 'f-mod', 'f-dur', 'f-horario', 'f-fecha', 'f-inv', 'f-img', 'f-asesor', 'f-equipo', 'f-wa']) {
    assert.ok(ids.includes(id), 'falta el requerido ' + id);
  }
  assert.ok(Config.requeridos.every((r) => r[1] !== ''), 'todas las etiquetas deben existir');
});

function mockDocument(valores) {
  const faltas = [];
  globalThis.document = {
    getElementById(id) {
      return {
        value: valores[id] || '',
        classList: {
          add(c) { faltas.push(id + ':' + c); },
          remove() {}
        }
      };
    }
  };
  return faltas;
}

test('validar: devuelve las etiquetas de los vacíos y marca con la clase falta', () => {
  const faltasGuardadas = mockDocument({ 'f-titulo': 'Curso' });
  const faltantes = UI.validar();
  assert.equal(faltantes.length, 12, 'solo falta 1: ' + faltantes.join(', '));
  assert.ok(!faltantes.includes('Título del email'));
  assert.ok(faltantes.includes('Nombre de la empresa'));
  assert.ok(faltantes.includes('Sede'));
  assert.ok(faltantes.includes('Número de WhatsApp'));
  assert.ok(faltasGuardadas.includes('f-franja:falta'));
});

test('validar: sin campos vacíos devuelve []', () => {
  mockDocument({
    'f-empresa': 'Empresa', 'f-titulo': 'a', 'f-franja': 'Cesap', 'f-desc': 'b', 'f-mod': 'Virtual',
    'f-dur': 'c', 'f-horario': 'd', 'f-fecha': '2026-08-12', 'f-inv': '1000',
    'f-img': 'https://x.com/a.jpg', 'f-asesor': 'Nombre', 'f-equipo': 'Equipo', 'f-wa': '3224418087'
  });
  assert.deepEqual(UI.validar(), []);
});

test('validar: los espacios no cuentan como valor', () => {
  mockDocument({
    'f-empresa': 'Mi Empresa', 'f-titulo': '  ', 'f-franja': 'Cesap', 'f-desc': 'b', 'f-mod': 'Virtual',
    'f-dur': 'c', 'f-horario': 'd', 'f-fecha': '2026-08-12', 'f-inv': '1000',
    'f-img': 'https://x.com/a.jpg', 'f-asesor': 'Nombre', 'f-equipo': 'Equipo', 'f-wa': '3224418087'
  });
  assert.deepEqual(UI.validar(), ['Título del email']);
});

test('ui: carga sin document no se rompe (boot protegido)', () => {
  assert.equal(typeof UI, 'object');
  assert.equal(typeof UI.validar, 'function');
});

test('slug: genera nombres de archivo seguros', () => {
  assert.equal(UI.slug('Curso de Fotografía 2026'), 'curso_de_fotografia_2026');
  assert.equal(UI.slug(''), 'email');
  assert.equal(UI.slug('   '), 'email');
});

test('autocompletarEquipo: rellena con "Equipo" + empresa si está vacío', () => {
  UI.campos = { empresa: { value: 'Cesap' }, equipo: { value: '' } };
  UI.autocompletarEquipo();
  assert.equal(UI.campos.equipo.value, 'Equipo Cesap');
});

test('autocompletarEquipo: concatena la empresa completa aunque haya un valor previo', () => {
  UI.campos = { empresa: { value: 'Cesap' }, equipo: { value: 'Equipo Cesa' } };
  UI.autocompletarEquipo();
  assert.equal(UI.campos.equipo.value, 'Equipo Cesap');
});

test('autocompletarEquipo: sin empresa deja el campo vacío', () => {
  UI.campos = { empresa: { value: '   ' }, equipo: { value: 'Equipo Cesap' } };
  UI.autocompletarEquipo();
  assert.equal(UI.campos.equipo.value, '');
});

function nodoFalso(tag, attrs, hijos, texto) {
  const n = {
    nodeType: tag === '#text' ? 3 : 1,
    nodeName: tag === '#text' ? '#text' : tag.toUpperCase(),
    textContent: texto !== undefined ? texto : '',
    attributes: Object.entries(attrs || {}).map(([name, value]) => ({ name, value })),
    childNodes: (hijos || []).slice(),
    parentNode: null,
    getAttribute(name) {
      const a = n.attributes.find((x) => x.name === name);
      return a ? a.value : null;
    },
    hasAttribute(name) {
      return n.attributes.some((x) => x.name === name);
    },
    setAttribute(name, value) {
      const a = n.attributes.find((x) => x.name === name);
      if (a) a.value = value; else n.attributes.push({ name, value });
    },
    removeAttribute(name) {
      n.attributes = n.attributes.filter((x) => x.name !== name);
    },
    remove() {
      if (!n.parentNode) return;
      const idx = n.parentNode.childNodes.indexOf(n);
      if (idx >= 0) n.parentNode.childNodes.splice(idx, 1);
      n.parentNode = null;
    },
    replaceWith(sust) {
      if (!n.parentNode) return;
      const idx = n.parentNode.childNodes.indexOf(n);
      if (idx >= 0) n.parentNode.childNodes.splice(idx, 1, sust);
      sust.parentNode = n.parentNode;
      n.parentNode = null;
    },
    appendChild(h) {
      n.childNodes.push(h);
      h.parentNode = n;
    },
    cloneNode(profundo) {
      return nodoFalso(
        tag === '#text' ? '#text' : tag,
        Object.fromEntries(n.attributes.map((a) => [a.name, a.value])),
        profundo ? n.childNodes.map((c) => c.cloneNode(true)) : [],
        n.textContent
      );
    }
  };
  for (const h of n.childNodes) h.parentNode = n;
  return n;
}

function texto(valor) {
  return nodoFalso('#text', {}, [], valor);
}

let arbolParseado = null;
globalThis.DOMParser = class {
  parseFromString() {
    return { documentElement: arbolParseado };
  }
};

test('aplicarVista: fallback a srcdoc si el iframe aún no cargó', () => {
  const iframe = { contentDocument: null };
  UI.iframeVista = iframe;
  UI.aplicarVista('<html></html>');
  assert.equal(iframe.srcdoc, '<html></html>');
});

test('parchear: actualiza texto y atributos sin recargar', () => {
  const viejo = nodoFalso('p', { style: 'color:#000' }, [texto('Curso viejo')]);
  const nuevo = nodoFalso('p', { style: 'color:#41b6e6' }, [texto('Curso nuevo')]);
  UI._parchear(viejo, nuevo);
  assert.equal(viejo.childNodes[0].textContent, 'Curso nuevo');
  assert.equal(viejo.getAttribute('style'), 'color:#41b6e6');
});

test('parchear: inserta y elimina bloques cuando cambia la estructura', () => {
  const viejo = nodoFalso('td', {}, [
    nodoFalso('p', {}, [texto('a')]),
    nodoFalso('p', {}, [texto('b')])
  ]);
  const nuevo = nodoFalso('td', {}, [
    nodoFalso('p', {}, [texto('a')]),
    nodoFalso('p', {}, [texto('b')]),
    nodoFalso('p', {}, [texto('c')])
  ]);
  UI._parchear(viejo, nuevo);
  assert.equal(viejo.childNodes.length, 3);
  assert.equal(viejo.childNodes[2].childNodes[0].textContent, 'c');
  const menos = nodoFalso('td', {}, [
    nodoFalso('p', {}, [texto('a')])
  ]);
  UI._parchear(viejo, menos);
  assert.equal(viejo.childNodes.length, 1);
});

test('aplicarVista: con iframe cargado parcha la vista sin tocar srcdoc', () => {
  const doc = { readyState: 'complete', documentElement: nodoFalso('html', {}, [nodoFalso('p', {}, [texto('Antes')])]) };
  const iframe = { contentDocument: doc };
  arbolParseado = nodoFalso('html', {}, [nodoFalso('p', {}, [texto('Después')])]);
  UI.iframeVista = iframe;
  UI.aplicarVista('<html></html>');
  assert.equal(iframe.srcdoc, undefined);
  assert.equal(doc.documentElement.childNodes[0].childNodes[0].textContent, 'Después');
});

test('aplicarVista: parcha aunque el HTML nuevo sea distinto al render inicial', () => {
  const doc = { readyState: 'complete', documentElement: nodoFalso('html', {}, [nodoFalso('img', { src: 'a.jpg' })]) };
  const iframe = { contentDocument: doc };
  arbolParseado = nodoFalso('html', {}, [
    nodoFalso('img', { src: 'a.jpg' }),
    nodoFalso('p', {}, [texto('bloque nuevo')])
  ]);
  UI.iframeVista = iframe;
  UI.aplicarVista('<html></html>');
  assert.equal(doc.documentElement.childNodes.length, 2);
  assert.equal(doc.documentElement.childNodes[1].childNodes[0].textContent, 'bloque nuevo');
});

function llenarPoblar() {
  const opciones = [];
  const select = {
    appendChild(o) { opciones.push(o); },
    _opciones: opciones
  };
  globalThis.document = {
    createElement(tag) { return { tag, value: '', textContent: '' }; }
  };
  UI.campos = {
    franja: select, mod: select, clases: select,
    color1: { value: '' }, color1hex: { value: '' },
    color2: { value: '' }, color2hex: { value: '' },
    wa: { placeholder: '' }, boton: { placeholder: '' }
  };
  return select;
}

test('poblarOpciones: llena selects y campos desde Config sin hardcodear', () => {
  const select = llenarPoblar();
  UI.poblarOpciones();
  const valores = select._opciones.map((o) => o.value);
  assert.deepEqual(valores, ['Cesap', 'Chapinero', 'Sesiones virtuales', 'Presencial', 'Virtual', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
  const etiquetas = select._opciones.map((o) => o.textContent);
  assert.ok(etiquetas.includes('Sesiones virtuales'));
  assert.equal(UI.campos.color1.value, Config.valoresDefecto.color1);
  assert.equal(UI.campos.color1hex.value, Config.valoresDefecto.color1);
  assert.equal(UI.campos.color2.value, Config.valoresDefecto.color2);
  assert.equal(UI.campos.color2hex.value, Config.valoresDefecto.color2);
  assert.equal(UI.campos.wa.placeholder, Config.valoresDefecto.wa);
  assert.equal(UI.campos.boton.placeholder, Config.valoresDefecto.boton);
});

test('autocompletarMsg: rellena el mensaje de WhatsApp con el compuesto si está vacío', () => {
  UI.campos = { titulo: { value: 'Curso de Excel Avanzado' }, msg: { value: '' } };
  UI.autocompletarMsg();
  assert.equal(UI.campos.msg.value, 'Hola, quiero inscribirme al curso de Curso de Excel Avanzado');
});

test('autocompletarMsg: se mantiene sincronizado con el título mientras sea el auto-relleno', () => {
  UI._msgAuto = 'Hola, quiero inscribirme al curso de Curso';
  UI.campos = { titulo: { value: 'Curso de Excel Avanzado' }, msg: { value: 'Hola, quiero inscribirme al curso de Curso' } };
  UI.autocompletarMsg();
  assert.equal(UI.campos.msg.value, 'Hola, quiero inscribirme al curso de Curso de Excel Avanzado');
});

test('autocompletarMsg: recupera la sincronización tras recargar con valor guardado', () => {
  UI._msgAuto = '';
  UI.campos = { titulo: { value: 'Curso de Excel' }, msg: { value: 'Hola, quiero inscribirme al curso de Curso de Excel' } };
  UI.autocompletarMsg();
  UI.campos.titulo = { value: 'Curso de Excel Avanzado' };
  UI.autocompletarMsg();
  assert.equal(UI.campos.msg.value, 'Hola, quiero inscribirme al curso de Curso de Excel Avanzado');
});

test('autocompletarMsg: sin título deja el mensaje vacío', () => {
  UI._msgAuto = '';
  UI.campos = { titulo: { value: '   ' }, msg: { value: '' } };
  UI.autocompletarMsg();
  assert.equal(UI.campos.msg.value, '');
});

test('autocompletarMsg: no toca un mensaje ya escrito por el usuario', () => {
  UI._msgAuto = '';
  UI.campos = { titulo: { value: 'Curso' }, msg: { value: 'Quiero más info' } };
  UI.autocompletarMsg();
  assert.equal(UI.campos.msg.value, 'Quiero más info');
});