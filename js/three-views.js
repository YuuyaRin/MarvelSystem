/* ==========================================================================
   MARVEL 宇宙观影指挥中心 — 高阶版(2.5D)视图引擎 v2
   星座图(角色) / 星轨螺旋(宇宙链路) / 时光之河(时间线)
   基于 three.js(vendor/three.min.js,按需懒加载)
   ========================================================================== */

(function () {
  const S = () => MARVEL.store;
  let cur = null;
  const BODY_FONT = '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif';
  const DISPLAY_FONT = '"Bebas Neue",Impact,"Arial Narrow",sans-serif';
  const noop = () => {};
  const COARSE = window.matchMedia && matchMedia('(pointer: coarse)').matches; // 触屏设备
  const LABEL_K = COARSE ? 1.28 : 1;

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

  /* ========================================================================
     素材工具:纹理 / 精灵 / 标签
     ======================================================================== */
  const texCache = {};

  function radialTex(color, inner) {
    const key = 'r' + color + inner;
    if (texCache[key]) return texCache[key];
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 1, 64, 64, 64);
    grad.addColorStop(0, color);
    grad.addColorStop(inner == null ? 0.25 : inner, color + 'aa');
    grad.addColorStop(1, color + '00');
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    return (texCache[key] = new THREE.CanvasTexture(c));
  }

  /* 星辰纹理:亮核 + 光晕 + 十字光芒 */
  function starTex() {
    if (texCache.star) return texCache.star;
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    let grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.12, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.28)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    [[0, 64, 128, 64], [64, 0, 64, 128]].forEach(([x1, y1, x2, y2]) => {
      const lg = g.createLinearGradient(x1, y1, x2, y2);
      lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,0.85)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
      g.strokeStyle = lg; g.lineWidth = 2.2;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    });
    return (texCache.star = new THREE.CanvasTexture(c));
  }

  function gradientTex(stops) {
    const c = document.createElement('canvas'); c.width = 4; c.height = 512;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 512);
    stops.forEach(([o, col]) => grad.addColorStop(o, col));
    g.fillStyle = grad; g.fillRect(0, 0, 4, 512);
    return new THREE.CanvasTexture(c);
  }

  function sprite(tex, color, scale, opacity, additive) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: color || 0xffffff, transparent: true, opacity: opacity == null ? 1 : opacity, depthWrite: false, blending: additive === false ? THREE.NormalBlending : THREE.AdditiveBlending }));
    sp.scale.set(scale, scale, 1);
    sp.raycast = noop;
    return sp;
  }
  const glow = (color, scale, opacity) => sprite(radialTex(color), 0xffffff, scale, opacity);
  const star = (color, scale, opacity) => sprite(starTex(), color, scale, opacity);

  /* 地面光晕圆盘(平躺) */
  function groundGlow(color, radius, opacity) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(radius, 48), new THREE.MeshBasicMaterial({ map: radialTex(color, 0.1), transparent: true, opacity: opacity == null ? 0.5 : opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.rotation.x = -Math.PI / 2; m.raycast = noop;
    return m;
  }

  /* 天幕:渐变球 */
  function backdrop(scene, stops) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(220, 24, 16), new THREE.MeshBasicMaterial({ map: gradientTex(stops), side: THREE.BackSide, fog: false, depthWrite: false }));
    m.raycast = noop;
    scene.add(m);
  }

  /* 星尘/星空 */
  function dust(n, spread, y, size, opacity, color) {
    if (COARSE) n = Math.round(n * 0.55);
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * spread; pos[i * 3 + 1] = y + (Math.random() - 0.5) * (y ? y : spread * 0.6); pos[i * 3 + 2] = (Math.random() - 0.5) * spread; }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: color || 0xbfc9ea, size: size || 0.08, transparent: true, opacity: opacity == null ? 0.7 : opacity, depthWrite: false, blending: THREE.AdditiveBlending, map: radialTex('#ffffff', 0.2) }));
    pts.raycast = noop;
    return pts;
  }

  function lights(scene, amb) {
    scene.add(new THREE.AmbientLight(0x8a94c8, amb == null ? 0.9 : amb));
    const hemi = new THREE.HemisphereLight(0x8fa2ff, 0x2a1a3a, 0.55);
    scene.add(hemi);
    const d = new THREE.DirectionalLight(0xffffff, 0.45);
    d.position.set(8, 16, 10);
    scene.add(d);
  }

  /* 文字标签精灵 */
  function makeLabel(lines, opts) {
    opts = opts || {};
    const dpr = 2, pad = opts.pad == null ? 10 : opts.pad;
    const c = document.createElement('canvas');
    const g = c.getContext('2d');
    const measured = lines.map(l => { g.font = `${l.weight || 700} ${l.size || 22}px ${l.font || BODY_FONT}`; return { w: g.measureText(l.text).width, h: (l.size || 22) * 1.25 }; });
    const w = Math.ceil(Math.max(...measured.map(m => m.w)) + pad * 2);
    const h = Math.ceil(measured.reduce((a, m) => a + m.h, 0) + pad * 2);
    c.width = w * dpr; c.height = h * dpr; g.scale(dpr, dpr);
    if (opts.bg) {
      g.fillStyle = opts.bg; const r = Math.min(12, h / 2);
      g.beginPath(); g.moveTo(r, 0); g.arcTo(w, 0, w, h, r); g.arcTo(w, h, 0, h, r); g.arcTo(0, h, 0, 0, r); g.arcTo(0, 0, w, 0, r); g.closePath(); g.fill();
      if (opts.border) { g.strokeStyle = opts.border; g.lineWidth = 2; g.stroke(); }
    }
    let y = pad; g.textAlign = 'center'; g.textBaseline = 'top';
    lines.forEach((l, i) => {
      g.font = `${l.weight || 700} ${l.size || 22}px ${l.font || BODY_FONT}`;
      g.fillStyle = l.color || '#eef1f8';
      g.shadowColor = 'rgba(0,0,0,0.85)'; g.shadowBlur = 8;
      g.fillText(l.text, w / 2, y + 2); y += measured[i].h;
    });
    const tex = new THREE.CanvasTexture(c); tex.minFilter = THREE.LinearFilter;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: opts.opacity == null ? 1 : opts.opacity }));
    const k = (opts.worldPerPx || 0.012) * LABEL_K;
    sp.scale.set(w * k, h * k, 1);
    sp.raycast = noop;
    return sp;
  }

  /* 发光圆环序号徽章 */
  function badgeSprite(num, color) {
    const c = document.createElement('canvas'); c.width = c.height = 160;
    const g = c.getContext('2d');
    g.shadowColor = color; g.shadowBlur = 22;
    g.strokeStyle = color; g.lineWidth = 6;
    g.beginPath(); g.arc(80, 80, 54, 0, Math.PI * 2); g.stroke();
    g.shadowBlur = 0;
    g.fillStyle = 'rgba(6,8,18,0.72)';
    g.beginPath(); g.arc(80, 80, 51, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff'; g.font = `900 62px ${DISPLAY_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = color; g.shadowBlur = 14;
    g.fillText(String(num), 80, 86);
    const tex = new THREE.CanvasTexture(c); tex.minFilter = THREE.LinearFilter;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.scale.set(1.25, 1.25, 1); sp.raycast = noop;
    return sp;
  }

  /* 设计化占位海报(阶段渐变 + 表情 + 片名) */
  function placeholderPoster(w, color) {
    const c = document.createElement('canvas'); c.width = 340; c.height = 510;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 340, 510);
    grad.addColorStop(0, color); grad.addColorStop(1, '#0a0d14');
    g.fillStyle = grad; g.fillRect(0, 0, 340, 510);
    g.fillStyle = 'rgba(255,255,255,0.08)';
    for (let y = 8; y < 510; y += 18) for (let x = 8; x < 340; x += 18) { g.beginPath(); g.arc(x, y, 1.4, 0, 7); g.fill(); }
    g.font = '150px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 24;
    g.fillText(w.emoji, 170, 215);
    g.shadowBlur = 0;
    const sh = g.createLinearGradient(0, 300, 0, 510); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.85)');
    g.fillStyle = sh; g.fillRect(0, 300, 340, 210);
    g.fillStyle = '#fff'; g.font = `900 30px ${BODY_FONT}`;
    const t = w.title.length > 10 ? w.title.slice(0, 10) + '…' : w.title;
    g.fillText(t, 170, 420);
    g.fillStyle = '#f0b429'; g.font = `34px ${DISPLAY_FONT}`;
    g.fillText(w.release.slice(0, 4), 170, 465);
    const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  /* 海报纹理:跨挂载缓存 + 限并发 + 重试 */
  const posterCache = {};
  const posterQueue = []; let posterActive = 0;
  function loadPoster(url) {
    if (posterCache[url]) return posterCache[url];
    posterCache[url] = new Promise(resolve => {
      posterQueue.push({ url, resolve, tries: 0 });
      pumpPosters();
    });
    return posterCache[url];
  }
  function pumpPosters() {
    while (posterActive < 4 && posterQueue.length) {
      const job = posterQueue.shift(); posterActive++;
      const loader = new THREE.TextureLoader(); loader.setCrossOrigin('anonymous');
      loader.load(job.url, tex => { tex.encoding = THREE.sRGBEncoding; posterActive--; job.resolve(tex); pumpPosters(); },
        undefined, () => { posterActive--; if (job.tries < 2) { job.tries++; setTimeout(() => { posterQueue.push(job); pumpPosters(); }, 1200 * job.tries); } else { delete posterCache[job.url]; job.resolve(null); } pumpPosters(); });
    }
  }

  /* 不可见的拾取体 */
  function pickBody(r) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), new THREE.MeshBasicMaterial({ visible: false }));
    return m;
  }

  /* ========================================================================
     相机:受限轨道 + 缓动 + 微摆
     ======================================================================== */
  class Orbit {
    constructor(camera, dom, o) {
      this.cam = camera; this.dom = dom; this.o = o;
      this.target = new THREE.Vector3(...(o.target || [0, 0, 0]));
      this.yaw = this.yawT = o.yaw || 0; this.pitch = this.pitchT = o.pitch == null ? 0.9 : o.pitch; this.dist = this.distT = o.dist || 20;
      this.moved = 0; this.drag = null; this.idle = 0; this.t = 0;
      this.pointers = new Map(); this.pinchD = 0;
      const pinchDist = () => { const [a, b] = [...this.pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
      this._down = e => {
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); this.idle = 0;
        dom.setPointerCapture(e.pointerId);
        if (this.pointers.size === 1) { this.drag = { x: e.clientX, y: e.clientY }; this.moved = 0; }
        else { this.drag = null; this.pinchD = pinchDist(); this.moved = 99; }
      };
      this._move = e => {
        const p = this.pointers.get(e.pointerId); if (!p) return;
        const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
        this.moved += Math.abs(dx) + Math.abs(dy);
        if (this.pointers.size >= 2) { const d = pinchDist(); if (this.pinchD > 0 && d > 0) { this.distT *= this.pinchD / d; this.clamp(); } this.pinchD = d; return; }
        if (!this.drag) return;
        const s = e.pointerType === 'touch' ? 0.006 : 0.004;
        this.yawT -= dx * s; this.pitchT += dy * s;
        this.clamp();
      };
      this._up = e => { this.pointers.delete(e.pointerId); if (this.pointers.size < 2) this.pinchD = 0; if (this.pointers.size === 0) this.drag = null; };
      this._wheel = e => { e.preventDefault(); this.idle = 0; this.distT *= e.deltaY > 0 ? 1.08 : 0.93; this.clamp(); };
      dom.addEventListener('pointerdown', this._down); dom.addEventListener('pointermove', this._move);
      dom.addEventListener('pointerup', this._up); dom.addEventListener('pointercancel', this._up);
      dom.addEventListener('wheel', this._wheel, { passive: false });
      this.update();
    }
    clamp() {
      const o = this.o;
      if (o.yawRange != null) this.yawT = Math.max((o.yaw || 0) - o.yawRange, Math.min((o.yaw || 0) + o.yawRange, this.yawT));
      this.pitchT = Math.max(o.minPitch == null ? 0.3 : o.minPitch, Math.min(o.maxPitch == null ? 1.3 : o.maxPitch, this.pitchT));
      this.distT = Math.max(o.minDist || 6, Math.min(o.maxDist || 60, this.distT));
    }
    tick(dt) {
      this.idle += dt; this.t += dt;
      if (this.o.idleRotate && this.idle > 2 && !this.drag) { this.yawT += this.o.idleRotate * dt; this.clamp(); }
      const k = Math.min(1, dt * 6);
      this.yaw += (this.yawT - this.yaw) * k; this.pitch += (this.pitchT - this.pitch) * k; this.dist += (this.distT - this.dist) * k;
      this.update();
    }
    update() {
      const sway = this.o.sway || 0;
      const yaw = this.yaw + Math.sin(this.t * 0.23) * sway, pitch = this.pitch + Math.cos(this.t * 0.17) * sway * 0.4;
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      this.cam.position.set(this.target.x + this.dist * cp * Math.sin(yaw), this.target.y + this.dist * sp, this.target.z + this.dist * cp * Math.cos(yaw));
      this.cam.lookAt(this.target);
    }
    reset() { this.yawT = this.o.yaw || 0; this.pitchT = this.o.pitch; this.distT = this.o.dist; this.idle = 0; }
    dispose() {
      this.dom.removeEventListener('pointerdown', this._down); this.dom.removeEventListener('pointermove', this._move);
      this.dom.removeEventListener('pointerup', this._up); this.dom.removeEventListener('pointercancel', this._up); this.dom.removeEventListener('wheel', this._wheel);
    }
  }

  /* ========================================================================
     场景骨架
     ======================================================================== */
  function createStage(host, kind, clear) {
    host.querySelectorAll('canvas, .three-tip, .three-loading').forEach(el => el.remove());
    const canvas = document.createElement('canvas'); host.insertBefore(canvas, host.firstChild);
    const tip = document.createElement('div'); tip.className = 'three-tip hidden'; host.appendChild(tip);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(COARSE ? 1.6 : 2, window.devicePixelRatio || 1));
    renderer.setClearColor(clear || 0x0b1020, 1);
    renderer.outputEncoding = THREE.sRGBEncoding;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 500);
    const ctx = { kind, host, canvas, tip, renderer, scene, camera, pickables: [], hovered: null, raf: 0, disposers: [], t: 0, touch: COARSE, portrait: host.clientWidth < host.clientHeight * 1.05 };
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(-9, -9);
    let downAt = null;
    const resize = () => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    const ro = new ResizeObserver(resize); ro.observe(host); ctx.disposers.push(() => ro.disconnect()); resize();

    const setPointerFrom = e => { const r = canvas.getBoundingClientRect(); pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); return r; };
    canvas.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return; // 触屏不做悬停
      const r = setPointerFrom(e);
      tip.style.left = `${e.clientX - r.left + 14}px`; tip.style.top = `${e.clientY - r.top + 14}px`;
    });
    canvas.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') pointer.set(-9, -9); });
    canvas.addEventListener('pointerdown', e => { downAt = { x: e.clientX, y: e.clientY, type: e.pointerType }; if (e.pointerType === 'touch') ctx.touch = true; });
    canvas.addEventListener('pointerup', e => {
      const moved = (ctx.cam && ctx.cam.moved > 8) || (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 8);
      if (moved) return;
      if (e.pointerType === 'touch') {
        // 触屏:第一次点按 = 选中并弹出信息条,再点同一目标 = 打开详情
        setPointerFrom(e);
        const obj = ctx.raycast();
        if (obj && obj === ctx.hovered) { if (ctx.onClick) ctx.onClick(obj); return; }
        ctx.setHover(obj);
        return;
      }
      if (ctx.hovered && ctx.onClick) ctx.onClick(ctx.hovered);
    });
    tip.addEventListener('click', e => { if (e.target.closest('[data-three-open]') && ctx.hovered && ctx.onClick) ctx.onClick(ctx.hovered); });

    ctx.raycast = () => { raycaster.setFromCamera(pointer, camera); const hit = raycaster.intersectObjects(ctx.pickables, false)[0]; return hit ? hit.object : null; };
    ctx.setHover = obj => {
      if (obj === ctx.hovered) return;
      const prev = ctx.hovered; ctx.hovered = obj;
      canvas.style.cursor = obj ? 'pointer' : 'grab';
      if (ctx.onHover) ctx.onHover(obj, prev);
      if (obj && obj.userData.tip) {
        tip.classList.toggle('sheet', ctx.touch);
        tip.innerHTML = ctx.touch ? `<div class="tip-body">${obj.userData.tip}</div><button class="btn btn-primary btn-sm" data-three-open>查看详情 →</button>` : obj.userData.tip;
        tip.classList.remove('hidden');
      } else tip.classList.add('hidden');
    };
    ctx.pick = () => { if (ctx.touch) return; ctx.setHover(ctx.raycast()); };
    let last = performance.now();
    const loop = now => {
      ctx.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now; ctx.t += dt;
      try { if (ctx.cam) ctx.cam.tick(dt); if (ctx.onFrame) ctx.onFrame(dt, ctx.t); ctx.pick(); }
      catch (e) { if (!ctx.warned) { ctx.warned = true; console.warn('[three-views]', e); } }
      renderer.render(scene, camera);
    };
    ctx.start = () => { last = performance.now(); loop(last); };
    return ctx;
  }

  function disposeStage(ctx) {
    cancelAnimationFrame(ctx.raf);
    if (ctx.cam && ctx.cam.dispose) ctx.cam.dispose();
    ctx.disposers.forEach(f => f());
    ctx.scene.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
      mats.forEach(m => { if (m.map && !Object.values(texCache).includes(m.map)) m.map.dispose(); m.dispose(); });
    });
    ctx.renderer.dispose();
    if (ctx.host.isConnected) ctx.host.querySelectorAll('canvas, .three-tip, .three-loading').forEach(el => el.remove());
  }

  const shortTitle = w => { if (w.title.length <= 7) return w.title; const p = w.title.split(/[::]/); if (p.length < 2) return w.title; if (/\d/.test(p[0])) return p[0]; return p[1].length <= 6 ? p[1] : p[0]; };
  const colorOfWork = w => w.phase >= 1 ? MARVEL.PHASES[w.phase].color : ((MARVEL.UNIVERSES[w.universe] || {}).color || '#7f8da3');
  const lerpOpacity = (mat, target, k) => { mat.opacity += (target - mat.opacity) * k; };

  /* ========================================================================
     1) 星座图(角色)
     ======================================================================== */
  const REL_COLORS = { family: '#f0b429', love: '#ff5ca8', mentor: '#4d9fff', comrade: '#3ecf8e', rival: '#ff4d57' };

  function layoutCharacters(W, H) {
    const chars = MARVEL.CHARACTERS, fids = Object.keys(MARVEL.FACTIONS), anchors = {};
    fids.forEach((f, i) => { const a = (i / fids.length) * Math.PI * 2 - Math.PI / 2; anchors[f] = { x: W / 2 + Math.cos(a) * W * 0.36, y: H / 2 + Math.sin(a) * H * 0.36 }; });
    const nodes = chars.map((c, i) => { const a = anchors[c.faction]; return { c, x: a.x + Math.sin(i * 7.3) * 70, y: a.y + Math.cos(i * 5.1) * 70 }; });
    const byId = {}; nodes.forEach(n => { byId[n.c.id] = n; });
    const edges = MARVEL.RELATIONS.filter(r => byId[r.a] && byId[r.b]).map(r => ({ ...r, na: byId[r.a], nb: byId[r.b] }));
    for (let it = 0; it < 320; it++) {
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j]; let dx = b.x - a.x, dy = b.y - a.y; const d2 = Math.max(dx * dx + dy * dy, 100);
        if (d2 < 52000) { const d = Math.sqrt(d2), f = 3400 / d2 * 9; dx /= d; dy /= d; a.x -= dx * f; a.y -= dy * f; b.x += dx * f; b.y += dy * f; }
      }
      edges.forEach(e => { const dx = e.nb.x - e.na.x, dy = e.nb.y - e.na.y, d = Math.sqrt(dx * dx + dy * dy) || 1, f = (d - 190) * 0.015; e.na.x += dx / d * f; e.na.y += dy / d * f; e.nb.x -= dx / d * f; e.nb.y -= dy / d * f; });
      nodes.forEach(n => { const a = anchors[n.c.faction]; n.x += (a.x - n.x) * 0.03; n.y += (a.y - n.y) * 0.03; n.x = Math.max(50, Math.min(W - 50, n.x)); n.y = Math.max(50, Math.min(H - 50, n.y)); });
    }
    return { nodes, edges };
  }

  function mountCharacters(ctx, opts) {
    const { scene, camera } = ctx;
    const activeFaction = opts.activeFaction || null;
    backdrop(scene, [[0, '#10132e'], [0.5, '#080a1b'], [1, '#04050b']]);
    lights(scene, 0.8);
    scene.fog = new THREE.FogExp2(0x07091a, 0.01);
    const dustA = dust(1200, 110, 8, 0.11, 0.5); scene.add(dustA);
    const dustB = dust(400, 60, 2, 0.2, 0.35, 0xdfe6ff); scene.add(dustB);
    const band = glow('#4a56b8', 1, 0.07); band.scale.set(140, 30, 1); band.position.set(-10, 18, -70); scene.add(band);
    [8.5, 13.5, 18.5].forEach((r, i) => {
      const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.025, r + 0.025, 160), new THREE.MeshBasicMaterial({ color: 0x7484d8, transparent: true, opacity: 0.13 - i * 0.03, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = -0.75; ring.raycast = noop; scene.add(ring);
    });

    const W = 1300, H = 900, K = 0.02;
    const { nodes, edges } = layoutCharacters(W, H);
    const toWorld = n => new THREE.Vector3((n.x - W / 2) * K, 0, (n.y - H / 2) * K);

    // 银河盘面 + 阵营星云
    const disc = groundGlow('#222a60', 21, 0.1); disc.position.y = -0.9; scene.add(disc);
    const byF = {};
    nodes.forEach(n => { (byF[n.c.faction] = byF[n.c.faction] || []).push(toWorld(n)); });
    Object.entries(byF).forEach(([fid, pts]) => {
      const f = MARVEL.FACTIONS[fid];
      const c = pts.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / pts.length);
      const neb = glow(f.color, 6.5 + pts.length * 0.6, 0.075); neb.position.copy(c).setY(-0.3); scene.add(neb);
      const lab = makeLabel([{ text: f.name, size: 28, color: f.color, weight: 900 }], { worldPerPx: 0.013, opacity: 0.75 });
      lab.position.copy(c).setY(2.9); scene.add(lab);
    });

    // 关系:默认细线,悬停变光轨 + 火花
    const adj = {};
    const edgeObjs = edges.map(e => {
      const a = toWorld(e.na), b = toWorld(e.nb);
      const mid = a.clone().add(b).multiplyScalar(0.5); mid.y = 0.6 + a.distanceTo(b) * 0.13;
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const col = new THREE.Color(REL_COLORS[e.type]);
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(28)), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
      line.raycast = noop; scene.add(line);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.05, 6, false), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      tube.raycast = noop; scene.add(tube);
      const spark = glow(REL_COLORS[e.type], 0.7, 0); spark.userData.phase = Math.random(); scene.add(spark);
      (adj[e.a] = adj[e.a] || new Set()).add(e.b); (adj[e.b] = adj[e.b] || new Set()).add(e.a);
      return { e, line, tube, spark, curve, lit: false };
    });

    // 星辰
    const starObjs = {};
    nodes.forEach(n => {
      const f = MARVEL.FACTIONS[n.c.faction];
      const deg = (adj[n.c.id] || new Set()).size;
      const dim = activeFaction && n.c.faction !== activeFaction;
      const g = new THREE.Group(); g.position.copy(toWorld(n));
      const core = star(f.color, 1.0 + deg * 0.1, dim ? 0.25 : 1);
      const halo = glow(f.color, 1.5 + deg * 0.12, dim ? 0.08 : 0.3);
      const body = pickBody(0.75);
      const title = n.c.title || n.c.name, sub = n.c.title && n.c.title !== n.c.name ? n.c.name : '';
      body.userData = { id: n.c.id, tip: `<b style="color:${f.color}">${n.c.emoji} ${title}</b>${sub ? ' · ' + sub : ''}<br><small>${f.name} · ${deg} 条关系 · ${n.c.actor} · 点击查看档案</small>` };
      const lab = makeLabel([{ text: `${n.c.emoji} ${title}`, size: 22, weight: 900 }], { worldPerPx: 0.011, opacity: dim ? 0.2 : 0.92, bg: 'rgba(7,9,19,0.5)', pad: 6 });
      lab.position.y = 0.95;
      g.add(core, halo, body, lab); scene.add(g);
      ctx.pickables.push(body);
      starObjs[n.c.id] = { g, core, halo, lab, dim, phase: Math.random() * 6.28, baseScale: core.scale.x, id: n.c.id, body };
    });

    let focus = null;
    ctx.onHover = obj => { focus = obj ? obj.userData.id : null; };
    ctx.onClick = obj => { if (MARVEL.ui) MARVEL.ui.openCharacter(obj.userData.id); };
    ctx.onFrame = (dt, t) => {
      const k = Math.min(1, dt * 7);
      const keep = focus ? new Set([focus, ...(adj[focus] || [])]) : null;
      Object.values(starObjs).forEach(s => {
        const base = s.dim ? 0.25 : 1;
        const on = keep ? keep.has(s.id) : true;
        const target = keep ? (on ? 1 : 0.18) : base;
        lerpOpacity(s.core.material, target, k); lerpOpacity(s.halo.material, target * 0.3, k); lerpOpacity(s.lab.material, keep ? (on ? 1 : 0.1) : base * 0.9, k);
        const sc = (s.id === focus ? 1.6 : 1) * s.baseScale * (1 + Math.sin(t * 1.6 + s.phase) * 0.06);
        s.core.scale.x += (sc - s.core.scale.x) * k; s.core.scale.y = s.core.scale.x;
        s.g.position.y = Math.sin(t * 0.8 + s.phase) * 0.1;
      });
      dustA.material.opacity = 0.4 + Math.sin(t * 0.9) * 0.12; dustB.material.opacity = 0.3 + Math.sin(t * 1.7 + 1) * 0.12;
      edgeObjs.forEach(o => {
        const lit = focus && (o.e.a === focus || o.e.b === focus);
        lerpOpacity(o.tube.material, lit ? 0.9 : 0, k);
        lerpOpacity(o.line.material, keep ? (lit ? 0 : 0.04) : 0.22, k);
        lerpOpacity(o.spark.material, lit ? 1 : 0, k);
        if (lit || o.spark.material.opacity > 0.02) o.spark.position.copy(o.curve.getPointAt((t * 0.35 + o.spark.userData.phase) % 1));
      });
    };

    const pb = ctx.portrait ? 1.5 : 1;
    ctx.cam = new Orbit(camera, ctx.canvas, { target: ctx.portrait ? [0, 0.2, 0] : [1.5, 0.2, -2.5], yaw: 0, pitch: ctx.portrait ? 1.0 : 0.88, dist: 27 * pb, yawRange: 0.45, minPitch: 0.55, maxPitch: 1.2, minDist: 12, maxDist: 46 * pb, sway: 0.03 });
  }

  /* ========================================================================
     2) 星轨螺旋(宇宙链路)
     ======================================================================== */
  function mountMetro(ctx, opts) {
    const { scene, camera } = ctx;
    const activeThread = opts.activeThread || null;
    backdrop(scene, [[0, '#151a42'], [0.5, '#0b0f2a'], [1, '#060812']]);
    lights(scene, 0.9);
    scene.fog = new THREE.FogExp2(0x0b1028, 0.009);
    scene.add(dust(900, 110, 8, 0.12, 0.5));

    const works = MARVEL.WORKS.filter(w => w.universe === 'mcu' && w.threads && w.threads.length).sort((a, b) => a.release.localeCompare(b.release));
    // 阿基米德螺旋:等弧长分布
    const r0 = 3.2, kR = 0.58, step = 2.7;
    const pos = {}, theta = {};
    let th = 0;
    works.forEach(w => { const r = r0 + kR * th; pos[w.id] = new THREE.Vector3(Math.cos(th) * r, 0, Math.sin(th) * r); theta[w.id] = th; th += step / r; });
    const thEnd = th;
    const spiralPt = a => { const r = r0 + kR * a; return new THREE.Vector3(Math.cos(a) * r, 0.02, Math.sin(a) * r); };

    // 地面光晕 + 阶段轨道
    const disc = groundGlow('#263066', r0 + kR * thEnd + 6, 0.5); disc.position.y = -0.6; scene.add(disc);
    [1, 2, 3, 4, 5, 6].forEach(n => {
      const ws = works.filter(w => w.phase === n); if (!ws.length) return;
      const a0 = Math.min(...ws.map(w => theta[w.id])) - 0.25, a1 = Math.max(...ws.map(w => theta[w.id])) + 0.25;
      const pts = []; for (let a = a0; a <= a1; a += 0.05) pts.push(spiralPt(a)); pts.push(spiralPt(a1));
      const rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length, 0.07, 6, false), new THREE.MeshBasicMaterial({ color: MARVEL.PHASES[n].color, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
      rail.raycast = noop; scene.add(rail);
      const lab = makeLabel([{ text: MARVEL.PHASES[n].en, size: 26, color: MARVEL.PHASES[n].color, weight: 900, font: DISPLAY_FONT }], { worldPerPx: 0.012, opacity: 0.8 });
      const p = spiralPt(a0 + 0.2); const out = p.clone().setY(0).normalize().multiplyScalar(1.9);
      lab.position.copy(p).add(out).setY(0.25); scene.add(lab);
    });

    const threadIds = Object.keys(MARVEL.THREADS);
    const activeMembers = activeThread ? works.filter(w => w.threads.includes(activeThread)) : [];
    const nextWork = activeThread ? activeMembers.find(w => !S().isWatched(w.id) && !w.upcoming) : null;
    const orderMap = {}; activeMembers.forEach((w, i) => { orderMap[w.id] = i + 1; });

    // 故事线光弧
    const arcObjs = [];
    let activePath = null;
    threadIds.forEach(tid => {
      const t = MARVEL.THREADS[tid];
      const members = works.filter(w => w.threads.includes(tid));
      if (members.length < 2) return;
      const isActive = tid === activeThread, faded = activeThread && !isActive;
      const col = new THREE.Color(t.color);
      const path = new THREE.CurvePath();
      for (let i = 1; i < members.length; i++) {
        const a = pos[members[i - 1].id], b = pos[members[i].id];
        const mid = a.clone().add(b).multiplyScalar(0.5); mid.y = 0.9 + a.distanceTo(b) * 0.35;
        const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
        path.add(curve);
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(30)), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: isActive ? 0 : (faded ? 0.05 : 0.28), blending: THREE.AdditiveBlending, depthWrite: false }));
        line.raycast = noop; scene.add(line);
        if (isActive) {
          const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.08, 8, false), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
          tube.raycast = noop; scene.add(tube);
          const haloTube = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.22, 8, false), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false }));
          haloTube.raycast = noop; scene.add(haloTube);
        }
      }
      if (isActive) activePath = path;
    });

    // 彗星:沿活动线飞行
    const comets = [];
    if (activePath) {
      const col = MARVEL.THREADS[activeThread].color;
      for (let i = 0; i < 3; i++) {
        const head = glow(col, 1.4, 1); head.userData.offset = i / 3; scene.add(head);
        const tail = []; for (let j = 0; j < 10; j++) { const s = glow(col, 0.9 - j * 0.07, 0.5 - j * 0.045); scene.add(s); tail.push(s); }
        comets.push({ head, tail });
      }
    }

    // 站点:光环 + 光点
    const ringGeo = new THREE.RingGeometry(0.34, 0.46, 40);
    const stationObjs = [];
    works.forEach(w => {
      const p = pos[w.id];
      const watched = S().isWatched(w.id);
      const inActive = !activeThread || w.threads.includes(activeThread);
      const isNext = nextWork && nextWork.id === w.id;
      const color = watched ? '#f0b429' : (inActive ? '#9fb4ff' : '#5a6480');
      const g = new THREE.Group(); g.position.copy(p);
      const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: inActive ? (watched ? 0.95 : 0.6) : 0.15, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.raycast = noop;
      const core = star(color, watched ? 1.5 : 0.9, inActive ? 1 : 0.25);
      const pool = groundGlow(watched ? '#f0b429' : colorOfWork(w), 1.4, inActive ? (watched ? 0.7 : 0.35) : 0.08); pool.position.y = 0.01;
      const body = pickBody(0.6);
      body.userData = { id: w.id, tip: `<b>${w.emoji} ${w.title}</b> · ${w.release.slice(0, 4)}<br><small>${watched ? '✔ 已看' : (w.upcoming ? '⏳ 未上映' : '未看')} · ${w.threads.map(t => MARVEL.THREADS[t].name).join(' / ')}</small>` };
      const out = p.clone().normalize();
      const lab = makeLabel([{ text: `${w.emoji} ${shortTitle(w)}`, size: 19, weight: 700, color: watched ? '#f0b429' : '#e8ecf4' }], { worldPerPx: 0.0105, opacity: inActive ? 0.92 : 0.2, bg: 'rgba(7,9,19,0.55)', pad: 6 });
      lab.position.copy(out.clone().multiplyScalar(1.15)).setY(0.05);
      g.add(ring, core, pool, body, lab); scene.add(g);
      ctx.pickables.push(body);
      if (orderMap[w.id]) {
        const tc = MARVEL.THREADS[activeThread].color;
        const badge = badgeSprite(orderMap[w.id], tc); badge.position.set(0, 2.0, 0); g.add(badge);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.4, 6), new THREE.MeshBasicMaterial({ color: tc, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
        stem.position.y = 0.75; stem.raycast = noop; g.add(stem);
      }
      if (isNext) {
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.5, 7, 20, 1, true), new THREE.MeshBasicMaterial({ map: gradientTex([[0, 'rgba(240,180,41,0)'], [1, 'rgba(240,180,41,0.7)']]), transparent: true, opacity: 0.9, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
        beam.position.y = 3.5; beam.raycast = noop; g.add(beam);
        const pulse = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.6, 40), new THREE.MeshBasicMaterial({ color: 0xf0b429, transparent: true, opacity: 0.8, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
        pulse.rotation.x = -Math.PI / 2; pulse.position.y = 0.03; pulse.raycast = noop; g.add(pulse);
        const tag = makeLabel([{ text: '▼ 下一站', size: 24, color: '#f0b429', weight: 900 }], { bg: 'rgba(7,9,19,0.8)', border: 'rgba(240,180,41,0.6)', worldPerPx: 0.013 });
        tag.position.y = 7.6; g.add(tag);
        stationObjs.push({ g, core, pulse });
      } else stationObjs.push({ g, core });
    });

    ctx.onClick = obj => { if (MARVEL.ui) MARVEL.ui.openDetail(obj.userData.id); };
    ctx.onFrame = (dt, t) => {
      stationObjs.forEach(s => {
        const hot = ctx.hovered && ctx.hovered.parent === s.g;
        const sc = s.core.userData.base || (s.core.userData.base = s.core.scale.x);
        const tg = sc * (hot ? 1.7 : 1 + Math.sin(t * 2 + s.g.position.x) * 0.05);
        s.core.scale.x += (tg - s.core.scale.x) * 0.15; s.core.scale.y = s.core.scale.x;
        if (s.pulse) { const ps = 1 + (t * 0.8 % 1) * 2.2; s.pulse.scale.set(ps, ps, 1); s.pulse.material.opacity = 0.8 * (1 - (t * 0.8 % 1)); }
      });
      if (activePath) comets.forEach(c => {
        const at = u => activePath.getPointAt(Math.max(0.001, Math.min(0.999, u))) || c.head.position;
        const u = (t * 0.045 + c.head.userData.offset) % 1;
        const hp = at(u); c.head.position.set(hp.x, hp.y + 0.05, hp.z);
        c.tail.forEach((s, j) => { const v = (u - (j + 1) * 0.006 + 1) % 1; s.position.copy(at(v)); });
      });
    };

    const pb = ctx.portrait ? 1.55 : 1;
    ctx.cam = new Orbit(camera, ctx.canvas, { target: [0, 0, 0], yaw: 0.6, pitch: ctx.portrait ? 1.15 : 0.98, dist: 38 * pb, minPitch: 0.6, maxPitch: 1.35, minDist: 16, maxDist: 56 * pb, idleRotate: 0.025, sway: 0.02 });
  }

  /* ========================================================================
     3) 时光之河(时间线)
     ======================================================================== */
  function mountCorridor(ctx) {
    const { scene, camera } = ctx;
    backdrop(scene, [[0, '#0c0f2a'], [0.55, '#07091b'], [1, '#04050c']]);
    lights(scene, 1.0);
    scene.fog = new THREE.FogExp2(0x080a1c, 0.016);
    scene.add(dust(1600, 170, 9, 0.13, 0.4));

    const works = MARVEL.WORKS.slice().sort((a, b) => a.release.localeCompare(b.release));
    const n = works.length, SLOT = 3.6, L = (n + 2) * SLOT;
    const wps = []; for (let z = 0; z <= L + 20; z += 22) wps.push(new THREE.Vector3(Math.sin(z / 44) * 7.5, 0, -z));
    const river = new THREE.CatmullRomCurve3(wps, false, 'centripetal');
    const tOf = i => (i + 1.5) / (n + 3);
    const up = new THREE.Vector3(0, 1, 0);
    const frame = t => { t = Math.max(0.002, Math.min(0.994, t)); const p = river.getPointAt(t), T = river.getTangentAt(t).normalize(), N = new THREE.Vector3().crossVectors(T, up).normalize(); return { p, T, N }; };
    const firstIdx = pred => { const i = works.findIndex(pred); return i < 0 ? n : i; };
    const colorAt = works.map(w => new THREE.Color(colorOfWork(w)));
    const colorNear = t => colorAt[Math.max(0, Math.min(n - 1, Math.round(t * (n + 3) - 1.5)))];

    /* ---------- 地面 + 发光河面缎带 ---------- */
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, L + 90), new THREE.MeshStandardMaterial({ color: 0x090c1c, roughness: 1, metalness: 0 }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.03, -L / 2); ground.raycast = noop; scene.add(ground);
    const ribbon = (width, stops, opacity, y) => {
      const SEG = 420, posArr = [], uvArr = [], idx = [];
      for (let i = 0; i <= SEG; i++) {
        const t = i / SEG, { p, N } = frame(Math.min(0.9999, t));
        const l = p.clone().add(N.clone().multiplyScalar(-width / 2)), r = p.clone().add(N.clone().multiplyScalar(width / 2));
        posArr.push(l.x, y, l.z, r.x, y, r.z); uvArr.push(t, 0, t, 1);
        if (i < SEG) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvArr, 2));
      geo.setIndex(idx);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: gradientTex(stops), transparent: true, opacity, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.raycast = noop; return m;
    };
    scene.add(ribbon(4.2, [[0, 'rgba(90,110,255,0)'], [0.5, 'rgba(150,170,255,0.75)'], [1, 'rgba(90,110,255,0)']], 0.45, 0.02));
    scene.add(ribbon(1.2, [[0, 'rgba(200,215,255,0)'], [0.5, 'rgba(230,238,255,1)'], [1, 'rgba(200,215,255,0)']], 0.6, 0.03));
    scene.add(ribbon(11, [[0, 'rgba(60,70,160,0)'], [0.5, 'rgba(70,85,190,0.35)'], [1, 'rgba(60,70,160,0)']], 0.25, 0.01));

    /* ---------- 时光隧道:沿河道的光拱 ---------- */
    const arcs = [];
    for (let d = 6; d < L - 2; d += 5.5) {
      const t = d / L;
      const { p, T } = frame(t);
      const col = colorNear(t);
      const g = new THREE.Group(); g.position.copy(p); g.lookAt(p.clone().sub(T));
      const arc = new THREE.Mesh(new THREE.TorusGeometry(7.2, 0.03, 8, 72, Math.PI), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false }));
      arc.raycast = noop; g.add(arc); scene.add(g); arcs.push({ arc, t });
    }

    /* ---------- 流向未来的光粒子 ---------- */
    const PN = 420, pGeo = new THREE.BufferGeometry(), pPos = new Float32Array(PN * 3), pT = new Float32Array(PN), pOff = new Float32Array(PN * 2);
    for (let i = 0; i < PN; i++) { pT[i] = Math.random(); pOff[i * 2] = (Math.random() - 0.5) * 3.2; pOff[i * 2 + 1] = 0.15 + Math.random() * 1.6; }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const flow = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xcfd8ff, size: 0.16, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, map: radialTex('#ffffff', 0.2) }));
    flow.raycast = noop; scene.add(flow);
    const updateFlow = dt => {
      for (let i = 0; i < PN; i++) {
        pT[i] += dt * 0.012; if (pT[i] > 0.994) pT[i] -= 0.992;
        const { p, N } = frame(pT[i]);
        pPos[i * 3] = p.x + N.x * pOff[i * 2]; pPos[i * 3 + 1] = pOff[i * 2 + 1]; pPos[i * 3 + 2] = p.z + N.z * pOff[i * 2];
      }
      pGeo.attributes.position.needsUpdate = true;
    };
    updateFlow(0);
    // 低空薄雾
    for (let d = 10; d < L; d += 24) { const { p } = frame(d / L); const m = glow('#6a7ae0', 16, 0.05); m.position.copy(p).setY(0.8); scene.add(m); }

    /* ---------- 里程碑:阶段之门 / 今日之门 / 年份 ---------- */
    const gate = (t, color, text, big) => {
      const { p, T } = frame(t);
      const g = new THREE.Group(); g.position.copy(p); g.lookAt(p.clone().sub(T));
      const arch = new THREE.Mesh(new THREE.TorusGeometry(big ? 5.4 : 4.6, big ? 0.12 : 0.07, 10, 72, Math.PI), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: big ? 0.95 : 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
      arch.raycast = noop; g.add(arch);
      const archGlow = new THREE.Mesh(new THREE.TorusGeometry(big ? 5.4 : 4.6, big ? 0.4 : 0.25, 10, 72, Math.PI), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false }));
      archGlow.raycast = noop; g.add(archGlow);
      const lab = makeLabel([{ text, size: big ? 30 : 24, color, weight: 900, font: DISPLAY_FONT }], { worldPerPx: big ? 0.016 : 0.012, opacity: 0.95, bg: 'rgba(5,7,16,0.6)' });
      lab.position.y = (big ? 5.4 : 4.6) + 1.0; g.add(lab);
      scene.add(g);
      const pool = groundGlow(color, big ? 5.5 : 3.4, big ? 0.45 : 0.22); pool.position.copy(p).setY(0.015); scene.add(pool);
    };
    for (let y = 2001; y <= 2028; y++) {
      const i = firstIdx(w => w.release >= `${y}-01-01`); if (i >= n) break;
      const { p, N } = frame((i + 1) / (n + 3));
      const lab = makeLabel([{ text: String(y), size: 30, color: '#aab4d8', weight: 400, font: DISPLAY_FONT }], { worldPerPx: 0.014, opacity: 0.75 });
      lab.position.copy(p).add(N.clone().multiplyScalar(-6.4)).setY(0.45); scene.add(lab);
    }
    [1, 2, 3, 4, 5, 6].forEach(ph => { const i = firstIdx(w => w.phase === ph); if (i < n) gate((i + 1.1) / (n + 3), MARVEL.PHASES[ph].color, `${MARVEL.PHASES[ph].en} · ${MARVEL.PHASES[ph].name}`, false); });
    const todayI = firstIdx(w => w.release > S().today());
    const todayT = (todayI + 1) / (n + 3);
    gate(todayT, '#f0b429', `TODAY · ${S().today().replace(/-/g, '.')}`, true);

    /* ---------- 海报立牌 ---------- */
    const cardGeo = new THREE.PlaneGeometry(1.7, 2.55), frameGeo = new THREE.PlaneGeometry(1.84, 2.69);
    const cards = [];
    works.forEach((w, i) => {
      const t = tOf(i);
      const { p, T, N } = frame(t);
      const side = i % 2 ? 1 : -1;
      const off = 2.8 + ((i * 7) % 3) * 0.5;
      const watched = S().isWatched(w.id);
      const colHex = colorOfWork(w), col = new THREE.Color(colHex);
      const g = new THREE.Group();
      g.position.copy(p).add(N.clone().multiplyScalar(side * off)).setY(1.5);
      g.lookAt(g.position.clone().sub(T)); g.rotateY(side * -0.38);
      const baseQ = g.quaternion.clone(), baseY = g.position.y;
      const fr = new THREE.Mesh(frameGeo, new THREE.MeshBasicMaterial({ color: watched ? 0xf0b429 : col, transparent: true, opacity: w.upcoming ? 0.35 : 0.9 })); fr.position.z = -0.02; fr.raycast = noop; g.add(fr);
      const mat = new THREE.MeshBasicMaterial({ map: placeholderPoster(w, colHex), transparent: true, opacity: w.upcoming ? 0.55 : 1 });
      const card = new THREE.Mesh(cardGeo, mat);
      card.userData = { id: w.id, g, tip: `<b>${w.emoji} ${w.title}</b><br><small>${w.release} · ${watched ? '✔ 已看' : (w.upcoming ? '⏳ 未上映' : '未看')} · 点击查看详情</small>` };
      g.add(card); ctx.pickables.push(card);
      const url = MARVEL.POSTERS && MARVEL.POSTERS[w.id];
      if (url) loadPoster(url).then(tex => { if (tex) { mat.map = tex; mat.needsUpdate = true; } });
      const halo = glow(watched ? '#f0b429' : colHex, 4.2, watched ? 0.42 : 0); halo.position.z = -0.1; g.add(halo);
      const lab = makeLabel([{ text: `${watched ? '✔ ' : ''}${shortTitle(w)}`, size: 20, weight: 700, color: watched ? '#f0b429' : '#eef1f8' }, { text: w.release.slice(0, 7).replace('-', '.'), size: 14, color: '#a3acc2', weight: 500 }], { worldPerPx: 0.011, bg: 'rgba(5,7,16,0.6)', pad: 7 });
      lab.position.set(0, -1.8, 0.05); g.add(lab);
      const pool = groundGlow(watched ? '#f0b429' : colHex, 1.7, watched ? 0.45 : 0.25); pool.position.copy(g.position).setY(0.02); scene.add(pool);
      scene.add(g);
      cards.push({ card, g, baseQ, baseY, halo, lab, fr, watched, labScale: lab.scale.clone() });
    });

    /* ---------- 河道相机 ---------- */
    const startT = tOf(firstIdx(w => w.release >= '2008-01-01')) - 0.012;
    const rc = { t: startT, tT: startT, yaw: 0, yawT: 0, pitch: 0, pitchT: 0, moved: 0, drag: null };
    const onDown = e => { rc.drag = { x: e.clientX, y: e.clientY }; rc.moved = 0; ctx.canvas.setPointerCapture(e.pointerId); };
    const onMove = e => {
      if (!rc.drag) return;
      const dx = e.clientX - rc.drag.x, dy = e.clientY - rc.drag.y; rc.drag.x = e.clientX; rc.drag.y = e.clientY; rc.moved += Math.abs(dx) + Math.abs(dy);
      if (e.pointerType === 'touch') {
        // 触屏:上滑前进 / 下滑后退,左右滑微调视角
        rc.tT = Math.max(0.005, Math.min(0.985, rc.tT - dy * 0.00022));
        rc.yawT = Math.max(-0.6, Math.min(0.6, rc.yawT - dx * 0.002));
        return;
      }
      rc.yawT = Math.max(-0.7, Math.min(0.7, rc.yawT - dx * 0.003)); rc.pitchT = Math.max(-0.25, Math.min(0.35, rc.pitchT + dy * 0.003));
    };
    const onUp = () => { rc.drag = null; };
    // 滚轮向上(手指向前推)= 向未来前进
    const onWheel = e => { e.preventDefault(); rc.tT = Math.max(0.005, Math.min(0.985, rc.tT - Math.sign(e.deltaY) * Math.min(1, Math.abs(e.deltaY) / 60) * 0.55 / (n + 3))); };
    ctx.canvas.addEventListener('pointerdown', onDown); ctx.canvas.addEventListener('pointermove', onMove); ctx.canvas.addEventListener('pointerup', onUp); ctx.canvas.addEventListener('wheel', onWheel, { passive: false });
    ctx.disposers.push(() => { ctx.canvas.removeEventListener('pointerdown', onDown); ctx.canvas.removeEventListener('pointermove', onMove); ctx.canvas.removeEventListener('pointerup', onUp); ctx.canvas.removeEventListener('wheel', onWheel); });

    const fogTarget = new THREE.Color(0x080a1c), tmpQ = new THREE.Quaternion(), tmpO = new THREE.Object3D();
    ctx.cam = {
      moved: 0,
      tick(dt) {
        const k = Math.min(1, dt * 3.2);
        rc.t += (rc.tT - rc.t) * k; rc.yaw += (rc.yawT - rc.yaw) * Math.min(1, dt * 5); rc.pitch += (rc.pitchT - rc.pitch) * Math.min(1, dt * 5);
        this.moved = rc.moved;
        const { p, T, N } = frame(Math.max(0.001, Math.min(0.999, rc.t)));
        const ahead = river.getPointAt(Math.min(0.994, rc.t + 0.028));
        const back = ctx.portrait ? 10 : 7.5, high = ctx.portrait ? 4.4 : 3.4;
        const eye = p.clone().sub(T.clone().multiplyScalar(back)).add(N.clone().multiplyScalar(Math.sin(ctx.t * 0.2) * 0.8)).setY(high + Math.sin(ctx.t * 0.5) * 0.08);
        camera.position.lerp(eye, Math.min(1, dt * 4));
        const look = ahead.clone().setY(1.3);
        const rot = new THREE.Vector3().subVectors(look, camera.position).applyAxisAngle(up, rc.yaw);
        rot.y += rc.pitch * rot.length() * 0.5;
        camera.lookAt(camera.position.clone().add(rot));
        fogTarget.copy(colorNear(rc.t)).multiplyScalar(0.14).lerp(new THREE.Color(0x080a1c), 0.5);
        scene.fog.color.lerp(fogTarget, Math.min(1, dt * 1.5));
        ctx.renderer.setClearColor(scene.fog.color);
      },
      dispose: noop,
      reset() { rc.tT = startT; rc.yawT = 0; rc.pitchT = 0; },
      jumpToday() { rc.tT = todayT - 0.012; },
    };
    ctx.onClick = obj => { if (MARVEL.ui) MARVEL.ui.openDetail(obj.userData.id); };
    ctx.onFrame = (dt, t) => {
      updateFlow(dt);
      arcs.forEach((a, i) => { a.arc.material.opacity = 0.1 + Math.sin(t * 1.2 + i * 0.6) * 0.05; });
      const k = Math.min(1, dt * 7);
      cards.forEach(c => {
        const hot = ctx.hovered === c.card;
        // 升起 + 转向镜头 + 发光
        const ty = c.baseY + (hot ? 0.45 : 0);
        c.g.position.y += (ty - c.g.position.y) * k;
        if (hot) { tmpO.position.copy(c.g.position); tmpO.lookAt(camera.position.x, c.g.position.y, camera.position.z); tmpQ.copy(tmpO.quaternion); } else tmpQ.copy(c.baseQ);
        c.g.quaternion.slerp(tmpQ, k);
        const sc = hot ? 1.1 : 1; c.g.scale.x += (sc - c.g.scale.x) * k; c.g.scale.y = c.g.scale.x;
        lerpOpacity(c.halo.material, hot ? 0.9 : (c.watched ? 0.42 : 0), k);
        const hs = hot ? 5.2 + Math.sin(t * 4) * 0.3 : 4.2; c.halo.scale.x += (hs - c.halo.scale.x) * k; c.halo.scale.y = c.halo.scale.x;
        lerpOpacity(c.fr.material, hot ? 1 : (c.watched ? 0.9 : 0.9), k);
        const ls = hot ? 1.18 : 1; c.lab.scale.x += (c.labScale.x * ls - c.lab.scale.x) * k; c.lab.scale.y += (c.labScale.y * ls - c.lab.scale.y) * k;
      });
    };
  }

  /* ========================================================================
     挂载 / 卸载
     ======================================================================== */
  const MOUNTERS = { characters: mountCharacters, map: mountMetro, corridor: mountCorridor };

  async function mount(kind, host, opts) {
    unmount();
    if (!host) return;
    const loading = document.createElement('div'); loading.className = 'three-loading'; loading.textContent = '🪐 正在加载高阶视图…'; host.appendChild(loading);
    const token = (mount._token = (mount._token || 0) + 1);
    try { await loadThree(); } catch (e) { loading.textContent = `⚠️ ${e.message}`; return; }
    if (token !== mount._token || !host.isConnected) return;
    try {
      const ctx = createStage(host, kind);
      MOUNTERS[kind](ctx, opts || {});
      ctx.start();
      cur = ctx;
    } catch (e) { console.error(e); const err = document.createElement('div'); err.className = 'three-loading'; err.textContent = `⚠️ 高阶视图渲染失败:${e.message}`; host.appendChild(err); }
  }
  function unmount() { if (cur) { disposeStage(cur); cur = null; } }
  function resetCamera() { if (cur && cur.cam && cur.cam.reset) cur.cam.reset(); }
  function jumpToday() { if (cur && cur.cam && cur.cam.jumpToday) cur.cam.jumpToday(); }

  MARVEL.three = { mount, unmount, resetCamera, jumpToday, get active() { return cur; } };
})();
