/*
 * Logica lingvistică și verificarea răspunsurilor.
 * Nu conține text de lecție: toate cuvintele și mesajele vin din data/leccion-donde-esta.js.
 * Verificarea primește starea reală a scenei (snapshot din SceneState).
 */
window.DE = window.DE || {};

(function (DE) {
  'use strict';

  function capitalizar(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  function fill(tpl, vars) {
    return tpl.replace(/\{(\w+)\}/g, function (m, key) {
      return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : m;
    });
  }

  // Mesajele încep mereu cu majusculă, chiar dacă șablonul începe cu {objeto}.
  function mensaje(tpl, vars) {
    return capitalizar(fill(tpl, vars));
  }

  // „encima de” + „el libro” = „encima del libro”; „encima de” + „la mesa” = „encima de la mesa”.
  function unirPreposicion(prepEs, referencia) {
    if (referencia.articulo === 'el' && /\bde$/.test(prepEs)) {
      return prepEs.replace(/de$/, 'del') + referencia.es.replace(/^el/, '');
    }
    return prepEs + ' ' + referencia.es;
  }

  function zonaEs(L, zoneId) {
    var z = L.zonas[zoneId];
    return unirPreposicion(L.preposiciones[z.preposicion].es, L.referencias[z.referencia]);
  }

  function frase(L, objId, zoneId) {
    return capitalizar(L.objetos[objId].es) + ' está ' + zonaEs(L, zoneId) + '.';
  }

  // Descriere în română, pentru cititoare de ecran și varianta textuală.
  function fraseRo(L, objId, zoneId) {
    return capitalizar(L.objetos[objId].ro) + ': ' + L.zonas[zoneId].ro + '.';
  }

  function escenaDeTarea(L, tarea) {
    var out = {};
    for (var i = 0; i < L.ordenObjetos.length; i++) {
      var id = L.ordenObjetos[i];
      out[id] = (tarea && tarea.escena && tarea.escena[id]) || L.escenaInicial[id];
    }
    return out;
  }

  function varsZona(L, prefix, zoneId, vars) {
    var z = L.zonas[zoneId];
    var p = L.preposiciones[z.preposicion];
    var r = L.referencias[z.referencia];
    vars['prep' + prefix] = p.es;
    vars['prep' + prefix + 'Ro'] = p.ro;
    vars['ref' + prefix] = r.es;
    vars['ref' + prefix + 'Ro'] = r.ro;
    vars['zona' + prefix] = zonaEs(L, zoneId);
  }

  /*
   * Verifică o sarcină de tip „colocar”.
   * actual: starea scenei acum; inicio: starea de la începutul sarcinii.
   */
  function evaluarColocar(L, tarea, actual, inicio) {
    var M = L.mensajes.colocar;
    var obj = L.objetos[tarea.objeto];
    var zonaActual = actual[tarea.objeto];
    var vars = {
      objeto: obj.es,
      objetoRo: obj.ro,
      frase: frase(L, tarea.objeto, zonaActual),
      fraseCorrecta: frase(L, tarea.objeto, tarea.zona),
      explicacion: L.preposiciones[L.zonas[tarea.zona].preposicion].explicacion
    };
    varsZona(L, 'Pedida', tarea.zona, vars);
    varsZona(L, 'Actual', zonaActual, vars);

    if (zonaActual === tarea.zona) {
      return { correcto: true, caso: 'correcto', mensaje: mensaje(M.correcto, vars) };
    }

    if (inicio && zonaActual === inicio[tarea.objeto]) {
      var movido = null;
      for (var i = 0; i < L.ordenObjetos.length; i++) {
        var id = L.ordenObjetos[i];
        if (id !== tarea.objeto && actual[id] !== inicio[id]) { movido = id; break; }
      }
      if (movido) {
        vars.movido = L.objetos[movido].es;
        vars.movidoRo = L.objetos[movido].ro;
        return { correcto: false, caso: 'otroObjeto', mensaje: mensaje(M.otroObjeto, vars) };
      }
      return { correcto: false, caso: 'sinMover', mensaje: mensaje(M.sinMover, vars) };
    }

    if (L.zonas[zonaActual].preposicion === L.zonas[tarea.zona].preposicion) {
      return { correcto: false, caso: 'referenciaIncorrecta', mensaje: mensaje(M.referenciaIncorrecta, vars) };
    }
    return { correcto: false, caso: 'preposicionIncorrecta', mensaje: mensaje(M.preposicionIncorrecta, vars) };
  }

  function opcionVerdadera(actual, opcion) {
    return actual[opcion.objeto] === opcion.zona;
  }

  // Verifică o sarcină de tip „elegir”. indice = opțiunea aleasă (sau null).
  function evaluarElegir(L, tarea, indice, actual) {
    var M = L.mensajes.elegir;
    if (indice === null || indice === undefined || !tarea.opciones[indice]) {
      return { correcto: false, caso: 'sinRespuesta', mensaje: M.sinRespuesta };
    }
    var op = tarea.opciones[indice];
    var zonaReal = actual[op.objeto];
    var vars = {
      frase: frase(L, op.objeto, op.zona),
      fraseCorrecta: frase(L, op.objeto, zonaReal),
      explicacion: L.preposiciones[L.zonas[zonaReal].preposicion].explicacion
    };
    varsZona(L, 'Pedida', op.zona, vars);
    if (opcionVerdadera(actual, op)) {
      return { correcto: true, caso: 'correcto', mensaje: mensaje(M.correcto, vars) };
    }
    return { correcto: false, caso: 'incorrecto', mensaje: mensaje(M.incorrecto, vars) };
  }

  // Verifică datele lecției. Întoarce o listă de probleme (goală dacă totul e în regulă).
  function validarLeccion(L, layout) {
    var err = [];
    function zonaOk(z, unde) {
      if (!L.zonas[z]) err.push(unde + ': zona „' + z + '” nu există în „zonas”.');
      else if (!layout.zones[z]) err.push(unde + ': zona „' + z + '” nu are geometrie în scene-layout.js.');
    }
    function objOk(o, unde) {
      if (!L.objetos[o]) err.push(unde + ': obiectul „' + o + '” nu există în „objetos”.');
    }
    Object.keys(L.zonas).forEach(function (z) {
      var d = L.zonas[z];
      if (!L.preposiciones[d.preposicion]) err.push('Zona ' + z + ': prepoziție necunoscută „' + d.preposicion + '”.');
      if (!L.referencias[d.referencia]) err.push('Zona ' + z + ': referință necunoscută „' + d.referencia + '”.');
      if (layout.zones[z] && layout.zones[z].slots.length < L.ordenObjetos.length) {
        err.push('Zona ' + z + ': are mai puține locuri decât obiecte.');
      }
    });
    L.ordenObjetos.forEach(function (o) {
      objOk(o, 'ordenObjetos');
      zonaOk(L.escenaInicial[o], 'escenaInicial.' + o);
    });
    ['comprension', 'expresion', 'final'].forEach(function (act) {
      L.actividades[act].tareas.forEach(function (t) {
        var unde = act + '/' + t.id;
        var escena = escenaDeTarea(L, t);
        Object.keys(escena).forEach(function (o) { zonaOk(escena[o], unde + ' escena.' + o); });
        if (t.tipo === 'colocar') {
          objOk(t.objeto, unde);
          zonaOk(t.zona, unde);
          if (escena[t.objeto] === t.zona) err.push(unde + ': obiectul este deja în zona cerută la început.');
        } else if (t.tipo === 'elegir') {
          var adevarate = 0;
          t.opciones.forEach(function (op, i) {
            objOk(op.objeto, unde + ' opțiunea ' + (i + 1));
            zonaOk(op.zona, unde + ' opțiunea ' + (i + 1));
            if (escena[op.objeto] === op.zona) adevarate++;
          });
          if (adevarate !== 1) err.push(unde + ': trebuie să existe exact o opțiune adevărată (acum: ' + adevarate + ').');
        } else {
          err.push(unde + ': tip de sarcină necunoscut „' + t.tipo + '”.');
        }
      });
    });
    return err;
  }

  DE.logic = {
    capitalizar: capitalizar,
    fill: fill,
    zonaEs: zonaEs,
    frase: frase,
    fraseRo: fraseRo,
    escenaDeTarea: escenaDeTarea,
    evaluarColocar: evaluarColocar,
    evaluarElegir: evaluarElegir,
    opcionVerdadera: opcionVerdadera,
    validarLeccion: validarLeccion
  };
})(window.DE);
