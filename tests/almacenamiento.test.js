import { test } from 'node:test';
import assert from 'node:assert/strict';

let cookie = '';
globalThis.document = {
  get cookie() { return cookie; },
  set cookie(v) { cookie = v; }
};

const { Config } = await import('../js/config.js');
const { Almacenamiento } = await import('../js/almacenamiento.js');

test('cargar sin cookie guardada devuelve null', () => {
  cookie = '';
  assert.equal(Almacenamiento.cargar(), null);
});

test('guardar escribe clave, SameSite=Lax, path=/ y expires a ~1 mes', () => {
  cookie = '';
  Almacenamiento.guardar({ titulo: 'Curso básico' });
  assert.ok(cookie.startsWith(Config.CLAVE + '='));
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /; path=\//);
  const m = cookie.match(/expires=([^;]+)/);
  assert.ok(m, 'la cookie debe incluir expires');
  const exp = new Date(m[1]).getTime();
  const ahora = Date.now();
  const dias = (exp - ahora) / 86400000;
  assert.ok(dias > 29 && dias < 31, 'debe expirar a 1 mes (30 días), llegó ' + dias.toFixed(2));
});

test('guardar URL-encodes los valores (sin separadores crudos)', () => {
  cookie = '';
  Almacenamiento.guardar({ titulo: 'Función & café ñ' });
  assert.ok(cookie.includes('%26'), 'el & debe ir codificado');
  assert.ok(cookie.includes('%C3%B1'), 'la ñ debe ir codificada');
  assert.ok(!cookie.includes(Config.CLAVE + '={\"'), 'el JSON no debe ir plano');
});

test('guardar/cargar: round-trip con caracteres especiales', () => {
  const datos = { titulo: 'Función & café ñ', inv: '450.000', firma2: 'Equipo' };
  Almacenamiento.guardar(datos);
  assert.deepEqual(Almacenamiento.cargar(), datos);
});

test('cargar ignora otras cookies', () => {
  const datos = { titulo: 'Curso' };
  Almacenamiento.guardar(datos);
  cookie = 'otra_clave=valor; ' + cookie;
  assert.deepEqual(Almacenamiento.cargar(), datos);
});

test('cargar con cookie corrupta devuelve null', () => {
  cookie = Config.CLAVE + '=no-es-json; path=/; SameSite=Lax';
  assert.equal(Almacenamiento.cargar(), null);
  cookie = Config.CLAVE + '=; path=/; SameSite=Lax';
  assert.equal(Almacenamiento.cargar(), null);
});

test('borrar deja la cookie expirada y cargar devuelve null', () => {
  Almacenamiento.guardar({ titulo: 'x' });
  Almacenamiento.borrar();
  assert.match(cookie, /expires=Thu, 01 Jan 1970 00:00:00 GMT/);
  assert.equal(Almacenamiento.cargar(), null);
});