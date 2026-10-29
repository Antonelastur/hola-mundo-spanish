/*
 * Geometria scenei: unde se află masa, cutia și zonele de plasare.
 * Unitățile sunt metri aproximativi. Axa Y este în sus, elevul privește din +Z.
 *
 * Fiecare zonă are:
 *  - box:   volumul în care se poate lăsa un obiect (pentru tragere cu mouse-ul);
 *  - pad:   dreptunghiul evidențiat pe suprafață (x, z, lățime, adâncime, înălțime y);
 *  - slots: locurile fixe în care se așază obiectele [x, y, z];
 *  - slots2d: aceleași locuri în varianta 2D (coordonate SVG, baza obiectului).
 * Numărul de locuri trebuie să fie cel puțin egal cu numărul de obiecte mobile.
 */
window.DE = window.DE || {};

window.DE.LAYOUT = {
  room: { width: 10, depth: 5, backZ: -1.6 },
  table: { x: -1.2, z: 0, width: 2.4, depth: 1.4, height: 1.0, top: 0.1, leg: 0.06 },
  box: { x: 2.0, z: 0.1, width: 1.2, depth: 0.9, height: 0.5, wall: 0.03 },
  view2d: {
    width: 1090, height: 420, top: 165, floorY: 380, objectScale: 1.25,
    table: { x: 250, width: 300, topY: 236, top: 12, leg: 9 },
    box: { x: 610, width: 230, height: 80, wall: 4 }
  },
  // Obiectele sunt puțin mai mari decât în realitate, ca să se vadă bine pe ecran.
  objectScale: 1.3,
  camera: { target: [0.2, 0.5, 0.0], fov: 40, elevation: 0.6, fitWidth: 8.6, minRadius: 4.5, maxAzimuth: 1.05 },

  zones: {
    encima_mesa: {
      box: { min: [-2.4, 1.0, -0.7], max: [0.0, 1.7, 0.7] },
      pad: { x: -1.2, z: 0, w: 2.2, d: 1.25, y: 1.056 },
      slots: [[-1.85, 1.05, -0.15], [-1.25, 1.05, 0.2], [-0.65, 1.05, -0.15], [-1.25, 1.05, -0.4]],
      slots2d: [[300, 236], [360, 236], [420, 236], [480, 236]]
    },
    debajo_mesa: {
      box: { min: [-2.4, 0.0, -0.7], max: [0.0, 0.95, 0.7] },
      pad: { x: -1.2, z: 0, w: 2.2, d: 1.25, y: 0.006 },
      slots: [[-1.85, 0, 0.1], [-1.25, 0, -0.2], [-0.65, 0, 0.15], [-1.25, 0, 0.4]],
      slots2d: [[300, 380], [360, 380], [420, 380], [480, 380]]
    },
    lado_mesa: {
      box: { min: [-3.7, 0.0, -0.7], max: [-2.5, 0.9, 0.8] },
      pad: { x: -3.1, z: 0.05, w: 1.1, d: 1.3, y: 0.006 },
      slots: [[-3.35, 0, -0.25], [-2.85, 0, -0.25], [-3.35, 0, 0.35], [-2.85, 0, 0.35]],
      slots2d: [[30, 380], [87, 380], [144, 380], [201, 380]]
    },
    dentro_caja: {
      box: { min: [1.4, 0.0, -0.35], max: [2.6, 0.9, 0.55] },
      pad: { x: 2.0, z: 0.1, w: 1.1, d: 0.8, y: 0.036 },
      slots: [[1.72, 0.03, -0.1], [2.28, 0.03, -0.1], [1.72, 0.03, 0.32], [2.28, 0.03, 0.32]],
      slots2d: [[645, 376], [700, 376], [755, 376], [810, 376]]
    },
    lado_caja: {
      box: { min: [2.75, 0.0, -0.6], max: [4.1, 0.9, 0.8] },
      pad: { x: 3.42, z: 0.1, w: 1.2, d: 1.3, y: 0.006 },
      slots: [[3.15, 0, -0.2], [3.7, 0, -0.2], [3.15, 0, 0.4], [3.7, 0, 0.4]],
      slots2d: [[880, 380], [937, 380], [994, 380], [1051, 380]]
    }
  }
};
