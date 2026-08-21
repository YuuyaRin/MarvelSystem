/* ==========================================================================
   MARVEL 宇宙观影指挥中心 — 高阶版(2.5D)视图引擎:角色星系 / 立体地铁 / 年代长廊
   基于 three.js(vendor/three.min.js,按需懒加载)
   ========================================================================== */

(function () {
  const S = () => MARVEL.store;
  let cur = null;                 // 当前挂载的场景上下文
  const camMemory = {};           // 每种视图的相机状态记忆
  const BODY_FONT = '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif';
  const DISPLAY_FONT = '"Bebas Neue",Impact,"Arial Narrow",sans-serif';

  function loadThree() {
    if (window.THREE) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const sc = document.createElement('script');
      sc.src = 'vendor/three.min.js';
      sc.onload = resolve;
      sc.onerror = () => reject(new Error('three.js 加载失败'));
      document.head.appendChild(sc);
    });
  }

  /* ---------- 通用工具 ---------- */
  function glowTex(color) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 2, 64, 64, 64);
    grad.addColorStop(0, color); grad.addColorStop(0.3, color + '99'); grad.addColorStop(1, color + '00');
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  function glowSprite(color, scale, opacity) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(color), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: opacity == null ? 0.8 : opacity }));
    sp.scale.set(scale, scale, 1);
    sp.raycast = () => {};
    return sp;
  }

  /* 文字标签精灵:lines = [{ text, size, color, font, weight }] */
  function makeLabel(lines, opts) {
    opts = opts || {};
    const dpr = 2, pad = opts.pad == null ? 10 : opts.pad;
    const c = document.createElement('canvas');
    const g = c.getContext('2d');
    const measured = lines.map(l => {
      g.font = `${l.weight || 700} ${l.size || 22}px ${l.font || BODY_FONT}`;
      return { w: g.measureText(l.text).width, h: (l.size || 22) * 1.25 };
    });
    const w = Math.ceil(Math.max(...measured.map(m => m.w)) + pad * 2);
    const h = Math.ceil(measured.reduce((a, m) => a + m.h, 0) + pad * 2);
    c.width = w * dpr; c.height = h * dpr;
    g.scale(dpr, dpr);
    if (opts.bg) {
      g.fillStyle = opts.bg;
      const r = 10;
      g.beginPath(); g.moveTo(r, 0); g.arcTo(w, 0, w, h, r); g.arcTo(w, h, 0, h, r); g.arcTo(0, h, 0, 0, r); g.arcTo(0, 0, w, 0, r); g.closePath(); g.fill();
      if (opts.border) { g.strokeStyle = opts.border; g.lineWidth = 2; g.stroke(); }
    }
    let y = pad;
    g.textAlign = 'center'; g.textBaseline = 'top';
    lines.forEach((l, i) => {
      g.font = `${l.weight || 700} ${l.size || 22}px ${l.font || BODY_FONT}`;
      g.fillStyle = l.color || '#e8ecf4';
      if (opts.shadow !== false) { g.shadowColor = 'rgba(0,0,0,0.8)'; g.shadowBlur = 6; }
      g.fillText(l.text, w / 2, y + 2);
      y += measured[i].h;
    });
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: opts.opacity == null ? 1 : opts.opacity });
    const sp = new THREE.Sprite(mat);
    const k = opts.worldPerPx || 0.012;
    sp.scale.set(w * k, h * k, 1);
    sp.raycast = () => {};
    sp.userData.px = { w, h };
    return sp;
  }

  function starField(n, spread) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < pos.length; i++) pos[i] = (Math.random() - 0.5) * spread;
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x8fa0c8, size: 0.09, transparent: true, opacity: 0.7 }));
    pts.raycast = () => {};
    return pts;
  }

  /* 轻量轨道控制:左键旋转 / Shift 或右键平移 / 滚轮缩放 */
  class Orbit {
    constructor(camera, dom, o) {
      this.cam = camera; this.dom = dom;
      this.target = new THREE.Vector3(...(o.target || [0, 0, 0]));
      this.yaw = o.yaw || 0; this.pitch = o.pitch == null ? 0.9 : o.pitch; this.dist = o.dist || 20;
      this.minPitch = o.minPitch == null ? 0.25 : o.minPitch; this.maxPitch = o.maxPitch == null ? 1.45 : o.maxPitch;
      this.minDist = o.minDist || 6; this.maxDist = o.maxDist || 60;
      this.yawLimit = o.yawLimit; // 可选:限制偏航范围
      this.autoRotate = o.autoRotate || 0;
      this.onWheel = o.onWheel;   // 自定义滚轮(年代长廊用)
      this.moved = 0; this.drag = null; this.idle = 0;
      this._down = e => { this.drag = { x: e.clientX, y: e.clientY, pan: e.shiftKey || e.button === 2 || e.button === 1 }; this.moved = 0; this.idle = 0; dom.setPointerCapture(e.pointerId); };
      this._move = e => {
        if (!this.drag) return;
        const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y;
        this.drag.x = e.clientX; this.drag.y = e.clientY;
        this.moved += Math.abs(dx) + Math.abs(dy);
        if (this.drag.pan) this.pan(dx, dy); else {
          this.yaw -= dx * 0.005; this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch + dy * 0.005));
          if (this.yawLimit != null) this.yaw = Math.max(-this.yawLimit, Math.min(this.yawLimit, this.yaw));
        }
        this.update();
      };
      this._up = () => { this.drag = null; };
      this._wheel = e => {
        e.preventDefault();
        this.idle = 0;
        if (this.onWheel) { this.onWheel(e); this.update(); return; }
        this.dist = Math.max(this.minDist, Math.min(this.maxDist, this.dist * (e.deltaY > 0 ? 1.1 : 0.9)));
        this.update();
      };
      this._ctx = e => e.preventDefault();
      dom.addEventListener('pointerdown', this._down);
      dom.addEventListener('pointermove', this._move);
      dom.addEventListener('pointerup', this._up);
      dom.addEventListener('wheel', this._wheel, { passive: false });
      dom.addEventListener('contextmenu', this._ctx);
      this.update();
    }
    pan(dx, dy) {
      const k = this.dist * 0.0016;
      const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
      const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      this.target.addScaledVector(right, -dx * k).addScaledVector(fwd, -dy * k);
    }
    tick(dt) {
      this.idle += dt;
      if (this.autoRotate && !this.drag && this.idle > 2.5) { this.yaw += this.autoRotate * dt; this.update(); }
    }
    update() {
      const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
      this.cam.position.set(this.target.x + this.dist * cp * Math.sin(this.yaw), this.target.y + this.dist * sp, this.target.z + this.dist * cp * Math.cos(this.yaw));
      this.cam.lookAt(this.target);
    }
    state() { return { yaw: this.yaw, pitch: this.pitch, dist: this.dist, target: this.target.toArray() }; }
    dispose() {
      this.dom.removeEventListener('pointerdown', this._down); this.dom.removeEventListener('pointermove', this._move);
      this.dom.removeEventListener('pointerup', this._up); this.dom.removeEventListener('wheel', this._wheel);
      this.dom.removeEventListener('contextmenu', this._ctx);
    }
  }

  /* ---------- 场景骨架 ---------- */
  function createStage(host, kind) {
    host.innerHTML = '';
    const canvas = document.createElement('canvas');
    host.appendChild(canvas);
    const tip = document.createElement('div');
    tip.className = 'three-tip hidden';
    host.appendChild(tip);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(0x070a12, 1);
    renderer.outputEncoding = THREE.sRGBEncoding;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 400);

    const ctx = { kind, host, canvas, tip, renderer, scene, camera, pickables: [], hovered: null, raf: 0, disposers: [], t: 0 };
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(-9, -9);

    const resize = () => {
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    ctx.disposers.push(() => ro.disconnect());
    resize();

    canvas.addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      tip.style.left = `${e.clientX - r.left + 14}px`;
      tip.style.top = `${e.clientY - r.top + 14}px`;
    });
    canvas.addEventListener('pointerleave', () => { pointer.set(-9, -9); });
    canvas.addEventListener('pointerup', () => {
      if (ctx.orbit && ctx.orbit.moved > 6) return;
      if (ctx.hovered && ctx.onClick) ctx.onClick(ctx.hovered);
    });

    ctx.pick = () => {
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(ctx.pickables, false)[0];
      const obj = hit ? hit.object : null;
      if (obj !== ctx.hovered) {
        const prev = ctx.hovered;
        ctx.hovered = obj;
        canvas.style.cursor = obj ? 'pointer' : 'grab';
        if (ctx.onHover) ctx.onHover(obj, prev);
        if (obj && obj.userData.tip) { tip.innerHTML = obj.userData.tip; tip.classList.remove('hidden'); }
        else tip.classList.add('hidden');
      }
    };

    let last = performance.now();
    const loop = now => {
      ctx.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now; ctx.t += dt;
      try {
        if (ctx.orbit) ctx.orbit.tick(dt);
        if (ctx.onFrame) ctx.onFrame(dt, ctx.t);
        ctx.pick();
      } catch (e) {
        if (!ctx.warned) { ctx.warned = true; console.warn('[three-views] frame error', e); }
      }
      renderer.render(scene, camera);
    };
    ctx.start = () => { last = performance.now(); loop(last); };
    return ctx;
  }

  function disposeStage(ctx) {
    cancelAnimationFrame(ctx.raf);
    if (ctx.orbit) { camMemory[ctx.kind] = ctx.orbit.state(); ctx.orbit.dispose(); }
    ctx.disposers.forEach(f => f());
    ctx.scene.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
      mats.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
    });
    ctx.renderer.dispose();
    if (ctx.host.isConnected) ctx.host.innerHTML = '';
  }

  function addLights(scene, amb, dir) {
    scene.add(new THREE.AmbientLight(0x7080b0, amb == null ? 0.55 : amb));
    const d = new THREE.DirectionalLight(0xffffff, dir == null ? 0.6 : dir);
    d.position.set(6, 14, 8);
    scene.add(d);
  }

  const shortTitle = w => {
    if (w.title.length <= 7) return w.title;
    const parts = w.title.split(/[::]/);
    if (parts.length < 2) return w.title;
    if (/\d/.test(parts[0])) return parts[0];
    return parts[1].length <= 6 ? parts[1] : parts[0];
  };
  const colorOfWork = w => w.phase >= 1 ? MARVEL.PHASES[w.phase].color : ((MARVEL.UNIVERSES[w.universe] || {}).color || '#7f8da3');

  /* ==========================================================================
     1) 角色星系图
     ========================================================================== */
  function layoutCharacters(W, H) {
    const chars = MARVEL.CHARACTERS;
    const fids = Object.keys(MARVEL.FACTIONS);
    const anchors = {};
    fids.forEach((f, i) => { const a = (i / fids.length) * Math.PI * 2 - Math.PI / 2; anchors[f] = { x: W / 2 + Math.cos(a) * W * 0.3, y: H / 2 + Math.sin(a) * H * 0.33 }; });
    const nodes = chars.map((c, i) => { const a = anchors[c.faction]; return { c, x: a.x + (Math.sin(i * 7.3) * 90), y: a.y + (Math.cos(i * 5.1) * 90) }; });
    const byId = {}; nodes.forEach(n => { byId[n.c.id] = n; });
    const edges = MARVEL.RELATIONS.filter(r => byId[r.a] && byId[r.b]).map(r => ({ ...r, na: byId[r.a], nb: byId[r.b] }));
    for (let it = 0; it < 320; it++) {
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = b.x - a.x, dy = b.y - a.y; const d2 = Math.max(dx * dx + dy * dy, 100);
        if (d2 < 40000) { const d = Math.sqrt(d2), f = 2600 / d2 * 9; dx /= d; dy /= d; a.x -= dx * f; a.y -= dy * f; b.x += dx * f; b.y += dy * f; }
      }
      edges.forEach(e => { const dx = e.nb.x - e.na.x, dy = e.nb.y - e.na.y, d = Math.sqrt(dx * dx + dy * dy) || 1, f = (d - 160) * 0.02; e.na.x += dx / d * f; e.na.y += dy / d * f; e.nb.x -= dx / d * f; e.nb.y -= dy / d * f; });
      nodes.forEach(n => { const a = anchors[n.c.faction]; n.x += (a.x - n.x) * 0.02; n.y += (a.y - n.y) * 0.02; n.x = Math.max(60, Math.min(W - 60, n.x)); n.y = Math.max(60, Math.min(H - 60, n.y)); });
    }
    return { nodes, edges, byId };
  }

  const REL_COLORS = { family: '#f0b429', love: '#ff5ca8', mentor: '#4d9fff', comrade: '#3ecf8e', rival: '#e62429' };

  function mountCharacters(ctx, opts) {
    const { scene, camera } = ctx;
    const activeFaction = opts.activeFaction || null;
    addLights(scene, 0.5, 0.5);
    scene.fog = new THREE.FogExp2(0x070a12, 0.012);
    scene.add(starField(1800, 120));
    const grid = new THREE.GridHelper(60, 30, 0x1b2335, 0x121827);
    grid.position.y = -0.7; grid.raycast = () => {};
    scene.add(grid);

    const W = 1100, H = 800, K = 0.022;
    const { nodes, edges } = layoutCharacters(W, H);
    const toWorld = n => new THREE.Vector3((n.x - W / 2) * K, 0, (n.y - H / 2) * K);

    // 阵营星云 + 标签
    const byFaction = {};
    nodes.forEach(n => { (byFaction[n.c.faction] = byFaction[n.c.faction] || []).push(toWorld(n)); });
    Object.entries(byFaction).forEach(([fid, pts]) => {
      const f = MARVEL.FACTIONS[fid];
      const c = pts.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / pts.length);
      const neb = glowSprite(f.color, 9 + pts.length * 0.6, 0.16);
      neb.position.copy(c).setY(-0.4);
      scene.add(neb);
      const lab = makeLabel([{ text: f.name, size: 26, color: f.color, weight: 900 }], { worldPerPx: 0.016, opacity: 0.9 });
      lab.position.copy(c).setY(3.2);
      scene.add(lab);
    });

    // 关系弧线
    const edgeMeshes = [];
    const adj = {};
    edges.forEach(e => {
      const a = toWorld(e.na), b = toWorld(e.nb);
      const mid = a.clone().add(b).multiplyScalar(0.5); mid.y = 0.9 + a.distanceTo(b) * 0.12;
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.045, 6, false), new THREE.MeshBasicMaterial({ color: REL_COLORS[e.type], transparent: true, opacity: 0.5 }));
      mesh.raycast = () => {};
      mesh.userData = { a: e.a, b: e.b };
      scene.add(mesh); edgeMeshes.push(mesh);
      (adj[e.a] = adj[e.a] || new Set()).add(e.b); (adj[e.b] = adj[e.b] || new Set()).add(e.a);
    });

    // 角色星体
    const sphereGeo = new THREE.SphereGeometry(0.5, 24, 24);
    const nodeMeshes = {};
    nodes.forEach(n => {
      const f = MARVEL.FACTIONS[n.c.faction];
      const col = new THREE.Color(f.color);
      const dim = activeFaction && n.c.faction !== activeFaction;
      const mesh = new THREE.Mesh(sphereGeo, new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: dim ? 0.1 : 0.55, roughness: 0.35, metalness: 0.2, transparent: true, opacity: dim ? 0.25 : 1 }));
      mesh.position.copy(toWorld(n));
      const title = n.c.title || n.c.name, sub = n.c.title && n.c.title !== n.c.name ? n.c.name : '';
      mesh.userData = { id: n.c.id, tip: `<b style="color:${f.color}">${n.c.emoji} ${title}</b>${sub ? ' · ' + sub : ''}<br><small>${f.name} · ${(adj[n.c.id] || new Set()).size} 条关系 · 点击查看档案</small>`, baseY: 0, phase: Math.random() * 6.28, dim };
      scene.add(mesh);
      const glow = glowSprite(f.color, 2.4, dim ? 0.15 : 0.6);
      mesh.add(glow); mesh.userData.glow = glow;
      const lines = [{ text: `${n.c.emoji} ${title}`, size: 24, weight: 900 }];
      if (sub) lines.push({ text: sub, size: 16, color: '#9aa3b5', weight: 500 });
      const lab = makeLabel(lines, { worldPerPx: 0.013, opacity: dim ? 0.3 : 1 });
      lab.position.set(0, 1.2, 0);
      mesh.add(lab); mesh.userData.label = lab;
      ctx.pickables.push(mesh);
      nodeMeshes[n.c.id] = mesh;
    });

    ctx.onHover = (obj) => {
      const id = obj ? obj.userData.id : null;
      const keep = id ? new Set([id, ...(adj[id] || [])]) : null;
      Object.values(nodeMeshes).forEach(m => {
        const base = m.userData.dim ? 0.25 : 1;
        const o = keep ? (keep.has(m.userData.id) ? 1 : 0.12) : base;
        m.material.opacity = o; m.userData.label.material.opacity = o; m.userData.glow.material.opacity = o * 0.6;
        m.material.emissiveIntensity = keep && keep.has(m.userData.id) ? 1 : (m.userData.dim ? 0.1 : 0.55);
      });
      edgeMeshes.forEach(e => { e.material.opacity = keep ? ((e.userData.a === id || e.userData.b === id) ? 1 : 0.05) : 0.5; });
    };
    ctx.onClick = obj => { if (MARVEL.ui) MARVEL.ui.openCharacter(obj.userData.id); };
    ctx.onFrame = (dt, t) => {
      Object.values(nodeMeshes).forEach(m => {
        m.position.y = Math.sin(t * 1.1 + m.userData.phase) * 0.12;
        const s = ctx.hovered === m ? 1.35 : 1;
        m.scale.x += (s - m.scale.x) * 0.15; m.scale.y = m.scale.z = m.scale.x;
      });
    };

    const mem = camMemory.characters || {};
    ctx.orbit = new Orbit(camera, ctx.canvas, { target: mem.target || [0, 0, 0], yaw: mem.yaw || 0, pitch: mem.pitch || 0.95, dist: mem.dist || 22, minDist: 8, maxDist: 50, autoRotate: 0.05 });
  }

  /* ==========================================================================
     2) 立体地铁(宇宙链路)
     ========================================================================== */
  function mountMetro(ctx, opts) {
    const { scene, camera } = ctx;
    const activeThread = opts.activeThread || null;
    addLights(scene, 0.55, 0.5);
    scene.fog = new THREE.FogExp2(0x070a12, 0.008);
    scene.add(starField(1500, 140));

    const works = MARVEL.WORKS.filter(w => w.universe === 'mcu' && w.threads && w.threads.length).sort((a, b) => a.release.localeCompare(b.release));
    const perRow = 6, stepX = 168, stepY = 152, mx = 96, my = 84, K = 0.022;
    const rows = Math.ceil(works.length / perRow);
    const W = mx * 2 + (perRow - 1) * stepX, H = my * 2 + (rows - 1) * stepY;
    const pos = {};
    works.forEach((w, i) => { const row = Math.floor(i / perRow), col = i % perRow; pos[w.id] = new THREE.Vector3(((mx + (row % 2 ? perRow - 1 - col : col) * stepX) - W / 2) * K, 0, ((my + row * stepY) - H / 2) * K); });

    // 底座
    const base = new THREE.Mesh(new THREE.PlaneGeometry(W * K + 6, H * K + 6), new THREE.MeshStandardMaterial({ color: 0x0d1220, roughness: 0.9, metalness: 0.1 }));
    base.rotation.x = -Math.PI / 2; base.position.y = -0.12; base.raycast = () => {};
    scene.add(base);
    const grid = new THREE.GridHelper(Math.max(W, H) * K + 8, 40, 0x1b2335, 0x121827);
    grid.position.y = -0.1; grid.raycast = () => {};
    scene.add(grid);

    const threadIds = Object.keys(MARVEL.THREADS);
    const levelOf = tid => 0.7 + threadIds.indexOf(tid) * 0.34;
    const activeMembers = activeThread ? works.filter(w => w.threads.includes(activeThread)) : [];
    const nextWork = activeThread ? activeMembers.find(w => !S().isWatched(w.id) && !w.upcoming) : null;
    const orderMap = {}; activeMembers.forEach((w, i) => { orderMap[w.id] = i + 1; });

    // 线路(分层悬浮管道)
    let activeCurve = null;
    threadIds.forEach(tid => {
      const t = MARVEL.THREADS[tid];
      const members = works.filter(w => w.threads.includes(tid));
      if (members.length < 2) return;
      const y = levelOf(tid);
      const pts = members.map(w => pos[w.id].clone().setY(y));
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.25);
      const isActive = tid === activeThread;
      const faded = activeThread && !isActive;
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, members.length * 16, isActive ? 0.11 : 0.06, 8, false),
        new THREE.MeshStandardMaterial({ color: t.color, emissive: t.color, emissiveIntensity: isActive ? 0.85 : (faded ? 0.1 : 0.5), transparent: true, opacity: isActive ? 1 : (faded ? 0.08 : 0.55), roughness: 0.4 }));
      tube.raycast = () => {};
      scene.add(tube);
      if (isActive) activeCurve = curve;
      // 站点竖井(换乘柱)
      members.forEach(w => {
        const p = pos[w.id];
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, y, 6), new THREE.MeshBasicMaterial({ color: t.color, transparent: true, opacity: faded ? 0.05 : 0.35 }));
        col.position.set(p.x, y / 2, p.z); col.raycast = () => {};
        scene.add(col);
      });
    });

    // 活动线粒子流
    let flow = null;
    if (activeCurve) {
      const N = 48;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
      flow = new THREE.Points(geo, new THREE.PointsMaterial({ color: MARVEL.THREADS[activeThread].color, size: 0.32, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
      flow.raycast = () => {};
      flow.userData = { curve: activeCurve, N, offset: 0 };
      scene.add(flow);
    }

    // 站点
    const discGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.16, 28);
    const stations = [];
    works.forEach(w => {
      const p = pos[w.id];
      const watched = S().isWatched(w.id);
      const inActive = !activeThread || w.threads.includes(activeThread);
      const isNext = nextWork && nextWork.id === w.id;
      const col = new THREE.Color(watched ? '#f0b429' : colorOfWork(w));
      const mesh = new THREE.Mesh(discGeo, new THREE.MeshStandardMaterial({ color: watched ? col : 0x2a3346, emissive: col, emissiveIntensity: watched ? 0.8 : 0.25, metalness: 0.5, roughness: 0.35, transparent: true, opacity: inActive ? 1 : 0.25 }));
      mesh.position.copy(p);
      mesh.userData = { id: w.id, tip: `<b>${w.emoji} ${w.title}</b> · ${w.release.slice(0, 4)}<br><small>${watched ? '✔ 已看' : (w.upcoming ? '⏳ 未上映' : '未看')} · ${w.threads.map(t => MARVEL.THREADS[t].name).join(' / ')}</small>` };
      scene.add(mesh); ctx.pickables.push(mesh); stations.push(mesh);
      if (watched) { const g = glowSprite('#f0b429', 1.8, inActive ? 0.7 : 0.15); g.position.y = 0.1; mesh.add(g); }
      const lab = makeLabel([{ text: `${w.emoji} ${shortTitle(w)}`, size: 20, weight: 700, color: watched ? '#f0b429' : '#dfe5f0' }, { text: w.release.slice(0, 4), size: 14, color: '#8b94a7', weight: 500 }], { worldPerPx: 0.011, opacity: inActive ? 0.95 : 0.25 });
      lab.position.set(0, -0.05, 1.05);
      mesh.add(lab);
      if (orderMap[w.id]) {
        const badge = makeLabel([{ text: String(orderMap[w.id]), size: 22, color: '#0a0d14', weight: 900, font: DISPLAY_FONT }], { bg: MARVEL.THREADS[activeThread].color, worldPerPx: 0.012, pad: 8 });
        badge.position.set(0.55, levelOf(activeThread) + 0.45, -0.4);
        mesh.add(badge);
      }
      if (isNext) {
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 6, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xf0b429, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
        beam.position.y = 3; beam.raycast = () => {};
        mesh.add(beam); mesh.userData.beam = beam;
        const tag = makeLabel([{ text: '▼ 下一站', size: 22, color: '#f0b429', weight: 900 }], { bg: 'rgba(10,13,20,0.8)', border: 'rgba(240,180,41,0.6)', worldPerPx: 0.013 });
        tag.position.y = 6.6; mesh.add(tag);
      }
    });

    ctx.onClick = obj => { if (MARVEL.ui) MARVEL.ui.openDetail(obj.userData.id); };
    ctx.onFrame = (dt, t) => {
      stations.forEach(m => { const s = ctx.hovered === m ? 1.3 : 1; m.scale.x += (s - m.scale.x) * 0.15; m.scale.z = m.scale.x; if (m.userData.beam) m.userData.beam.material.opacity = 0.16 + Math.sin(t * 3) * 0.08; });
      if (flow) {
        flow.userData.offset = (flow.userData.offset + dt * 0.06) % 1;
        const arr = flow.geometry.attributes.position.array;
        for (let i = 0; i < flow.userData.N; i++) { const p = flow.userData.curve.getPointAt((i / flow.userData.N + flow.userData.offset) % 1); arr[i * 3] = p.x; arr[i * 3 + 1] = p.y + 0.05; arr[i * 3 + 2] = p.z; }
        flow.geometry.attributes.position.needsUpdate = true;
      }
    };

    const mem = camMemory.map || {};
    ctx.orbit = new Orbit(camera, ctx.canvas, { target: mem.target || [0, 0.5, 0], yaw: mem.yaw || 0, pitch: mem.pitch || 1.18, dist: mem.dist || 44, minDist: 8, maxDist: 80, minPitch: 0.35, maxPitch: 1.5 });
  }

  /* ==========================================================================
     3) 年代长廊(时间线)
     ========================================================================== */
  function mountCorridor(ctx) {
    const { scene, camera } = ctx;
    addLights(scene, 0.75, 0.35);
    scene.fog = new THREE.FogExp2(0x070a12, 0.03);
    scene.add(starField(1600, 220));

    const START = new Date('2000-01-01T00:00:00');
    const UNIT = 6; // 每年 6 个单位
    const zOf = d => -((new Date(d + 'T00:00:00') - START) / (365.25 * 864e5)) * UNIT;
    const LANE = { movie: -3.8, series: 0, legacy: 3.8 };
    const laneOf = w => w.universe !== 'mcu' ? 'legacy' : (w.type === 'movie' ? 'movie' : 'series');
    const zEnd = zOf('2028-06-30');

    // 地面与阶段色带
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(16, -zEnd + 30), new THREE.MeshStandardMaterial({ color: 0x0c101b, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.02, zEnd / 2 + 4); ground.raycast = () => {};
    scene.add(ground);
    [1, 2, 3, 4, 5, 6].forEach(n => {
      const ws = MARVEL.WORKS.filter(w => w.phase === n);
      if (!ws.length) return;
      const zs = ws.map(w => zOf(w.release));
      const z1 = Math.max(...zs) + 1.2, z2 = Math.min(...zs) - 1.2;
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(12, z1 - z2), new THREE.MeshBasicMaterial({ color: MARVEL.PHASES[n].color, transparent: true, opacity: 0.16 }));
      strip.rotation.x = -Math.PI / 2; strip.position.set(0, 0.01, (z1 + z2) / 2); strip.raycast = () => {};
      scene.add(strip);
      const lab = makeLabel([{ text: `${MARVEL.PHASES[n].en} · ${MARVEL.PHASES[n].name}`, size: 34, color: MARVEL.PHASES[n].color, weight: 900, font: DISPLAY_FONT }], { worldPerPx: 0.013, opacity: 0.85 });
      lab.position.set(0, 5.2, (z1 + z2) / 2);
      scene.add(lab);
    });
    // 年份线与标签 / 泳道线
    for (let y = 2000; y <= 2028; y++) {
      const z = zOf(`${y}-01-01`);
      const line = new THREE.Mesh(new THREE.PlaneGeometry(12, 0.06), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 }));
      line.rotation.x = -Math.PI / 2; line.position.set(0, 0.02, z); line.raycast = () => {};
      scene.add(line);
      const lab = makeLabel([{ text: String(y), size: 30, color: '#9aa3b5', weight: 400, font: DISPLAY_FONT }], { worldPerPx: 0.014 });
      lab.position.set(-6.9, 0.45, z);
      scene.add(lab);
    }
    Object.entries({ 'MCU 电影': -3.8, 'MCU 剧集 · 动画 · 特别篇': 0, '前代与番外': 3.8 }).forEach(([name, x]) => {
      const lab = makeLabel([{ text: name, size: 18, color: '#5a6376', weight: 900 }], { worldPerPx: 0.014 });
      lab.position.set(x, 0.3, zOf('2008-01-01') + 4.5);
      scene.add(lab);
    });

    // 今日之门
    const zToday = zOf(S().today());
    [-6.6, 6.6].forEach(x => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.25, 5.5, 0.25), new THREE.MeshStandardMaterial({ color: 0xf0b429, emissive: 0xf0b429, emissiveIntensity: 0.9 }));
      pillar.position.set(x, 2.75, zToday); pillar.raycast = () => {};
      scene.add(pillar);
    });
    const beam = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: 0xf0b429 }));
    beam.position.set(0, 5.5, zToday); beam.raycast = () => {};
    scene.add(beam);
    const todayLab = makeLabel([{ text: `今天 · ${S().today().replace(/-/g, '.')}`, size: 26, color: '#f0b429', weight: 900 }], { bg: 'rgba(10,13,20,0.75)', worldPerPx: 0.014 });
    todayLab.position.set(0, 6.2, zToday);
    scene.add(todayLab);

    // 海报立牌
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const cardGeo = new THREE.PlaneGeometry(1.5, 2.25);
    const frameGeo = new THREE.PlaneGeometry(1.64, 2.39);
    const cards = [];
    const works = MARVEL.WORKS.slice().sort((a, b) => a.release.localeCompare(b.release));
    const lastZ = { movie: 99, series: 99, legacy: 99 };
    const stagger = { movie: 0, series: 0, legacy: 0 };
    works.forEach(w => {
      const lane = laneOf(w);
      const z = zOf(w.release);
      if (lastZ[lane] - z < 0.9) stagger[lane] = (stagger[lane] + 1) % 3; else stagger[lane] = 0;
      lastZ[lane] = z;
      const x = LANE[lane] + (stagger[lane] === 1 ? 1.1 : stagger[lane] === 2 ? -1.1 : 0);
      const watched = S().isWatched(w.id);
      const col = new THREE.Color(colorOfWork(w));
      const group = new THREE.Group();
      group.position.set(x, 1.3, z);
      const frame = new THREE.Mesh(frameGeo, new THREE.MeshBasicMaterial({ color: watched ? 0xf0b429 : col, transparent: true, opacity: w.upcoming ? 0.4 : 0.95 }));
      frame.position.z = -0.02; frame.raycast = () => {};
      group.add(frame);
      const mat = new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(0.5), transparent: true, opacity: w.upcoming ? 0.55 : 1 });
      const card = new THREE.Mesh(cardGeo, mat);
      card.userData = { id: w.id, tip: `<b>${w.emoji} ${w.title}</b><br><small>${w.release} · ${watched ? '✔ 已看' : (w.upcoming ? '⏳ 未上映' : '未看')}</small>`, group };
      group.add(card);
      ctx.pickables.push(card); cards.push(card);
      const url = MARVEL.POSTERS && MARVEL.POSTERS[w.id];
      if (url) loader.load(url, tex => { tex.encoding = THREE.sRGBEncoding; mat.map = tex; mat.color.set(0xffffff); mat.needsUpdate = true; }, undefined, () => {});
      else { const e = makeLabel([{ text: w.emoji, size: 64 }], { worldPerPx: 0.012 }); group.add(e); }
      if (watched) { const g = glowSprite('#f0b429', 3.2, 0.5); g.position.z = -0.05; group.add(g); }
      const lab = makeLabel([{ text: `${watched ? '✔ ' : ''}${shortTitle(w)}`, size: 20, weight: 700, color: watched ? '#f0b429' : '#e8ecf4' }, { text: w.release.slice(0, 7).replace('-', '.'), size: 14, color: '#8b94a7', weight: 500 }], { worldPerPx: 0.011 });
      lab.position.set(0, -1.55, 0.05);
      group.add(lab);
      scene.add(group);
    });

    ctx.onClick = obj => { if (MARVEL.ui) MARVEL.ui.openDetail(obj.userData.id); };
    ctx.onFrame = () => {
      cards.forEach(c => { const s = ctx.hovered === c ? 1.12 : 1; c.userData.group.scale.x += (s - c.userData.group.scale.x) * 0.15; c.userData.group.scale.y = c.userData.group.scale.x; });
    };

    const mem = camMemory.corridor || {};
    const zStart = zOf('2008-01-01');
    const orbit = new Orbit(camera, ctx.canvas, {
      target: mem.target || [0, 1.2, zStart - 5], yaw: mem.yaw || 0, pitch: mem.pitch || 0.5, dist: mem.dist || 15,
      minDist: 6, maxDist: 30, minPitch: 0.15, maxPitch: 1.2, yawLimit: 0.9,
      onWheel: e => { orbit.target.z = Math.max(zEnd - 4, Math.min(zOf('2000-01-01') + 6, orbit.target.z + (e.deltaY > 0 ? -1 : 1) * 1.4)); },
    });
    ctx.orbit = orbit;
    ctx.jumpTo = date => { orbit.target.z = zOf(date) - 5; orbit.update(); };
  }

  /* ==========================================================================
     挂载 / 卸载
     ========================================================================== */
  const MOUNTERS = { characters: mountCharacters, map: mountMetro, corridor: mountCorridor };

  async function mount(kind, host, opts) {
    unmount();
    if (!host) return;
    host.innerHTML = '<div class="three-loading">🪐 正在加载高阶视图…</div>';
    const token = (mount._token = (mount._token || 0) + 1);
    try { await loadThree(); }
    catch (e) { host.innerHTML = `<div class="three-loading">⚠️ ${e.message}</div>`; return; }
    if (token !== mount._token || !host.isConnected) return;
    try {
      const ctx = createStage(host, kind);
      MOUNTERS[kind](ctx, opts || {});
      ctx.start();
      cur = ctx;
    } catch (e) {
      console.error(e);
      host.innerHTML = `<div class="three-loading">⚠️ 高阶视图渲染失败:${e.message}</div>`;
    }
  }

  function unmount() {
    if (cur) { disposeStage(cur); cur = null; }
  }

  function resetCamera() {
    if (!cur || !cur.orbit) return;
    delete camMemory[cur.kind];
    const o = cur.orbit;
    if (cur.kind === 'characters') { o.yaw = 0; o.pitch = 0.95; o.dist = 22; o.target.set(0, 0, 0); }
    if (cur.kind === 'map') { o.yaw = 0; o.pitch = 1.18; o.dist = 44; o.target.set(0, 0.5, 0); }
    if (cur.kind === 'corridor') { o.yaw = 0; o.pitch = 0.5; o.dist = 15; cur.jumpTo('2008-01-01'); }
    o.update();
  }

  function jumpToday() { if (cur && cur.jumpTo) cur.jumpTo(S().today()); }

  MARVEL.three = { mount, unmount, resetCamera, jumpToday, get active() { return cur; } };
})();
