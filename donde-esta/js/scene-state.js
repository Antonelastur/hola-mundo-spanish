/*
 * Starea scenei: în ce zonă și în ce loc (slot) se află fiecare obiect mobil.
 * Este singura sursă de adevăr. Scena 3D și varianta 2D doar o afișează,
 * iar verificarea răspunsurilor citește tot de aici.
 */
window.DE = window.DE || {};

(function (DE) {
  'use strict';

  function SceneState(zoneSlots, objectIds) {
    // zoneSlots: { zoneId: numărDeLocuri }
    this.zoneSlots = zoneSlots;
    this.objectIds = objectIds.slice();
    this.placement = {}; // objId -> { zone, slot }
    this.listeners = [];
  }

  SceneState.prototype.onChange = function (fn) {
    this.listeners.push(fn);
  };

  SceneState.prototype.emit = function (reason, objId) {
    for (var i = 0; i < this.listeners.length; i++) this.listeners[i](reason, objId);
  };

  SceneState.prototype.freeSlot = function (zoneId, ignoreObjId) {
    var total = this.zoneSlots[zoneId];
    if (!total) return -1;
    var used = {};
    for (var id in this.placement) {
      if (id === ignoreObjId) continue;
      var p = this.placement[id];
      if (p.zone === zoneId) used[p.slot] = true;
    }
    for (var s = 0; s < total; s++) if (!used[s]) return s;
    return -1;
  };

  // Încarcă o configurație { objId: zoneId }. Obiectele lipsă primesc zona din fallback.
  SceneState.prototype.load = function (layout, fallback) {
    this.placement = {};
    for (var i = 0; i < this.objectIds.length; i++) {
      var id = this.objectIds[i];
      var zone = (layout && layout[id]) || (fallback && fallback[id]);
      if (!zone || !this.zoneSlots[zone]) throw new Error('Zonă necunoscută pentru „' + id + '”: ' + zone);
      var slot = this.freeSlot(zone);
      if (slot < 0) throw new Error('Zona „' + zone + '” nu mai are locuri libere.');
      this.placement[id] = { zone: zone, slot: slot };
    }
    this.emit('load');
  };

  // Mută un obiect într-o zonă. Întoarce true dacă mutarea a reușit.
  SceneState.prototype.place = function (objId, zoneId) {
    var current = this.placement[objId];
    if (!current) return false;
    if (current.zone === zoneId) {
      this.emit('place', objId);
      return true;
    }
    var slot = this.freeSlot(zoneId, objId);
    if (slot < 0) return false;
    this.placement[objId] = { zone: zoneId, slot: slot };
    this.emit('place', objId);
    return true;
  };

  SceneState.prototype.zoneOf = function (objId) {
    return this.placement[objId] ? this.placement[objId].zone : null;
  };

  SceneState.prototype.slotOf = function (objId) {
    return this.placement[objId] ? this.placement[objId].slot : -1;
  };

  // Copie simplă { objId: zoneId }.
  SceneState.prototype.snapshot = function () {
    var out = {};
    for (var id in this.placement) out[id] = this.placement[id].zone;
    return out;
  };

  DE.SceneState = SceneState;
})(window.DE);
