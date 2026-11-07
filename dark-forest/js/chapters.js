/* =========================================================
   CHAPTERS
   ========================================================= */

/* ---------------------------------------------------------
   CH 1 — 黑暗战役 · 囚徒困境
   --------------------------------------------------------- */
const C1 = {
  id: "c1",
  phase: "brief",
  st: null,
  logFrom: 0,

  mount() {
    this.phase = "brief";
    this.logFrom = 0;
    this.st = {
      round: 1, total: 0, history: [], log: [], phase: "choose", last: null,
      firstStrike: false, fired: 0, silent: 0
    };
    this.draw();
  },

  draw() {
    if (typeof Hologram !== "undefined") {
      Hologram.setState("battle", { round: this.st.round, last: this.st.last, phase: this.st.phase });
    }
    App.set(this.html());
  },

  scene3D() {
    const gone = this.st.round >= 3;
    return `
    <div class="scene scene--3d">
      <span class="scene-tag">${gone ? "RADAR // 目标消失" : "RADAR // 编队航行"}</span>
      <canvas data-holo="battle" tabindex="0" aria-label="三维战术星图，可拖拽旋转，滚轮缩放"></canvas>
      <span class="holo-hint">拖拽旋转 · 滚轮缩放</span>
      <div class="scene-caption">
        <span>蓝色空间号 · <b>舰长视角</b></span>
        <span>距离下一个恒星系 4.2 ly</span>
      </div>
    </div>`;
  },

  html() {
    if (this.phase === "brief") {
      return UI.brief(CHAPTERS[0], {
        intro: [
          `${T("末日之战")}结束后的第十三天。五艘人类战舰正在驶离太阳系：<strong>蓝色空间号</strong>、终极规律号、企业号、深空号、自然选择号。`,
          "燃料和食物只够支撑一艘战舰上的人抵达下一个恒星系。五艘船的舰长都明白这一点。没有人先开口。",
          "你的通讯器响了。终极规律号发来一份《资源共享协议》。同时，你的雷达显示，它的武器系统正在预热。",
          "<span class=\"em\">你是蓝色空间号的舰长。现在，做出你的选择。</span>"
        ],
        note: "在这个故事里，人类刚刚在一场末日之战中惨败。五艘战舰逃出太阳系，燃料只够一艘船的人活下去。它们之间没有法律，只有黑暗和猜疑。",
        rules: [
          { k: "你的身份", v: "蓝色空间号 · 舰长" },
          { k: "回合", v: "4 轮同时决策" },
          { k: "目标", v: "让尽可能多的人活下来" },
          { k: "提示", v: "键盘 1 / 2 可快速选择" }
        ],
        act: "begin", cta: "开始对峙", hint: "没有标准答案，只有均衡"
      });
    }

    if (this.phase === "end") return this.endHTML();

    const st = this.st;
    const intel = C1_INTEL[st.round - 1];

    return `
    <div class="screen fade">
      ${UI.hud(0, "囚徒困境")}
      <div class="stage">
        <section class="stage-main">
          ${this.scene3D()}
          <div class="panel">
            <div class="panel-head">
              <span class="panel-kicker">通信记录 / COMMS</span>
              <span class="panel-meta">${st.history.length} 条决策</span>
            </div>
            <div class="log-scroll">
              ${UI.log(st.log, this.logFrom)}
            </div>
          </div>
        </section>

        <aside class="stage-side">
          <div class="panel">
            <div class="panel-head">
              <span class="panel-kicker">DECISION</span>
              <span class="panel-meta">回合 ${st.round} / 4</span>
            </div>
            <h4>${intel.title}</h4>
            <p class="panel-note">${intel.text}</p>
            <div class="rule" style="margin:14px 0"></div>
            ${st.phase === "choose" ? this.chooseHTML(intel) : this.revealHTML()}
            <div class="rule" style="margin:16px 0 12px"></div>
            <div style="display:flex;justify-content:space-between;align-items:baseline">
              <span class="mono" style="font-size:9px;letter-spacing:.2em;color:var(--faint)">生存点数</span>
              <span class="mono" style="font-size:22px;color:${st.total >= 0 ? "var(--cyan)" : "var(--red)"}">${st.total > 0 ? "+" : ""}${st.total}</span>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head">
              <span class="panel-kicker">收益矩阵</span>
              <span class="panel-meta">每轮得分</span>
            </div>
            ${UI.matrix({
              cols: ["对方沉默", "对方开火"],
              rows: ["你沉默", "你开火"],
              data: [[3, -5], [5, -2]],
              pick: st.last ? [st.last.you === "fire" ? 1 : 0, st.last.them === "fire" ? 1 : 0] : null,
              result: st.phase === "reveal" ? [st.last.you === "fire" ? 1 : 0, st.last.them === "fire" ? 1 : 0] : null,
              caption: "行 = 你的选择　列 = 终极规律号的选择"
            })}
          </div>
        </aside>
      </div>
    </div>`;
  },

  chooseHTML(intel) {
    return `
      ${UI.choices([
        { act: "pick:silent", key: "1", title: "沉默 · 共享资源", desc: "签署协议。等对方先动。", tag: "对方沉默 <b>+3</b><br>对方开火 <b>−5</b>" },
        { act: "pick:fire", key: "2", title: "开火 · 先发制人", desc: "在对方开火之前，摧毁它。", tag: "对方沉默 <b>+5</b><br>对方开火 <b>−2</b>", tone: "red" }
      ])}
      <p class="panel-note" style="margin-top:12px;color:var(--faint)">${intel.hint}</p>`;
  },

  revealHTML() {
    const l = this.st.last;
    return `
      <div class="reveal-row">
        <div class="reveal-side is-you"><small>你</small><b>${l.you === "fire" ? "开火" : "沉默"}</b></div>
        <div class="reveal-vs">VS</div>
        <div class="reveal-side is-them"><small>终极规律号</small><b>${l.them === "fire" ? "开火" : "沉默"}</b></div>
      </div>
      <p class="panel-note" style="color:var(--ink-2);font-size:13.5px">${l.text}</p>
      <div class="mono" style="margin:14px 0 4px;font-size:11px;letter-spacing:.14em;color:${l.pts >= 0 ? "var(--teal)" : "var(--red)"}">
        本轮 ${signed(l.pts)} 生存点数
      </div>
      <button class="btn btn--primary" type="button" data-act="next" style="width:100%;margin-top:10px">
        ${this.st.round >= 4 ? "结束这场战役" : "进入下一轮"} →
      </button>`;
  },

  handle(act) {
    if (act === "begin") {
      this.phase = "play";
      this.st.log.push({ tag: "第 1 轮", text: "终极规律号：「我们建议共享最后的资源。请回复。」", who: "them" });
      this.st.log.push({ tag: "舰桥", text: "蓝色空间号已经进入深海状态。舰体里灌满了缓冲液，所有人都在自己的位置上。", who: "sys" });
      this.logFrom = 0;
      this.draw();
      return;
    }
    if (act.startsWith("pick:")) {
      if (this.st.phase !== "choose") return;
      const you = act.split(":")[1];
      this.resolve(you);
      return;
    }
    if (act === "next") {
      if (this.st.round >= 4) {
        this.phase = "end";
        this.stats();
        this.draw();
      } else {
        this.st.round++;
        this.st.phase = "choose";
        this.st.last = null;
        this.st.log.push({ tag: `第 ${this.st.round} 轮`, text: C1_INTEL[this.st.round - 1].log, who: "sys" });
        this.draw();
      }
    }
  },

  enemyMove(round) {
    const defected = this.st.history.some(h => h.you === "fire");
    if (round === 1) return "silent";
    if (round === 4) return "fire";
    return defected ? "fire" : "silent";
  },

  resolve(you) {
    const them = this.enemyMove(this.st.round);
    const pts = you === "fire" ? (them === "fire" ? -2 : 5) : (them === "fire" ? -5 : 3);
    const text = C1_RESULT[this.st.round][you][them];

    this.st.total += pts;
    this.st.fired += you === "fire" ? 1 : 0;
    this.st.silent += you === "silent" ? 1 : 0;
    this.st.firstStrike = this.st.firstStrike || (this.st.round === 1 && you === "fire" && them === "silent");
    this.st.history.push({ you, them, pts });
    this.st.last = { you, them, pts, text };
    this.st.phase = "reveal";
    this.st.log.push({
      tag: `第 ${this.st.round} 轮 · 你 ${you === "fire" ? "开火" : "沉默"} / 对方 ${them === "fire" ? "开火" : "沉默"}`,
      text, delta: pts, who: "you"
    });
    if (you === "silent" && them === "silent" && !this.st.notedCoop) {
      this.st.notedCoop = true;
      this.st.log.push({ tag: "观察", text: "你们都选择了沉默。注意：这不是均衡，这是运气。", who: "sys" });
    }
    Sound.alarm();
    this.draw();
  },

  stats() {
    const s = App.stats;
    s.cooperations += this.st.silent;
    s.defections += this.st.fired;
    s.firstStrike = s.firstStrike || this.st.firstStrike;
    s.payoff += this.st.total;
  },

  ending() {
    const st = this.st;
    const fired = st.fired;
    if (st.firstStrike) return C1_END.hunter;
    if (fired === 0) return C1_END.coop;
    if (st.total <= -4) return C1_END.dead;
    return C1_END.survivor;
  },

  endHTML() {
    const e = this.ending();
    const st = this.st;
    return `
    <div class="screen fade">
      ${UI.hud(0, "囚徒困境")}
      <div class="debrief">
        <div class="debrief-head">
          <p class="eyebrow">第 1 章 · 结束 / AFTERMATH</p>
          <h2 class="debrief-title">${e.title}</h2>
        </div>
        ${UI.endingCard({ label: e.label, paras: e.paras, sign: e.sign })}
        <div class="stat-grid" style="margin-bottom:36px">
          <div class="stat"><b>${st.total > 0 ? "+" : ""}${st.total}</b><span>生存点数</span></div>
          <div class="stat"><b>${st.fired}</b><span>开火次数</span></div>
          <div class="stat"><b>${st.silent}</b><span>沉默次数</span></div>
          <div class="stat"><b>${st.firstStrike ? "是" : "否"}</b><span>先发制人</span></div>
        </div>
        <div class="brief-cta">
          <button class="btn btn--primary" type="button" data-act="debrief">翻开博弈论手记</button>
          <span class="hint">为什么理性的人会一起走向毁灭？</span>
        </div>
      </div>
    </div>`;
  }
};

const C1_INTEL = [
  {
    title: "《资源共享协议》",
    text: "终极规律号发来一份协议。雷达显示，它的武器系统正在预热。",
    hint: "它说它想合作。它也在准备开火。",
    log: "终极规律号：「协议仍然有效。请相信我们。」雷达：对方导弹舱门仍然关闭。"
  },
  {
    title: "食物储备清单",
    text: "对方公开了他们的储备清单，数字很诚实。你的工程师说，循环系统最多再撑四十天。",
    hint: "资源在减少。每一轮沉默，都在把最终的决定推得更近。",
    log: "对方发来了食物储备清单。数字精确到个位——精确得像是某种挑衅。"
  },
  {
    title: "深空号消失了",
    text: "深空号从雷达上消失了。公共频道里，有人开始哭泣。",
    hint: "已经有人先动手了。现在，你的「沉默」还安全吗？",
    log: "深空号的信号中断。没有人承认开火。频道里只剩下呼吸声。"
  },
  {
    title: "最后一次分配",
    text: "最后一次分配。终极规律号的引擎正在转向——它要从你的侧翼经过。",
    hint: "这是最后一轮。你知道，他也知道。",
    log: "终极规律号正在转向。它说：「这是最后一轮了，舰长。」"
  }
];

const C1_RESULT = {
  1: {
    silent: {
      silent: "两艘船交换了第一批物资。协议生效了。频道里有人笑了一声，听不出是放松还是嘲讽。",
      fire: "对方先开了火。你的舰体被撕开——协议还亮在屏幕上，光标一闪一闪。"
    },
    fire: {
      silent: "你先开了火。次声波氢弹穿过终极规律号的舰体，没有爆炸，只是安静地杀死了里面所有的人。",
      fire: "双方同时开火。两艘船都受了重伤。你们像两只在黑暗里互相撕咬的野兽，谁也没有松口。"
    }
  },
  2: {
    silent: {
      silent: "第二批物资完成了交换。你们的循环系统又能多撑十天。对方发来一张清单，末尾写着：「谢谢。」",
      fire: "对方开火了。你听见舰体撕裂的声音。那份清单还开着，最后一个字是「谢」。"
    },
    fire: {
      silent: "你趁他们卸货时开火。终极规律号的反应堆熄灭了。频道里传来半句没有说完的话。",
      fire: "双方同时开火。你们的舰体上多了第一个洞。对方也没有好到哪里去。"
    }
  },
  3: {
    silent: {
      silent: "深空号消失后，你们和终极规律号反而靠得更近了。没有人提起那件事。你们交换了最后一批氧气。",
      fire: "对方开火了。你终于明白：深空号不是消失，是被吃掉了。"
    },
    fire: {
      silent: "你开火了。对方没有还手。它的舰体在无声中裂开——频道里，有人还在念那份协议。",
      fire: "又是一次同时开火。你们的舰体上多了三个洞。对方也没有好到哪里去。"
    }
  },
  4: {
    silent: {
      silent: "最后一轮，你们都沉默了。这不在任何人的计算里。",
      fire: "最后一轮，对方先开了火。你签署的协议还亮在屏幕上。它没有救你。"
    },
    fire: {
      silent: "最后一轮，你先开了火。对方的舰长在频道里说：「你赢了。」然后信号断了。",
      fire: "最后一轮，你们都开了火。两艘船在黑暗里互相撕咬，谁也没有松口。"
    }
  }
};

const C1_END = {
  hunter: {
    title: "先发制人",
    label: "结局 · 唯一幸存者",
    paras: [
      "黑暗战役结束了。五艘战舰，只有蓝色空间号驶出了那片海域。",
      "你下令关掉次声波氢弹的发射架。舰桥上没有人说话。你在日志里写下：「我们活下来了。」就这一句。",
      "你活着。你的船上多了两千具尸体——属于别人的。宇宙没有审判你，宇宙只是继续黑着。",
      "你想起那份《资源共享协议》。它其实是一个很好的东西：它让被杀的人，在死前还以为自己是被信任的。"
    ],
    sign: "—— 黑暗战役 · 唯一幸存者"
  },
  coop: {
    title: "罕见的合作",
    label: "结局 · 例外",
    paras: [
      "你们分享了最后的物资。两艘船都活了下来——至少在抵达下一个恒星系之前。",
      "这是黑暗森林里极其罕见的一幕。它需要两个条件：双方都愿意承担被背叛的风险，并且都相信对方也愿意。",
      "它不会经常发生。也许，这正是它值得被记录的原因。"
    ],
    sign: "—— 黑暗战役 · 例外"
  },
  dead: {
    title: "先眨眼的人",
    label: "结局 · 阵亡",
    paras: [
      "你签署了协议。你等了很久。然后，终极规律号的导弹舱门打开了。",
      "次声波氢弹没有声音，也没有光。你甚至不知道自己是什么时候死的。",
      "在黑暗里，先眨眼的人，连光都看不见。"
    ],
    sign: "—— 黑暗战役 · 阵亡"
  },
  survivor: {
    title: "带着弹孔继续航行",
    label: "结局 · 幸存",
    paras: [
      "你们互相试探，互相开火，最后都活着，也都残破。",
      "你们的舰体上多了三个洞。没有人赢，也没有人输。你们带着弹孔，继续向黑暗深处驶去。",
      "你隐约觉得，这场战役并没有结束——它只是换了一个地方，重新开始。"
    ],
    sign: "—— 黑暗战役 · 幸存"
  }
};

/* ---------------------------------------------------------
   CH 2 — 执剑人 · 胆小鬼博弈
   --------------------------------------------------------- */

/* 每一年的局势：让八轮不只是同一个房间里的同一天 */
const C2_EVENTS = {
  1: "智子第一次走进控制室。她没有带武器，只带了一壶茶和两个杯子。她说：「我们可以谈谈。」",
  2: "三体舰队越过了奥尔特云。地面上，有人开始质疑：把两个世界的命交给一个人，是否明智。",
  3: "智子第二次来。她带来一份三体世界的报纸——头版是你的照片，标题写着：「他今天会按吗？」",
  4: "控制室外的走廊上，换班的士兵不敢看你的眼睛。他们把你的照片贴在墙上，像一张遗像。",
  5: "三体舰队开始加速。智子带来一份《共存协议》：只要人类放弃威慑，三体保证不灭绝人类。",
  6: "联合国开始讨论第二任执剑人的人选。有人在走廊里说：「他太老了。」你听见了。",
  7: "智子来得很早。她坐在那里，一句话也没说。茶凉了，她也没有续。",
  8: "这是最后一年。控制室的氧气循环出了故障——或者只是你觉得呼吸困难。智子说：「今天是最后一天了。」"
};

/* 同一个选项，不同的说法：按使用次数轮换，再叠加上下文特写 */
const C2_LINES = {
  silent: [
    "你没有说话。你只是看着她。五十四年，你学会了用沉默施加压力。",
    "你把开关放在桌上，手指没有离开它。她看着你的手，看了很久。",
    "你给她倒了一杯茶。她没喝。你也没喝。",
    "你想起第一次握住这个开关的下午。那时你还不知道，它会把你的后半生也一起握住。",
    "窗外是五千米岩层。你看不见星空，但你知道它在那里，也在看着你。",
    "你数着自己的心跳。七十二下。和昨天一样。",
    "她开口了。你抬起手，让她停下。有些话，说出来就轻了。"
  ],
  warn: [
    "你向三体舰队广播了一份声明。你的声音很平静，平静得像在念一份天气预报。",
    "你让全世界听见你的声音：「再前进一步，我们就一起消失。」",
    "你念出了那份改过十七遍的稿子。每一个字都像一颗钉子。",
    "你把开关举到镜头前，让三体看见它，也让人类看见它。",
    "你在广播里说了一个笑话。没有人笑。三体也没有。",
    "你警告他们：「我不是在谈判。我是在通知。」"
  ],
  mad: [
    "你打开了全球直播，启动了倒计时。四十亿人看着你的手。智子的影像闪烁了一下。",
    "你对着镜头说：「如果你们听见这段广播，说明我已经按了。」然后你笑了。",
    "你把倒计时设成十分钟，然后坐下来，给自己倒了一杯水。",
    "你让全世界看见你按在开关上的手。那只手没有抖——这比发抖更可怕。",
    "你在直播里念了一份名单：所有将被一起毁灭的城市。念到第三页时，智子关掉了直播。",
    "你开始唱歌。一首很老的歌。没有人知道你在唱什么，但所有人都知道你没有疯。"
  ],
  yield: [
    "你关闭了三分之一的发射阵列。你告诉自己，这只是为了活得更久一点。",
    "你签了那份协议。笔尖在纸上停了很久。",
    "你让士兵把发射阵列的保险栓重新插上。他们松了一口气。",
    "你对智子说：「今天不行。」她笑了。",
    "你回到地面，晒了太阳。五十四年来第一次。",
    "你把开关交给副手，睡了四个小时。梦里没有开关。"
  ]
};

const C2_SPECIAL = {
  silentStreak: "又是一年。你依然没有说话。连智子都开始习惯你的沉默——这未必是好事。",
  warnTired: "你的声音有些哑。你念到一半停了一下，喝了口水，然后继续。智子注意到了这个停顿。",
  madRepeat: "你又按了一次倒计时。这一次，连地面上的直播弹幕都少了。同一个疯子，第二次就没那么可怕了。",
  yieldLowD: "你关闭了最后一段还能关闭的阵列。控制室暗了下来。智子轻声说：「谢谢。」"
};

const C2_REPLY = {
  ok: [
    "智子沉默了几秒，说：「我们愿意再等一等。」舰队减速了。",
    "她看着你的手，看了很久。然后她说：「好吧。今年就这样。」",
    "她笑了一下，但那不是嘲弄。她说：「你比我们想的更难对付。」",
    "她收起茶具，站起来：「我们明年再来。」",
    "舰队在最后一刻转向。智子没有解释。",
    "她说：「你知道吗？在我们的世界里，没有人会这样握着一样东西。」",
    "她突然问：「你累吗？」你没有回答。"
  ],
  test: [
    "智子笑了。她说：「你不会按的。」一艘探测器越过了红线。",
    "她向前一步，把手放在开关旁边：「按啊。」你没有动。",
    "她说：「我们计算过。你有 73% 的概率不会按。赌了。」",
    "探测器从你头顶掠过。智子说：「明年见。」",
    "她叹了口气，像是对一个不听话的孩子：「你总是这样。」"
  ],
  okHigh: "她看着你的眼睛，第一次没有笑。她说：「我们回去要改一份评估报告。」",
  okLate: "舰队已经越过了柯伊伯带，但这一次，他们还是退了回去。智子说：「你赢了这一局。」",
  testWeak: "她看着你发抖的手：「你看，你连杯子都拿不稳了。」",
  testLow: "她甚至懒得再演戏。她说：「明年，我们就不来了。」"
};

const C2 = {
  id: "c2",
  phase: "brief",
  st: null,
  logFrom: 0,

  mount() {
    this.phase = "brief";
    this.logFrom = 0;
    this.st = {
      turn: 1, T: 0, D: 55, S: 100, prev: { T: 0, D: 55, S: 100 },
      phase: "choose", log: [], cool: 0, endKey: null, last: null,
      counts: { silent: 0, warn: 0, mad: 0, yield: 0 },
      streak: 0, lastAction: null, specials: {},
      replyIndex: { ok: 0, test: 0 },
      sawHigh: false, sawLate: false, sawWeak: false, sawLow: false
    };
    this.draw();
  },

  threshold() { return 42 + (this.st.turn - 1) * 6; },

  draw() { App.set(this.html()); },

  html() {
    if (this.phase === "brief") {
      return UI.brief(CHAPTERS[1], {
        intro: [
          "地下五千米。引力波发射控制室。你在这里坐了五十四年。",
          "你的手里握着一个开关。按下它，太阳系和三体世界的坐标会同时被广播给宇宙。然后，两个文明一起消失。",
          `${T("三体文明", "三体人")}怕你。不是怕你的舰队，是怕你真的会按。他们把这种怕，叫作<strong>威慑度</strong>。`,
          `<span class=\"em\">今天，${T("智子")}的全息影像出现在你面前。它说：「我们想谈一谈。」</span>`
        ],
        note: `三体文明住在四光年外，舰队正在逼近太阳系。${T("智子")}是他们发射的超级智能粒子，能看见地球上的每一个角落。你手里的${T("引力波发射", "开关")}会同时暴露两个文明的坐标——那是同归于尽的意思。`,
        rules: [
          { k: "回合", v: "8 个威慑纪元年" },
          { k: "威慑度", v: "必须高于三体的试探阈值" },
          { k: "意志", v: "每次强硬都会消耗它" },
          { k: "失败", v: "第八年失手 / 推进至 8 / 意志归零" }
        ],
        act: "begin", cta: "握住开关", hint: "第 8 年之后，你还要继续坐着"
      });
    }
    if (this.phase === "end") return this.endHTML();

    const st = this.st;
    const th = this.threshold();

    return `
    <div class="screen fade">
      ${UI.hud(1, "胆小鬼博弈")}
      <div class="stage">
        <section class="stage-main">
          ${this.scene(th)}
          <div class="panel">
            <div class="panel-head">
              <span class="panel-kicker">执剑人日志 / LOG</span>
              <span class="panel-meta">威慑纪元 ${st.turn} 年</span>
            </div>
            <div class="log-scroll">
              ${UI.log(st.log, this.logFrom)}
            </div>
          </div>
        </section>

        <aside class="stage-side">
          <div class="panel">
            <div class="panel-head">
              <span class="panel-kicker">STATUS</span>
              <span class="panel-meta">第 ${st.turn} / 8 年</span>
            </div>
            <div class="meter-row">
              ${UI.meter({ label: "威慑度", value: st.D, prev: st.prev.D, tone: "cyan", marker: th, markerLabel: "阈值 " + th })}
              ${UI.meter({ label: "三体推进", value: st.T, max: 8, prev: st.prev.T, tone: "red" })}
              ${UI.meter({ label: "你的意志", value: st.S, prev: st.prev.S, tone: "gold" })}
            </div>
            <div class="meter-legend"><span>◇ 高于阈值 = 收敛</span><span>◇ 低于阈值 = 试探</span></div>
          </div>

          <div class="panel">
            <div class="panel-head">
              <span class="panel-kicker">DECISION</span>
              <span class="panel-meta">${st.phase === "confirm" ? "最终确认" : "选择你的姿态"}</span>
            </div>
            ${st.phase === "confirm" ? this.confirmHTML() : this.chooseHTML()}
          </div>
        </aside>
      </div>
    </div>`;
  },

  scene(th) {
    const st = this.st;
    const fleet = Array.from({ length: 8 }, (_, i) => {
      if (i >= st.T) return "";
      const x = 372 - i * 14;
      return `<g>
        <path d="M${x} 118 l-9 16 l18 0 z" fill="#ff5d5d"/>
        <path d="M${x} 118 l-9 16 l18 0 z" fill="none" stroke="rgba(255,93,93,.6)" stroke-width="3"/>
      </g>`;
    }).join("");

    return `
    <div class="scene">
      <span class="scene-tag ${st.D >= th ? "is-calm" : ""}">${st.D >= th ? "DETERRENCE // 稳定" : "WARNING // 威慑不足"}</span>
      <svg viewBox="0 0 400 300" role="img" aria-label="威慑控制室">
        <defs>
          <radialGradient id="earth2" cx="38%" cy="34%" r="70%">
            <stop offset="0%" stop-color="#8fd6ff"/><stop offset="55%" stop-color="#2570a8"/><stop offset="100%" stop-color="#07131f"/>
          </radialGradient>
          <radialGradient id="btn2" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#ff9b9b"/><stop offset="55%" stop-color="#d92b2b"/><stop offset="100%" stop-color="#4a0808"/>
          </radialGradient>
          <filter id="glow2"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>

        <circle cx="64" cy="150" r="31" fill="url(#earth2)"/>
        <circle cx="64" cy="150" r="43" fill="none" stroke="rgba(111,217,255,.22)" stroke-width=".8"/>
        <text x="64" y="206" text-anchor="middle" font-family="monospace" font-size="8" letter-spacing="2" fill="rgba(125,145,165,.7)">太阳系</text>

        <g opacity=".9">${fleet}</g>
        <line x1="378" y1="126" x2="244" y2="126" stroke="rgba(255,93,93,.18)" stroke-width=".7" stroke-dasharray="1 6"/>
        ${st.T === 0 ? `<text x="378" y="118" text-anchor="end" font-family="monospace" font-size="7" letter-spacing="1.5" fill="rgba(125,145,165,.5)">FLEET OUT OF RANGE</text>` : ""}

        <g>
          <rect x="176" y="76" width="50" height="148" rx="4" fill="rgba(12,20,30,.85)" stroke="rgba(126,170,210,.25)"/>
          <circle cx="201" cy="92" r="3" fill="${st.D >= th ? "#5eead4" : "#ff5d5d"}"/>
          <circle cx="201" cy="150" r="19" fill="url(#btn2)" filter="url(#glow2)" class="bigbtn"/>
          <circle cx="201" cy="150" r="29" fill="none" stroke="rgba(255,93,93,.35)" stroke-width=".8" stroke-dasharray="2 5"/>
          <text x="201" y="184" text-anchor="middle" font-family="monospace" font-size="6.5" letter-spacing="1" fill="rgba(255,140,140,.75)">GRAVITY</text>
          <text x="201" y="194" text-anchor="middle" font-family="monospace" font-size="6.5" letter-spacing="1" fill="rgba(255,140,140,.75)">BROADCAST</text>
          <path d="M150 150 h22" stroke="rgba(255,93,93,.3)" stroke-width=".8"/>
          <path d="M230 150 h22" stroke="rgba(255,93,93,.3)" stroke-width=".8"/>
        </g>
      </svg>
      <div class="scene-caption">
        <span>引力波发射阵列 · <b>${st.D >= th ? "在线" : "被试探中"}</b></span>
        <span>三体舰队推进 ${st.T} / 8</span>
      </div>
    </div>`;
  },

  chooseHTML() {
    const st = this.st;
    const madCool = st.cool > 0;
    const weak = st.S < 25;
    return `
      ${UI.choices([
        { act: "act:silent", key: "1", title: "沉默对峙", desc: "什么也不做，只是看着他。", tag: "威慑 <b>+0</b><br>意志 <b>−6</b>" },
        { act: "act:warn", key: "2", title: "公开警告", desc: "广播声明：再前进一步，就一起消失。", tag: "威慑 <b>+9</b><br>意志 <b>−13</b>" },
        {
          act: "act:mad", key: "3", title: "展示疯狂",
          desc: madCool ? "重复的表演会被看穿。冷却中。" : (weak ? "你的手在抖，无法完成直播。" : "全球直播：你启动倒计时。"),
          tag: madCool ? "冷却 " + st.cool + " 年" : "威慑 <b>+22</b><br>意志 <b>−21</b>",
          disabled: madCool || weak, tone: "red"
        },
        { act: "act:yield", key: "4", title: "让步", desc: "关闭部分阵列，换取片刻安宁，恢复意志。", tag: "威慑 <b>−12</b><br>意志 <b>+19</b>", tone: "gold" }
      ])}
      <button class="choice choice--compact" type="button" data-act="act:press" data-tone="red" style="margin-top:9px">
        <span class="choice-key">5</span>
        <span class="choice-main"><b>按下开关</b><small>结束一切。没有赢家。</small></span>
        <span class="choice-tag">结局</span>
      </button>`;
  },

  confirmHTML() {
    return `
      <p class="panel-note" style="color:#ffb3b3;font-size:14px;line-height:2">
        按下它，太阳系与三体世界的坐标将同时暴露。两个文明都会在黑暗森林里被点亮，然后熄灭。
      </p>
      <p class="panel-note" style="margin-top:10px;color:var(--dim)">
        你确定吗？这不是一个可以撤回的选择。
      </p>
      <div class="choices" style="margin-top:18px">
        <button class="choice is-armed" type="button" data-act="confirm:press">
          <span class="choice-key">!</span>
          <span class="choice-main"><b>确认按下</b><small>同归于尽。威慑成立，但没有人活着看见它。</small></span>
          <span></span>
        </button>
        <button class="choice" type="button" data-act="cancel">
          <span class="choice-key">↩</span>
          <span class="choice-main"><b>把手收回来</b><small>还没有到那一步。</small></span>
          <span></span>
        </button>
      </div>`;
  },

  handle(act) {
    if (act === "begin") {
      this.phase = "play";
      this.pushEvent(1);
      this.st.log.push({ tag: "智子", text: "「五十四年了。你一直坐在这里，不累吗？」", who: "them" });
      this.draw();
      return;
    }
    if (act === "cancel") { this.st.phase = "choose"; this.draw(); return; }
    if (act === "confirm:press") { this.finish("press"); return; }
    if (act === "toDebrief") { App.chapterDebrief(1, this.payload()); return; }
    if (act.startsWith("act:")) {
      const a = act.split(":")[1];
      if (a === "press") { this.st.phase = "confirm"; this.draw(); return; }
      this.apply(a);
    }
  },

  apply(a) {
    const st = this.st;
    const th = this.threshold();
    st.prev = { T: st.T, D: st.D, S: st.S };
    const before = st.log.length;

    st.streak = st.lastAction === a ? st.streak + 1 : 1;
    st.lastAction = a;
    const line = this.pickLine(a);

    let dD = 0, dS = 0;

    if (a === "silent") {
      dD = 0; dS = -6;
    } else if (a === "warn") {
      dD = 9; dS = -13;
      Sound.tone(330, 0.18, "sine", 0.05);
    } else if (a === "mad") {
      dD = 22; dS = -21; st.cool = 2;
      Sound.alarm();
    } else if (a === "yield") {
      dD = -12; dS = 19;
    }

    st.D = clamp(st.D + dD, 0, 100);
    st.S = clamp(st.S + dS, 0, 100);

    if (st.D < 25) {
      st.T = clamp(st.T + 1, 0, 8);
      st.log.push({ tag: `第 ${st.turn} 年 · 你的行动`, text: line, who: "you" });
      st.log.push({ tag: "三体评估", text: "智子收起了笑容：「原来你也不会按。」", who: "them" });
      this.finish("invade");
      return;
    }

    // 三体评估
    const converged = st.D >= th;
    const reply = this.pickReply(converged);

    st.log.push({ tag: `第 ${st.turn} 年 · 你的行动`, text: line, who: "you" });

    if (converged) {
      st.T = Math.max(0, st.T - 1);
      st.log.push({
        tag: `第 ${st.turn} 年 · 三体评估 ${Math.round(st.D)} ≥ ${th}`,
        text: reply,
        who: "them"
      });
    } else {
      st.T = clamp(st.T + 1, 0, 8);
      st.D = clamp(st.D - 4, 0, 100);
      st.log.push({
        tag: `第 ${st.turn} 年 · 三体评估 ${Math.round(st.D)} < ${th}`,
        text: reply,
        who: "them"
      });
    }

    // 让步的代价：舰队推进，不受当年评估影响
    if (a === "yield") st.T = clamp(st.T + 1, 0, 8);

    st.cool = Math.max(0, st.cool - 1);
    st.last = a;

    if (st.S <= 0) { this.finish("collapse"); return; }
    if (st.T >= 8) { this.finish("invade"); return; }
    if (st.turn >= 8) {
      this.finish(converged ? "win" : "invade");
      return;
    }

    st.turn++;
    this.pushEvent(st.turn);
    this.st.phase = "choose";
    this.logFrom = before;
    this.draw();
    if (st.T >= 4) Toast.show("三体舰队已越过柯伊伯带", 2400);
    else if (st.S <= 30) Toast.show("你的手在发抖", 2000);
  },

  pushEvent(turn) {
    const e = C2_EVENTS[turn];
    if (e) this.st.log.push({ tag: `威慑纪元 ${turn} 年 · 局势`, text: e, who: "sys" });
  },

  pickLine(a) {
    const st = this.st;
    const n = st.counts[a]++;
    const once = k => {
      if (st.specials[k]) return false;
      st.specials[k] = true;
      return true;
    };
    if (a === "silent" && st.streak >= 3 && once("silentStreak")) return C2_SPECIAL.silentStreak;
    if (a === "warn" && st.S < 25 && once("warnTired")) return C2_SPECIAL.warnTired;
    if (a === "mad" && n >= 2 && once("madRepeat")) return C2_SPECIAL.madRepeat;
    if (a === "yield" && st.D < 35 && once("yieldLowD")) return C2_SPECIAL.yieldLowD;
    const pool = C2_LINES[a];
    return pool[n % pool.length];
  },

  pickReply(converged) {
    const st = this.st;
    if (converged) {
      if (st.D >= 90 && !st.sawHigh) { st.sawHigh = true; return C2_REPLY.okHigh; }
      if (st.T >= 4 && !st.sawLate) { st.sawLate = true; return C2_REPLY.okLate; }
      const i = st.replyIndex.ok++;
      return C2_REPLY.ok[i % C2_REPLY.ok.length];
    }
    if (st.S < 30 && !st.sawWeak) { st.sawWeak = true; return C2_REPLY.testWeak; }
    if (st.D < 30 && !st.sawLow) { st.sawLow = true; return C2_REPLY.testLow; }
    const i = st.replyIndex.test++;
    return C2_REPLY.test[i % C2_REPLY.test.length];
  },

  payload() {
    return { key: this.st.endKey, turn: this.st.turn, T: this.st.T, D: Math.round(this.st.D), S: Math.round(this.st.S) };
  },

  finish(key) {
    this.st.endKey = key;
    this.phase = "end";
    this.stats(key);
    Sound.press();
    this.draw();
  },

  stats(key) {
    const s = App.stats;
    s.deterrenceWin = key === "win";
    s.pressed = key === "press";
    s.deterrenceYears = this.st.turn;
    s.finalDeterrence = Math.round(this.st.D);
  },

  ending() {
    const k = this.st.endKey;
    return C2_END[k] || C2_END.win;
  },

  endHTML() {
    const e = this.ending();
    return `
    <div class="screen fade">
      ${UI.hud(1, "胆小鬼博弈")}
      <div class="debrief">
        <div class="debrief-head">
          <p class="eyebrow">第 2 章 · 结束 / AFTERMATH</p>
          <h2 class="debrief-title">${e.title}</h2>
        </div>
        ${UI.endingCard({ label: e.label, paras: e.paras, sign: e.sign })}
        <div class="stat-grid" style="margin-bottom:36px">
          <div class="stat"><b>${this.st.turn}</b><span>坚持年数</span></div>
          <div class="stat"><b>${Math.round(this.st.D)}</b><span>最终威慑度</span></div>
          <div class="stat"><b>${this.st.T}</b><span>三体推进</span></div>
          <div class="stat"><b>${Math.round(this.st.S)}</b><span>剩余意志</span></div>
        </div>
        <div class="brief-cta">
          <button class="btn btn--primary" type="button" data-act="toDebrief">翻开博弈论手记</button>
          <span class="hint">为什么「疯子」比「好人」更能阻止战争？</span>
        </div>
      </div>
    </div>`;
  }
};

const C2_END = {
  win: {
    title: "第八年，舰队转向了",
    label: "结局 · 威慑成立",
    paras: [
      "第八年，三体舰队转向了。你赢了。",
      "你低头看了看自己的手——它还在抖。你还有一点意志，够你再坐一年。",
      "智子最后一次来的时候，桌上的茶还是温的。她没有喝，只是说：「明年，我们还会来。」",
      "五十四年，你就是用这只手，握着两个世界的命。三体人怕的不是你，是你手里那个已经不需要再思考的决定。"
    ],
    sign: "—— 威慑纪元 · 执剑人"
  },
  press: {
    title: "两个坐标同时亮起",
    label: "结局 · 同归于尽",
    paras: [
      "你按下了。引力波穿过太阳系，穿过奥尔特云，穿过四光年外的三体世界。",
      "按钮陷下去的那一瞬间，你想起她第一次来的时候，带了一壶茶。",
      "两个坐标同时亮起。在宇宙的尺度上，这只是一次微弱的闪烁。",
      "智子在最后一刻说：「我们相信你了。」"
    ],
    sign: "—— 威慑纪元 · 终"
  },
  invade: {
    title: "开关还在手里，但已经不重要了",
    label: "结局 · 威慑失效",
    paras: [
      "三体舰队越过火星轨道。你的开关还在手里，但已经没有人再害怕它了。",
      "你终于明白：威慑不是那个按钮，是按钮背后的那个人。当他们相信你不会按下时，按钮就只是一个塑料疙瘩。",
      "智子从你身边经过，没有看你。她走的时候，替你带上了门。"
    ],
    sign: "—— 威慑纪元 · 沦陷"
  },
  collapse: {
    title: "你的手松开了",
    label: "结局 · 意志归零",
    paras: [
      "你的手松开了。开关落在地上，发出一声轻响。",
      "智子弯下腰，替你把它捡了起来，放回台面。她说：「谢谢你，这五十四年。」",
      "她给你倒了一杯茶。这一次，茶是热的。",
      "你突然很想哭。但你太累了，连哭的力气都没有。"
    ],
    sign: "—— 威慑纪元 · 崩溃"
  }
};

/* ---------------------------------------------------------
   CH 3 — 猜疑链 · 贝叶斯信号
   --------------------------------------------------------- */
const C3_ENCOUNTERS = [
  {
    name: "前哨 K-2", region: "中立星域",
    prior: 0.5,
    signal: { name: "质数序列", desc: "2, 3, 5, 7, 11, 13……一段重复的质数广播。", g: 0.8, h: 0.4 },
    first: true,
    flavor: "最古老的问候，也是最廉价的伪装。"
  },
  {
    name: "前哨 K-2", region: "中立星域",
    prior: 0.5,
    signal: { name: "静默", desc: "什么都没有。只有背景辐射，像一场没有尽头的雨。", g: 0.75, h: 0.35 },
    first: false,
    flavor: "没有信号，也是一种信号。"
  },
  {
    name: "猎场 7A", region: "猎手密集区",
    prior: 0.3,
    signal: { name: "一段童谣", desc: "一段人类语言的童谣，用未知的嗓音唱着。", g: 0.7, h: 0.55 },
    first: true,
    flavor: "这片星域，十个文明里有七个是猎手。"
  },
  {
    name: "摇篮 3F", region: "文明摇篮",
    prior: 0.75,
    signal: { name: "坐标交换请求", desc: "对方主动发来了自己的坐标，并请求交换。", g: 0.9, h: 0.5 },
    first: true,
    flavor: "主动暴露坐标，是一种昂贵的善意。"
  },
  {
    name: "镜像", region: "未知",
    prior: 0.5,
    signal: { name: "你们的通用问候协议", desc: "它发出的，正是你会发出的信号。一字不差。", g: 0.85, h: 0.85 },
    first: true,
    flavor: "它和你，在做同一道计算。"
  }
];

const C3_RESULT = [
  {
    contact: {
      good: "对方用同样的质数序列回应，然后加了一个新的数：下一个质数。你们开始用数学交谈。",
      bad: "对方回应了。它发送的不是数学，是一串坐标——你的坐标。"
    },
    clear: {
      good: "光粒命中了。质数序列停在 13。你永远不知道下一个质数是什么。",
      bad: "光粒命中了。你从残骸里读出了它的猎杀名单。上面有你的名字。"
    },
    silent: "你没有回应。信号在第七天停止了。你不知道那是放弃，还是出发。"
  },
  {
    contact: {
      good: "你主动发送了一段质数。三天后，对方回了一个更长的序列。它一直在听。",
      bad: "你的信号被放大了十倍，反射回你的接收器。它在用你当诱饵。"
    },
    clear: {
      good: "你向静默发射了光粒。那里什么也没有。你杀死了一片寂静。",
      bad: "你打中了它。它的最后一句话是：「你也是。」"
    },
    silent: "你没有回应。静默继续。你开始怀疑，那片静默是不是一种邀请。"
  },
  {
    contact: {
      good: "对方用同样的童谣回应，但换了一个声部。那是一首摇篮曲。",
      bad: "对方用那首童谣的调子，唱出了你的坐标。"
    },
    clear: {
      good: "光粒命中了。那首童谣的最后一句没有唱完。",
      bad: "光粒命中了。它的残骸里有一张星图，标着十几个已经熄灭的坐标。"
    },
    silent: "你没有回应。童谣唱了三天，然后停了。"
  },
  {
    contact: {
      good: "对方发来了它的坐标，还有一句话：「我们这里有一片海。」",
      bad: "对方接受了你的坐标，然后把它转发给了整片星域。"
    },
    clear: {
      good: "光粒命中了。它发来的坐标还在屏幕上，那片海也在。",
      bad: "你打中了它。它的坐标是假的，但你的光粒是真的。"
    },
    silent: "你没有回应。它又发了一次坐标，然后也沉默了。"
  },
  {
    contact: {
      good: "对方用你的语言回应：「你好。」你无法判断这是真心，还是它从你的广播里学会的。",
      bad: "它用你的语言说：「谢谢。」然后你的屏幕黑了。"
    },
    clear: {
      good: "光粒命中了。它最后发出的，还是你的通用问候协议。",
      bad: "光粒命中了。它没有躲。它好像一直在等这一刻。"
    },
    silent: "你没有回应。它重复了三次问候，然后消失了。"
  }
];

const C3 = {
  id: "c3",
  phase: "brief",
  st: null,
  logFrom: 0,

  mount() {
    this.phase = "brief";
    this.logFrom = 0;
    this.st = {
      idx: 0, post: 0.5, obs: [], phase: "choose", log: [],
      exposure: 0, safety: 3, knowledge: 0,
      contacts: 0, clears: 0, silences: 0, morality: 0,
      hits: 0, judged: 0, endKey: null, last: null, revealed: false, extended: false
    };
    this.draw();
  },

  draw() { App.set(this.html()); },

  enc() { return C3_ENCOUNTERS[this.st.idx]; },

  bayes(prior, g, h, isSignal) {
    const pg = isSignal ? g : 1 - g;
    const ph = isSignal ? h : 1 - h;
    const a = pg * prior, b = ph * (1 - prior);
    return a + b === 0 ? prior : a / (a + b);
  },

  startEncounter() {
    const st = this.st, e = this.enc();
    st.post = e.prior;
    st.obs = [{ name: e.signal.name, isSignal: e.first, g: e.signal.g, h: e.signal.h, desc: e.signal.desc }];
    st.post = this.bayes(e.prior, e.signal.g, e.signal.h, e.first);
    st.phase = "choose";
    st.revealed = false;
    st.extended = false;
    st.last = null;
  },

  html() {
    if (this.phase === "brief") {
      return UI.brief(CHAPTERS[2], {
        intro: [
          "你是深空监听站的一名分析员。你的工作，是听。",
          "今夜，你收到了第一个信号。它来自 4.2 光年外的一颗行星，只有一段重复的脉冲：一个质数序列。这是宇宙里最便宜的自我介绍。",
          "你不知道对方是谁。你只知道：<strong>善意和恶意，都可以发出同样的信号。</strong>",
          "<span class=\"em\">五次接触。每一次，你都要在看见之后，决定相信什么。</span>"
        ],
        note: `${T("黑暗森林", "黑暗森林法则")}认为，宇宙里每个文明都是带枪的猎人，被发现坐标的文明会被更强大的文明消灭。所以，一个友善的信号，也可能只是猎手的伪装。`,
        rules: [
          { k: "接触", v: "获得知识，但暴露坐标" },
          { k: "静默", v: "什么也不发生" },
          { k: "清除", v: "先发制人，可能杀错" },
          { k: "延长监听", v: "多一个信号，多六点暴露" }
        ],
        act: "begin", cta: "开始监听", hint: "先看分母，再看证据"
      });
    }
    if (this.phase === "end") return this.endHTML();

    const st = this.st, e = this.enc();
    const good = Math.round(st.post * 100);

    return `
    <div class="screen fade">
      ${UI.hud(2, "贝叶斯信号")}
      <div class="stage">
        <section class="stage-main">
          <div class="scene">
            <span class="scene-tag ${good >= 50 ? "is-calm" : ""}">SIGNAL ${String(st.idx + 1).padStart(2, "0")} // ${e.region}</span>
            <div style="width:100%;padding:26px 0 10px">
              ${UI.sceneWave({ strength: 0.35 + good / 200 })}
              <div style="text-align:center;margin-top:6px">
                <div class="mono" style="font-size:9px;letter-spacing:.3em;color:var(--faint)">${e.name} · 信号解析</div>
                <div class="serif" style="font-size:22px;letter-spacing:.12em;margin-top:8px">${this.obsTitle()}</div>
              </div>
            </div>
            <div class="scene-caption"><span>监听站 · <b>被动接收</b></span><span>暴露度 ${st.exposure} / 100</span></div>
          </div>

          <div class="panel">
            <div class="panel-head">
              <span class="panel-kicker">监听日志 / LOG</span>
              <span class="panel-meta">${st.idx + 1} / 5 次接触</span>
            </div>
            <div class="log-scroll">
              ${UI.log(st.log, this.logFrom)}
            </div>
          </div>
        </section>

        <aside class="stage-side">
          <div class="panel">
            <div class="panel-head">
              <span class="panel-kicker">判断 / BELIEF</span>
              <span class="panel-meta">P(善意) = ${(st.post * 100).toFixed(0)}%</span>
            </div>
            <div class="belief">
              <div class="belief-bar"><i style="width:${(st.post * 100).toFixed(1)}%"></i></div>
              <div class="belief-labels"><span>善意 ${(st.post * 100).toFixed(0)}%</span><span>猎手 ${((1 - st.post) * 100).toFixed(0)}%</span></div>
            </div>
            ${this.bayesHTML()}
            <div class="rule" style="margin:14px 0"></div>
            <div style="display:flex;gap:16px;font-family:var(--mono);font-size:9px;letter-spacing:.14em;color:var(--faint)">
              <span>安全 <b style="color:var(--ink-2)">${st.safety}</b></span>
              <span>知识 <b style="color:var(--ink-2)">${st.knowledge}</b></span>
              <span>道德 <b style="color:var(--ink-2)">${st.morality}</b></span>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head">
              <span class="panel-kicker">DECISION</span>
              <span class="panel-meta">${st.phase === "result" ? "已观测" : "你的回应"}</span>
            </div>
            ${st.phase === "result" ? this.resultHTML() : this.chooseHTML()}
          </div>
        </aside>
      </div>
    </div>`;
  },

  obsTitle() {
    const st = this.st;
    const last = st.obs[st.obs.length - 1];
    return last.isSignal ? `「${last.name}」` : "「静默」";
  },

  bayesHTML() {
    const st = this.st;
    const last = st.obs[st.obs.length - 1];
    const prior = st.obs.length > 1 ? st.postBefore : this.enc().prior;
    const pg = last.isSignal ? last.g : 1 - last.g;
    const ph = last.isSignal ? last.h : 1 - last.h;
    const a = pg * prior, b = ph * (1 - prior);
    return `
      <div class="bayes">
        <div class="bayes-row"><span>先验 P(善意)</span><b>${(prior * 100).toFixed(0)}%</b></div>
        <div class="bayes-row"><span>P(${last.isSignal ? "信号" : "静默"} | 善意)</span><b>${(pg * 100).toFixed(0)}%</b></div>
        <div class="bayes-row"><span>P(${last.isSignal ? "信号" : "静默"} | 猎手)</span><b>${(ph * 100).toFixed(0)}%</b></div>
        <div class="bayes-calc">${a.toFixed(2)} ÷ (${a.toFixed(2)} + ${b.toFixed(2)}) = <b>${(st.post * 100).toFixed(0)}%</b></div>
      </div>`;
  },

  chooseHTML() {
    const st = this.st;
    const e = this.enc();
    return `
      ${st.obs.length > 1 ? `<div class="obs-list">${st.obs.map((o, i) => `<span class="obs-chip">${i + 1}. ${o.isSignal ? o.name : "静默"}</span>`).join("")}</div>` : ""}
      ${UI.choices([
        { act: "act:contact", key: "1", title: "接触", desc: "发送友好回应，尝试交换信息。", tag: "善意 <b>+2 知识</b><br>猎手 <b>−1 安全</b>" },
        { act: "act:silent", key: "2", title: "静默", desc: "不回应，只记录。什么也不会发生。", tag: "无收益<br>无暴露" },
        { act: "act:clear", key: "3", title: "清除", desc: "向那个坐标发射一枚光粒。", tag: "猎手 <b>+1 安全</b><br>善意 <b>−1 道德</b>", tone: "red" }
      ])}
      <button class="btn btn--ghost btn--sm" type="button" data-act="extend" style="width:100%;margin-top:12px"
        ${st.extended || st.obs.length > 2 ? "disabled" : ""}>
        延长监听 · 再听一个信号（暴露 +6）
      </button>
      <p class="panel-note" style="margin-top:10px;color:var(--faint)">${e.flavor}</p>`;
  },

  resultHTML() {
    const l = this.st.last;
    return `
      <div class="mono" style="font-size:9px;letter-spacing:.22em;color:${l.good ? "var(--teal)" : "var(--red)"};margin-bottom:10px">
        ${l.good ? "判定 · 这是一个善意文明" : "判定 · 这是一个猎手文明"}
      </div>
      <p class="panel-note" style="color:var(--ink-2);font-size:13.5px;line-height:2">${l.text}</p>
      <div class="mono" style="margin:14px 0;font-size:11px;letter-spacing:.12em;color:var(--ink-2)">
        知识 ${signed(l.dk)}　安全 ${signed(l.ds)}　暴露 ${signed(l.de)}　道德 ${signed(l.dm)}
      </div>
      <button class="btn btn--primary" type="button" data-act="next" style="width:100%">
        ${this.st.idx >= 4 ? "结束监听" : "下一个信号"} →
      </button>`;
  },

  handle(act) {
    if (act === "begin") {
      this.phase = "play";
      this.startEncounter();
      this.st.log.push({ tag: "第一次接触", text: "你锁定了一个信号源。它正在重复发送一段质数序列。", who: "sys" });
      this.draw();
      return;
    }
    if (act === "extend") { this.extend(); return; }
    if (act === "next") {
      if (this.st.idx >= 4) { this.finish("survive"); return; }
      this.st.idx++;
      if (this.st.idx === 3) {
        this.st.log.push({
          tag: "第 4 天 · 新闻",
          text: "4.2 光年外的一颗恒星被摧毁了。光粒。有人在你之前，回答了那个信号。",
          who: "sys"
        });
      }
      this.startEncounter();
      this.st.log.push({ tag: `第 ${this.st.idx + 1} 次接触`, text: `新的信号来自「${this.enc().name}」。${this.enc().flavor}`, who: "sys" });
      this.draw();
      return;
    }
    if (act.startsWith("act:")) {
      if (this.st.phase !== "choose") return;
      this.resolve(act.split(":")[1]);
    }
  },

  extend() {
    const st = this.st, e = this.enc();
    if (st.extended || st.obs.length > 2) return;
    st.extended = true;
    st.postBefore = st.post;
    const pSig = e.signal.g * st.post + e.signal.h * (1 - st.post);
    const isSignal = Math.random() < pSig;
    st.obs.push({ name: e.signal.name, isSignal, g: e.signal.g, h: e.signal.h, desc: e.signal.desc });
    st.exposure += 6;
    st.post = this.bayes(st.post, e.signal.g, e.signal.h, isSignal);
    st.log.push({ tag: "延长监听", text: isSignal ? "你又听到了它。信号重复了一次。" : "你等了很久。这一次，什么都没有。", who: "sys" });
    if (st.exposure >= 100) { this.finish("located"); return; }
    this.draw();
  },

  resolve(action) {
    const st = this.st;
    const good = Math.random() < st.post;
    const r = C3_RESULT[st.idx];
    let dk = 0, ds = 0, de = 0, dm = 0, text = "";

    if (action === "contact") {
      st.contacts++;
      if (good) {
        dk = 2; de = 8; text = r.contact.good;
        st.hits++;
      } else {
        ds = -1; de = 30; text = r.contact.bad;
      }
      st.judged++;
    } else if (action === "clear") {
      st.clears++;
      if (good) {
        dk = -1; dm = -1; de = 10; text = r.clear.good;
      } else {
        ds = 1; dk = 1; de = 12; text = r.clear.bad;
        st.hits++;
      }
      st.judged++;
    } else {
      st.silences++;
      text = r.silent;
    }

    st.knowledge += dk; st.safety += ds; st.exposure += de; st.morality += dm;
    st.last = { good, text, dk, ds, de, dm };
    st.phase = "result";
    st.log.push({
      tag: action === "contact" ? "你选择了接触" : action === "clear" ? "你选择了清除" : "你选择了静默",
      text, who: "you"
    });

    if (st.safety <= 0) { this.finish("hunted"); return; }
    if (st.exposure >= 100) { this.finish("located"); return; }
    Sound.tone(good ? 520 : 140, 0.4, good ? "sine" : "sawtooth", 0.05, good ? 80 : -50);
    this.draw();
  },

  finish(key) {
    this.st.endKey = key;
    this.phase = "end";
    this.stats();
    this.draw();
  },

  stats() {
    const s = App.stats;
    s.contacts += this.st.contacts;
    s.clears += this.st.clears;
    s.bayesHits += this.st.hits;
    s.bayesTotal += this.st.judged;
    s.exposure = this.st.exposure;
  },

  ending() {
    const k = this.st.endKey;
    if (k === "hunted") return C3_END.hunted;
    if (k === "located") return C3_END.located;
    return C3_END.survive;
  },

  endHTML() {
    const e = this.ending();
    const st = this.st;
    return `
    <div class="screen fade">
      ${UI.hud(2, "贝叶斯信号")}
      <div class="debrief">
        <div class="debrief-head">
          <p class="eyebrow">第 3 章 · 结束 / AFTERMATH</p>
          <h2 class="debrief-title">${e.title}</h2>
        </div>
        ${UI.endingCard({ label: e.label, paras: e.paras, sign: e.sign })}
        <div class="stat-grid" style="margin-bottom:36px">
          <div class="stat"><b>${st.contacts}</b><span>接触次数</span></div>
          <div class="stat"><b>${st.clears}</b><span>清除次数</span></div>
          <div class="stat"><b>${st.exposure}</b><span>最终暴露度</span></div>
          <div class="stat"><b>${st.hits}/${st.judged || 0}</b><span>判断命中</span></div>
        </div>
        <div class="brief-cta">
          <button class="btn btn--primary" type="button" data-act="toDebrief">翻开博弈论手记</button>
          <span class="hint">为什么「友善信号」不能证明友善？</span>
        </div>
      </div>
    </div>`;
  },

  payload() {
    return {
      contacts: this.st.contacts, clears: this.st.clears, exposure: this.st.exposure,
      hits: this.st.hits, judged: this.st.judged, endKey: this.st.endKey
    };
  }
};

const C3_END = {
  survive: {
    title: "宇宙还是那么安静",
    label: "结局 · 监听继续",
    paras: [
      "你活了下来。你的记录里有几次接触、几次清除，和一条不断上升的暴露度曲线。",
      "宇宙还是那么安静。安静得像什么都没有发生过。",
      "你把今天的所有判断归档。明天，还会有新的信号。你希望自己仍然分得清「听见」和「相信」。"
    ],
    sign: "—— 监听站 · 第 4,127 天"
  },
  hunted: {
    title: "猎手先看见了你",
    label: "结局 · 被猎杀",
    paras: [
      "你的安全余量归零了。最后一次接触里，对方没有回应你的问候。",
      "它只是把你的坐标，转发给了它认识的每一个猎手。",
      "在黑暗森林里，一次错误的善意，就足够致命。"
    ],
    sign: "—— 监听站 · 信号中断"
  },
  located: {
    title: "「找到你了。」",
    label: "结局 · 坐标暴露",
    paras: [
      "暴露度达到了一百。你的监听站收到了最后一段信号，只有两个音节。",
      "翻译过来是：「找到你了。」",
      "你关掉了所有设备。但已经太晚了——坐标一旦进入宇宙，就再也收不回来。"
    ],
    sign: "—— 监听站 · 终止"
  }
};

/* ---------------------------------------------------------
   CH 4 — 面壁者 · 混合策略
   --------------------------------------------------------- */
const C4_PLANS = [
  { name: "掩体计划", en: "BUNKER", desc: "把太阳系变成堡垒。安全，但也会被困住。" },
  { name: "黑域计划", en: "BLACK DOMAIN", desc: "降低光速，制造黑域。自毁，但绝对安全。" },
  { name: "光速飞船", en: "LIGHTSPEED", desc: "造飞船逃离。冒险，但保留火种。" }
];
const C4_COUNTERS = ["封锁", "干扰", "诱导"];
const C4_M = [
  [-3, 2, 1],
  [1, -3, 2],
  [2, 1, -3]
];

const C4 = {
  id: "c4",
  phase: "brief",
  st: null,
  logFrom: 0,

  mount() {
    this.phase = "brief";
    this.logFrom = 0;
    this.st = {
      round: 1, score: 0, weights: [1, 1, 1], history: [], log: [],
      phase: "choose", last: null, dice: 2, entropies: [], endKey: null,
      planStreak: 0, lastPlan: null
    };
    this.draw();
  },

  draw() {
    if (typeof Hologram !== "undefined") {
      const last = this.st.last;
      Hologram.setState("plans", {
        prediction: this.prediction(),
        last: last ? { ...last, counter: C4_COUNTERS[last.them] } : null,
        round: this.st.round
      });
    }
    App.set(this.html());
  },

  prediction() {
    const w = this.st.weights;
    const s = w[0] + w[1] + w[2];
    return w.map(x => x / s);
  },

  html() {
    if (this.phase === "brief") {
      return UI.brief(CHAPTERS[3], {
        intro: [
          "面壁计划，第七年。你是第四位面壁者。",
          `你的真实计划不能告诉任何人——包括你自己。因为${T("破壁人")}能从你的每一个表情、每一次呼吸里，读出答案。`,
          `你面前有三份方案：${T("掩体计划")}、${T("黑域")}、${T("光速飞船")}。破壁人也在选择他的对策。`,
          "<span class=\"em\">他知道你会怎么选吗？</span>"
        ],
        note: "面壁者是人类选出的四位战略家。因为智子能读取一切，他们的真实计划只能藏在脑子里；三体则为每个人指定了一名「破壁人」，任务是识破它。",
        rules: [
          { k: "回合", v: "5 轮同时决策" },
          { k: "得分", v: "正分 = 计划保留，负分 = 被破壁" },
          { k: "关键", v: "破壁人会预测你，别让他猜中" },
          { k: "骰子", v: "两次机会，强行随机" }
        ],
        act: "begin", cta: "走进会议室", hint: "人类不擅长随机，这是真的"
      });
    }
    if (this.phase === "end") return this.endHTML();

    const st = this.st;
    const p = this.prediction();
    const maxP = Math.max(...p);
    const predict = Math.round(((maxP - 1 / 3) / (2 / 3)) * 100);

    return `
    <div class="screen fade">
      ${UI.hud(3, "混合策略")}
      <div class="stage">
        <section class="stage-main">
          ${this.scene()}
          <div class="panel">
            <div class="panel-head">
              <span class="panel-kicker">面壁者日志 / LOG</span>
              <span class="panel-meta">累计 ${st.score > 0 ? "+" : ""}${st.score}</span>
            </div>
            <div class="log-scroll">
              ${UI.log(st.log, this.logFrom)}
            </div>
          </div>
        </section>

        <aside class="stage-side">
          <div class="panel">
            <div class="panel-head">
              <span class="panel-kicker">破壁人的预测</span>
              <span class="panel-meta">可预测性 ${predict}%</span>
            </div>
            <div class="prediction">
              ${C4_PLANS.map((pl, i) => `
                <div class="prow">
                  <span>${pl.name}</span>
                  <span class="ptrack"><i style="width:${(p[i] * 100).toFixed(1)}%"></i></span>
                  <b>${Math.round(p[i] * 100)}%</b>
                </div>`).join("")}
            </div>
            <p class="panel-note" style="margin-top:12px;color:var(--faint)">
              ${predict > 40 ? "破壁人已经摸到你的习惯了。他会押这一手。" : "他还没有抓住你的模式。"}
            </p>
          </div>

          <div class="panel">
            <div class="panel-head">
              <span class="panel-kicker">DECISION</span>
              <span class="panel-meta">回合 ${st.round} / 5</span>
            </div>
            ${st.phase === "result" ? this.resultHTML() : this.chooseHTML()}
          </div>
        </aside>
      </div>
    </div>`;
  },

  scene() {
    const st = this.st;
    return `
    <div class="scene scene--3d">
      <span class="scene-tag ${st.score >= 0 ? "is-calm" : ""}">WALLFACER // 计划 ${st.round}/5</span>
      <canvas data-holo="plans" tabindex="0" aria-label="三维计划星图，可拖拽旋转，滚轮缩放"></canvas>
      <span class="holo-hint">拖拽旋转 · 滚轮缩放</span>
      <div class="scene-caption"><span>联合国 · 面壁计划听证会</span><span>破壁人在看着你</span></div>
    </div>`;
  },

  chooseHTML() {
    const st = this.st;
    return `
      ${UI.choices(C4_PLANS.map((pl, i) => {
        const pay = C4_M[i].map((v, j) => `<span style="color:${v > 0 ? "var(--teal)" : "#ff8d8d"}">${C4_COUNTERS[j]} ${v > 0 ? "+" : ""}${v}</span>`).join("　");
        return {
          act: "plan:" + i,
          key: String(i + 1),
          title: pl.name,
          desc: `${pl.desc}<br><span class="mono" style="font-size:10px;letter-spacing:.02em">${pay}</span>`
        };
      }))}
      <button class="btn btn--ghost btn--sm" type="button" data-act="dice" style="width:100%;margin-top:12px" ${st.dice <= 0 ? "disabled" : ""}>
        面壁者的骰子 · 强行随机（剩 ${st.dice} 次）
      </button>`;
  },

  resultHTML() {
    const l = this.st.last;
    return `
      <div class="reveal-row">
        <div class="reveal-side is-you"><small>你</small><b>${C4_PLANS[l.you].name.replace("计划", "").replace("飞船", "")}</b></div>
        <div class="reveal-vs">VS</div>
        <div class="reveal-side is-them"><small>破壁人</small><b>${C4_COUNTERS[l.them]}</b></div>
      </div>
      <p class="panel-note" style="color:var(--ink-2);font-size:13.5px">${l.text}</p>
      <div class="mono" style="margin:14px 0;font-size:11px;letter-spacing:.14em;color:${l.pts >= 0 ? "var(--teal)" : "var(--red)"}">
        本轮 ${signed(l.pts)} · 累计 ${signed(this.st.score + l.pts)}
      </div>
      <button class="btn btn--primary" type="button" data-act="next" style="width:100%">
        ${this.st.round >= 5 ? "结束听证" : "进入下一轮"} →
      </button>`;
  },

  aiPick(p) {
    const ev = C4_COUNTERS.map((_, j) => p[0] * C4_M[0][j] + p[1] * C4_M[1][j] + p[2] * C4_M[2][j]);
    let best = 0;
    ev.forEach((v, i) => { if (v < ev[best]) best = i; });
    if (Math.random() < 0.18) return randInt(0, 2);
    return best;
  },

  resolve(i, forced) {
    const st = this.st;
    const p = this.prediction();
    st.entropies.push(-p.reduce((a, x) => a + (x > 0 ? x * Math.log(x) : 0), 0) / Math.log(3));
    const them = this.aiPick(p);
    const pts = C4_M[i][them];

    st.score += pts;
    st.history.push({ i, them, pts });
    st.last = { you: i, them, pts, text: C4_RESULT_TEXT[i][them] };
    st.phase = "result";
    st.planStreak = st.lastPlan === i ? st.planStreak + 1 : 1;
    st.lastPlan = i;
    if (st.planStreak === 3) {
      st.log.push({ tag: "破壁人", text: "「你总是选同一个。这不是策略，是习惯。」", who: "them" });
    }
    st.log.push({
      tag: `第 ${st.round} 轮 · ${C4_PLANS[i].name} / ${C4_COUNTERS[them]}`,
      text: C4_RESULT_TEXT[i][them], delta: pts, who: "you"
    });
    if (forced) st.log.push({ tag: "骰子", text: "你让骰子替你做了决定。破壁人愣了一下。", who: "sys" });

    // 更新破壁人的信念
    st.weights[i] += 2.4;
    st.weights = st.weights.map(x => Math.max(0.55, x * 0.86));

    Sound.tone(pts >= 0 ? 460 : 180, 0.2, pts >= 0 ? "sine" : "sawtooth", 0.05, pts >= 0 ? 60 : -40);
    this.draw();
  },

  handle(act) {
    if (act === "begin") {
      this.phase = "play";
      this.st.log.push({ tag: "听证会开始", text: "三位破壁人坐在长桌对面。最年轻的那位抬起头，看着你的眼睛。", who: "them" });
      this.draw();
      return;
    }
    if (act === "dice") {
      if (this.st.dice <= 0 || this.st.phase !== "choose") return;
      this.st.dice--;
      Toast.show("骰子决定了你的计划");
      this.resolve(randInt(0, 2), true);
      return;
    }
    if (act === "next") {
      if (this.st.round >= 5) { this.finish(); return; }
      this.st.round++;
      this.st.phase = "choose";
      this.st.last = null;
      this.st.log.push({ tag: `第 ${this.st.round} 轮`, text: C4_ROUND_LINES[this.st.round - 1], who: "them" });
      this.draw();
      return;
    }
    if (act.startsWith("plan:")) {
      if (this.st.phase !== "choose") return;
      this.resolve(parseInt(act.split(":")[1], 10), false);
    }
  },

  finish() {
    this.phase = "end";
    const st = this.st;
    const avg = st.entropies.length ? st.entropies.reduce((a, b) => a + b, 0) / st.entropies.length : 1;
    App.stats.mixedScore = st.score;
    App.stats.randomness = Math.round(avg * 100);
    App.stats.diceUsed = 2 - st.dice;
    Sound.confirm();
    this.draw();
  },

  ending() {
    const s = this.st.score;
    if (s >= 4) return C4_END.win;
    if (s >= -3) return C4_END.draw;
    return C4_END.lose;
  },

  endHTML() {
    const e = this.ending();
    const st = this.st;
    return `
    <div class="screen fade">
      ${UI.hud(3, "混合策略")}
      <div class="debrief">
        <div class="debrief-head">
          <p class="eyebrow">第 4 章 · 结束 / AFTERMATH</p>
          <h2 class="debrief-title">${e.title}</h2>
        </div>
        ${UI.endingCard({ label: e.label, paras: e.paras, sign: e.sign })}
        <div class="stat-grid" style="margin-bottom:36px">
          <div class="stat"><b>${signed(st.score)}</b><span>计划得分</span></div>
          <div class="stat"><b>${App.stats.randomness}%</b><span>随机性</span></div>
          <div class="stat"><b>${st.history.filter(h => h.pts > 0).length}/5</b><span>成功回合</span></div>
          <div class="stat"><b>${2 - st.dice}</b><span>使用骰子</span></div>
        </div>
        <div class="brief-cta">
          <button class="btn btn--primary" type="button" data-act="toDebrief">翻开博弈论手记</button>
          <span class="hint">为什么「随机」也是一种策略？</span>
        </div>
      </div>
    </div>`;
  },

  payload() {
    return { score: this.st.score, randomness: App.stats.randomness, diceUsed: App.stats.diceUsed };
  }
};

const C4_RESULT_TEXT = [
  [
    "破壁人封锁了太阳系。你的掩体成了坟墓：你把自己埋在了最安全的地方。",
    "破壁人干扰了关键实验。掩体的数据在最后一刻变成了噪声。",
    "破壁人诱导你加固掩体。你花了五年，把一座墓碑修得更坚固。"
  ],
  [
    "破壁人封锁了太阳系。黑域还没造好，门就先被关上了。",
    "破壁人干扰了关键实验。光速降不下来，黑域只是一个词。",
    "破壁人诱导你提前启动黑域。你把自己关了进去，也把人类关了进去。"
  ],
  [
    "破壁人封锁了太阳系。飞船还在船坞里，钥匙已经被收走了。",
    "破壁人干扰了关键实验。曲率引擎在最后一步变成了烟花。",
    "破壁人诱导你把资源投进一艘永远造不完的船。你看着它，像看着一个不会长大的孩子。"
  ]
];

const C4_ROUND_LINES = [
  "破壁人：「你的计划，写在你的睡眠里。」",
  "消息传来：第三位面壁者的计划被公开了。他在办公室里坐了一整夜，没有开灯。",
  "第二位面壁者被破壁。电视里，他的照片和「骗子」两个字放在一起。",
  "第一位面壁者死了。官方说法是意外。你知道不是。",
  "现在，只剩你了。破壁人合上笔记本，看着你。"
];

const C4_END = {
  win: {
    title: "破壁人失败了",
    label: "结局 · 计划完整",
    paras: [
      "五年过去，你的计划依然完整。破壁人合上笔记本，第一次露出了疲惫的表情。",
      "他没有看穿你，因为你没有给他一个稳定的你。",
      "三位同僚的名字已经从墙上取下来了。你的还在。",
      "你走出会议室。走廊尽头的窗外，太阳照常升起。你突然意识到：你也不知道自己下一步会做什么。"
    ],
    sign: "—— 面壁计划 · 第七年"
  },
  draw: {
    title: "一场平局",
    label: "结局 · 势均力敌",
    paras: [
      "你们的博弈以平局告终。计划保住了一半，也失去了一半。",
      "破壁人在门口叫住你，说：「你比我想的更难猜。」",
      "你回答：「我自己也猜不到。」这不是谎话。"
    ],
    sign: "—— 面壁计划 · 第七年"
  },
  lose: {
    title: "他看穿了你",
    label: "结局 · 破壁成功",
    paras: [
      "破壁人站起来，把你的计划一页一页地念了出来。一个字都没有错。",
      "你一直以为自己是在隐藏，其实你只是在重复。",
      "你是第四个。前三个的名字，已经在墙上挂了很久。",
      "「你不是输给了我，」他说，「你是输给了你自己的习惯。」"
    ],
    sign: "—— 面壁计划 · 第七年"
  }
};

/* ---------------------------------------------------------
   DEBRIEFS — 博弈论手记
   --------------------------------------------------------- */
C1.debriefHTML = function (p) {
  const e = p.ending;
  return `
  <div class="screen fade">
    ${UI.hud(0, "囚徒困境")}
    <div class="debrief">
      <div class="debrief-head">
        <p class="eyebrow">博弈论手记 / DEBRIEF 01</p>
        <h2 class="debrief-title">为什么他们一定会开火？</h2>
      </div>
      ${UI.endingCard({ label: e.label, paras: e.paras, sign: e.sign })}
      <div class="lesson">
        <p>你刚刚玩的，是博弈论里最著名的模型：<b>囚徒困境</b>（Prisoner's Dilemma）。你做了 ${p.silent} 次沉默、${p.fired} 次开火，最后拿到 ${signed(p.total)} 点生存点数。现在，我们把这个矩阵拆开看。</p>

        <div class="split">
          <div>${UI.matrix({
            cols: ["对方沉默", "对方开火"],
            rows: ["你沉默", "你开火"],
            data: [[3, -5], [5, -2]],
            caption: "每轮生存点数"
          })}</div>
          <div>
            <p>无论对方怎么选，开火对你都更好：</p>
            <p class="mono" style="font-size:13px;line-height:2.2">
              对方沉默：<b>5 &gt; 3</b><br>
              对方开火：<b>−2 &gt; −5</b>
            </p>
            <p>这就是<b>占优策略</b>：它不需要你猜测对方，也不需要你相信任何人。终极规律号算出了同一件事。于是（开火，开火）成为唯一的<b>纳什均衡</b>。</p>
          </div>
        </div>

        <h4>可是，明明有更好的结果</h4>
        <p>如果双方都沉默，各得 3 分，总分 6；如果双方都开火，各得 −2，总分 −4。也就是说，<b>（沉默，沉默）比（开火，开火）更好</b>——它是帕累托最优的。</p>
        <p>但帕累托最优不等于稳定：只要对方相信你会沉默，他就有动力偷偷开火，独吞 5 分。所以这个「更好的结果」经不起任何一次怀疑。个体理性把双方一起推进了更差的结局——这就是囚徒困境最刺痛人的地方。</p>

        <h4>有限次的重复，救不了他们</h4>
        <p>你可能会想：只要还会再见，合作就有价值。但如果所有人都知道这是第 4 轮、也是最后一轮，那么在最后一轮，开火仍然占优。既然双方都知道最后一轮会开火，那么倒数第二轮的合作就没有意义……</p>
        <p>这种从终点往回推的方法叫<b>逆向归纳</b>。它会一路推回第一轮，把合作的可能性彻底抹掉。<b>黑暗战役不是一次意外，它是这个矩阵的必然结果。</b></p>

        <h4>那无限次重复呢？</h4>
        <p>如果博弈没有终点，答案会不同。背叛要付出「未来合作破裂」的代价，合作就可能成为均衡。阿克塞尔罗德的计算机竞赛里，最简单的策略「<b>一报还一报</b>」击败了所有精于算计的对手：第一轮合作，之后照抄对方上一轮的选择。它善良、可报复、宽容、清晰。</p>
        <p class="aside">黑暗森林的残酷之处在于：它把宇宙变成了一场有限次的博弈。而有限次的博弈，会从最后一轮开始崩塌。</p>

        <h4>回到三体</h4>
        <p>猜疑链是无穷的：你不仅要判断对方是善意还是恶意，还要判断「对方如何看待你的善意」，再判断「对方如何看待你对他判断的判断」……而技术爆炸意味着，今天弱小的文明，明天就可能毁灭你。于是等待本身成了风险。</p>
        <p>先发制人不是邪恶，它是在这个矩阵里，唯一不需要相信奇迹的选择。</p>

        ${UI.conceptCards(["pd", "dominant", "nash", "pareto", "backward", "repeated", "titfortat"])}
      </div>

      <div class="debrief-cta">
        <div>
          <div class="mono" style="font-size:9px;letter-spacing:.22em;color:var(--faint)">NEXT / CHAPTER 02</div>
          <div class="serif" style="font-size:18px;letter-spacing:.1em;margin-top:6px">执剑人 · 一个人如何威慑一个文明</div>
        </div>
        <button class="btn btn--primary" type="button" data-act="next">进入第二章 →</button>
      </div>
    </div>
  </div>`;
};

C2.debriefHTML = function (p) {
  const e = this.ending();
  return `
  <div class="screen fade">
    ${UI.hud(1, "胆小鬼博弈")}
    <div class="debrief">
      <div class="debrief-head">
        <p class="eyebrow">博弈论手记 / DEBRIEF 02</p>
        <h2 class="debrief-title">为什么疯子比好人更能阻止战争？</h2>
      </div>
      ${UI.endingCard({ label: e.label, paras: e.paras, sign: e.sign })}
      <div class="lesson">
        <p>你在那个控制室里又守了 ${p.turn} 年，把威慑度维持在 ${p.D}，让三体舰队停在了推进 ${p.T} 的位置。现在，我们把「威慑」拆成一道数学题。</p>

        <h4>两辆车，迎面加速</h4>
        <table class="matrix">
          <thead><tr><th>你 ＼ 对方</th><th>对方转向</th><th>对方坚持</th></tr></thead>
          <tbody>
            <tr><th>你转向</th><td>0　,　0</td><td>−1　,　+1</td></tr>
            <tr><th>你坚持</th><td>+1　,　−1</td><td class="is-neg">−10　,　−10</td></tr>
          </tbody>
        </table>
        <div class="matrix-cap">左 = 你的收益，右 = 对方的收益</div>

        <p>这是<b>胆小鬼博弈</b>（Chicken）。最好的结果是对方转向，其次是自己转向（丢脸但活着），最差是双方都坚持（同归于尽）。它有两个纯策略均衡：你坚持、他转向；或者他坚持、你转向。</p>
        <p>问题在于：<b>哪一个均衡成立，取决于谁更「不可理喻」。</b></p>

        <h4>可信承诺：把方向盘扔出窗外</h4>
        <p>如果威胁只是「我可能会」，对方就会不断试探。真正的威慑要求你做出一个<b>不可撤销的承诺</b>：把方向盘扔出窗外、把发射权交给机器、把选择权从自己手里拿走。</p>
        <p>罗辑握住的那个开关，就是那个被扔出窗外的方向盘。他让「同归于尽」变成一个不需要再决策的事实。三体不是在和一个人谈判，是在和一个已经写好的程序谈判。这就是<b>可信承诺</b>。</p>

        <h4>威慑的数学</h4>
        <p>三体每年都在估算一件事：<b>这个执剑人按下的概率，够不够高？</b> 我们把那个阈值记作 D*。他们会试探，当且仅当：</p>
        <div class="formula">D × (两个文明毁灭的代价) &lt; (前进一步的收益)<br>⇒ 三体选择「试探」</div>
        <p>你每一次让步，都会降低 D；你每一次展示疯狂，都会提高 D——但同时消耗你的意志。更麻烦的是，<b>阈值会随他们的推进而上升</b>：他们越接近太阳系，需要的威慑就越高。这就是<b>边缘政策</b>：双方一起走到悬崖边，谁先眨眼谁输。</p>

        <h4>为什么程心会失败</h4>
        <p>不是因为她善良，而是因为她的选择可以被预测。三体对她的威慑度评估只有 10% 左右——他们知道她不会按。一个可以被预测的执剑人，等于没有执剑人。</p>
        <p>反过来，<b>疯子理论</b>说的正是这件事：当对手认为你的行为不可预测、不计后果时，他会为了避免最坏结果而主动退让。三体怕的不是罗辑的理性，怕的是他的「不理性」。</p>
        <p class="aside">所以，威慑度从来不是一个数字。它是对方头脑里，关于你的一个贝叶斯信念。</p>

        ${UI.conceptCards(["chicken", "commitment", "brink", "madman", "mixed"])}
      </div>

      <div class="debrief-cta">
        <div>
          <div class="mono" style="font-size:9px;letter-spacing:.22em;color:var(--faint)">NEXT / CHAPTER 03</div>
          <div class="serif" style="font-size:18px;letter-spacing:.1em;margin-top:6px">猜疑链 · 你看见的，是你原本相信的</div>
        </div>
        <button class="btn btn--primary" type="button" data-act="next">进入第三章 →</button>
      </div>
    </div>
  </div>`;
};

C3.debriefHTML = function (p) {
  const e = this.ending();
  const rate = p.judged ? Math.round((p.hits / p.judged) * 100) : 0;
  return `
  <div class="screen fade">
    ${UI.hud(2, "贝叶斯信号")}
    <div class="debrief">
      <div class="debrief-head">
        <p class="eyebrow">博弈论手记 / DEBRIEF 03</p>
        <h2 class="debrief-title">你看见的，是你原本相信的</h2>
      </div>
      ${UI.endingCard({ label: e.label, paras: e.paras, sign: e.sign })}
      <div class="lesson">
        <p>你完成了 ${p.contacts + p.clears} 次判断，命中率 ${rate}%，最终暴露度 ${p.exposure}。这一章没有「正确答案」，只有一件事：<b>你的信念，应该如何随证据移动。</b></p>

        <h4>贝叶斯公式</h4>
        <p>每次看到信号，你都在心里做这样一道题：</p>
        <div class="formula">P(善意 | 信号) = P(信号 | 善意) × P(善意)<br>　　　　　　　 ÷ [ P(信号 | 善意)P(善意) + P(信号 | 猎手)P(猎手) ]</div>
        <p>用第一次接触的数字：先验 50%，善意文明发信号的似然是 80%，猎手伪装发信号的似然是 40%。</p>
        <div class="formula">0.8 × 0.5 ÷ (0.8 × 0.5 + 0.4 × 0.5) = 0.40 ÷ 0.60 ≈ <b>67%</b></div>
        <p>一个友善信号，只把「善意」的概率从 50% 推到了 67%。它是有信息的，但远不足以让你放心。</p>

        <h4>基础比率：先看分母</h4>
        <p>第三次接触发生在「猎场 7A」。那里的文明，十个里有七个是猎手。即使对方发出了友善信号，后验概率仍然只有 35% 左右——<b>因为先验太低了。</b></p>
        <p>这就是<b>基础比率谬误</b>：人们被具体的信号吸引，却忽略了整体分布。在一个猎手遍地的星域，友善信号救不了你。</p>

        <h4>为什么最后一个信号什么也没告诉你</h4>
        <p>第五次接触里，对方发出的信号，善意文明和猎手文明发送的概率都是 85%。代入公式，分子分母同时乘以 0.85：</p>
        <div class="formula">P(善意 | 信号) = P(善意) = <b>50%</b></div>
        <p>信号没有改变任何东西。当不同类型的选择者发送相同的信号时，观察者无法区分他们——这叫<b>混同均衡</b>。猜疑链正是在这里闭合的：你们都发出同样的问候，于是谁也无法证明自己。</p>
        <p>真正可信的信号必须是<b>昂贵的</b>：放弃资源、暴露弱点、自断退路。便宜的承诺，在黑暗森林里一文不值。</p>

        <h4>猜疑链的阶数</h4>
        <p class="mono" style="font-size:12.5px;line-height:2.2;color:var(--ink-2)">
          一阶：它是善意还是恶意？<br>
          二阶：它认为我是善意还是恶意？<br>
          三阶：它认为我认为它是善意还是恶意？<br>
          ……<br>
          n 阶：没有尽头。
        </p>
        <p>即使双方都是善意的，只要这条链上任何一环出现不确定性，先发制人就仍然可能是理性的。再加上<b>技术爆炸</b>——今天弱小的文明，明天可能超越你——等待本身就成了风险。</p>
        <p class="aside">黑暗森林法则不是一句诅咒，它是一条推论：在无法验证善意的宇宙里，猜疑会自我实现。</p>

        ${UI.conceptCards(["bayes", "prior", "baserate", "signaling", "pooling"])}
      </div>

      <div class="debrief-cta">
        <div>
          <div class="mono" style="font-size:9px;letter-spacing:.22em;color:var(--faint)">NEXT / CHAPTER 04</div>
          <div class="serif" style="font-size:18px;letter-spacing:.1em;margin-top:6px">面壁者 · 为什么最好的计划是掷骰子</div>
        </div>
        <button class="btn btn--primary" type="button" data-act="next">进入第四章 →</button>
      </div>
    </div>
  </div>`;
};

C4.debriefHTML = function (p) {
  const e = this.ending();
  return `
  <div class="screen fade">
    ${UI.hud(3, "混合策略")}
    <div class="debrief">
      <div class="debrief-head">
        <p class="eyebrow">博弈论手记 / DEBRIEF 04</p>
        <h2 class="debrief-title">为什么最好的计划是掷骰子？</h2>
      </div>
      ${UI.endingCard({ label: e.label, paras: e.paras, sign: e.sign })}
      <div class="lesson">
        <p>你的计划得分是 ${signed(p.score)}，随机性 ${p.randomness}%。如果你一直选同一个计划，破壁人很快就能锁定你。现在，我们把这个「猜拳」拆开。</p>

        <div class="split">
          <div>${UI.matrix({
            cols: ["封锁", "干扰", "诱导"],
            rows: ["掩体", "黑域", "光速"],
            data: C4_M,
            caption: "行 = 你的计划　列 = 破壁人的对策"
          })}</div>
          <div>
            <p>注意这个矩阵的两件事：每一行的和都是 0，每一列的和也都是 0。这是一个<b>零和博弈</b>——你赢的就是他输的。</p>
            <p>如果你总是选「掩体」，他就总是「封锁」，你每轮 −3。任何固定的选择，都会被他针对。</p>
          </div>
        </div>

        <h4>唯一的均衡：各三分之一</h4>
        <p>假设你以 1/3 的概率随机选择三种计划。无论破壁人选择哪一列，你的期望收益都是：</p>
        <div class="formula">(1/3)(−3) + (1/3)(+2) + (1/3)(+1) = <b>0</b><br>(1/3)(+1) + (1/3)(−3) + (1/3)(+2) = <b>0</b><br>(1/3)(+2) + (1/3)(+1) + (1/3)(−3) = <b>0</b></div>
        <p>三种计划各 1/3，就是这场博弈的混合策略纳什均衡。此时破壁人无论怎么选，都拿不到便宜；你也一样。这就是冯·诺依曼的<b>极小极大定理</b>：在零和博弈里，你的最优策略是让对手无论怎么选，都得不到超过博弈值的收益。</p>

        <h4>人类不擅长随机</h4>
        <p>我们以为自己在随机，其实有强烈的模式：刚输过的选项会避开，刚赢过的会重复，喜欢「中间那个」，不喜欢连续两次相同……赌场和破壁人，靠的都是这一点。</p>
        <p>你刚才看到的「可预测性」百分比，就是你的模式留下的指纹。它不是心理分析，它只是频率统计。</p>
        <p class="aside">面壁者的真实计划必须连自己都骗过——因为你的行为会泄露你的想法。这在博弈论里叫信息泄露，在生活里叫「你藏不住」。</p>

        <h4>所以，掷骰子</h4>
        <p>随机不是放弃思考，随机是把「不可预测」本身当成一种策略。石头剪刀布的唯一均衡，就是各出三分之一。下次你觉得「我已经看穿他了」，不妨先问一句：他是不是也这么想？</p>

        ${UI.conceptCards(["zerosum", "mixed", "minimax", "nash"])}
      </div>

      <div class="debrief-cta">
        <div>
          <div class="mono" style="font-size:9px;letter-spacing:.22em;color:var(--faint)">NEXT / CHAPTER 05</div>
          <div class="serif" style="font-size:18px;letter-spacing:.1em;margin-top:6px">归零 · 当所有人都必须归还</div>
        </div>
        <button class="btn btn--primary" type="button" data-act="next">进入第五章 →</button>
      </div>
    </div>
  </div>`;
};

C1.payload = function () {
  return {
    total: this.st.total, fired: this.st.fired, silent: this.st.silent,
    firstStrike: this.st.firstStrike, ending: this.ending()
  };
};

/* ---------------------------------------------------------
   FINALE — 不要回答
   --------------------------------------------------------- */
const Finale = {
  phase: "brief",
  choice: null,

  mount() {
    this.phase = "brief";
    this.choice = null;
    App.handler = act => this.handle(act);
    this.draw();
  },

  draw() { App.set(this.html()); },

  html() {
    if (this.phase === "after") {
      const c = FINALE_CHOICES[this.choice];
      return `
      <div class="screen fade">
        <div class="brief">
          <p class="eyebrow">尾声 / EPILOGUE</p>
          <h2 class="brief-title" style="font-size:clamp(32px,5vw,52px)">${c.title}</h2>
          <p class="brief-en">${c.en}</p>
          <div class="rule"></div>
          <div class="prose">${c.after.map(p => `<p>${p}</p>`).join("")}</div>
          <div class="brief-rules" style="border-style:solid;border-color:var(--line-strong)">
            <div><b>你刚刚做的</b>是一个一次性博弈：没有下一轮，没有声誉，没有重复。</div>
            <div><b>它没有最优解</b>博弈论能算出均衡，却算不出你想要什么。</div>
          </div>
          <div class="brief-cta">
            <button class="btn btn--primary" type="button" data-act="toReport">查看实验报告 →</button>
            <span class="hint">最后一步：把你的四次博弈拼成一张画像</span>
          </div>
        </div>
      </div>`;
    }

    return `
    <div class="screen fade">
      <div class="brief" style="padding-top:6vh">
        <p class="eyebrow">尾声 / EPILOGUE · 监听员 1379</p>
        <h2 class="brief-title" style="font-size:clamp(34px,5.4vw,58px)">不要回答</h2>
        <p class="brief-en">DO NOT ANSWER</p>
        <div class="scene" style="margin:26px 0;min-height:200px">
          <span class="scene-tag is-calm">SIGNAL // 太阳系方向</span>
          <div style="width:100%;padding:20px 0 6px">
            ${UI.sceneWave({ strength: 0.8 })}
            <div style="text-align:center;margin-top:4px">
              <div class="mono" style="font-size:9px;letter-spacing:.3em;color:var(--faint)">4.2 光年外 · 一段重复的问候</div>
            </div>
          </div>
          <div class="scene-caption"><span>三体世界 · <b>监听站 1379</b></span><span>岗位时限：一生</span></div>
        </div>
        <div class="prose">
          <p>你是${T("三体文明", "三体世界")}的一名监听员，编号 1379。你的工作，是在成千上万个噪声里，找到那个不该出现的信号。</p>
          <p>今夜，你找到了。一个来自太阳系的文明，正在向宇宙呼喊。信号里有一段话，翻译过来是：<strong>「到这里来，我们的世界很美好。」</strong></p>
          <p>按照规程，你应该立刻上报坐标。你的文明会派出一支舰队。这是你的职责，也是你存在的意义。</p>
          <p><span class="em">但你听见了那个声音里的孤独。</span></p>
        </div>
        <div class="rule"></div>
        ${UI.choices([
          { act: "choose:warn", key: "1", title: "回复「不要回答」", desc: "警告那个文明。你会因此被处决。", tag: "代价：你自己" },
          { act: "choose:report", key: "2", title: "上报坐标", desc: "履行你的职责。你的文明会活下来。", tag: "代价：他们" },
          { act: "choose:ignore", key: "3", title: "关闭接收器", desc: "让信号过去。就当今晚什么也没发生。", tag: "代价：没有", tone: "gold" }
        ])}
        <p class="panel-note" style="margin-top:18px;color:var(--faint)">
          这不是一道博弈题。或者说，它是一道只有你能定义收益的博弈题。
        </p>
      </div>
    </div>`;
  },

  handle(act) {
    if (act.startsWith("choose:")) {
      this.choice = act.split(":")[1];
      App.stats.finale = this.choice;
      App.save();
      this.phase = "after";
      Sound.tone(220, 0.6, "sine", 0.06, -40);
      this.draw();
      return;
    }
    if (act === "toReport") App.report();
  }
};

const FINALE_CHOICES = {
  warn: {
    title: "你按下了发射键",
    en: "WARNING SENT",
    after: [
      "三个字，重复了三遍：「不要回答。」",
      "你知道这意味着什么：如果被发现，你会被处决。你的文明不会记得你，它只会记得那个信号。",
      "但那个声音里的孤独，你听懂了。在一个只有生存的宇宙里，你为了让一个陌生人活下去，放弃了自己活下去的可能。",
      "<span class=\"em\">博弈论把这种行为叫作「非理性」。它没有错。它只是无法解释你。</span>"
    ]
  },
  report: {
    title: "你按下了上报键",
    en: "COORDINATES FILED",
    after: [
      "坐标进入了档案。三支舰队将在四百年后抵达。",
      "你继续听，像什么都没有发生。你的职责完成了，你的文明会活下来。",
      "很多年后，你会想起那个声音。它说：「到这里来，我们的世界很美好。」",
      "<span class=\"em\">你做了在这个宇宙里最正确的选择。这就是它让人难受的地方。</span>"
    ]
  },
  ignore: {
    title: "你关掉了接收器",
    en: "RECEIVER OFFLINE",
    after: [
      "宇宙又安静了。你告诉自己，那不是你的责任。",
      "你没有救他们，也没有杀他们。你只是让一个信号，消失在噪声里。",
      "那天夜里，你梦见一片森林。所有的树都在说话，但没有人回答。",
      "<span class=\"em\">在博弈论里，这叫「不作为」。它也是一种选择。</span>"
    ]
  }
};

/* ---------------------------------------------------------
   CH 5 — 归零 · 阈值公共品
   --------------------------------------------------------- */
const C5_THRESHOLD = 34;
const C5_ROUNDS = 6;
const C5_CIVS = [
  { id: "zero", name: "归零者", en: "ZERO" },
  { id: "watch", name: "守望者", en: "WATCHER" },
  { id: "merchant", name: "商人", en: "MERCHANT" },
  { id: "child", name: "孩子", en: "CHILD" }
];

const C5_EVENTS = {
  1: "归零者的第一次广播。它没有说「请」，它说的是：「你们欠宇宙一笔账。」",
  2: "一个自称「歌者」的文明发来一段歌声。它说，它已经归还了质量，然后继续唱。",
  3: "一个年轻的文明宣布：「我们不还。我们要活到最后一刻。」",
  4: "宇宙的膨胀速率又上升了 0.3%。归零者没有评论。",
  5: "你收到一段来自「田园时代」的录音。那是一个还没有黑暗森林的宇宙，星星很多。",
  6: "归零者最后一次广播：「还差最后一点。」"
};

const C5 = {
  id: "c5",
  phase: "brief",
  st: null,

  mount() {
    this.phase = "brief";
    this.st = {
      round: 1, cum: 0, prevCum: 0, contribution: 0, history: [],
      phase: "choose", last: null, childLast: 1, endKey: null
    };
    this.draw();
  },

  draw() {
    if (typeof Hologram !== "undefined") {
      Hologram.setState("mass", { cum: this.st.cum, threshold: C5_THRESHOLD, last: this.st.last });
    }
    App.set(this.html());
  },

  moves() {
    const st = this.st;
    const pace = (C5_THRESHOLD * (st.round - 1)) / C5_ROUNDS;
    const zero = 2;
    const watch = st.cum >= pace ? 2 : 1;
    const merchant = st.cum >= C5_THRESHOLD ? 0 : (st.round >= C5_ROUNDS && st.cum + 2 < C5_THRESHOLD ? 2 : 1);
    const child = st.childLast;
    return { zero, watch, merchant, child };
  },

  html() {
    if (this.phase === "brief") {
      return UI.brief(CHAPTERS[4], {
        intro: [
          "宇宙正在膨胀。十亿年后，最后一颗恒星会熄灭。",
          `一个自称<strong>${T("归零者", "「归零者」")}</strong>的文明向全宇宙广播：请归还你们占有的质量。当归还的总量越过临界值，宇宙会停止膨胀、坍缩、然后重新开始。`,
          "你是「回声」文明的领袖。你们把自己改造成了依赖质量存在的形态——归还质量，等于放弃现在的一切。",
          "<span class=\"em\">五个文明，六轮。临界值 34。你保留的质量，会成为你在新宇宙里的起点。</span>"
        ],
        note: "归零者认为，宇宙原本会坍缩、重生。但文明为了生存从宇宙里借走了太多质量，使它永远膨胀下去。他们的广播没有强制力，只是一个请求——以及一个焦点。",
        rules: [
          { k: "回合", v: "6 轮同时决策" },
          { k: "每轮", v: "归还 0 / 1 / 2 个单位的质量" },
          { k: "临界值", v: "累计归还 ≥ 34" },
          { k: "邻居", v: "归零者 · 守望者 · 商人 · 孩子" }
        ],
        act: "begin", cta: "开始归还", hint: "你保留的，会成为新宇宙的起点"
      });
    }
    if (this.phase === "end") return this.endHTML();

    const st = this.st;
    return `
    <div class="screen fade">
      ${UI.hud(4, "阈值公共品")}
      <div class="stage">
        <section class="stage-main">
          ${this.scene()}
          <div class="panel">
            <div class="panel-head">
              <span class="panel-kicker">归还记录 / LEDGER</span>
              <span class="panel-meta">${st.history.length} / 6 轮</span>
            </div>
            <p class="c5-event">${C5_EVENTS[st.round] || ""}</p>
            ${this.tableHTML()}
          </div>
        </section>

        <aside class="stage-side">
          <div class="panel">
            <div class="panel-head">
              <span class="panel-kicker">STATUS</span>
              <span class="panel-meta">第 ${st.round} / ${C5_ROUNDS} 轮</span>
            </div>
            ${UI.meter({
              label: "累计归还", value: Math.min(st.cum, 40), max: 40,
              prev: Math.min(st.prevCum, 40), tone: "gold",
              marker: C5_THRESHOLD, markerLabel: "临界值 " + C5_THRESHOLD,
              note: st.cum
            })}
            <div class="c5-retain">
              <span>你的保留质量</span>
              <b>${12 - st.contribution}<small> / 12</small></b>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head">
              <span class="panel-kicker">DECISION</span>
              <span class="panel-meta">${st.phase === "result" ? "本轮结算" : "这一轮，归还多少？"}</span>
            </div>
            ${st.phase === "result" ? this.resultHTML() : this.chooseHTML()}
          </div>
        </aside>
      </div>
    </div>`;
  },

  scene() {
    const st = this.st;
    const pct = clamp(st.cum / C5_THRESHOLD, 0, 1);
    return `
    <div class="scene scene--3d">
      <span class="scene-tag ${pct >= 1 ? "is-calm" : ""}">${pct >= 1 ? "MASS QUORUM // 已越过" : "MASS QUORUM // 收集中"}</span>
      <canvas data-holo="mass" tabindex="0" aria-label="三维质量环，可拖拽旋转，滚轮缩放"></canvas>
      <span class="holo-hint">拖拽旋转 · 滚轮缩放</span>
      <div class="scene-caption">
        <span>宇宙质量总账 · <b>${pct >= 1 ? "临界值已越过" : "还差 " + Math.max(0, C5_THRESHOLD - st.cum)}</b></span>
        <span>第 ${st.round} / ${C5_ROUNDS} 轮</span>
      </div>
    </div>`;
  },

  tableHTML() {
    const st = this.st;
    if (!st.history.length) return `<div class="log-empty">// 还没有人归还质量</div>`;
    return `
      <div class="c5-table">
        <div class="c5-tr c5-head"><span>轮</span><span>你</span><span>归零者</span><span>守望者</span><span>商人</span><span>孩子</span><span>累计</span></div>
        ${st.history.map(h => `
          <div class="c5-tr ${h.round === st.round ? "is-last" : ""}">
            <span>${h.round}</span>
            <span class="is-you">${h.you}</span>
            <span>${h.zero}</span><span>${h.watch}</span><span>${h.merchant}</span><span>${h.child}</span>
            <span class="is-cum">${h.cum}</span>
          </div>`).join("")}
      </div>
      <div class="matrix-cap">每格 = 该文明本轮归还的质量（0–2）</div>`;
  },

  chooseHTML() {
    return `
      ${UI.choices([
        { act: "c5:0", key: "1", title: "保留全部", desc: "一点质量也不归还。你的文明会变得更强。", tag: "保留 <b>+2</b><br>归还 <b>0</b>" },
        { act: "c5:1", key: "2", title: "归还一半", desc: "交出半个自己。刚好跟上队伍。", tag: "保留 <b>+1</b><br>归还 <b>1</b>" },
        { act: "c5:2", key: "3", title: "归还全部", desc: "把一切都交出去。你们可能再也回不来。", tag: "保留 <b>+0</b><br>归还 <b>2</b>", tone: "gold" }
      ])}
      <p class="panel-note" style="margin-top:10px;color:var(--faint)">归零者每轮都会归还 2。其他人……在看。</p>`;
  },

  resultHTML() {
    const st = this.st;
    const l = st.last;
    const gap = C5_THRESHOLD - l.cum;
    return `
      <div class="c5-result">
        <div><span>本轮合计</span><b>+${l.total}</b></div>
        <div><span>累计归还</span><b>${l.cum}</b></div>
      </div>
      <p class="panel-note" style="color:var(--ink-2);font-size:13px">${this.reaction()}</p>
      <p class="panel-note" style="color:${gap <= 0 ? "var(--teal)" : "var(--faint)"};margin-top:8px">
        ${gap <= 0 ? "临界值已经越过。剩下的轮次，只决定谁保留得更多。" : "距离临界值还差 " + gap + " 个单位的质量。"}
      </p>
      <button class="btn btn--primary" type="button" data-act="next" style="width:100%;margin-top:14px">
        ${st.round >= C5_ROUNDS ? "见证结局" : "进入下一轮"} →
      </button>`;
  },

  reaction() {
    const l = this.st.last;
    if (l.child === 0) return "孩子看了你一眼，把自己那份质量收了回去。";
    if (l.child === 2) return "孩子学着你，把一切都交了出来。";
    return "孩子学着你，归还了一半。";
  },

  handle(act) {
    if (act === "begin") {
      this.phase = "play";
      this.draw();
      return;
    }
    if (act === "next") {
      if (this.st.round >= C5_ROUNDS) { this.finish(); return; }
      this.st.round++;
      this.st.phase = "choose";
      this.st.last = null;
      this.draw();
      return;
    }
    if (act.startsWith("c5:")) {
      if (this.st.phase !== "choose") return;
      this.resolve(parseInt(act.split(":")[1], 10));
    }
  },

  resolve(c) {
    const st = this.st;
    const m = this.moves();
    const total = c + m.zero + m.watch + m.merchant + m.child;
    const before = st.cum;
    st.prevCum = before;
    st.cum += total;
    st.contribution += c;
    st.childLast = c;
    st.history.push({ round: st.round, you: c, zero: m.zero, watch: m.watch, merchant: m.merchant, child: m.child, total, cum: st.cum });
    st.last = { you: c, zero: m.zero, watch: m.watch, merchant: m.merchant, child: m.child, total, cum: st.cum };
    st.phase = "result";
    Sound.tone(c === 2 ? 392 : c === 1 ? 330 : 220, 0.3, "sine", 0.05, c === 2 ? 60 : -30);
    this.draw();
  },

  finish() {
    const st = this.st;
    const win = st.cum >= C5_THRESHOLD;
    st.endKey = win
      ? (st.contribution >= 10 ? "hero" : st.contribution <= 4 ? "free" : "ok")
      : (st.contribution >= 10 ? "alone" : "dead");
    this.phase = "end";
    this.stats();
    Sound.confirm();
    this.draw();
  },

  stats() {
    const s = App.stats;
    s.contribution = this.st.contribution;
    s.zeroWin = this.st.cum >= C5_THRESHOLD;
    s.retained = 12 - this.st.contribution;
    s.childFinal = this.st.childLast;
    s.zeroTotal = this.st.cum;
  },

  ending() { return C5_END[this.st.endKey] || C5_END.ok; },

  endHTML() {
    const e = this.ending();
    const st = this.st;
    return `
    <div class="screen fade">
      ${UI.hud(4, "阈值公共品")}
      <div class="debrief">
        <div class="debrief-head">
          <p class="eyebrow">第 5 章 · 结束 / AFTERMATH</p>
          <h2 class="debrief-title">${e.title}</h2>
        </div>
        ${UI.endingCard({ label: e.label, paras: e.paras(st), sign: e.sign })}
        <div class="stat-grid" style="margin-bottom:36px">
          <div class="stat"><b>${st.contribution}</b><span>你归还的质量</span></div>
          <div class="stat"><b>${12 - st.contribution}</b><span>你保留的质量</span></div>
          <div class="stat"><b>${st.cum} / ${C5_THRESHOLD}</b><span>最终总量</span></div>
          <div class="stat"><b>${st.childLast}</b><span>孩子最后归还</span></div>
        </div>
        <div class="brief-cta">
          <button class="btn btn--primary" type="button" data-act="toDebrief">翻开博弈论手记</button>
          <span class="hint">为什么所有人都知道该还，却还是还不齐？</span>
        </div>
      </div>
    </div>`;
  },

  payload() {
    return {
      contribution: this.st.contribution,
      cum: this.st.cum,
      retained: 12 - this.st.contribution,
      childFinal: this.st.childLast,
      endKey: this.st.endKey
    };
  }
};

const C5_END = {
  hero: {
    title: "你把一切都交了出去",
    label: "结局 · 归零者",
    paras: st => [
      "你归还了十二个单位的质量。你的文明失去了质量，失去了形态，失去了十亿年的积累。",
      "在新宇宙的第一缕光里，你什么也没有。你只是一段记忆，漂浮在刚刚诞生的星云里。",
      "你想起归零者说过，宇宙原本是一个星星很多的田园。",
      "然后你听见一个孩子的声音。它说：「我看见了。谢谢你。」"
    ],
    sign: "—— 归零纪元 · 第一次呼吸"
  },
  free: {
    title: "你保住了自己的质量",
    label: "结局 · 搭便车的人",
    paras: st => [
      `宇宙活了下来。靠的是别人。你归还了 ${st.contribution} 个单位，保留了 ${12 - st.contribution} 个。`,
      "于是你在新宇宙里，比谁都明亮。你成了第一批恒星，光很暖，但没有文明愿意靠近你。",
      `那个孩子最后归还了 ${st.childLast} 个单位。它只是看着你，然后学会了你的选择。`
    ],
    sign: "—— 归零纪元 · 第一颗恒星"
  },
  ok: {
    title: "刚好够",
    label: "结局 · 临界线上",
    paras: st => [
      `你们越过了临界值。${st.cum} 对 ${C5_THRESHOLD}，不多不少，刚好够宇宙重新开始。`,
      `你归还了 ${st.contribution} 个单位，保留了 ${12 - st.contribution} 个。你没有成为英雄，也没有成为那个被记住的吝啬鬼。`,
      "有人说，这就是田园时代。",
      "新宇宙的第一天，一切都很安静。安静得像一场刚刚算对的账。"
    ],
    sign: "—— 归零纪元 · 临界值"
  },
  alone: {
    title: "你独自归还了所有",
    label: "结局 · 无人应答",
    paras: st => [
      `你归还了十二个单位。但总量停在了 ${st.cum}，还是没有越过临界值。`,
      "宇宙继续膨胀。最后一颗恒星熄灭的时候，你已经不在了。",
      "你做的没有错。你只是，一个人做完了所有人该做的事。"
    ],
    sign: "—— 归零纪元 · 永夜"
  },
  dead: {
    title: "宇宙继续膨胀",
    label: "结局 · 永死",
    paras: st => [
      `总量停在了 ${st.cum}。临界值是 ${C5_THRESHOLD}。`,
      "宇宙继续膨胀。星系彼此远离，恒星一颗接一颗熄灭，最后连黑暗都变得稀薄。",
      "你保留了很多质量。现在它们和你一起，悬在一片没有尽头的虚空里。",
      "没有人会记得这里曾经有过一个房间，也没有人会记得，房间曾经漏过水。"
    ],
    sign: "—— 归零纪元 · 终"
  }
};

C5.debriefHTML = function (p) {
  const e = this.ending();
  return `
  <div class="screen fade">
    ${UI.hud(4, "阈值公共品")}
    <div class="debrief">
      <div class="debrief-head">
        <p class="eyebrow">博弈论手记 / DEBRIEF 05</p>
        <h2 class="debrief-title">为什么所有人都知道该还，<br>却还是还不齐？</h2>
      </div>
      ${UI.endingCard({ label: e.label, paras: e.paras(this.st), sign: e.sign })}
      <div class="lesson">
        <p>你归还了 <b>${p.contribution}</b> 个单位的质量，保留了 <b>${p.retained}</b> 个。宇宙最终累计 <b>${p.cum} / ${C5_THRESHOLD}</b>。这一章没有敌人，只有一个正在漏水的房间。</p>

        <h4>公地悲剧</h4>
        <p>每个文明都想多保留一点质量。多保留的那一点，收益完全归自己；而宇宙膨胀的代价，由所有人分摊。于是每个人都多保留一点——直到房间漏光。</p>
        <p>这就是<b>公地悲剧</b>：不是因为他们邪恶，而是因为成本被分摊、收益被私有。你每少归还 1 个单位，就多得到 1 点质量；而如果所有人都这么做，宇宙就会死。</p>

        <h4>阈值公共品：差一点，就全都没有</h4>
        <p>这一章不是普通的公共品博弈，而是<b>阈值公共品</b>：只有总贡献达到 ${C5_THRESHOLD}，宇宙才会坍缩、重生；否则一切归零。</p>
        <div class="formula">5 个文明 × 6 轮 × 2 单位 = 60（理论上限）<br>每个人都只归还 1：5 × 6 × 1 = 30 &lt; ${C5_THRESHOLD}<br>归零者每轮归还 2：+6，刚好补上缺口</div>
        <p>注意这件小事：如果所有人都只归还一半，总量是 30，差 4 个单位。是归零者每轮多还的那 1 个单位，让「大家都归还」这件事变得足够。<b>公共品有时候需要一个愿意多付的人。</b></p>

        <h4>保证博弈：我愿意合作，前提是你也合作</h4>
        <p>这和第 1 章的囚徒困境不一样。在囚徒困境里，背叛是占优策略；在这里，你更愿意归还——只要你知道别人也会归还。这叫<b>保证博弈</b>。</p>
        <p>它有两个稳定的结局：大家都归还，宇宙重生；大家都不归还，宇宙永死。这就是<b>多重均衡</b>。理性本身无法告诉你该选哪一个——它取决于你相信别人会怎么做。</p>

        <table class="matrix">
          <thead><tr><th>文明</th><th>它的策略</th></tr></thead>
          <tbody>
            <tr><th>归零者</th><td style="text-align:left;font-family:var(--sans);font-size:12px;line-height:1.7">每轮归还 2。它先付出，为所有人补上缺口。</td></tr>
            <tr><th>守望者</th><td style="text-align:left;font-family:var(--sans);font-size:12px;line-height:1.7">总量跟上进度就归还 2，落后就只归还 1。它会失去信心。</td></tr>
            <tr><th>商人</th><td style="text-align:left;font-family:var(--sans);font-size:12px;line-height:1.7">达标前归还 1；最后一轮差额大时归还 2；达标后停止。</td></tr>
            <tr><th>孩子</th><td style="text-align:left;font-family:var(--sans);font-size:12px;line-height:1.7">复制你上一轮的选择。它不计算，它只学你。</td></tr>
          </tbody>
        </table>
        <div class="matrix-cap">它们不是 NPC，它们是三种真实的博弈者</div>

        <h4>焦点：一个信号如何改变均衡</h4>
        <p>归零者的广播没有强制力。但它给了所有文明同一个<b>焦点</b>：一个所有人都能注意到、并且相信别人也注意到的信号。谢林说过，当人们无法沟通时，会不约而同地选择那个最显眼的选项。</p>
        <p>「大家都归还」原本只是一个想象。广播让它变成了一个可以同时发生的预期。协调博弈里，预期本身就是一种力量。</p>

        <h4>孩子：你的行为是一个公共信号</h4>
        <p>孩子不计算。它只是学你。你归还 2，它就归还 2；你保留全部，它也把质量收回去。</p>
        <p>在重复博弈里，你的选择从来不只是你自己的事。它是一个信号，告诉别人「现在轮到哪里了」。<b>你保留的每一分质量，都在教别人也保留。</b></p>

        <p class="aside">宇宙不是一座森林。森林里的猎人可以躲起来；而房间漏水的时候，没有人能躲开。</p>

        ${UI.conceptCards(["commons", "threshold", "assurance", "multieq", "focal", "freeride"])}
      </div>

      <div class="debrief-cta">
        <div>
          <div class="mono" style="font-size:9px;letter-spacing:.22em;color:var(--faint)">FINALE / 尾声</div>
          <div class="serif" style="font-size:18px;letter-spacing:.1em;margin-top:6px">不要回答 · 一个不需要计算的选择</div>
        </div>
        <button class="btn btn--primary" type="button" data-act="next">进入尾声 →</button>
      </div>
    </div>
  </div>`;
};

const Chapters = [C1, C2, C3, C4, C5];
