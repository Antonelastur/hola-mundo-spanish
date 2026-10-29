/*
 * Aplicația: activitățile lecției, panoul de comenzi și legătura cu scena.
 * Conținutul vine din DE.LECCION, geometria din DE.LAYOUT.
 */
(function (DE) {
  'use strict';

  const L = DE.LECCION;
  const Y = DE.LAYOUT;
  const logic = DE.logic;
  const ACTS = ['exploracion', 'comprension', 'expresion', 'final'];
  const REFS = Object.keys(L.referencias);

  const $ = function (id) { return document.getElementById(id); };
  const sceneEl = $('scene');
  const panelEl = $('panel');
  const statusEl = $('scene-status');
  const noticeEl = $('scene-notice');

  // Starea scenei: singura sursă de adevăr pentru poziții
  const zoneSlots = {};
  L.ordenZonas.forEach(function (z) { zoneSlots[z] = Y.zones[z].slots.length; });
  const scene = new DE.SceneState(zoneSlots, L.ordenObjetos);

  const app = {
    act: 'exploracion',
    selected: null,
    view: null,
    startSnapshot: null,
    exploracion: { seen: {}, info: null, prep: null },
    comprension: { index: 0, results: {}, fb: null, showTr: false },
    expresion: { index: 0, results: {}, fb: null, choice: null, showTr: false },
    final: { index: 0, answers: [], fb: null, choice: null, checked: false, done: false }
  };

  // ---------- Utilitare DOM ----------

  function h(tag, props) {
    const n = document.createElement(tag);
    const p = props || {};
    Object.keys(p).forEach(function (k) {
      const v = p[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
      else if (k === 'disabled' || k === 'hidden') n[k] = true;
      else n.setAttribute(k, v === true ? '' : v);
    });
    for (let i = 2; i < arguments.length; i++) append(n, arguments[i]);
    return n;
  }

  function append(n, c) {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { append(n, x); }); return; }
    n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }

  function es(text, tag) {
    return h(tag || 'span', { lang: 'es', class: 'es' }, text);
  }

  const canSpeak = 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';

  function speak(text) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES';
    u.rate = 0.9;
    const voice = window.speechSynthesis.getVoices().find(function (v) { return /^es([-_]|$)/i.test(v.lang); });
    if (voice) u.voice = voice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  function speakButton(text, key) {
    if (!canSpeak) return null;
    return h('button', { type: 'button', class: 'btn btn-small btn-ghost', 'data-key': key, onclick: function () { speak(text); }, 'aria-label': 'Ascultă în spaniolă: ' + text },
      h('span', { 'aria-hidden': 'true' }, '🔊 '), 'Ascultă');
  }

  function feedbackBox(fb) {
    if (!fb) return null;
    const ok = fb.correcto;
    const badLabel = app.act === 'final' ? L.mensajes.etiquetaIncorrectoFinal : L.mensajes.etiquetaIncorrecto;
    return h('div', { class: 'feedback ' + (ok ? 'is-ok' : 'is-bad'), role: 'status' },
      h('p', { class: 'fb-label' },
        h('span', { class: 'fb-icon', 'aria-hidden': 'true' }, ok ? '✔' : '✘'),
        ok ? L.mensajes.etiquetaCorrecto : badLabel),
      h('p', { class: 'fb-text' }, fb.mensaje));
  }

  function setStatus(text) {
    statusEl.textContent = text || '';
  }

  // ---------- Scena ----------

  function currentTask() {
    if (app.act === 'exploracion') return null;
    const tareas = L.actividades[app.act].tareas;
    return tareas[app[app.act].index] || null;
  }

  function loadSceneFor(task) {
    scene.load(logic.escenaDeTarea(L, task), L.escenaInicial);
    app.startSnapshot = scene.snapshot();
  }

  function dragAllowed() {
    if (app.act === 'exploracion' || app.act === 'comprension') return true;
    const t = currentTask();
    if (app.act === 'final') return !!t && t.tipo === 'colocar' && !app.final.checked && !app.final.done;
    return false;
  }

  function movingAllowed() { return dragAllowed(); }

  function select(id) {
    app.selected = id;
    if (app.view) app.view.setSelected(id);
  }

  function zoneLabel(zid) {
    if (app.act === 'exploracion') return logic.zonaEs(L, zid) + ' (' + L.zonas[zid].ro + ')';
    return L.zonas[zid].ro;
  }

  function onSelect(kind, id) {
    if (kind === 'objeto') {
      select(id);
      if (app.act === 'exploracion') {
        app.exploracion.seen[id] = true;
        app.exploracion.info = { kind: 'objeto', id: id };
      }
      setStatus('Obiect selectat: ' + L.objetos[id].es + (app.act === 'exploracion' || app.act === 'expresion' ? ' (' + L.objetos[id].ro + ')' : '') + '.');
    } else if (kind === 'referencia') {
      if (app.act === 'exploracion') {
        app.exploracion.seen[id] = true;
        app.exploracion.info = { kind: 'referencia', id: id };
      }
      setStatus('Ai ales ' + L.referencias[id].es + ' (' + L.referencias[id].ro + ').');
    }
    renderPanel();
    renderTabs();
  }

  function moveObject(objId, zid) {
    if (!movingAllowed()) return;
    if (!scene.place(objId, zid)) {
      setStatus('Zona „' + zoneLabel(zid) + '” nu mai are loc liber.');
      return;
    }
    select(objId);
    if (app.act === 'exploracion') {
      setStatus(logic.frase(L, objId, zid));
    } else {
      setStatus('Ai pus ' + L.objetos[objId].es + ': ' + L.zonas[zid].ro + '.');
      // O mutare nouă după verificare face feedbackul vechi depășit
      if (app.act === 'comprension') app.comprension.fb = null;
    }
    renderPanel();
  }

  function onDrop(objId, zid) {
    if (!zid) {
      setStatus('Obiectul nu a ajuns într-o zonă de plasare, așa că s-a întors la locul lui.');
      return;
    }
    moveObject(objId, zid);
  }

  function onHoverZone(zid) {
    if (zid) setStatus('Dacă lași obiectul aici, ajunge: ' + zoneLabel(zid) + '.');
  }

  function updateSceneDescription() {
    const list = $('scene-desc-list');
    list.textContent = '';
    L.ordenObjetos.forEach(function (id) {
      list.appendChild(h('li', {}, logic.fraseRo(L, id, scene.zoneOf(id))));
    });
  }

  scene.onChange(function () {
    if (app.view) app.view.render();
    updateSceneDescription();
  });

  function shownZonesForExplore() {
    const p = app.exploracion.prep;
    if (app.act !== 'exploracion' || !p) return [];
    return L.ordenZonas.filter(function (z) { return L.zonas[z].preposicion === p; });
  }

  function syncView() {
    if (!app.view) return;
    app.view.setDragEnabled(dragAllowed());
    app.view.setSelected(app.selected);
    app.view.showZones(shownZonesForExplore());
    app.view.render();
  }

  function viewOptions() {
    return { lesson: L, layout: Y, state: scene, onSelect: onSelect, onDrop: onDrop, onHoverZone: onHoverZone, onError: onViewError };
  }

  function hasWebGL() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) {
      return false;
    }
  }

  function use2D(reason, chosen) {
    if (app.view) app.view.dispose();
    $('scene-loading').hidden = true;
    sceneEl.classList.add('is-2d');
    $('camera-tools').hidden = true;
    $('camera-hint').hidden = true;
    app.view = DE.createView2D(sceneEl, viewOptions());
    noticeEl.textContent = '';
    noticeEl.appendChild(h('p', {}, h('strong', {}, chosen ? 'Varianta 2D este activă. ' : 'Scena 3D nu poate fi afișată. '), reason));
    noticeEl.appendChild(h('p', {}, 'Folosești varianta simplă, în două dimensiuni. Toate activitățile funcționează la fel: apeși pe un obiect (sau pe numele lui din panou) și alegi locul din butoane.'));
    if (location.protocol === 'file:') {
      noticeEl.appendChild(h('p', {}, 'Ai deschis fișierul direct de pe disc. Pentru scena 3D, pornește lecția printr-un server local (vezi README.md).'));
    }
    noticeEl.appendChild(h('button', { type: 'button', class: 'btn btn-small', onclick: retry3D }, 'Încearcă din nou scena 3D'));
    noticeEl.hidden = false;
    syncView();
  }

  function retry3D() {
    const params = new URLSearchParams(location.search);
    if (params.get('mod') === '2d') {
      params.delete('mod');
      const q = params.toString();
      location.search = q ? '?' + q : '';
      return;
    }
    start3D();
  }

  function onViewError(err) {
    use2D(err.message);
  }

  async function start3D() {
    const params = new URLSearchParams(location.search);
    if (params.get('mod') === '2d') {
      use2D('Ai cerut-o prin adresa paginii (?mod=2d).', true);
      return;
    }
    if (!hasWebGL()) {
      use2D('Browserul sau placa video nu permit grafică 3D (WebGL nu este disponibil).');
      return;
    }
    try {
      const THREE = await import(new URL('vendor/three.module.min.js', document.baseURI).href);
      if (app.view) app.view.dispose();
      sceneEl.classList.remove('is-2d');
      app.view = DE.createView3D(THREE, sceneEl, viewOptions());
      $('scene-loading').hidden = true;
      $('camera-tools').hidden = false;
      $('camera-hint').hidden = false;
      noticeEl.hidden = true;
      syncView();
    } catch (err) {
      if (location.protocol === 'file:') use2D('Browserul nu încarcă biblioteca 3D dintr-o pagină deschisă direct de pe disc.');
      else use2D('Biblioteca 3D nu a putut porni (' + (err && err.message ? err.message : err) + ').');
    }
  }

  // ---------- Navigare între activități ----------

  function goTo(act) {
    app.act = act;
    select(null);
    app.exploracion.prep = null;
    setStatus('');
    if (act === 'exploracion') loadSceneFor(null);
    else if (act === 'final' && app.final.done) loadSceneFor(L.actividades.final.tareas[L.actividades.final.tareas.length - 1]);
    else loadSceneFor(currentTask());
    syncView();
    renderTabs();
    renderPanel();
  }

  function goToTask(index) {
    const st = app[app.act];
    st.index = index;
    st.fb = null;
    st.showTr = false;
    if ('choice' in st) st.choice = null;
    if (app.act === 'final') app.final.checked = false;
    select(null);
    setStatus('');
    loadSceneFor(currentTask());
    syncView();
    renderTabs();
    renderPanel();
    panelEl.focus();
  }

  function countTrue(obj) {
    return Object.keys(obj).filter(function (k) { return obj[k] && obj[k].correct; }).length;
  }

  function tabStatus(act) {
    if (act === 'exploracion') {
      const total = L.ordenObjetos.length + REFS.length;
      const seen = Object.keys(app.exploracion.seen).length;
      return seen >= total ? '✔ ' + seen + '/' + total : seen + '/' + total;
    }
    const total = L.actividades[act].tareas.length;
    if (act === 'final') {
      if (!app.final.done) return app.final.answers.length + '/' + total;
      return '✔ ' + app.final.answers.filter(function (a) { return a.correcto; }).length + '/' + total + ' corecte';
    }
    const ok = countTrue(app[act].results);
    return (ok >= total ? '✔ ' : '') + ok + '/' + total;
  }

  function renderTabs() {
    ACTS.forEach(function (act) {
      const b = document.querySelector('[data-act="' + act + '"]');
      b.setAttribute('aria-selected', act === app.act ? 'true' : 'false');
      b.tabIndex = act === app.act ? 0 : -1;
      b.querySelector('.tab-status').textContent = tabStatus(act);
    });
  }

  // ---------- Panoul ----------

  function renderPanel() {
    const active = document.activeElement;
    const key = active && panelEl.contains(active) ? active.getAttribute('data-key') : null;
    panelEl.textContent = '';
    const builder = { exploracion: panelExploracion, comprension: panelComprension, expresion: panelExpresion, final: panelFinal }[app.act];
    append(panelEl, builder());
    if (key) {
      const again = panelEl.querySelector('[data-key="' + key + '"]');
      if (again && !again.disabled) again.focus();
      else panelEl.focus();
    }
  }

  function objectPicker(disabled) {
    return h('fieldset', { class: 'group' },
      h('legend', {}, 'Alege obiectul'),
      h('div', { class: 'btn-row' }, L.ordenObjetos.map(function (id) {
        const on = app.selected === id;
        return h('button', {
          type: 'button', class: 'btn btn-choice' + (on ? ' is-on' : ''), 'aria-pressed': on ? 'true' : 'false',
          'data-key': 'obj-' + id, disabled: disabled, onclick: function () { onSelect('objeto', id); }
        }, h('span', { class: 'mark', 'aria-hidden': 'true' }, on ? '●' : '○'), es(L.objetos[id].es));
      })));
  }

  function zonePicker(disabled, bilingual) {
    const sel = app.selected;
    return h('fieldset', { class: 'group' },
      h('legend', {}, sel ? 'Unde pui obiectul selectat?' : 'Unde pui obiectul? (selectează mai întâi un obiect)'),
      h('div', { class: 'btn-row' }, L.ordenZonas.map(function (zid) {
        const here = sel && scene.zoneOf(sel) === zid;
        return h('button', {
          type: 'button', class: 'btn btn-zone', 'data-key': 'zone-' + zid,
          disabled: disabled || !sel, onclick: function () { moveObject(sel, zid); }
        }, bilingual ? [es(logic.zonaEs(L, zid)), h('small', {}, L.zonas[zid].ro)] : L.zonas[zid].ro,
        here ? h('span', { class: 'here' }, ' (aici este acum)') : null);
      })));
  }

  function taskHeader(act) {
    const total = L.actividades[act].tareas.length;
    return h('p', { class: 'task-count' }, 'Sarcina ' + (app[act].index + 1) + ' din ' + total);
  }

  function taskNav(act) {
    const st = app[act];
    const total = L.actividades[act].tareas.length;
    return h('div', { class: 'btn-row nav-row' },
      h('button', { type: 'button', class: 'btn btn-ghost', 'data-key': 'prev', disabled: st.index === 0, onclick: function () { goToTask(st.index - 1); } }, '← Sarcina anterioară'),
      st.index < total - 1
        ? h('button', { type: 'button', class: 'btn' + (st.fb && st.fb.correcto ? ' btn-primary' : ' btn-ghost'), 'data-key': 'next', onclick: function () { goToTask(st.index + 1); } }, 'Sarcina următoare →')
        : nextActivityButton(act));
  }

  function nextActivityButton(act) {
    const i = ACTS.indexOf(act);
    if (i < 0 || i >= ACTS.length - 1) return null;
    const next = ACTS[i + 1];
    return h('button', { type: 'button', class: 'btn btn-ghost', 'data-key': 'next-act', onclick: function () { goTo(next); } },
      'Mergi la ' + L.actividades[next].titulo.replace(/^\d+\.\s*/, '') + ' →');
  }

  function translationToggle(st, text) {
    return [
      h('button', {
        type: 'button', class: 'btn btn-small btn-ghost', 'aria-expanded': st.showTr ? 'true' : 'false', 'data-key': 'tr',
        onclick: function () { st.showTr = !st.showTr; renderPanel(); }
      }, st.showTr ? 'Ascunde traducerea' : 'Arată traducerea'),
      st.showTr ? h('p', { class: 'translation' }, text) : null
    ];
  }

  // 1. Explorare
  function panelExploracion() {
    const A = L.actividades.exploracion;
    const st = app.exploracion;
    const total = L.ordenObjetos.length + REFS.length;
    const seen = Object.keys(st.seen).length;

    const items = L.ordenObjetos.map(function (id) { return { kind: 'objeto', id: id, es: L.objetos[id].es }; })
      .concat(REFS.map(function (id) { return { kind: 'referencia', id: id, es: L.referencias[id].es }; }));

    let info = null;
    if (st.info) {
      const isObj = st.info.kind === 'objeto';
      const d = isObj ? L.objetos[st.info.id] : L.referencias[st.info.id];
      const sentence = isObj ? logic.frase(L, st.info.id, scene.zoneOf(st.info.id)) : null;
      info = h('div', { class: 'card info-card' },
        h('p', { class: 'word' }, es(d.es, 'strong'), ' ', h('span', { class: 'ro' }, '= ' + d.ro)),
        speakButton(logic.capitalizar(d.es), 'speak-word'),
        isObj
          ? h('p', { class: 'sentence' }, es(sentence), ' ', speakButton(sentence, 'speak-sentence'))
          : h('p', {}, 'Obiect fix. Descriem poziția celorlalte obiecte față de ' + d.roScurt + '.'));
    }

    let prepInfo = null;
    if (st.prep) {
      const p = L.preposiciones[st.prep];
      const zs = shownZonesForExplore();
      const examples = [];
      L.ordenObjetos.forEach(function (o) {
        if (zs.indexOf(scene.zoneOf(o)) >= 0) examples.push(logic.frase(L, o, scene.zoneOf(o)));
      });
      prepInfo = h('div', { class: 'card' },
        h('p', { class: 'word' }, es(p.es, 'strong'), ' ', h('span', { class: 'ro' }, '= ' + p.ro)),
        h('p', {}, p.explicacion),
        h('p', {}, 'Zona evidențiată în scenă (dreptunghiul colorat, cu contur): ' + zs.map(function (z) { return L.zonas[z].ro; }).join(', ') + '.'),
        examples.length
          ? h('ul', { class: 'examples' }, examples.map(function (f) { return h('li', {}, es(f)); }))
          : h('p', {}, 'Acum nu este niciun obiect aici. Mută un obiect în zona evidențiată ca să vezi un exemplu.'));
    }

    return [
      h('h2', {}, A.titulo),
      h('p', { class: 'lead' }, A.instrucciones),
      h('fieldset', { class: 'group' },
        h('legend', {}, 'Ce este în scenă?'),
        h('div', { class: 'btn-row' }, items.map(function (it) {
          const done = !!st.seen[it.id];
          const on = st.info && st.info.id === it.id;
          return h('button', {
            type: 'button', class: 'btn btn-choice' + (on ? ' is-on' : ''), 'aria-pressed': on ? 'true' : 'false', 'data-key': 'item-' + it.id,
            onclick: function () { onSelect(it.kind, it.id); }
          }, es(it.es), done ? h('span', { class: 'seen' }, ' ✔ văzut') : null);
        })),
        h('p', { class: 'progress' }, 'Ai explorat ' + seen + ' din ' + total + ' elemente.')),
      info,
      st.info && st.info.kind === 'objeto' ? zonePicker(false, true) : null,
      h('fieldset', { class: 'group' },
        h('legend', {}, 'Prepozițiile'),
        h('p', { class: 'hint' }, A.instruccionesPreposiciones),
        h('div', { class: 'btn-row' }, L.ordenPreposiciones.map(function (pid) {
          const on = st.prep === pid;
          return h('button', {
            type: 'button', class: 'btn btn-choice' + (on ? ' is-on' : ''), 'aria-pressed': on ? 'true' : 'false', 'data-key': 'prep-' + pid,
            onclick: function () { st.prep = on ? null : pid; syncView(); renderPanel(); }
          }, h('span', { class: 'mark', 'aria-hidden': 'true' }, on ? '●' : '○'), es(L.preposiciones[pid].es));
        }))),
      prepInfo,
      h('p', { class: 'note' }, L.notaGramatica),
      h('div', { class: 'btn-row' },
        h('button', { type: 'button', class: 'btn btn-ghost', 'data-key': 'reset', onclick: function () { loadSceneFor(null); setStatus('Scena a revenit la început.'); renderPanel(); } }, 'Resetează scena'),
        seen >= total ? h('button', { type: 'button', class: 'btn btn-primary', 'data-key': 'next-act', onclick: function () { goTo('comprension'); } }, 'Mergi la Înțelegere →') : null),
      seen >= total ? h('p', { class: 'progress' }, '✔ Ai explorat toate elementele.') : null
    ];
  }

  // 2. Înțelegere
  function panelComprension() {
    const A = L.actividades.comprension;
    const st = app.comprension;
    const t = currentTask();
    const res = st.results[t.id] || { attempts: 0, correct: false };

    function check() {
      const fb = logic.evaluarColocar(L, t, scene.snapshot(), app.startSnapshot);
      const r = st.results[t.id] || { attempts: 0, correct: false };
      if (fb.caso !== 'sinMover') r.attempts++;
      if (fb.correcto) r.correct = true;
      st.results[t.id] = r;
      st.fb = fb;
      renderTabs();
      renderPanel();
    }

    return [
      h('h2', {}, A.titulo),
      h('p', { class: 'lead' }, A.instrucciones),
      taskHeader('comprension'),
      h('div', { class: 'card task-card' },
        h('p', { class: 'instruction' }, es(t.instruccion)),
        h('div', { class: 'btn-row' }, speakButton(t.instruccion, 'speak'), translationToggle(st, t.traduccion))),
      objectPicker(false),
      zonePicker(false, false),
      h('div', { class: 'btn-row' },
        h('button', { type: 'button', class: 'btn btn-primary', 'data-key': 'check', onclick: check }, 'Verifică'),
        h('button', { type: 'button', class: 'btn btn-ghost', 'data-key': 'reset', onclick: function () { loadSceneFor(t); st.fb = null; setStatus('Obiectele au revenit la începutul sarcinii.'); renderPanel(); } }, 'Resetează scena'),
        h('button', { type: 'button', class: 'btn btn-ghost', 'data-key': 'retry', onclick: function () { delete st.results[t.id]; goToTask(st.index); } }, 'Reia sarcina')),
      feedbackBox(st.fb),
      res.attempts ? h('p', { class: 'progress' }, 'Verificări la această sarcină: ' + res.attempts + (res.correct ? ' (rezolvată)' : '')) : null,
      taskNav('comprension')
    ];
  }

  function optionButtons(t, st, disabled) {
    return h('fieldset', { class: 'group' },
      h('legend', {}, 'Alege propoziția'),
      h('div', { class: 'options' }, t.opciones.map(function (op, i) {
        const on = st.choice === i;
        return h('button', {
          type: 'button', class: 'btn btn-option' + (on ? ' is-on' : ''), 'aria-pressed': on ? 'true' : 'false', 'data-key': 'opt-' + i,
          disabled: disabled, onclick: function () { st.choice = i; if (app.act === 'expresion') st.fb = null; renderPanel(); }
        }, h('span', { class: 'mark', 'aria-hidden': 'true' }, on ? '●' : '○'), es(logic.frase(L, op.objeto, op.zona)));
      })));
  }

  // 3. Exprimare
  function panelExpresion() {
    const A = L.actividades.expresion;
    const st = app.expresion;
    const t = currentTask();

    function check() {
      const fb = logic.evaluarElegir(L, t, st.choice, scene.snapshot());
      if (fb.caso !== 'sinRespuesta') {
        const r = st.results[t.id] || { attempts: 0, correct: false };
        r.attempts++;
        if (fb.correcto) r.correct = true;
        st.results[t.id] = r;
      }
      st.fb = fb;
      renderTabs();
      renderPanel();
    }

    return [
      h('h2', {}, A.titulo),
      h('p', { class: 'lead' }, A.instrucciones),
      taskHeader('expresion'),
      h('div', { class: 'card task-card' },
        h('p', { class: 'instruction' }, es(t.pregunta)),
        h('div', { class: 'btn-row' }, speakButton(t.pregunta, 'speak'), translationToggle(st, t.traduccion))),
      optionButtons(t, st, false),
      h('div', { class: 'btn-row' },
        h('button', { type: 'button', class: 'btn btn-primary', 'data-key': 'check', onclick: check }, 'Verifică'),
        h('button', { type: 'button', class: 'btn btn-ghost', 'data-key': 'retry', onclick: function () { delete st.results[t.id]; goToTask(st.index); } }, 'Reia sarcina')),
      feedbackBox(st.fb),
      taskNav('expresion')
    ];
  }

  // 4. Verificare finală
  function panelFinal() {
    const A = L.actividades.final;
    const st = app.final;
    const tareas = A.tareas;

    if (st.done) {
      const ok = st.answers.filter(function (a) { return a.correcto; }).length;
      return [
        h('h2', {}, A.titulo),
        h('div', { class: 'card result-card', role: 'status' },
          h('p', { class: 'score' }, logic.fill(L.mensajes.final.resultado, { correctas: ok, total: tareas.length })),
          h('p', {}, ok === tareas.length ? L.mensajes.final.todoBien : L.mensajes.final.repasar)),
        h('ol', { class: 'summary' }, st.answers.map(function (a, i) {
          const t = tareas[i];
          return h('li', { class: a.correcto ? 'is-ok' : 'is-bad' },
            h('p', { class: 'fb-label' }, h('span', { class: 'fb-icon', 'aria-hidden': 'true' }, a.correcto ? '✔' : '✘'), a.correcto ? L.mensajes.etiquetaCorrecto : L.mensajes.etiquetaIncorrectoFinal),
            h('p', {}, es(t.tipo === 'colocar' ? t.instruccion : t.pregunta), ' ', h('span', { class: 'ro' }, '(' + t.traduccion + ')')),
            a.respuesta ? h('p', {}, 'Răspunsul tău: ', es(a.respuesta)) : null,
            h('p', {}, a.mensaje));
        })),
        h('div', { class: 'btn-row' },
          h('button', { type: 'button', class: 'btn btn-primary', 'data-key': 'restart', onclick: restartFinal }, 'Reia verificarea finală'))
      ];
    }

    const t = tareas[st.index];
    const isLast = st.index === tareas.length - 1;

    function check() {
      let fb;
      let respuesta = null;
      if (t.tipo === 'colocar') {
        fb = logic.evaluarColocar(L, t, scene.snapshot(), app.startSnapshot);
        respuesta = logic.frase(L, t.objeto, scene.zoneOf(t.objeto));
        if (fb.caso === 'sinMover' || fb.caso === 'otroObjeto') respuesta = null;
      } else {
        fb = logic.evaluarElegir(L, t, st.choice, scene.snapshot());
        if (fb.caso === 'sinRespuesta') { st.fb = fb; renderPanel(); return; }
        const op = t.opciones[st.choice];
        respuesta = logic.frase(L, op.objeto, op.zona);
      }
      st.fb = fb;
      st.checked = true;
      st.answers[st.index] = { correcto: fb.correcto, mensaje: fb.mensaje, respuesta: respuesta };
      select(null);
      syncView();
      renderTabs();
      renderPanel();
    }

    function next() {
      if (isLast) {
        st.done = true;
        st.fb = null;
        renderTabs();
        renderPanel();
        panelEl.focus();
        return;
      }
      goToTask(st.index + 1);
    }

    const locked = st.checked;
    return [
      h('h2', {}, A.titulo),
      h('p', { class: 'lead' }, A.instrucciones),
      taskHeader('final'),
      h('div', { class: 'card task-card' },
        h('p', { class: 'instruction' }, es(t.tipo === 'colocar' ? t.instruccion : t.pregunta)),
        h('div', { class: 'btn-row' }, speakButton(t.tipo === 'colocar' ? t.instruccion : t.pregunta, 'speak'))),
      t.tipo === 'colocar' ? [objectPicker(locked), zonePicker(locked, false)] : optionButtons(t, st, locked),
      h('div', { class: 'btn-row' },
        locked ? null : h('button', { type: 'button', class: 'btn btn-primary', 'data-key': 'check', onclick: check }, 'Verifică'),
        !locked && t.tipo === 'colocar'
          ? h('button', { type: 'button', class: 'btn btn-ghost', 'data-key': 'reset', onclick: function () { loadSceneFor(t); setStatus('Obiectele au revenit la începutul sarcinii.'); renderPanel(); } }, 'Resetează scena')
          : null,
        locked ? h('button', { type: 'button', class: 'btn btn-primary', 'data-key': 'continue', onclick: next }, isLast ? 'Vezi rezultatul' : 'Continuă →') : null),
      feedbackBox(st.fb),
      locked ? null : h('p', { class: 'hint' }, 'Ai o singură verificare la fiecare sarcină.')
    ];
  }

  function restartFinal() {
    app.final = { index: 0, answers: [], fb: null, choice: null, checked: false, done: false };
    goToTask(0);
  }

  // ---------- Pornire ----------

  function initTabs() {
    ACTS.forEach(function (act, i) {
      const b = document.querySelector('[data-act="' + act + '"]');
      b.querySelector('.tab-title').textContent = L.actividades[act].titulo;
      b.addEventListener('click', function () { goTo(act); });
      b.addEventListener('keydown', function (e) {
        let j = null;
        if (e.key === 'ArrowRight') j = (i + 1) % ACTS.length;
        if (e.key === 'ArrowLeft') j = (i - 1 + ACTS.length) % ACTS.length;
        if (j === null) return;
        e.preventDefault();
        goTo(ACTS[j]);
        document.querySelector('[data-act="' + ACTS[j] + '"]').focus();
      });
    });
  }

  function initCameraTools() {
    $('cam-left').addEventListener('click', function () { if (app.view) app.view.rotate(0.26); });
    $('cam-right').addEventListener('click', function () { if (app.view) app.view.rotate(-0.26); });
    $('cam-reset').addEventListener('click', function () { if (app.view) app.view.resetCamera(); });
  }

  function init() {
    $('subtitulo').textContent = L.subtitulo + ' · ' + L.nivel;
    const obj = $('objetivos');
    L.objetivos.forEach(function (o) { obj.appendChild(h('li', {}, o)); });

    const errors = logic.validarLeccion(L, Y);
    if (errors.length) {
      panelEl.textContent = '';
      append(panelEl, [
        h('h2', {}, 'Datele lecției au greșeli'),
        h('p', {}, 'Corectează fișierul data/leccion-donde-esta.js și reîncarcă pagina:'),
        h('ul', { class: 'errors' }, errors.map(function (e) { return h('li', {}, e); }))
      ]);
      $('scene-loading').textContent = 'Scena nu pornește până nu sunt corectate datele lecției.';
      return;
    }

    initTabs();
    initCameraTools();
    loadSceneFor(null);
    renderTabs();
    renderPanel();
    start3D();
  }

  // Expus pentru testare din consola browserului.
  DE.app = { state: app, scene: scene, view: function () { return app.view; }, goTo: goTo, goToTask: goToTask, moveObject: moveObject };

  init();
})(window.DE);
