/* =========================================================
   HANDBOOK — 给没看过《三体》/没学过博弈论的玩家
   ========================================================= */

function termHTML(term, label) {
  const txt = label || term;
  if (!GLOSSARY[term]) return txt;
  return `<button type="button" class="term" data-term="${term}">${txt}</button>`;
}
const T = termHTML;

const CONCEPT_BY_NAME = Object.fromEntries(
  Object.entries(CONCEPTS).map(([k, v]) => [v.name, k])
);

const Handbook = {
  el: null,
  tab: "world",
  popEl: null,

  build() {
    const wrap = document.createElement("div");
    wrap.className = "handbook";
    wrap.id = "handbook";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = `
      <div class="handbook-backdrop" data-hb-close></div>
      <div class="handbook-panel" role="dialog" aria-modal="true" aria-label="游戏手册">
        <header class="hb-head">
          <div class="hb-tabs" role="tablist">
            <button class="hb-tab" type="button" role="tab" data-hb-tab="world">世界观</button>
            <button class="hb-tab" type="button" role="tab" data-hb-tab="theory">博弈论</button>
            <button class="hb-tab" type="button" role="tab" data-hb-tab="controls">操作</button>
          </div>
          <button class="hb-close" type="button" data-hb-close aria-label="关闭手册">×</button>
        </header>
        <div class="hb-body" id="hb-body"></div>
      </div>`;
    document.body.appendChild(wrap);
    this.el = wrap;

    wrap.addEventListener("click", e => {
      const tab = e.target.closest("[data-hb-tab]");
      if (tab) { this.setTab(tab.dataset.hbTab); return; }
      if (e.target.closest("[data-hb-close]")) { this.close(); }
    });
  },

  open(tab) {
    if (!this.el) this.build();
    this.tab = tab || this.tab || "world";
    this.el.classList.add("is-open");
    this.el.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const app = document.getElementById("app");
    if (app) app.inert = true;
    SoundPanel.hide();
    const snd = document.getElementById("sound-toggle");
    if (snd) snd.inert = true;
    this.render();
    this.closePop();
    const panel = this.el.querySelector(".handbook-panel");
    if (panel) { panel.setAttribute("tabindex", "-1"); panel.focus({ preventScroll: true }); }
  },

  close() {
    if (!this.el) return;
    this.el.classList.remove("is-open");
    this.el.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    const app = document.getElementById("app");
    if (app) app.inert = false;
    const snd = document.getElementById("sound-toggle");
    if (snd) snd.inert = false;
    this.closePop();
  },

  setTab(tab) {
    this.tab = tab;
    this.render();
    const body = this.el.querySelector("#hb-body");
    if (body) body.scrollTop = 0;
  },

  render() {
    if (!this.el) return;
    this.el.querySelectorAll(".hb-tab").forEach(b => {
      b.classList.toggle("is-on", b.dataset.hbTab === this.tab);
      b.setAttribute("aria-selected", b.dataset.hbTab === this.tab ? "true" : "false");
    });
    const body = this.el.querySelector("#hb-body");
    if (!body) return;
    body.innerHTML = this.tab === "world" ? this.worldHTML()
      : this.tab === "theory" ? this.theoryHTML()
      : this.controlsHTML();
  },

  worldHTML() {
    return `
      <h4 class="hb-h" style="margin-top:0">这个宇宙的三条规矩</h4>
      <div class="hb-rules">
        ${WORLD.rules.map((r, i) => `
          <article class="hb-rule">
            <span class="hb-rule-num">0${i + 1}</span>
            <h3>${r.h}</h3>
            <p>${r.p}</p>
          </article>`).join("")}
      </div>

      <h4 class="hb-h">五个章节分别在哪里</h4>
      <div class="hb-timeline">
        ${WORLD.timeline.map(t => `
          <div class="hb-time">
            <span class="hb-time-n">${t.n}</span>
            <div><b>${t.t}</b><p>${t.d}</p></div>
          </div>`).join("")}
      </div>

      <h4 class="hb-h">名词表 <small>点击展开</small></h4>
      <div class="hb-terms">
        ${Object.entries(GLOSSARY).map(([k, g]) => `
          <details class="concept">
            <summary><span class="cname">${g.name}</span><span class="cen">${g.en}</span><span class="cplus">+</span></summary>
            <div class="cbody">${g.long}</div>
          </details>`).join("")}
      </div>
      <p class="hb-note">以上已经覆盖了五个章节会用到的全部设定。遇到不认识的词，正文里带虚线的都可以点。</p>`;
  },

  theoryHTML() {
    const groups = [1, 2, 3, 4, 5].map(n => {
      const ch = CHAPTERS[n - 1];
      const keys = Object.keys(CONCEPTS).filter(k => CONCEPTS[k].chapter === n);
      return `
        <section class="hb-group">
          <h5>第 ${ch.num} 章 · ${ch.title}</h5>
          ${keys.map(k => {
            const c = CONCEPTS[k];
            return `<details class="concept">
              <summary><span class="cname">${c.name}</span><span class="cen">${c.en}</span><span class="cplus">+</span></summary>
              <div class="cbody">
                <p>${c.body}</p>
                ${c.formula ? `<div class="cformula">${c.formula}</div>` : ""}
                ${c.example ? `<div class="cblock"><b>例子</b><p>${c.example}</p></div>` : ""}
                ${c.misread ? `<div class="cblock cblock--warn"><b>常见误解</b><p>${c.misread}</p></div>` : ""}
              </div>
            </details>`;
          }).join("")}
        </section>`;
    }).join("");

    return `
      <p class="hb-lead">${THEORY.lead}</p>
      <div class="hb-basics">
        ${THEORY.basics.map(b => `<div class="hb-basic"><b>${b.t}</b><p>${b.d}</p></div>`).join("")}
      </div>
      <p class="hb-note">下面 25 个概念，按章节排列。不用背——遇到时回来查一次就够了。</p>
      ${groups}`;
  },

  controlsHTML() {
    return `
      <p class="hb-lead">这是一个纯网页游戏：双击就能玩，不需要安装，也不需要联网。</p>
      <div class="hb-controls">
        ${CONTROLS.map(c => `<div class="hb-control"><b>${c.t}</b><p>${c.d}</p></div>`).join("")}
      </div>
      <div class="hb-tip">
        <b>给第一次玩的你</b>
        <p>你不需要看过《三体》，也不需要懂博弈论。每一章都会把处境、规则和收益讲清楚；你只需要做那个选择，然后看看它在数学上意味着什么。</p>
      </div>`;
  },

  pop(term, anchor) {
    this.closePop();
    const g = GLOSSARY[term];
    const ck = CONCEPT_BY_NAME[term];
    const c = ck ? CONCEPTS[ck] : null;
    if (!g && !c) return;
    const name = g ? g.name : c.name;
    const en = g ? g.en : c.en;
    const short = g ? g.short : c.one;
    const tab = g ? "world" : "theory";

    const pop = document.createElement("div");
    pop.className = "term-pop";
    pop.innerHTML = `
      <div class="term-pop-head"><b>${name}</b><span>${en}</span></div>
      <p>${short}</p>
      <button type="button" class="term-pop-link" data-hb-open="${tab}">在手册里看完整解释 →</button>`;
    document.body.appendChild(pop);
    this.popEl = pop;

    if (window.innerWidth < 640) {
      pop.classList.add("is-sheet");
    } else {
      const r = anchor.getBoundingClientRect();
      const w = 300;
      let left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left + r.width / 2 - w / 2));
      let top = r.bottom + 10;
      const h = pop.offsetHeight;
      if (top + h > window.innerHeight - 12) top = Math.max(12, r.top - h - 10);
      pop.style.left = left + "px";
      pop.style.top = top + "px";
      pop.style.width = w + "px";
    }

    const dismiss = e => {
      if (pop.contains(e.target)) return;
      this.closePop();
    };
    setTimeout(() => document.addEventListener("click", dismiss, { once: true }), 0);
    this._dismiss = dismiss;
  },

  closePop() {
    if (this._dismiss) { document.removeEventListener("click", this._dismiss); this._dismiss = null; }
    if (this.popEl) { this.popEl.remove(); this.popEl = null; }
  }
};

document.addEventListener("click", e => {
  const opener = e.target.closest("[data-hb-open]");
  if (opener) {
    e.preventDefault();
    Handbook.closePop();
    Handbook.open(opener.dataset.hbOpen);
    return;
  }
  const term = e.target.closest(".term[data-term]");
  if (term) {
    e.preventDefault();
    Handbook.pop(term.dataset.term, term);
  }
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    if (Handbook.popEl) Handbook.closePop();
    else if (Handbook.el && Handbook.el.classList.contains("is-open")) Handbook.close();
  }
});

window.addEventListener("scroll", () => Handbook.closePop(), true);
