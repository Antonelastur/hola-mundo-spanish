/*
 * Varianta simplă 2D (SVG), folosită când scena 3D nu poate porni.
 * Afișează aceeași stare (SceneState) într-o vedere din față.
 * Obiectele se selectează cu clic sau cu tastatura și se mută cu butoanele din panou.
 */
window.DE = window.DE || {};

(function (DE) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs, parent) {
    const node = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(node);
    return node;
  }

  DE.createView2D = function (container, opts) {
    const L = opts.lesson;
    const Y = opts.layout;
    const V = Y.view2d;
    const state = opts.state;

    const svg = el('svg', {
      viewBox: '0 ' + V.top + ' ' + V.width + ' ' + (V.height - V.top),
      class: 'scene-svg',
      role: 'group',
      'aria-label': 'Scena în două dimensiuni: o masă, o cutie și obiecte școlare'
    });
    container.appendChild(svg);

    // Fundal: perete și podea
    el('rect', { x: 0, y: 0, width: V.width, height: V.floorY, fill: '#f4efe4' }, svg);
    el('rect', { x: 0, y: V.floorY, width: V.width, height: V.height - V.floorY, fill: '#d8c3a1' }, svg);

    // Zonele evidențiate (sub obiecte)
    const zoneLayer = el('g', {}, svg);
    const pads = {};
    L.ordenZonas.forEach(function (zid) {
      const s = Y.zones[zid].slots2d;
      const x0 = s[0][0] - 28;
      const x1 = s[s.length - 1][0] + 28;
      const y = s[0][1];
      pads[zid] = el('rect', {
        x: x0, y: y - 62, width: x1 - x0, height: 66, rx: 6,
        fill: '#2b7bff', 'fill-opacity': 0.18, stroke: '#0b3d91', 'stroke-width': 2, 'stroke-dasharray': '6 4',
        visibility: 'hidden'
      }, zoneLayer);
    });

    // Masa
    const T = V.table;
    const tableG = el('g', { class: 'ref', 'data-ref': 'mesa' }, svg);
    el('title', {}, tableG).textContent = 'la mesa';
    el('rect', { x: T.x, y: T.topY, width: T.width, height: T.top, fill: '#9a6a3e', rx: 2 }, tableG);
    el('rect', { x: T.x + 10, y: T.topY + T.top, width: T.leg, height: V.floorY - T.topY - T.top, fill: '#9a6a3e' }, tableG);
    el('rect', { x: T.x + T.width - 10 - T.leg, y: T.topY + T.top, width: T.leg, height: V.floorY - T.topY - T.top, fill: '#9a6a3e' }, tableG);

    // Cutia (spatele, apoi obiectele, apoi fața transparentă)
    const B = V.box;
    const boxTop = V.floorY - B.height;
    const boxBack = el('g', { class: 'ref', 'data-ref': 'caja' }, svg);
    el('title', {}, boxBack).textContent = 'la caja';
    el('rect', { x: B.x, y: boxTop, width: B.width, height: B.height, fill: '#a87540' }, boxBack);

    const objLayer = el('g', {}, svg);

    const boxFront = el('g', { class: 'ref', 'data-ref': 'caja', 'pointer-events': 'none' }, svg);
    el('rect', { x: B.x, y: boxTop, width: B.width, height: B.height, fill: '#c48f55', 'fill-opacity': 0.35, stroke: '#6b4a26', 'stroke-width': B.wall }, boxFront);

    // Obiectele mobile, desenate cu baza în (0,0)
    const shapes = {
      libro: function (g, c) {
        el('rect', { x: -23, y: -14, width: 46, height: 14, fill: c, rx: 2 }, g);
        el('rect', { x: -21, y: -11, width: 42, height: 8, fill: '#f7f3ea' }, g);
      },
      lapiz: function (g, c) {
        el('rect', { x: -24, y: -8, width: 38, height: 8, fill: c }, g);
        el('polygon', { points: '14,-8 26,-4 14,0', fill: '#e9c99a' }, g);
        el('rect', { x: -28, y: -8, width: 5, height: 8, fill: '#e07a9a' }, g);
      },
      goma: function (g, c) {
        el('rect', { x: -12, y: -12, width: 24, height: 12, fill: c, rx: 2 }, g);
        el('rect', { x: -12, y: -12, width: 10, height: 12, fill: '#3b6fb6' }, g);
      },
      pelota: function (g, c) {
        el('circle', { cx: 0, cy: -14, r: 14, fill: c }, g);
        el('path', { d: 'M -14 -14 Q 0 -4 14 -14', stroke: '#fff', 'stroke-width': 2, fill: 'none' }, g);
      }
    };

    const objects = {};
    L.ordenObjetos.forEach(function (id) {
      const def = L.objetos[id];
      const g = el('g', { class: 'obj2d', tabindex: 0, role: 'button', 'data-obj': id, 'aria-label': def.es + ' (' + def.ro + ')' }, objLayer);
      // Zonă de clic puțin mai mare decât obiectul, ca să fie ușor de atins
      el('rect', { x: -30, y: -34, width: 60, height: 38, fill: 'transparent', 'pointer-events': 'all' }, g);
      el('rect', { class: 'sel-mark', x: -30, y: -34, width: 60, height: 38, rx: 6, fill: 'none', stroke: '#1d3557', 'stroke-width': 3, visibility: 'hidden' }, g);
      shapes[def.forma](g, def.color);
      el('title', {}, g).textContent = def.es;
      // Eticheta apare doar la obiectul selectat, ca scena să nu fie aglomerată
      const label = el('text', { x: 0, y: -40, 'text-anchor': 'middle', class: 'obj2d-label', visibility: 'hidden', 'pointer-events': 'none' }, g);
      label.textContent = def.es;
      g.addEventListener('click', function () { opts.onSelect('objeto', id); });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opts.onSelect('objeto', id); }
      });
      objects[id] = g;
    });

    [tableG, boxBack].forEach(function (g) {
      g.addEventListener('click', function () { opts.onSelect('referencia', g.getAttribute('data-ref')); });
    });

    let selectedId = null;
    let shown = [];

    function render() {
      L.ordenObjetos.forEach(function (id) {
        const s = Y.zones[state.zoneOf(id)].slots2d[state.slotOf(id)];
        objects[id].setAttribute('transform', 'translate(' + s[0] + ' ' + s[1] + ') scale(' + (V.objectScale || 1) + ')');
        objects[id].querySelector('.sel-mark').setAttribute('visibility', id === selectedId ? 'visible' : 'hidden');
        objects[id].querySelector('.obj2d-label').setAttribute('visibility', id === selectedId ? 'visible' : 'hidden');
        objects[id].setAttribute('aria-pressed', id === selectedId ? 'true' : 'false');
      });
      Object.keys(pads).forEach(function (zid) {
        pads[zid].setAttribute('visibility', shown.indexOf(zid) >= 0 ? 'visible' : 'hidden');
      });
    }

    render();

    return {
      kind: '2d',
      render: render,
      setSelected: function (id) { selectedId = id; render(); },
      showZones: function (ids) { shown = ids || []; render(); },
      setDragEnabled: function () {},
      rotate: function () {},
      resetCamera: function () {},
      dispose: function () { if (svg.parentNode) svg.parentNode.removeChild(svg); }
    };
  };
})(window.DE);
