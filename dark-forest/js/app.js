/* =========================================================
   APP — router, screens, persistence
   ========================================================= */

function defaultStats() {
  return {
    cooperations: 0, defections: 0, firstStrike: false, payoff: 0,
    deterrenceWin: false, pressed: false, deterrenceYears: 0, finalDeterrence: 0,
    contacts: 0, clears: 0, bayesHits: 0, bayesTotal: 0, exposure: 0,
    mixedScore: 0, randomness: 0, diceUsed: 0,
    contribution: 0, zeroWin: false, retained: 12, childFinal: 1, zeroTotal: 0,
    finale: null
  };
}

const App = {
  root: null,
  handler: null,
  timers: [],
  currentChapter: null,
  stats: defaultStats(),
  progress: [false, false, false, false, false],
  _resetArm: false,

  init() {
    this.root = $("#app");
    Stars.init();
    this.load();
    this.bind();
    this.syncSound();

    const q = new URLSearchParams(location.search);

    if (q.has("demo")) {
      this.progress = [true, true, true, true, true];
      this.stats = Object.assign(defaultStats(), {
        cooperations: 6, defections: 5, firstStrike: true, payoff: 4,
        deterrenceWin: true, deterrenceYears: 8, finalDeterrence: 82,
        contacts: 3, clears: 1, bayesHits: 4, bayesTotal: 6, exposure: 58,
        mixedScore: 3, randomness: 71, diceUsed: 1,
        contribution: 7, zeroWin: true, retained: 5, childFinal: 1, zeroTotal: 41,
        finale: "warn"
      });
      this.report();
      return;
    }

    const ch = parseInt(q.get("ch") || "0", 10);
    if (ch >= 1 && ch <= 5) {
      this.startChapter(ch - 1);
      if (q.has("auto")) {
        setTimeout(() => { if (Chapters[ch - 1].handle) Chapters[ch - 1].handle("begin"); }, 120);
      }
      return;
    }

    const sc = q.get("screen");
    if (sc === "report") { this.report(); return; }
    if (sc === "finale") { Finale.mount(); return; }
    if (sc === "codex") { this.title(); setTimeout(() => Handbook.open("theory"), 150); return; }
    if (sc === "prologue") { this.prologue(); return; }

    this.title();
  },

  bind() {
    document.addEventListener("click", e => {
      const t = e.target.closest("[data-act]");
      if (!t) return;
      if (t.disabled) return;
      Sound.resume();
      Sound.click();
      if (this.handler) this.handler(t.dataset.act, t);
    });

    document.addEventListener("keydown", e => {
      if (e.key >= "1" && e.key <= "5") {
        const opts = $$(".choice:not([disabled])");
        const i = parseInt(e.key, 10) - 1;
        if (opts[i]) { e.preventDefault(); opts[i].click(); }
      }
    });

    const snd = $("#sound-toggle");
    if (snd) {
      snd.addEventListener("click", e => {
        e.stopPropagation();
        Sound.resume();
        SoundPanel.toggle();
      });
    }

    document.addEventListener("pointerdown", () => Sound.resume(), { once: true });
  },

  syncSound() {
    Sound.load();
    Sound.updateButton();
    SoundPanel.sync();
  },

  load() {
    const s = store.read();
    if (!s) return;
    if (Array.isArray(s.progress)) this.progress = [0, 1, 2, 3, 4].map(i => !!s.progress[i]);
    if (s.stats) this.stats = Object.assign(defaultStats(), s.stats);
  },

  save() {
    store.write({ progress: this.progress, stats: this.stats });
  },

  set(html) {
    this.clearTimers();
    Toast.hide();
    if (typeof Hologram !== "undefined") Hologram.stopAll();
    this.root.innerHTML = html;
    window.scrollTo(0, 0);
    UI.animateMeters(this.root);
    $$('.log-scroll', this.root).forEach(el => { el.scrollTop = el.scrollHeight; });
    if (typeof Hologram !== "undefined") Hologram.mountAll(this.root);
  },

  after(fn, ms) {
    const id = setTimeout(fn, ms);
    this.timers.push(id);
    return id;
  },

  clearTimers() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  },

  /* ---------------- title ---------------- */
  title() {
    this.currentChapter = null;
    const started = this.progress.some(Boolean);
    const nextIdx = this.progress.findIndex(v => !v);
    const allDone = nextIdx === -1;
    const primaryLabel = !started
      ? "开始游戏"
      : allDone
        ? (this.stats.finale ? "查看实验报告" : "继续 · 尾声")
        : `继续游戏 · 第${["一", "二", "三", "四", "五"][nextIdx]}章`;

    this.handler = act => {
      if (act === "start") { this.newGame(); return; }
      if (act === "continue") {
        if (!allDone) this.startChapter(nextIdx);
        else if (!this.stats.finale) Finale.mount();
        else this.report();
        return;
      }
      if (act === "chapters") { this.chapterSelect(); return; }
      if (act === "reset") {
        if (!this._resetArm) {
          this._resetArm = true;
          Toast.show("再点一次「重新开始」以清除所有进度", 2600);
          const b = $('[data-act="reset"]');
          if (b) b.textContent = "确认清除进度？";
          this.after(() => {
            this._resetArm = false;
            const bb = $('[data-act="reset"]');
            if (bb) bb.textContent = "重新开始";
          }, 3000);
          return;
        }
        this._resetArm = false;
        this.newGame();
      }
    };

    this.set(`
    <div class="screen screen--center screen--title fade">
      <div class="title-orbit" aria-hidden="true"><i></i><i></i><i></i><b></b></div>
      <div class="title-horizon" aria-hidden="true"></div>
      <div class="wrap title-wrap">
        <p class="eyebrow eyebrow--center">非官方同人 · 博弈论互动叙事</p>
        <h1 class="game-title"><span>黑暗</span><span>森林</span></h1>
        <p class="title-cn">五 个 博 弈</p>
        <p class="title-lead">
          宇宙是一座黑暗森林。<br>
          <b>而猎人，也要做选择。</b>
        </p>
        <div class="btn-row">
          <button class="btn btn--primary" type="button" data-act="${started ? "continue" : "start"}">${primaryLabel}</button>
          ${started
            ? `<button class="btn" type="button" data-act="chapters">章节选择</button>
               <button class="btn btn--ghost" type="button" data-hb-open="theory">手册</button>
               <button class="btn btn--ghost btn--danger" type="button" data-act="reset">重新开始</button>`
            : `<button class="btn btn--ghost" type="button" data-hb-open="world">新手指南</button>`}
        </div>
        <p class="title-foot">
          改编自刘慈欣《三体》世界观 · 非官方同人 · AI 生成
        </p>
      </div>
      <div class="wrap title-version">
        <span>DARK FOREST / FIVE GAMES</span>
        <span>v1.3 · 2026</span>
      </div>
    </div>`);
  },

  newGame() {
    store.clear();
    this.stats = defaultStats();
    this.progress = [false, false, false, false, false];
    this.save();
    this.prologue();
  },

  /* ---------------- prologue ---------------- */
  prologue() {
    this.handler = act => {
      if (act === "toChapter") this.startChapter(0);
      if (act === "back") this.title();
    };
    this.set(`
    <div class="screen fade">
      <div class="brief" style="padding-top:12vh">
        <p class="eyebrow">序章 / PROLOGUE</p>
        <h2 class="brief-title" style="font-size:clamp(34px,5.4vw,58px)">五个在黑暗里<br>做过选择的人</h2>
        <div class="rule" style="margin:34px 0"></div>
        <div class="prose">
          <p>这是一份来自公元 2270 年的行为记录。记录的对象不是英雄，也不是罪犯。是五个在黑暗里做过选择的人。</p>
          <p>你即将进入他们的位置。每一次选择都会留下痕迹，但这里没有标准答案——只有<strong>均衡</strong>。</p>
          <p>每章结束，你会拿到一页博弈论手记。它不会告诉你「应该怎么选」，它只会告诉你，刚才那个选择在数学上意味着什么。</p>
          <p>如果遇到不认识的词，点右上角的「?」，或者直接点正文里带虚线的词。</p>
          <p><span class="em">现在，关掉灯。让我们从第一场黑暗开始。</span></p>
        </div>
        <div class="brief-rules">
          <div><b>第一章</b>黑暗战役 · 囚徒困境</div>
          <div><b>第二章</b>执剑人 · 胆小鬼博弈</div>
          <div><b>第三章</b>猜疑链 · 贝叶斯信号</div>
          <div><b>第四章</b>面壁者 · 混合策略</div>
          <div><b>第五章</b>归零 · 阈值公共品</div>
        </div>
        <div class="brief-cta">
          <button class="btn btn--primary" type="button" data-act="toChapter">进入第一章 →</button>
          <button class="btn btn--ghost btn--sm" type="button" data-act="back">返回标题</button>
        </div>
      </div>
    </div>`);
  },

  /* ---------------- chapters ---------------- */
  startChapter(i) {
    this.currentChapter = i;
    this.handler = act => {
      if (act === "debrief" || act === "toDebrief") {
        const payload = Chapters[i].payload ? Chapters[i].payload() : {};
        this.chapterDebrief(i, payload);
        return;
      }
      Chapters[i].handle(act);
    };
    Chapters[i].mount();
  },

  chapterDebrief(i, payload) {
    this.currentChapter = i;
    this.progress[i] = true;
    this.save();
    this.handler = act => {
      if (act === "next") {
        if (i < Chapters.length - 1) this.startChapter(i + 1);
        else Finale.mount();
      }
    };
    this.set(Chapters[i].debriefHTML(payload));
  },

  /* ---------------- chapter select ---------------- */
  chapterSelect() {
    this.currentChapter = null;
    this.handler = act => {
      if (act === "back") { this.title(); return; }
      if (act.startsWith("open:")) {
        const i = parseInt(act.split(":")[1], 10);
        if (i >= 0 && i < Chapters.length) this.startChapter(i);
      }
    };
    this.set(`
    <div class="screen fade">
      <div class="codex">
        <p class="eyebrow">章节 / CHAPTERS</p>
        <h2>选择一个博弈</h2>
        <p class="codex-intro">每一章都是一个独立的模型。你可以按顺序玩，也可以挑一章重玩——换一种策略，看看均衡会不会变。</p>
        <div class="chapter-list">
          ${CHAPTERS.map((ch, i) => `
            <button class="chapter-row" type="button" data-act="open:${i}">
              <span class="chapter-num">${ch.num}</span>
              <span class="chapter-main"><b>${ch.title}</b><small>${ch.en} · ${ch.concept}</small></span>
              <span class="chapter-state ${this.progress[i] ? "is-done" : ""}">${this.progress[i] ? "已完成" : "未开始"}</span>
              <span class="chapter-arrow">→</span>
            </button>`).join("")}
        </div>
        <div class="back">
          <button class="btn btn--ghost" type="button" data-act="back">← 返回标题</button>
        </div>
      </div>
    </div>`);
  },

  /* ---------------- report ---------------- */
  report() {
    this.currentChapter = null;
    const s = this.stats;
    const done = this.progress.filter(Boolean).length;
    const persona = PERSONAS.find(p => p.cond(s)) || DEFAULT_PERSONA;
    const rate = s.bayesTotal ? Math.round((s.bayesHits / s.bayesTotal) * 100) : 0;
    const finaleText = {
      warn: "你回复了「不要回答」。你选择了让一个陌生人活下去。",
      report: "你上报了坐标。你选择了让自己的文明活下去。",
      ignore: "你关掉了接收器。你选择了不作为。"
    }[s.finale] || "你还没有走到那个监听站。";

    this.handler = act => {
      if (act === "replay") { this.newGame(); return; }
      if (act === "title") { this.title(); return; }
    };

    this.set(`
    <div class="screen fade">
      <div class="report">
        <p class="eyebrow">实验报告 / AFTER ACTION REPORT</p>
        <h2>你的博弈论画像</h2>
        <div class="persona">
          <div class="plabel">PERSONA // ${persona.key ? persona.key.toUpperCase() : "UNCLASSIFIED"}</div>
          <div class="pname">${persona.name}</div>
          <p class="pdesc">${persona.desc}</p>
        </div>

        <div class="stat-grid">
          <div class="stat"><b>${done}/5</b><span>完成章节</span></div>
          <div class="stat"><b>${s.cooperations} / ${s.defections}</b><span>合作 / 背叛</span></div>
          <div class="stat"><b>${signed(s.payoff)}</b><span>黑暗战役得分</span></div>
          <div class="stat"><b>${s.deterrenceYears || 0}</b><span>威慑坚持（年）</span></div>
          <div class="stat"><b>${rate}%</b><span>判断命中率</span></div>
          <div class="stat"><b>${s.randomness || 0}%</b><span>面壁随机性</span></div>
          <div class="stat"><b>${s.contribution || 0} / 12</b><span>归零归还质量</span></div>
          <div class="stat"><b>${s.zeroTotal || 0} / ${typeof C5_THRESHOLD !== "undefined" ? C5_THRESHOLD : 34}</b><span>归零最终总量</span></div>
        </div>

        <h3>你的五次博弈</h3>
        <div class="log">
          <div class="log-line is-you"><span class="tag">第一章 · 黑暗战役</span><span>${s.firstStrike ? "你先开了火。" : s.defections > 0 ? "你开过火，也沉默过。" : "你一次也没有开火。"}最终得分 ${signed(s.payoff)}。</span></div>
          <div class="log-line is-them"><span class="tag">第二章 · 执剑人</span><span>${s.pressed ? "你按下了开关。" : s.deterrenceWin ? "你撑到了第八年，舰队转向了。" : "威慑失效了。"}${s.finalDeterrence ? "最终威慑度 " + s.finalDeterrence + "。" : ""}</span></div>
          <div class="log-line is-sys"><span class="tag">第三章 · 猜疑链</span><span>接触 ${s.contacts} 次，清除 ${s.clears} 次，最终暴露度 ${s.exposure}。</span></div>
          <div class="log-line"><span class="tag">第四章 · 面壁者</span><span>计划得分 ${signed(s.mixedScore)}，随机性 ${s.randomness || 0}%，使用了 ${s.diceUsed || 0} 次骰子。</span></div>
          <div class="log-line is-you"><span class="tag">第五章 · 归零</span><span>你归还了 ${s.contribution || 0} 个单位的质量，宇宙${s.zeroWin ? "越过了临界值" : "在膨胀中熄灭"}。孩子最后归还了 ${s.childFinal || 0} 个。</span></div>
        </div>

        <h3>尾声 · 你的选择</h3>
        <p style="font-family:var(--serif);font-size:17px;line-height:2;color:var(--ink-2);border-left:1px solid var(--gold);padding-left:20px">${finaleText}</p>

        <h3>你解锁的概念</h3>
        <div class="concept-grid">
          ${Object.keys(CONCEPTS).map(k => {
            const c = CONCEPTS[k];
            return `<div class="concept-card"><b>${c.name}</b><small>${c.en}</small><p>${c.one}</p></div>`;
          }).join("")}
        </div>

        <h3>接下来读什么</h3>
        <div class="reading">
          ${READING.map(r => `<article><b>${r.title}</b><span>${r.en}</span><p>${r.desc}</p></article>`).join("")}
        </div>

        <p class="footnote">
          《黑暗森林 · 五个博弈》是一款非商业同人作品，基于刘慈欣《三体》的世界观进行改编，与原著作者及版权方无关。
          所有图像、声音与动画均由代码实时生成，未使用任何官方素材。博弈论部分的数值为教学简化，部分设定与原作有出入。
        </p>

        <div class="debrief-cta">
          <div class="btn-row">
            <button class="btn btn--primary" type="button" data-act="replay">再玩一次</button>
            <button class="btn" type="button" data-hb-open="theory">概念手册</button>
            <button class="btn btn--ghost" type="button" data-act="title">返回标题</button>
          </div>
          <span class="mono" style="font-size:9px;letter-spacing:.2em;color:var(--faint)">END OF REPORT</span>
        </div>
      </div>
    </div>`);
  }
};

window.addEventListener("DOMContentLoaded", () => App.init());
