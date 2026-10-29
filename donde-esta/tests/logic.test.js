/*
 * Teste automate pentru datele lecției și pentru verificarea răspunsurilor.
 * Rulare: node donde-esta/tests/logic.test.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');
const ctx = { window: {} };
vm.createContext(ctx);
['data/leccion-donde-esta.js', 'js/scene-layout.js', 'js/scene-state.js', 'js/lesson-logic.js'].forEach(function (f) {
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
});
const DE = ctx.window.DE;
const L = DE.LECCION;
const Y = DE.LAYOUT;
const logic = DE.logic;

let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('ok ' + n + ' - ' + name);
}

function newState() {
  const slots = {};
  L.ordenZonas.forEach(function (z) { slots[z] = Y.zones[z].slots.length; });
  return new DE.SceneState(slots, L.ordenObjetos);
}

test('datele lecției sunt valide', function () {
  const err = logic.validarLeccion(L, Y);
  assert.strictEqual(err.length, 0, err.join('\n'));
});

test('verificarea finală are cinci sarcini', function () {
  assert.strictEqual(L.actividades.final.tareas.length, 5);
});

test('propozițiile se construiesc corect', function () {
  assert.strictEqual(logic.frase(L, 'libro', 'encima_mesa'), 'El libro está encima de la mesa.');
  assert.strictEqual(logic.frase(L, 'goma', 'lado_caja'), 'La goma está al lado de la caja.');
  assert.strictEqual(logic.frase(L, 'lapiz', 'dentro_caja'), 'El lápiz está dentro de la caja.');
});

test('contracția de + el = del', function () {
  const L2 = JSON.parse(JSON.stringify(L));
  L2.referencias.mesa = { es: 'el escritorio', articulo: 'el', ro: 'biroul' };
  assert.strictEqual(logic.zonaEs(L2, 'lado_mesa'), 'al lado del escritorio');
});

test('starea: fiecare obiect primește un loc, mutarea schimbă zona', function () {
  const s = newState();
  s.load(L.escenaInicial);
  assert.strictEqual(s.zoneOf('libro'), 'encima_mesa');
  assert.ok(s.place('libro', 'debajo_mesa'));
  assert.strictEqual(s.zoneOf('libro'), 'debajo_mesa');
  assert.ok(s.place('lapiz', 'debajo_mesa'));
  assert.notStrictEqual(s.slotOf('libro'), s.slotOf('lapiz'));
});

test('starea: o zonă plină refuză obiectul', function () {
  const slots = { a: 1, b: 2 };
  const s = new DE.SceneState(slots, ['x', 'y']);
  s.load({ x: 'a', y: 'b' });
  assert.strictEqual(s.place('y', 'a'), false);
  assert.strictEqual(s.zoneOf('y'), 'b');
});

const c1 = L.actividades.comprension.tareas[0]; // lápiz encima de la mesa

function scenario(task, moves) {
  const s = newState();
  s.load(logic.escenaDeTarea(L, task));
  const start = s.snapshot();
  moves.forEach(function (m) { s.place(m[0], m[1]); });
  return logic.evaluarColocar(L, task, s.snapshot(), start);
}

test('colocar: corect', function () {
  const r = scenario(c1, [['lapiz', 'encima_mesa']]);
  assert.strictEqual(r.correcto, true);
  assert.match(r.mensaje, /El lápiz está encima de la mesa\./);
});

test('colocar: obiectul nu a fost mutat', function () {
  assert.strictEqual(scenario(c1, []).caso, 'sinMover');
});

test('colocar: alt obiect mutat', function () {
  const r = scenario(c1, [['goma', 'encima_mesa']]);
  assert.strictEqual(r.caso, 'otroObjeto');
  assert.match(r.mensaje, /la goma/);
});

test('colocar: prepoziție greșită', function () {
  const r = scenario(c1, [['lapiz', 'debajo_mesa']]);
  assert.strictEqual(r.caso, 'preposicionIncorrecta');
  assert.match(r.mensaje, /debajo de la mesa/);
  assert.match(r.mensaje, /encima de la mesa/);
});

test('colocar: prepoziție bună, referință greșită', function () {
  const c5 = L.actividades.comprension.tareas[4]; // pelota al lado de la mesa
  const r = scenario(c5, [['pelota', 'lado_caja']]);
  assert.strictEqual(r.caso, 'referenciaIncorrecta');
  assert.match(r.mensaje, /la caja/);
  // mutat și adus înapoi: tot în locul de început
  const r2 = scenario(c5, [['pelota', 'lado_caja'], ['pelota', 'dentro_caja']]);
  assert.strictEqual(r2.caso, 'sinMover');
});

test('elegir: verificarea citește starea reală a scenei', function () {
  const e1 = L.actividades.expresion.tareas[0];
  const s = newState();
  s.load(logic.escenaDeTarea(L, e1));
  assert.strictEqual(logic.evaluarElegir(L, e1, 1, s.snapshot()).correcto, true);
  assert.strictEqual(logic.evaluarElegir(L, e1, 0, s.snapshot()).correcto, false);
  // dacă scena se schimbă, se schimbă și răspunsul corect
  s.place('pelota', 'encima_mesa');
  assert.strictEqual(logic.evaluarElegir(L, e1, 0, s.snapshot()).correcto, true);
  assert.strictEqual(logic.evaluarElegir(L, e1, 1, s.snapshot()).correcto, false);
});

test('elegir: fără răspuns', function () {
  const e1 = L.actividades.expresion.tareas[0];
  assert.strictEqual(logic.evaluarElegir(L, e1, null, {}).caso, 'sinRespuesta');
});

test('validarea prinde o sarcină cu două opțiuni adevărate', function () {
  const L2 = JSON.parse(JSON.stringify(L));
  L2.actividades.expresion.tareas[0].opciones.push({ objeto: 'libro', zona: 'encima_mesa' });
  const err = logic.validarLeccion(L2, Y);
  assert.strictEqual(err.length, 1);
  assert.match(err[0], /exact o opțiune adevărată/);
});

test('mesajele nu conțin înlocuiri rămase necompletate', function () {
  ['comprension', 'final'].forEach(function (act) {
    L.actividades[act].tareas.filter(function (t) { return t.tipo === 'colocar'; }).forEach(function (t) {
      L.ordenZonas.forEach(function (z) {
        const r = scenario(t, [[t.objeto, z]]);
        assert.doesNotMatch(r.mensaje, /\{\w+\}/, t.id + ' ' + z + ': ' + r.mensaje);
      });
    });
  });
});

console.log('\nToate cele ' + n + ' teste au trecut.');
