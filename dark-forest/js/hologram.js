/* =========================================================
   HOLOGRAM — a tiny dependency-free 3D wireframe renderer
   Used by chapters 1, 4 and 5: drag to orbit, wheel to zoom.
   ========================================================= */
const Hologram = (() => {
  const TAU = Math.PI * 2;
  const C = {
    cyan: "111,217,255",
    red: "255,93,93",
    gold: "242,200,121",
    violet: "167,139,250",
    white: "233,241,250"
  };
  const state = {};
  const cams = {};
  const scenes = [];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const defaultCam = {
    battle: { yaw: -0.55, pitch: 0.28, dist: 4.3 },
    plans: { yaw: 0.55, pitch: 0.34, dist: 4.1 },
    mass: { yaw: 0.35, pitch: 0.40, dist: 4.7 }
  };

  function project(p, cam, W, H) {
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
    const x1 = p[0] * cy - p[2] * sy;
    const z1 = p[0] * sy + p[2] * cy;
    const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const y1 = p[1] * cp - z1 * sp;
    const z2 = p[1] * sp + z1 * cp;
    const zc = z2 + cam.dist;
    if (zc < 0.25) return null;
    const f = Math.min(W, H) * 1.5;
    return { x: W / 2 + (x1 * f) / zc, y: H / 2 - (y1 * f) / zc, z: zc };
  }

  function strokeRings(ctx, rings, cam, W, H, color, alpha, width) {
    ctx.strokeStyle = `rgba(${color},${alpha})`;
    ctx.lineWidth = width || 1;
    for (const pts of rings) {
      ctx.beginPath();
      let started = false;
      for (const p of pts) {
        const q = project(p, cam, W, H);
        if (!q) { started = false; continue; }
        if (!started) { ctx.moveTo(q.x, q.y); started = true; }
        else ctx.lineTo(q.x, q.y);
      }
      ctx.stroke();
    }
  }

  function line(ctx, a, b, cam, W, H, color, alpha, width) {
    const p = project(a, cam, W, H);
    const q = project(b, cam, W, H);
    if (!p || !q) return;
    ctx.strokeStyle = `rgba(${color},${alpha})`;
    ctx.lineWidth = width || 1;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
  }

  function node(ctx, p, cam, W, H, color, size, alpha, label, labelColor) {
    const q = project(p, cam, W, H);
    if (!q) return null;
    const r = Math.max(1.8, size * (4 / q.z));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = 16;
    ctx.shadowColor = `rgba(${color},.85)`;
    ctx.fillStyle = `rgba(${color},1)`;
    ctx.beginPath();
    ctx.arc(q.x, q.y, r, 0, TAU);
    ctx.fill();
    ctx.restore();
    if (label) {
      ctx.save();
      ctx.font = "10px 'Microsoft YaHei', sans-serif";
      ctx.fillStyle = `rgba(${labelColor || color},.78)`;
      ctx.fillText(label, q.x + 9, q.y + 3);
      ctx.restore();
    }
    return q;
  }

  function bezier(a, b, bulge, steps) {
    const mid = [
      (a[0] + b[0]) / 2,
      (a[1] + b[1]) / 2 + bulge,
      (a[2] + b[2]) / 2
    ];
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const u = i / steps, v = 1 - u;
      pts.push([
        v * v * a[0] + 2 * v * u * mid[0] + u * u * b[0],
        v * v * a[1] + 2 * v * u * mid[1] + u * u * b[1],
        v * v * a[2] + 2 * v * u * mid[2] + u * u * b[2]
      ]);
    }
    return { pts, mid };
  }

  function pointOn(a, b, mid, u) {
    const v = 1 - u;
    return [
      v * v * a[0] + 2 * v * u * mid[0] + u * u * b[0],
      v * v * a[1] + 2 * v * u * mid[1] + u * u * b[1],
      v * v * a[2] + 2 * v * u * mid[2] + u * u * b[2]
    ];
  }

  /* ---------------- chapter 1: tactical sphere ---------------- */
  function battle(ctx, st, cam, W, H, t) {
    const R = 1.16;
    const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.min(W, H) * 0.52);
    glow.addColorStop(0, "rgba(111,217,255,.055)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    const rings = [];
    for (let lat = -60; lat <= 60; lat += 30) {
      const la = (lat * Math.PI) / 180;
      const pts = [];
      for (let i = 0; i <= 48; i++) {
        const lo = (i / 48) * TAU;
        pts.push([Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)]);
      }
      rings.push(pts);
    }
    for (let lon = 0; lon < 180; lon += 30) {
      const lo = (lon * Math.PI) / 180;
      const pts = [];
      for (let i = 0; i <= 48; i++) {
        const la = -Math.PI / 2 + (i / 48) * Math.PI;
        pts.push([Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)]);
      }
      rings.push(pts);
    }
    strokeRings(ctx, rings, cam, W, H, C.cyan, 0.11, 1);
    const outer = [];
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * TAU;
      outer.push([Math.cos(a) * 1.28, 0, Math.sin(a) * 1.28]);
    }
    strokeRings(ctx, [outer], cam, W, H, C.cyan, 0.08, 1);

    const ang = t * 0.7;
    const sweep = [];
    for (let i = 0; i <= 20; i++) {
      const a = ang - 0.6 + (i / 20) * 0.6;
      sweep.push([Math.cos(a) * R, 0, Math.sin(a) * R]);
    }
    strokeRings(ctx, [sweep], cam, W, H, C.cyan, 0.28, 1);
    line(ctx, [0, 0, 0], [Math.cos(ang) * R, 0, Math.sin(ang) * R], cam, W, H, C.cyan, 0.32, 1);

    const ships = [
      { n: "你", p: [0.05, 0.02, 1.12], you: true },
      { n: "终极规律号", p: [-0.84, 0.2, 0.52] },
      { n: "企业号", p: [0.78, -0.34, 0.52] },
      { n: "深空号", p: [0.15, 0.84, -0.62] },
      { n: "自然选择号", p: [-0.56, -0.62, -0.55] }
    ];
    const list = st.round >= 3 ? ships.filter(s => s.n !== "深空号") : ships;

    for (let i = 1; i < list.length; i++) {
      ctx.setLineDash([2, 7]);
      line(ctx, list[0].p, list[i].p, cam, W, H, C.cyan, 0.15, 1);
      ctx.setLineDash([]);
    }

    if (st.last) {
      const target = list[1].p;
      const arcs = [];
      if (st.last.you === "fire") arcs.push([list[0].p, target, C.cyan]);
      if (st.last.them === "fire") arcs.push([target, list[0].p, C.red]);
      for (const [a, b, col] of arcs) {
        const { pts, mid } = bezier(a, b, 0.45, 28);
        strokeRings(ctx, [pts], cam, W, H, col, 0.75, 1.8);
        const u = (t * 0.85) % 1;
        node(ctx, pointOn(a, b, mid, u), cam, W, H, col, 2.2, 0.95);
      }
    }

    node(ctx, [0, 0, 0], cam, W, H, C.white, 1.6, 0.6);
    for (const s of list) {
      node(ctx, s.p, cam, W, H, s.you ? C.cyan : C.red, s.you ? 4.5 : 2.6, s.you ? 1 : 0.8, s.n, s.you ? C.cyan : C.red);
    }
    const q = project([0, 0.02, 1.12], cam, W, H);
    if (q) {
      ctx.save();
      ctx.font = "9px 'Microsoft YaHei', sans-serif";
      ctx.fillStyle = `rgba(${C.cyan},.45)`;
      ctx.fillText("深海状态", q.x + 9, q.y + 16);
      ctx.restore();
    }
  }

  /* ---------------- chapter 4: plan pyramid ---------------- */
  function plans(ctx, st, cam, W, H, t) {
    const pred = st.prediction || [1 / 3, 1 / 3, 1 / 3];
    const labels = ["掩体", "黑域", "光速"];
    const nodes = [0, 1, 2].map(i => {
      const a = -Math.PI / 2 + (i * TAU) / 3;
      return [Math.cos(a) * 1.05, -0.12, Math.sin(a) * 1.05];
    });
    const apex = [0, 0.72, 0];

    strokeRings(ctx, [[nodes[0], nodes[1], nodes[2], nodes[0]]], cam, W, H, C.violet, 0.10, 1);
    nodes.forEach((p, i) => {
      line(ctx, apex, p, cam, W, H, C.violet, 0.10 + pred[i] * 0.55, 1 + pred[i] * 3.2);
    });

    if (st.last) {
      const target = nodes[st.last.you];
      const { pts, mid } = bezier(apex, target, 0.3, 24);
      strokeRings(ctx, [pts], cam, W, H, C.red, 0.8, 1.8);
      const u = (t * 0.9) % 1;
      node(ctx, pointOn(apex, target, mid, u), cam, W, H, C.red, 2.2, 0.95);
    }

    nodes.forEach((p, i) => {
      node(ctx, p, cam, W, H, C.violet, 2.6 + pred[i] * 8, 0.9, labels[i], C.violet);
      const q = project(p, cam, W, H);
      if (q) {
        ctx.save();
        ctx.font = "8px Consolas, monospace";
        ctx.fillStyle = `rgba(${C.violet},.55)`;
        ctx.fillText(Math.round(pred[i] * 100) + "%", q.x + 9, q.y + 15);
        ctx.restore();
      }
    });
    node(ctx, apex, cam, W, H, C.white, 4.2, 0.95, "破壁人", C.white);

    if (st.last && st.last.counter) {
      const q = project(apex, cam, W, H);
      if (q) {
        ctx.save();
        ctx.font = "9px 'Microsoft YaHei', sans-serif";
        ctx.fillStyle = `rgba(${C.red},.85)`;
        ctx.fillText("对策 · " + st.last.counter, q.x - 26, q.y - 18);
        ctx.restore();
      }
    }
  }

  /* ---------------- chapter 5: mass torus ---------------- */
  function mass(ctx, st, cam, W, H, t) {
    const th = st.threshold || 34;
    const cum = st.cum || 0;
    const pct = Math.min(1, cum / th);
    const R = 1.08, r = 0.16;
    const rings = [];
    for (let v = 0; v < TAU; v += TAU / 8) {
      const pts = [];
      for (let i = 0; i <= 48; i++) {
        const u = (i / 48) * TAU;
        const rr = R + r * Math.cos(v);
        pts.push([rr * Math.cos(u), r * Math.sin(v), rr * Math.sin(u)]);
      }
      rings.push(pts);
    }
    for (let u = 0; u < TAU; u += TAU / 16) {
      const pts = [];
      for (let i = 0; i <= 16; i++) {
        const v = (i / 16) * TAU;
        const rr = R + r * Math.cos(v);
        pts.push([rr * Math.cos(u), r * Math.sin(v), rr * Math.sin(u)]);
      }
      rings.push(pts);
    }
    strokeRings(ctx, rings, cam, W, H, C.gold, 0.10, 1);

    const full = [], arc = [];
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * TAU;
      const p = [1.38 * Math.cos(a), 0.02, 1.38 * Math.sin(a)];
      full.push(p);
      if (i / 72 <= pct) arc.push(p);
    }
    strokeRings(ctx, [full], cam, W, H, C.gold, 0.12, 1);
    if (arc.length > 1) strokeRings(ctx, [arc], cam, W, H, C.gold, 0.85, 2.2);

    const pulse = 1 + Math.sin(t * 2.2) * 0.12;
    node(ctx, [0, 0, 0], cam, W, H, C.gold, 4.6 * pulse, 1);

    const n = 18 + Math.round(cum * 1.5);
    for (let i = 0; i < n; i++) {
      const a = i * 2.399 + t * 0.22;
      const rr = R + Math.sin(i * 1.7 + t * 0.7) * 0.13;
      const y = Math.cos(i * 2.1 + t * 0.55) * r;
      const q = project([rr * Math.cos(a), y, rr * Math.sin(a)], cam, W, H);
      if (!q) continue;
      const alpha = 0.22 + 0.3 * (0.5 + 0.5 * Math.sin(i * 3 + t * 1.8));
      ctx.fillStyle = `rgba(${C.gold},${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(q.x, q.y, Math.max(0.8, 2.4 / q.z), 0, TAU);
      ctx.fill();
    }

    const q = project([0, 0.66, 0], cam, W, H);
    if (q) {
      ctx.save();
      ctx.font = "600 18px Consolas, monospace";
      ctx.fillStyle = `rgba(${C.gold},.9)`;
      ctx.textAlign = "center";
      ctx.fillText(cum + " / " + th, q.x, q.y);
      ctx.restore();
    }

    if (pct >= 1) {
      const rr = 1.38 + Math.sin(t * 2.4) * 0.06;
      const halo = [];
      for (let i = 0; i <= 72; i++) {
        const a = (i / 72) * TAU;
        halo.push([rr * Math.cos(a), 0.02, rr * Math.sin(a)]);
      }
      strokeRings(ctx, [halo], cam, W, H, C.white, 0.35, 1.2);
    }
  }

  function draw(kind, st, ctx, W, H, cam, t) {
    if (kind === "battle") battle(ctx, st, cam, W, H, t);
    else if (kind === "plans") plans(ctx, st, cam, W, H, t);
    else if (kind === "mass") mass(ctx, st, cam, W, H, t);
  }

  function mount(canvas) {
    const kind = canvas.dataset.holo;
    if (!kind) return;
    const st = state[kind] || {};
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cam = cams[kind] || (cams[kind] = { ...defaultCam[kind] });
    let W = 0, H = 0, raf = 0, last = performance.now();
    let dragging = false, px = 0, py = 0;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const down = e => {
      dragging = true;
      px = e.clientX;
      py = e.clientY;
      canvas.classList.add("is-dragging");
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    };
    const move = e => {
      if (!dragging) return;
      const dx = e.clientX - px;
      const dy = e.clientY - py;
      px = e.clientX;
      py = e.clientY;
      cam.yaw += dx * 0.008;
      cam.pitch = clamp(cam.pitch + dy * 0.006, -1.15, 1.15);
    };
    const up = () => { dragging = false; canvas.classList.remove("is-dragging"); };
    const wheel = e => {
      e.preventDefault();
      cam.dist = clamp(cam.dist + e.deltaY * 0.0022, 2.5, 7.5);
    };
    const key = e => {
      const step = 0.13;
      if (e.key === "ArrowLeft") { cam.yaw -= step; e.preventDefault(); }
      else if (e.key === "ArrowRight") { cam.yaw += step; e.preventDefault(); }
      else if (e.key === "ArrowUp") { cam.pitch = clamp(cam.pitch - step, -1.15, 1.15); e.preventDefault(); }
      else if (e.key === "ArrowDown") { cam.pitch = clamp(cam.pitch + step, -1.15, 1.15); e.preventDefault(); }
    };
    const reset = () => Object.assign(cam, defaultCam[kind]);

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("wheel", wheel, { passive: false });
    canvas.addEventListener("keydown", key);
    canvas.addEventListener("dblclick", reset);

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas);
    else window.addEventListener("resize", resize);

    const frame = now => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!dragging && !reduce) cam.yaw += dt * 0.07;
      ctx.clearRect(0, 0, W, H);
      draw(kind, st, ctx, W, H, cam, reduce ? 0.6 : now / 1000);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    scenes.push({
      cleanup() {
        cancelAnimationFrame(raf);
        canvas.removeEventListener("pointerdown", down);
        canvas.removeEventListener("pointermove", move);
        canvas.removeEventListener("pointerup", up);
        canvas.removeEventListener("pointercancel", up);
        canvas.removeEventListener("wheel", wheel);
        canvas.removeEventListener("keydown", key);
        canvas.removeEventListener("dblclick", reset);
        if (ro) ro.disconnect();
        else window.removeEventListener("resize", resize);
      }
    });
  }

  return {
    setState(kind, st) { state[kind] = st; },
    stopAll() {
      scenes.forEach(s => s.cleanup());
      scenes.length = 0;
    },
    mountAll(root) {
      root.querySelectorAll("canvas[data-holo]").forEach(c => mount(c));
    },
    cam: cams
  };
})();
