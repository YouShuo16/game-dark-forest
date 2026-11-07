/* =========================================================
   CORE — utilities, sound, starfield, UI primitives
   ========================================================= */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rnd(a, b + 1));
const pickOne = arr => arr[Math.floor(Math.random() * arr.length)];
const signed = n => (n > 0 ? "+" : "") + n;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pct = (a, b) => Math.round((100 * a) / b);
const round1 = n => Math.round(n * 10) / 10;

const store = {
  key: "darkforest.save.v1",
  read() {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  },
  write(v) {
    try { localStorage.setItem(this.key, JSON.stringify(v)); } catch (e) { /* file:// may block */ }
  },
  clear() {
    try { localStorage.removeItem(this.key); } catch (e) { /* ignore */ }
  }
};

/* ---------------- sound ---------------- */
const Sound = {
  ctx: null,
  music: 0.85,
  sfx: 1,
  muted: false,
  master: null,
  musicBus: null,
  sfxBus: null,
  droneGain: null,

  load() {
    try {
      const raw = localStorage.getItem("darkforest.audio");
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.music === "number") this.music = clamp(p.music, 0, 1);
        if (typeof p.sfx === "number") this.sfx = clamp(p.sfx, 0, 1);
        if (typeof p.muted === "boolean") this.muted = p.muted;
      } else if (localStorage.getItem("darkforest.sound") === "0") {
        this.muted = true;
      }
    } catch (e) { /* ignore */ }
    this.updateButton();
  },

  save() {
    try {
      localStorage.setItem("darkforest.audio", JSON.stringify({
        music: this.music, sfx: this.sfx, muted: this.muted
      }));
    } catch (e) { /* ignore */ }
  },

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);

      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0;
      this.musicBus.connect(this.master);

      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0;
      this.sfxBus.connect(this.master);

      this.buildDrone();
      this.apply(0.5);
    } catch (e) { this.ctx = null; }
  },

  buildDrone() {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.value = 0.08;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 360;
    filter.Q.value = 1.1;
    [48, 72.5, 96.2, 193].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 2 ? "triangle" : "sine";
      o.frequency.value = f;
      const og = ctx.createGain();
      og.gain.value = i === 0 ? 0.5 : i === 1 ? 0.28 : i === 2 ? 0.14 : 0.055;
      o.connect(og).connect(filter);
      o.start();
    });
    filter.connect(g).connect(this.musicBus);
    this.droneGain = g;
  },

  apply(sec = 0.08) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const targets = [
      [this.musicBus, this.muted ? 0 : this.music],
      [this.sfxBus, this.muted ? 0 : this.sfx]
    ];
    targets.forEach(([bus, v]) => {
      if (!bus) return;
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(bus.gain.value, t);
      bus.gain.linearRampToValueAtTime(v, t + sec);
    });
  },

  setMusic(v) {
    this.music = clamp(v, 0, 1);
    this.apply();
    this.save();
    SoundPanel.sync();
  },

  setSfx(v) {
    this.sfx = clamp(v, 0, 1);
    this.apply();
    this.save();
    SoundPanel.sync();
  },

  setMuted(v) {
    this.muted = !!v;
    this.apply();
    this.save();
    this.updateButton();
    SoundPanel.sync();
  },

  updateButton() {
    const btn = $("#sound-toggle");
    if (!btn) return;
    btn.classList.toggle("is-on", !this.muted);
    btn.classList.toggle("is-off", this.muted);
    const label = btn.querySelector(".sound-label");
    if (label) label.textContent = this.muted ? "静音" : "声音";
  },

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  },

  tone(freq = 440, dur = 0.08, type = "sine", gain = 0.05, slide = 0) {
    if (this.muted || this.sfx < 0.002) return;
    this.init();
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(this.sfxBus);
    o.start(t0); o.stop(t0 + dur + 0.02);
  },

  click() { this.tone(620, 0.045, "triangle", 0.05); },
  hover() { this.tone(880, 0.02, "sine", 0.016); },
  confirm() { this.tone(392, 0.12, "sine", 0.065); setTimeout(() => this.tone(587, 0.16, "sine", 0.05), 90); },
  deny() { this.tone(160, 0.18, "sawtooth", 0.06, -60); },
  alarm() { this.tone(110, 0.5, "sawtooth", 0.07, -40); setTimeout(() => this.tone(98, 0.6, "sawtooth", 0.055, -30), 220); },
  press() {
    this.tone(60, 1.4, "sine", 0.2, -30);
    this.tone(90, 1.2, "triangle", 0.1, -45);
  }
};

/* ---------------- sound settings panel ---------------- */
const SoundPanel = {
  el: null,
  isOpen: false,

  build() {
    const el = document.createElement("div");
    el.className = "sound-panel";
    el.id = "sound-panel";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "声音设置");
    el.innerHTML = `
      <div class="sp-head">
        <span class="sp-title">声音设置</span>
        <button class="sp-close" type="button" data-sp-close aria-label="关闭声音设置">×</button>
      </div>
      <label class="sp-row">
        <span class="sp-k">音乐</span>
        <input type="range" min="0" max="100" step="1" value="85" data-audio="music" aria-label="音乐音量">
        <b class="sp-v" data-v="music">85</b>
      </label>
      <label class="sp-row">
        <span class="sp-k">音效</span>
        <input type="range" min="0" max="100" step="1" value="100" data-audio="sfx" aria-label="音效音量">
        <b class="sp-v" data-v="sfx">100</b>
      </label>
      <button class="sp-mute" type="button" data-sp-mute>全部静音</button>
      <p class="sp-note">音乐是环境底噪；音效是点击、警报与关键动作。</p>`;
    document.body.appendChild(el);
    this.el = el;

    el.addEventListener("input", e => {
      const key = e.target.dataset.audio;
      if (!key) return;
      const v = parseInt(e.target.value, 10) / 100;
      e.target.style.setProperty("--p", e.target.value + "%");
      if (key === "music") Sound.setMusic(v);
      else Sound.setSfx(v);
      this.sync();
    });

    el.addEventListener("click", e => {
      if (e.target.closest("[data-sp-close]")) { this.hide(); return; }
      if (e.target.closest("[data-sp-mute]")) Sound.setMuted(!Sound.muted);
    });

    this._outside = e => {
      if (!this.el.contains(e.target) && !e.target.closest("#sound-toggle")) this.hide();
    };
  },

  show() {
    if (this.isOpen) return;
    if (!this.el) this.build();
    this.sync();
    this.el.classList.add("is-open");
    this.isOpen = true;
    const btn = $("#sound-toggle");
    if (btn) btn.setAttribute("aria-expanded", "true");
    setTimeout(() => document.addEventListener("click", this._outside), 0);
    this.el.setAttribute("tabindex", "-1");
    this.el.focus({ preventScroll: true });
  },

  hide() {
    if (!this.el) return;
    this.el.classList.remove("is-open");
    this.isOpen = false;
    const btn = $("#sound-toggle");
    if (btn) btn.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", this._outside);
  },

  toggle() { this.isOpen ? this.hide() : this.show(); },

  sync() {
    if (!this.el) return;
    const m = Math.round(Sound.music * 100);
    const s = Math.round(Sound.sfx * 100);
    const mi = this.el.querySelector('[data-audio="music"]');
    const si = this.el.querySelector('[data-audio="sfx"]');
    const mv = this.el.querySelector('[data-v="music"]');
    const sv = this.el.querySelector('[data-v="sfx"]');
    if (mi) { mi.value = m; mi.style.setProperty("--p", m + "%"); }
    if (si) { si.value = s; si.style.setProperty("--p", s + "%"); }
    if (mv) mv.textContent = m;
    if (sv) sv.textContent = s;
    const mb = this.el.querySelector("[data-sp-mute]");
    if (mb) {
      mb.textContent = Sound.muted ? "取消静音" : "全部静音";
      mb.classList.toggle("is-muted", Sound.muted);
    }
  }
};

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && SoundPanel.isOpen) SoundPanel.hide();
});

/* ---------------- starfield ---------------- */
const Stars = {
  init() {
    const canvas = $("#starfield");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, stars = [], meteor = null, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let last = 0;

    function resize() {
      W = canvas.width = Math.floor(innerWidth * dpr);
      H = canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
      const n = Math.min(340, Math.round((innerWidth * innerHeight) / 7000));
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: (Math.random() * 1.05 + 0.25) * dpr,
        a: Math.random() * 0.55 + 0.12,
        tw: Math.random() * Math.PI * 2,
        sp: (Math.random() * 0.006 + 0.0015) * dpr
      }));
    }

    function frame(t) {
      const dt = Math.min(40, t - last || 16);
      last = t;
      ctx.clearRect(0, 0, W, H);
      for (const s of stars) {
        s.tw += 0.00035 * dt;
        s.x += s.sp * dt * 0.06;
        if (s.x > W + 2) s.x = -2;
        const alpha = s.a * (0.65 + 0.35 * Math.sin(s.tw));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(198,224,248,${alpha})`;
        ctx.fill();
        if (s.r > 1.35 * dpr) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(130,190,240,${alpha * 0.055})`;
          ctx.fill();
        }
      }
      if (!reduce) {
        if (!meteor && Math.random() < 0.0016) {
          meteor = { x: Math.random() * W * 0.7, y: Math.random() * H * 0.35, vx: 7 * dpr, vy: 2.6 * dpr, life: 1 };
        }
        if (meteor) {
          meteor.x += meteor.vx * dt * 0.08;
          meteor.y += meteor.vy * dt * 0.08;
          meteor.life -= 0.012 * dt * 0.06;
          const len = 90 * dpr;
          const grd = ctx.createLinearGradient(meteor.x, meteor.y, meteor.x - len, meteor.y - len * 0.37);
          grd.addColorStop(0, `rgba(210,240,255,${Math.max(0, meteor.life) * 0.8})`);
          grd.addColorStop(1, "rgba(210,240,255,0)");
          ctx.strokeStyle = grd;
          ctx.lineWidth = 1.4 * dpr;
          ctx.beginPath();
          ctx.moveTo(meteor.x, meteor.y);
          ctx.lineTo(meteor.x - len, meteor.y - len * 0.37);
          ctx.stroke();
          if (meteor.life <= 0 || meteor.x > W + 100) meteor = null;
        }
      }
      requestAnimationFrame(frame);
    }

    resize();
    addEventListener("resize", resize, { passive: true });
    requestAnimationFrame(frame);
  }
};

/* ---------------- toast ---------------- */
const Toast = {
  el: null,
  show(msg, ms = 2200) {
    if (!this.el) {
      this.el = document.createElement("div");
      this.el.className = "toast";
      document.body.appendChild(this.el);
    }
    this.el.textContent = msg;
    this.el.classList.add("is-on");
    clearTimeout(this._t);
    this._t = setTimeout(() => this.el.classList.remove("is-on"), ms);
  },
  hide() {
    clearTimeout(this._t);
    if (this.el) this.el.classList.remove("is-on");
  }
};

/* ---------------- UI ---------------- */
const UI = {
  hud(idx, concept) {
    const ch = CHAPTERS[clamp(idx, 0, CHAPTERS.length - 1)] || CHAPTERS[CHAPTERS.length - 1];
    return `
    <header class="hud">
      <div class="hud-left">
        <span class="hud-num">${ch.num}</span>
        <span class="hud-title">${ch.title}</span>
        <span class="hud-en">${ch.en}</span>
      </div>
      <div class="hud-mid" aria-hidden="true">
        ${CHAPTERS.map((c, i) => `<span class="pip ${i < idx ? "is-done" : ""} ${i === idx ? "is-now" : ""}"></span>`).join("")}
        <span class="pip ${idx >= CHAPTERS.length ? "is-done" : ""}"></span>
      </div>
      <div class="hud-right">${concept || ch.concept}</div>
      <button class="hud-help" type="button" data-hb-open="theory" aria-label="打开游戏手册" title="打开游戏手册">?</button>
    </header>`;
  },

  meter({ label, value, max = 100, prev, tone = "cyan", marker, markerLabel, note }) {
    const v = clamp(value, 0, max);
    const start = prev === undefined ? 0 : clamp(prev, 0, max);
    const w = (v / max) * 100;
    const sw = (start / max) * 100;
    return `
    <div class="meter ${marker !== undefined ? "has-marker" : ""}" data-tone="${tone}">
      <div class="meter-top"><span>${label}</span><b>${note !== undefined ? note : Math.round(v)}</b></div>
      <div class="meter-track">
        <i data-w="${w.toFixed(1)}" style="width:${sw.toFixed(1)}%"></i>
        ${marker !== undefined ? `<em style="left:${clamp((marker / max) * 100, 0, 100)}%" data-label="${markerLabel || ""}"></em>` : ""}
      </div>
    </div>`;
  },

  animateMeters(root) {
    requestAnimationFrame(() => {
      $$(".meter-track i[data-w]", root).forEach(el => { el.style.width = el.dataset.w + "%"; });
    });
  },

  matrix({ cols, rows, data, pick, result, caption, rowLabel = "你", colLabel = "对方" }) {
    const cell = (v, r, c) => {
      const isPick = pick && pick[0] === r && pick[1] === c;
      const isRes = result && result[0] === r && result[1] === c;
      return `<td class="${v > 0 ? "is-pos" : v < 0 ? "is-neg" : ""} ${isPick ? "is-pick" : ""} ${isRes ? "is-result" : ""}">${v > 0 ? "+" : ""}${v}</td>`;
    };
    return `
    <table class="matrix">
      <thead><tr><th>${rowLabel} ＼ ${colLabel}</th>${cols.map(c => `<th>${c}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows.map((r, ri) => `<tr><th>${r}</th>${data[ri].map((v, ci) => cell(v, ri, ci)).join("")}</tr>`).join("")}
      </tbody>
    </table>
    ${caption ? `<div class="matrix-cap">${caption}</div>` : ""}`;
  },

  choices(items) {
    return `<div class="choices">${items.map((it, i) => `
      <button class="choice ${it.armed ? "is-armed" : ""}" type="button" data-act="${it.act}"
        ${it.disabled ? "disabled" : ""} data-tone="${it.tone || ""}">
        <span class="choice-key">${it.key || i + 1}</span>
        <span class="choice-main"><b>${it.title}</b>${it.desc ? `<small>${it.desc}</small>` : ""}</span>
        ${it.tag ? `<span class="choice-tag">${it.tag}</span>` : "<span></span>"}
      </button>`).join("")}</div>`;
  },

  log(lines, from = 0) {
    if (!lines.length) return `<div class="log-empty">// 尚未记录任何决策</div>`;
    return `<div class="log">${lines.map((l, i) => `
      <div class="log-line ${l.who ? "is-" + l.who : ""} ${i >= from ? "is-new" : ""}">
        ${l.tag ? `<span class="tag">${l.tag}</span>` : ""}
        <span>${l.text}${l.delta ? `<span class="delta ${l.delta > 0 ? "up" : "down"}">${signed(l.delta)}</span>` : ""}</span>
      </div>`).join("")}</div>`;
  },

  brief(ch, { intro = [], rules = [], note = "", act = "begin", cta = "开始", hint = "" }) {
    return `
    <div class="screen fade">
      ${UI.hud(CHAPTERS.indexOf(ch), ch.concept)}
      <div class="brief">
        <div class="brief-num">${ch.num}</div>
        <p class="eyebrow">第 ${ch.num} 章 / CHAPTER ${ch.num}</p>
        <h2 class="brief-title">${ch.title}</h2>
        <p class="brief-en">${ch.en}</p>
        <blockquote class="epigraph">“${ch.epigraph}”<cite>— ${ch.source}</cite></blockquote>
        <div class="prose">${intro.map(p => `<p>${p}</p>`).join("")}</div>
        ${note ? `<details class="brief-note"><summary>没看过《三体》？点这里补 10 秒背景</summary><p>${note}</p></details>` : ""}
        ${rules.length ? `<div class="brief-rules">${rules.map(r => `<div><b>${r.k}</b>${r.v}</div>`).join("")}</div>` : ""}
        <div class="brief-cta">
          <button class="btn btn--primary" type="button" data-act="${act}">${cta}</button>
          ${hint ? `<span class="hint">${hint}</span>` : ""}
        </div>
      </div>
    </div>`;
  },

  endingCard({ label = "结局", paras = [], sign = "" }) {
    return `
    <div class="ending-card">
      <div class="label">${label}</div>
      ${paras.map(p => `<p>${p}</p>`).join("")}
      ${sign ? `<span class="sign">${sign}</span>` : ""}
    </div>`;
  },

  conceptCards(keys, heading = true) {
    return `
    ${heading ? `<h3>本章概念</h3>` : ""}
    <div class="concept-grid">
      ${keys.map(k => {
        const c = CONCEPTS[k];
        if (!c) return "";
        return `<div class="concept-card"><b>${c.name}</b><small>${c.en}</small><p>${c.one}</p></div>`;
      }).join("")}
    </div>`;
  },

  sceneRadar({ you = 0, contacts = [], tag = "RADAR // 主动扫描", calm = false }) {
    const pos = [[250, 88], [128, 196], [300, 214], [196, 62], [330, 128]];
    return `
    <div class="scene">
      <span class="scene-tag ${calm ? "is-calm" : ""}">${tag}</span>
      <svg viewBox="0 0 400 300" role="img" aria-label="战术雷达">
        <defs>
          <radialGradient id="rg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="rgba(111,217,255,.10)"/>
            <stop offset="100%" stop-color="rgba(111,217,255,0)"/>
          </radialGradient>
          <linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="rgba(111,217,255,0)"/>
            <stop offset="100%" stop-color="rgba(111,217,255,.30)"/>
          </linearGradient>
        </defs>
        <circle cx="200" cy="150" r="118" fill="url(#rg)"/>        ${[118, 84, 50].map(r => `<circle cx="200" cy="150" r="${r}" fill="none" stroke="rgba(111,217,255,.14)" stroke-width=".8"/>`).join("")}
        <line x1="82" y1="150" x2="318" y2="150" stroke="rgba(111,217,255,.12)" stroke-width=".8"/>
        <line x1="200" y1="32" x2="200" y2="268" stroke="rgba(111,217,255,.12)" stroke-width=".8"/>
        <g class="radar-sweep">
          <path d="M200 150 L200 32 A118 118 0 0 1 283.5 66.5 Z" fill="url(#sg)"/>
          <line x1="200" y1="150" x2="200" y2="32" stroke="rgba(111,217,255,.55)" stroke-width="1"/>
        </g>
        ${contacts.map((c, i) => {
          const p = pos[i % pos.length];
          const isYou = i === you;
          return `<g class="blip">
            <circle cx="${p[0]}" cy="${p[1]}" r="${isYou ? 5 : 3.2}" fill="${isYou ? "#6fd9ff" : "#ff5d5d"}"/>
            <circle cx="${p[0]}" cy="${p[1]}" r="${isYou ? 12 : 8}" fill="none" stroke="${isYou ? "rgba(111,217,255,.5)" : "rgba(255,93,93,.35)"}" stroke-width=".8"/>
            <text x="${p[0] + 9}" y="${p[1] + 4}" font-family="monospace" font-size="8" fill="${isYou ? "rgba(111,217,255,.8)" : "rgba(255,140,140,.65)"}" letter-spacing="1">${esc(c)}</text>
          </g>`;
        }).join("")}
      </svg>
      <div class="scene-caption"><span>蓝色空间号 · <b>舰长视角</b></span><span>距离下一个恒星系 4.2 ly</span></div>
    </div>`;
  },

  sceneWave({ strength = 0.7 }) {
    const bars = Array.from({ length: 42 }, (_, i) => {
      const base = 8 + Math.abs(Math.sin(i * 1.7)) * 34 * strength + Math.random() * 10;
      return `<i style="--h:${base.toFixed(0)}px;animation-delay:${(i * 0.045).toFixed(2)}s"></i>`;
    }).join("");
    return `<div class="wave">${bars}</div>`;
  }
};
