/*
 * Scena 3D (Three.js). Afișează starea din SceneState și transmite acțiunile
 * elevului (selectare, tragere) către aplicație. Nu decide nimic despre răspunsuri.
 *
 * Folosește doar forme geometrice simple, fără modele externe.
 */
window.DE = window.DE || {};

(function (DE) {
  'use strict';

  DE.createView3D = function (THREE, container, opts) {
    const L = opts.lesson;
    const Y = opts.layout;
    const state = opts.state;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const canvas = renderer.domElement;
    canvas.className = 'scene-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Scena 3D: o cameră cu o masă, o cutie și obiecte școlare. Folosește butoanele din panou pentru a selecta și muta obiectele.');
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e9eef5');

    const camera = new THREE.PerspectiveCamera(Y.camera.fov, 1, 0.1, 100);
    const target = new THREE.Vector3().fromArray(Y.camera.target);
    let azimuth = 0;
    let radius = Y.camera.minRadius;

    // Lumini
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a66, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(3, 7, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 5, bottom: -3, near: 1, far: 20 });
    sun.shadow.bias = -0.0005;
    scene.add(sun);

    function mat(color, extra) {
      return new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.75, metalness: 0 }, extra || {}));
    }
    function mesh(geo, material, x, y, z) {
      const m = new THREE.Mesh(geo, material);
      m.position.set(x || 0, y || 0, z || 0);
      m.castShadow = true;
      m.receiveShadow = true;
      return m;
    }

    // Camera (podea și pereți)
    const room = Y.room;
    const floorDepth = room.depth;
    const floor = mesh(new THREE.PlaneGeometry(room.width + 8, floorDepth + 4), mat('#d8c3a1', { roughness: 0.95 }), 0, 0, room.backZ + (floorDepth + 4) / 2);
    floor.rotation.x = -Math.PI / 2;
    floor.castShadow = false;
    scene.add(floor);
    const wall = mesh(new THREE.PlaneGeometry(room.width + 8, 6), mat('#f4efe4', { roughness: 1 }), 0, 3, room.backZ);
    wall.castShadow = false;
    scene.add(wall);
    const plinth = mesh(new THREE.BoxGeometry(room.width + 8, 0.12, 0.04), mat('#b8a07c'), 0, 0.06, room.backZ + 0.02);
    scene.add(plinth);

    const pickables = [];

    // Masa
    const T = Y.table;
    const table = new THREE.Group();
    table.position.set(T.x, 0, T.z);
    table.userData = { kind: 'referencia', id: 'mesa' };
    const wood = mat('#9a6a3e', { roughness: 0.6 });
    table.add(mesh(new THREE.BoxGeometry(T.width, T.top, T.depth), wood, 0, T.height, 0));
    const legH = T.height - T.top / 2;
    const lx = T.width / 2 - 0.12;
    const lz = T.depth / 2 - 0.12;
    [[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]].forEach(function (p) {
      table.add(mesh(new THREE.CylinderGeometry(T.leg, T.leg, legH, 12), wood, p[0], legH / 2, p[1]));
    });
    scene.add(table);
    pickables.push(table);

    // Cutia (deschisă sus; peretele din față este transparent ca să se vadă înăuntru)
    const B = Y.box;
    const box = new THREE.Group();
    box.position.set(B.x, 0, B.z);
    box.userData = { kind: 'referencia', id: 'caja' };
    const cardboard = mat('#c48f55', { roughness: 0.9 });
    const cardboardFront = mat('#c48f55', { roughness: 0.9, transparent: true, opacity: 0.32, depthWrite: false });
    const w = B.wall;
    box.add(mesh(new THREE.BoxGeometry(B.width, w, B.depth), cardboard, 0, w / 2, 0));
    box.add(mesh(new THREE.BoxGeometry(B.width, B.height, w), cardboard, 0, B.height / 2, -B.depth / 2 + w / 2));
    box.add(mesh(new THREE.BoxGeometry(w, B.height, B.depth), cardboard, -B.width / 2 + w / 2, B.height / 2, 0));
    box.add(mesh(new THREE.BoxGeometry(w, B.height, B.depth), cardboard, B.width / 2 - w / 2, B.height / 2, 0));
    const frontGeo = new THREE.BoxGeometry(B.width, B.height, w);
    const front = mesh(frontGeo, cardboardFront, 0, B.height / 2, B.depth / 2 - w / 2);
    front.castShadow = false;
    box.add(front);
    const frontEdges = new THREE.LineSegments(new THREE.EdgesGeometry(frontGeo), new THREE.LineBasicMaterial({ color: '#6b4a26' }));
    frontEdges.position.copy(front.position);
    box.add(frontEdges);
    scene.add(box);
    pickables.push(box);

    // Obiectele mobile
    const builders = {
      libro: function (color) {
        const g = new THREE.Group();
        g.add(mesh(new THREE.BoxGeometry(0.42, 0.1, 0.3), mat(color), 0, 0.05, 0));
        g.add(mesh(new THREE.BoxGeometry(0.4, 0.075, 0.302), mat('#f7f3ea'), 0.015, 0.05, 0));
        return g;
      },
      lapiz: function (color) {
        const g = new THREE.Group();
        const r = 0.035;
        const body = mesh(new THREE.CylinderGeometry(r, r, 0.46, 6), mat(color), 0, r, 0);
        body.rotation.z = Math.PI / 2;
        const tip = mesh(new THREE.ConeGeometry(r, 0.1, 6), mat('#e9c99a'), 0.28, r, 0);
        tip.rotation.z = -Math.PI / 2;
        const lead = mesh(new THREE.ConeGeometry(r * 0.35, 0.035, 6), mat('#333333'), 0.335, r, 0);
        lead.rotation.z = -Math.PI / 2;
        const end = mesh(new THREE.CylinderGeometry(r, r, 0.05, 12), mat('#e07a9a'), -0.255, r, 0);
        end.rotation.z = Math.PI / 2;
        g.add(body, tip, lead, end);
        return g;
      },
      goma: function (color) {
        const g = new THREE.Group();
        g.add(mesh(new THREE.BoxGeometry(0.22, 0.09, 0.13), mat(color, { roughness: 0.95 }), 0, 0.045, 0));
        g.add(mesh(new THREE.BoxGeometry(0.1, 0.094, 0.134), mat('#3b6fb6'), -0.04, 0.045, 0));
        return g;
      },
      pelota: function (color) {
        const g = new THREE.Group();
        g.add(mesh(new THREE.SphereGeometry(0.16, 32, 16), mat(color, { roughness: 0.5 }), 0, 0.16, 0));
        const band = mesh(new THREE.TorusGeometry(0.161, 0.012, 8, 40), mat('#ffffff'), 0, 0.16, 0);
        band.rotation.y = Math.PI / 4;
        g.add(band);
        return g;
      }
    };

    const objects = {};
    L.ordenObjetos.forEach(function (id) {
      const def = L.objetos[id];
      const build = builders[def.forma];
      if (!build) throw new Error('Formă 3D necunoscută: ' + def.forma);
      const g = build(def.color);
      g.scale.setScalar(Y.objectScale || 1);
      g.userData = { kind: 'objeto', id: id };
      scene.add(g);
      objects[id] = g;
      pickables.push(g);
    });

    // Inelul care marchează obiectul selectat (pe lângă evidențierea din panou)
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.025, 8, 48),
      new THREE.MeshBasicMaterial({ color: '#1d3557' })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.visible = false;
    scene.add(ring);
    let selectedId = null;

    // Zonele de plasare: volum pentru tragere + dreptunghi evidențiat
    const zones = {};
    L.ordenZonas.forEach(function (zid) {
      const z = Y.zones[zid];
      const pad = new THREE.Group();
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(z.pad.w, z.pad.d),
        new THREE.MeshBasicMaterial({ color: '#2b7bff', transparent: true, opacity: 0.25, depthWrite: false })
      );
      plane.rotation.x = -Math.PI / 2;
      const outline = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(z.pad.w, z.pad.d)),
        new THREE.LineBasicMaterial({ color: '#0b3d91' })
      );
      outline.rotation.x = -Math.PI / 2;
      pad.add(plane, outline);
      pad.position.set(z.pad.x, z.pad.y, z.pad.z);
      pad.visible = false;
      pad.renderOrder = 2;
      scene.add(pad);
      zones[zid] = {
        pad: pad,
        box: new THREE.Box3(new THREE.Vector3().fromArray(z.box.min), new THREE.Vector3().fromArray(z.box.max))
      };
    });
    let shownZones = [];
    let hoverZone = null;

    function updatePads() {
      Object.keys(zones).forEach(function (zid) {
        zones[zid].pad.visible = zid === hoverZone || shownZones.indexOf(zid) >= 0;
      });
    }

    // Randare la cerere (nu continuu)
    let pending = false;
    function requestRender() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        renderer.render(scene, camera);
      });
    }

    function slotPosition(zid, slot) {
      const s = Y.zones[zid].slots[slot];
      return new THREE.Vector3(s[0], s[1], s[2]);
    }

    function placeRing() {
      if (!selectedId) { ring.visible = false; return; }
      const g = objects[selectedId];
      ring.position.set(g.position.x, g.position.y + 0.012, g.position.z);
      ring.visible = true;
    }

    function syncFromState() {
      L.ordenObjetos.forEach(function (id) {
        const zid = state.zoneOf(id);
        objects[id].position.copy(slotPosition(zid, state.slotOf(id)));
      });
      placeRing();
      requestRender();
    }

    function setSelected(id) {
      if (selectedId && objects[selectedId]) setEmissive(objects[selectedId], 0x000000);
      selectedId = id && objects[id] ? id : null;
      if (selectedId) setEmissive(objects[selectedId], 0x2a2a2a);
      placeRing();
      requestRender();
    }

    function setEmissive(group, hex) {
      group.traverse(function (o) {
        if (o.isMesh && o.material.emissive) o.material.emissive.setHex(hex);
      });
    }

    // Camera: orbită simplă în jurul mesei, cu limite
    function updateCamera() {
      const e = Y.camera.elevation;
      camera.position.set(
        target.x + radius * Math.sin(azimuth) * Math.cos(e),
        target.y + radius * Math.sin(e),
        target.z + radius * Math.cos(azimuth) * Math.cos(e)
      );
      camera.lookAt(target);
      requestRender();
    }

    function resize() {
      const wpx = Math.max(container.clientWidth, 1);
      const hpx = Math.max(container.clientHeight, 1);
      renderer.setSize(wpx, hpx, false);
      camera.aspect = wpx / hpx;
      const vfov = THREE.MathUtils.degToRad(camera.fov);
      const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
      radius = Math.max(Y.camera.minRadius, Y.camera.fitWidth / 2 / Math.tan(hfov / 2));
      camera.updateProjectionMatrix();
      updateCamera();
    }

    function rotate(delta) {
      const max = Y.camera.maxAzimuth;
      azimuth = Math.max(-max, Math.min(max, azimuth + delta));
      updateCamera();
    }

    function resetCamera() {
      azimuth = 0;
      updateCamera();
    }

    // Interacțiune cu pointerul
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let dragEnabled = true;
    let drag = null;
    let orbit = null;

    function setRay(e) {
      const rect = canvas.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
    }

    function pick(e) {
      setRay(e);
      // Obiectele mobile au prioritate: peretele transparent al cutiei sau marginea mesei
      // nu trebuie să „acopere” un obiect pe care elevul îl vede.
      const hits = raycaster.intersectObjects(pickables, true);
      let reference = null;
      for (let i = 0; i < hits.length; i++) {
        let o = hits[i].object;
        while (o && !(o.userData && o.userData.kind)) o = o.parent;
        if (!o) continue;
        if (o.userData.kind === 'objeto') return o.userData;
        if (!reference) reference = o.userData;
      }
      return reference;
    }

    function zoneUnderRay() {
      let best = null;
      let bestDist = Infinity;
      const p = new THREE.Vector3();
      Object.keys(zones).forEach(function (zid) {
        if (raycaster.ray.intersectBox(zones[zid].box, p)) {
          const d = p.distanceTo(raycaster.ray.origin);
          if (d < bestDist) { bestDist = d; best = zid; }
        }
      });
      return best;
    }

    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.35);

    function onPointerDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      const hit = pick(e);
      if (hit && hit.kind === 'objeto') {
        opts.onSelect('objeto', hit.id);
        if (dragEnabled) {
          drag = { id: hit.id, x: e.clientX, y: e.clientY, active: false };
          canvas.setPointerCapture(e.pointerId);
        }
        return;
      }
      if (hit && hit.kind === 'referencia') opts.onSelect('referencia', hit.id);
      orbit = { x: e.clientX, az: azimuth, moved: false };
      canvas.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e) {
      if (drag) {
        if (!drag.active && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) {
          drag.active = true;
          canvas.classList.add('is-dragging');
        }
        if (!drag.active) return;
        setRay(e);
        const zid = zoneUnderRay();
        if (zid !== hoverZone) {
          hoverZone = zid;
          updatePads();
          opts.onHoverZone(zid);
        }
        const g = objects[drag.id];
        if (zid) {
          let slot = state.zoneOf(drag.id) === zid ? state.slotOf(drag.id) : state.freeSlot(zid, drag.id);
          if (slot < 0) slot = 0;
          g.position.copy(slotPosition(zid, slot));
          g.position.y += 0.12;
        } else {
          const p = new THREE.Vector3();
          if (raycaster.ray.intersectPlane(dragPlane, p)) {
            p.x = Math.max(-room.width / 2 + 0.3, Math.min(room.width / 2 - 0.3, p.x));
            p.z = Math.max(room.backZ + 0.3, Math.min(room.backZ + floorDepth - 0.3, p.z));
            g.position.copy(p);
          }
        }
        placeRing();
        requestRender();
        return;
      }
      if (orbit) {
        const dx = e.clientX - orbit.x;
        if (Math.abs(dx) > 3) orbit.moved = true;
        if (orbit.moved) {
          azimuth = orbit.az;
          rotate(-dx * 0.008);
        }
        return;
      }
      if (e.pointerType === 'mouse') {
        const hit = pick(e);
        canvas.style.cursor = hit && hit.kind === 'objeto' ? (dragEnabled ? 'grab' : 'pointer') : (hit ? 'pointer' : 'default');
      }
    }

    function endDrag(drop) {
      const d = drag;
      drag = null;
      canvas.classList.remove('is-dragging');
      const zid = hoverZone;
      hoverZone = null;
      updatePads();
      if (d && d.active) {
        opts.onHoverZone(null);
        if (drop && zid) opts.onDrop(d.id, zid);
        else opts.onDrop(d.id, null);
      }
      syncFromState();
    }

    function onPointerUp() {
      if (drag) endDrag(true);
      orbit = null;
    }

    function onPointerCancel() {
      if (drag) endDrag(false);
      orbit = null;
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerCancel);
    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      opts.onError(new Error('Contextul grafic WebGL s-a pierdut.'));
    });

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();
    syncFromState();

    return {
      kind: '3d',
      render: syncFromState,
      setSelected: setSelected,
      showZones: function (ids) { shownZones = ids || []; updatePads(); requestRender(); },
      setDragEnabled: function (on) {
        dragEnabled = !!on;
        if (!dragEnabled && drag) endDrag(false);
      },
      rotate: rotate,
      resetCamera: resetCamera,
      // Coordonatele pe ecran ale unui obiect sau ale unei zone (folosite de testele automate)
      screenPoint: function (id) {
        const v = objects[id] ? objects[id].position.clone() : new THREE.Vector3(Y.zones[id].pad.x, Y.zones[id].pad.y, Y.zones[id].pad.z);
        if (objects[id]) v.y += 0.08;
        v.project(camera);
        const rect = canvas.getBoundingClientRect();
        return { x: rect.left + (v.x + 1) / 2 * rect.width, y: rect.top + (1 - v.y) / 2 * rect.height };
      },
      dispose: function () {
        ro.disconnect();
        renderer.dispose();
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    };
  };
})(window.DE);
