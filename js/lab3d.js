/* ==========================================================================
   MARVEL 宇宙观影指挥中心 — 实验室:3D 无限宝石展示台(three.js,按需懒加载)
   ========================================================================== */

(function () {
  const S = () => MARVEL.store;
  let ctx = null; // 当前场景上下文,便于关闭时清理

  function loadThree() {
    if (window.THREE) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const sc = document.createElement('script');
      sc.src = 'vendor/three.min.js';
      sc.onload = resolve;
      sc.onerror = () => reject(new Error('three.js 加载失败(vendor/three.min.js)'));
      document.head.appendChild(sc);
    });
  }

  function glowTexture(color) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 2, 64, 64, 64);
    grad.addColorStop(0, color);
    grad.addColorStop(0.35, color + '88');
    grad.addColorStop(1, color + '00');
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    return tex;
  }

  function overlayHTML(stones) {
    const lit = stones.filter(s => s.lit).length;
    return `
      <canvas id="lab-canvas"></canvas>
      <div class="lab-top">
        <div>
          <div class="lab-title">INFINITY STONES · 3D 展示台 <span class="lab-tag">实验</span></div>
          <div class="lab-sub">拖拽旋转 · 悬停查看 · 点击宝石打开对应作品 · 已点亮 ${lit}/6</div>
        </div>
        <button class="modal-close" id="lab-close" style="position:static">✕</button>
      </div>
      <div class="lab-tip hidden" id="lab-tip"></div>
      <div class="lab-legend">
        ${stones.map(s => `<span class="lab-stone ${s.lit ? 'lit' : ''}" style="--c:${s.color}"><i></i>${s.name}<small>${s.src}</small></span>`).join('')}
      </div>
      ${lit === 6 ? '<div class="lab-complete">✦ 六颗宝石齐聚 · 命运已至 ✦</div>' : ''}`;
  }

  async function openStones() {
    if (ctx) return;
    const overlay = document.createElement('div');
    overlay.id = 'lab-overlay';
    overlay.innerHTML = '<div class="lab-loading">🪐 正在加载 3D 引擎…</div>';
    document.body.appendChild(overlay);

    try { await loadThree(); }
    catch (e) {
      overlay.innerHTML = `<div class="lab-loading">⚠️ ${e.message}<br><button class="btn btn-ghost btn-sm" id="lab-close" style="margin-top:12px">关闭</button></div>`;
      overlay.querySelector('#lab-close').onclick = close;
      ctx = { overlay };
      return;
    }

    const stones = S().stonesLit();
    overlay.innerHTML = overlayHTML(stones);
    const canvas = overlay.querySelector('#lab-canvas');
    const tip = overlay.querySelector('#lab-tip');
    overlay.querySelector('#lab-close').onclick = close;

    /* ---------- 场景 ---------- */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(0x05070c, 1);
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070c, 0.035);
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 3.2, 11.5);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0x6670a0, 0.35));
    const key = new THREE.DirectionalLight(0xffffff, 0.7);
    key.position.set(5, 8, 6);
    scene.add(key);

    // 星空
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(2400 * 3);
    for (let i = 0; i < starPos.length; i++) starPos[i] = (Math.random() - 0.5) * 90;
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x9fb0d8, size: 0.07, transparent: true, opacity: 0.8 }));
    scene.add(stars);

    // 展示台:双环
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x2a3346, metalness: 0.9, roughness: 0.3, emissive: 0x111827, emissiveIntensity: 0.6 });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.06, 12, 120), ringMat);
    ring1.rotation.x = Math.PI / 2; ring1.position.y = -1.4;
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.04, 12, 120), ringMat);
    ring2.rotation.x = Math.PI / 2; ring2.position.y = -1.55;
    scene.add(ring1, ring2);

    // 宝石
    const group = new THREE.Group();
    scene.add(group);
    const gems = [];
    const allLit = stones.every(s => s.lit);
    stones.forEach((s, i) => {
      const ang = (i / stones.length) * Math.PI * 2;
      const col = new THREE.Color(s.color);
      const geo = new THREE.IcosahedronGeometry(0.85, 1);
      const mat = new THREE.MeshStandardMaterial({
        color: s.lit ? col : 0x2a3244,
        emissive: s.lit ? col : 0x0a0d14,
        emissiveIntensity: s.lit ? 0.95 : 0.15,
        metalness: s.lit ? 0.25 : 0.6,
        roughness: s.lit ? 0.12 : 0.55,
        flatShading: true,
        transparent: !s.lit,
        opacity: s.lit ? 1 : 0.5,
      });
      const gem = new THREE.Mesh(geo, mat);
      gem.position.set(Math.cos(ang) * 4.0, 0, Math.sin(ang) * 4.0);
      gem.userData = { stone: s, baseY: 0, phase: Math.random() * Math.PI * 2, ang };
      group.add(gem);
      gems.push(gem);

      if (s.lit) {
        const light = new THREE.PointLight(col, 1.6, 9);
        gem.add(light);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(s.color), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.85 }));
        sprite.scale.set(3.6, 3.6, 1);
        gem.add(sprite);
        gem.userData.sprite = sprite;
      }
    });

    // 集齐六颗:中央金色能量核
    let core = null;
    if (allLit) {
      core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('#f0b429'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      core.scale.set(5, 5, 1);
      scene.add(core);
      scene.add(new THREE.PointLight(0xf0b429, 2.2, 14));
    }

    /* ---------- 交互 ---------- */
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(-9, -9);
    let drag = null, rotY = 0, rotVel = 0.0035, hovered = null;

    canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, moved: 0 }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      if (drag) {
        const dx = e.clientX - drag.x;
        drag.x = e.clientX; drag.moved += Math.abs(dx);
        rotY += dx * 0.008; rotVel = dx * 0.0006;
      }
      tip.style.left = `${e.clientX + 14}px`;
      tip.style.top = `${e.clientY + 14}px`;
    });
    canvas.addEventListener('pointerup', () => {
      if (drag && drag.moved < 5 && hovered) {
        const id = hovered.userData.stone.workId;
        close();
        if (MARVEL.ui && MARVEL.ui.openDetail) MARVEL.ui.openDetail(id);
      }
      drag = null;
    });

    function resize() {
      const w = overlay.clientWidth, h = overlay.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    let raf, t = 0;
    function animate() {
      raf = requestAnimationFrame(animate);
      t += 0.016;
      if (!drag) { rotVel *= 0.98; if (Math.abs(rotVel) < 0.0035) rotVel = 0.0035 * Math.sign(rotVel || 1); rotY += rotVel; }
      group.rotation.y = rotY;
      ring1.rotation.z = t * 0.15;
      ring2.rotation.z = -t * 0.25;
      stars.rotation.y = t * 0.01;
      gems.forEach(g => {
        g.position.y = Math.sin(t * 1.3 + g.userData.phase) * 0.28;
        g.rotation.x += 0.006; g.rotation.y += 0.009;
        const target = g === hovered ? 1.35 : 1;
        g.scale.lerp(new THREE.Vector3(target, target, target), 0.12);
        if (g.userData.sprite) g.userData.sprite.material.opacity = 0.7 + Math.sin(t * 2 + g.userData.phase) * 0.2;
      });
      if (core) { const s = 4.6 + Math.sin(t * 1.8) * 0.5; core.scale.set(s, s, 1); }

      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(gems, false)[0];
      const nowHover = hit ? hit.object : null;
      if (nowHover !== hovered) {
        hovered = nowHover;
        canvas.style.cursor = hovered ? 'pointer' : 'grab';
        if (hovered) {
          const s = hovered.userData.stone;
          tip.innerHTML = `<b style="color:${s.color}">${s.name}</b> · 《${MARVEL.byId[s.workId].title}》<br><small>${s.lit ? '✔ 已点亮 · 点击查看作品' : '未点亮 · 看完对应作品即可点亮'}</small>`;
          tip.classList.remove('hidden');
        } else tip.classList.add('hidden');
      }
      renderer.render(scene, camera);
    }
    animate();

    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);

    ctx = { overlay, renderer, raf, resize, onKey, scene };
  }

  function close() {
    if (!ctx) return;
    if (ctx.raf) cancelAnimationFrame(ctx.raf);
    if (ctx.resize) window.removeEventListener('resize', ctx.resize);
    if (ctx.onKey) document.removeEventListener('keydown', ctx.onKey);
    if (ctx.scene) ctx.scene.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
    });
    if (ctx.renderer) ctx.renderer.dispose();
    ctx.overlay.remove();
    ctx = null;
  }

  MARVEL.lab = { openStones, close };
})();
