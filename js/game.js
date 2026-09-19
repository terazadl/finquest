/* =========================================================
 * FinQuest 游戏逻辑
 * ========================================================= */

(function () {
  "use strict";

  const STORE_KEY = "finquest_v1";

  /* ---------- 状态 ---------- */
  const state = {
    saved: loadOrInit(),
    chapterBest: {}, // chapterId -> { correct, total, done }
  };

  let quizMode = "choice"; // 'choice' | 'self'

  /* 未完成的章节进度（本次会话内） */
  let quiz = null; // { chapterId, questions, index, correct, total, done:Set }

  function loadOrInit() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (typeof data.xp === "number") return data;
      }
    } catch (e) {
      /* ignore */
    }
    return { xp: 0, best: {}, mistakes: {} };
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state.saved));
    } catch (e) {
      /* ignore */
    }
  }

  function addXp(n) {
    state.saved.xp += n;
    save();
    refreshPlayer();
  }

  function resetProgress() {
    localStorage.removeItem(STORE_KEY);
    state.saved = { xp: 0, best: {}, mistakes: {} };
    refreshPlayer();
  }

  /* ---------- 错题记录 ---------- */
  function qidOf(chapterId, uiIndex) {
    return chapterId + ":" + uiIndex;
  }

  function recordMistake(chapterId, uiIndex) {
    const key = qidOf(chapterId, uiIndex);
    if (!state.saved.mistakes) state.saved.mistakes = {};
    if (!state.saved.mistakes[key]) {
      state.saved.mistakes[key] = { count: 0, lastAt: Date.now() };
    }
    state.saved.mistakes[key].count += 1;
    state.saved.mistakes[key].lastAt = Date.now();
    save();
  }

  function clearMistake(chapterId, uiIndex) {
    const key = qidOf(chapterId, uiIndex);
    if (state.saved.mistakes) delete state.saved.mistakes[key];
    save();
  }

  function mistakeCount() {
    return state.saved.mistakes ? Object.keys(state.saved.mistakes).length : 0;
  }

  /* 按错题记录还原题目对象（含解析信息） */
  function questionFromKey(key) {
    const [chapterId, ui] = key.split(":");
    const ch = CHAPTERS.find((c) => c.id === chapterId);
    if (!ch) return null;
    const q = ch.questions[Number(ui)];
    if (!q) return null;
    return { chapterId, uiIndex: Number(ui), ...q };
  }

  /* ---------- 通用工具 ---------- */
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $all(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function showScreen(id) {
    $all(".screen").forEach((s) => s.classList.remove("active"));
    $("#" + id).classList.add("active");
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function rankOf(xp) {
    let r = RANKS[0];
    for (const rank of RANKS) {
      if (xp >= rank.xp) r = rank;
    }
    return r;
  }

  function nextRankThreshold(xp) {
    for (const rank of RANKS) {
      if (xp < rank.xp) return rank.xp;
    }
    return RANKS[RANKS.length - 1].xp;
  }

  function refreshPlayer() {
    const xp = state.saved.xp;
    const rank = rankOf(xp);
    const next = nextRankThreshold(xp);
    $("#player-avatar").textContent = rank.icon;
    $("#player-title").textContent = rank.name;
    $("#player-xp").textContent = xp;
    $("#player-xp-next").textContent = next;
    const pct = Math.min(100, Math.round((xp / next) * 100));
    $("#xp-fill").style.width = pct + "%";
  }

  /* ---------- 章节列表 ---------- */
  function renderChapters() {
    const wrap = $("#chapter-list");
    wrap.innerHTML = "";
    CHAPTERS.forEach((ch, idx) => {
      const prevDone = idx === 0 || !!state.saved.best[CHAPTERS[idx - 1].id];
      const done = !!state.saved.best[ch.id];
      const card = document.createElement("div");
      card.className = "chapter-card" + (prevDone ? "" : " locked");
      const best = state.saved.best[ch.id];
      const status = done
        ? best && best.total
          ? `✓ ${best.correct}/${best.total}`
          : "✓ 已完成"
        : prevDone
          ? "▶ 开始"
          : "🔒 先完成上一章";
      card.innerHTML =
        '<div class="chapter-icon">' + ch.icon + "</div>" +
        '<div><div class="chapter-name">' + ch.name + "</div>" +
        '<div class="chapter-desc">' + ch.desc + "</div></div>" +
        '<div class="chapter-status' + (done ? " done" : "") + '">' + status + "</div>";
      if (prevDone) {
        card.addEventListener("click", () => startChapter(ch.id));
      }
      wrap.appendChild(card);
    });
  }

  /* ---------- 闯关 ---------- */
  function startChapter(id) {
    const ch = CHAPTERS.find((c) => c.id === id);
    if (!ch) return;
    quiz = {
      chapterId: id,
      reviewMode: false,
      questions: ch.questions.map((q, qi) => ({
        ...q,
        chapterId: id,
        uiIndex: qi,
        shuffleOptions: shuffle(q.options.map((t, ti) => ({ t, ti }))),
      })),
      index: 0,
      correct: 0,
      total: ch.questions.length,
      done: new Set(),
    };
    $("#quiz-title").textContent = ch.name;
    showScreen("screen-quiz");
    renderQuestion();
  }

  /* 考前突击：只刷错题，答对则清除 */
  function startReviewMode() {
    const keys = Object.keys(state.saved.mistakes || {});
    if (keys.length === 0) return;
    const questions = keys
      .map(questionFromKey)
      .filter(Boolean)
      .map((q) => ({
        ...q,
        shuffleOptions: shuffle(q.options.map((t, ti) => ({ t, ti }))),
      }));
    if (questions.length === 0) return;
    const ch = CHAPTERS.find((c) => c.id === questions[0].chapterId);
    quiz = {
      chapterId: "review",
      reviewMode: true,
      questions,
      index: 0,
      correct: 0,
      total: questions.length,
      done: new Set(),
    };
    $("#quiz-title").textContent = "考前突击 · 错题";
    showScreen("screen-quiz");
    renderQuestion();
  }

  function renderQuestion() {
    if (!quiz) return;
    const q = quiz.questions[quiz.index];
    $("#quiz-progress").textContent = (quiz.index + 1) + "/" + quiz.total;
    $("#feedback-card").classList.add("hidden");
    const card = $("#question-card");

    if (quiz.reviewMode) {
      card.innerHTML =
        '<span class="q-tag">📕 错题 · ' + q.tag + "</span>" +
        '<div class="q-text">' + q.q + "</div>" +
        '<div class="q-options"></div>';
      const optsWrapR = $(".q-options", card);
      q.shuffleOptions.forEach((opt) => {
        const btn = document.createElement("button");
        btn.className = "q-option";
        btn.textContent = opt.t;
        btn.dataset.ti = String(opt.ti);
        btn.addEventListener("click", () => pickAnswer(btn, opt.ti));
        optsWrapR.appendChild(btn);
      });
      renderShortcutHint(true);
      return;
    }

    if (quizMode === "self") {
      card.innerHTML =
        '<span class="q-tag">🫥 自测 · ' + q.tag + "</span>" +
        '<div class="q-text">' + q.q + "</div>" +
        '<div class="self-prompt">先别急着看答案！在脑中用英语组织你的回答，想好后点击下方按钮对照。</div>' +
        '<button class="primary-btn" id="btn-show-answer">👁️ 显示答案</button>';
      $("#btn-show-answer").addEventListener("click", () => showSelfAnswer(q));
      renderShortcutHint(false);
      return;
    }

    card.innerHTML =
      '<span class="q-tag">' + q.tag + "</span>" +
      '<div class="q-text">' + q.q + "</div>" +
      '<div class="q-options"></div>';
    const optsWrap = $(".q-options", card);
    q.shuffleOptions.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "q-option";
      btn.textContent = opt.t;
      btn.dataset.ti = String(opt.ti);
      btn.addEventListener("click", () => pickAnswer(btn, opt.ti));
      optsWrap.appendChild(btn);
    });
    renderShortcutHint(true);
  }

  function renderShortcutHint(withKeys) {
    let hint = $(".shortcut-hint", $("#quiz-area-main"));
    if (!hint) {
      hint = document.createElement("div");
      hint.className = "shortcut-hint";
      $("#quiz-area-main").appendChild(hint);
    }
    hint.innerHTML = withKeys
      ? "快捷键：<kbd>1</kbd>-<kbd>4</kbd> 选择答案 · <kbd>Enter</kbd> 下一题 · <kbd>Esc</kbd> 退出"
      : "快捷键：<kbd>Enter</kbd> 显示答案 · <kbd>Esc</kbd> 退出";
  }

  function showSelfAnswer(q) {
    const card = $("#question-card");
    card.innerHTML =
      '<span class="q-tag">🫥 自测 · ' + q.tag + "</span>" +
      '<div class="q-text">' + q.q + "</div>" +
      '<div class="self-answer">' +
      '<div class="self-answer-title">✅ 参考答案（英语口头版）</div>' +
      '<div class="self-answer-text">' + q.en + "</div>" +
      '<div class="self-answer-en">💡 ' + q.explain + "</div>" +
      '<div class="self-verdict-btns">' +
      '<button class="self-verdict-btn good" id="self-said-ok">✅ 我说对了</button>' +
      '<button class="self-verdict-btn bad" id="self-said-no">❌ 没答好</button>' +
      "</div>" +
      "</div>";
    $("#self-said-ok").addEventListener("click", () => {
      quiz.done.add(q.uiIndex);
      quiz.correct += 1;
      if (quiz.reviewMode) clearMistake(q.chapterId, q.uiIndex);
      renderSelfFeedback(true, q);
    });
    $("#self-said-no").addEventListener("click", () => {
      quiz.done.add(q.uiIndex);
      if (!quiz.reviewMode) recordMistake(q.chapterId, q.uiIndex);
      renderSelfFeedback(false, q);
    });
  }

  function renderSelfFeedback(ok, q) {
    const fb = $("#feedback-card");
    fb.classList.remove("hidden");
    $("#feedback-verdict").textContent = ok ? "✅ 自评正确" : "❌ 标记为错题（已加入错题本）";
    $("#feedback-verdict").className = "feedback-verdict " + (ok ? "good" : "bad");
    $("#feedback-explain").textContent = q.explain;
    $("#feedback-en").innerHTML = "<b>面试英语模板句</b>" + q.en;
    fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const last = quiz.index === quiz.total - 1;
    $("#feedback-next").textContent = last ? "查看结果" : "下一题";
    $("#feedback-next").onclick = last ? finishChapter : nextQuestion;
  }

  function pickAnswer(btn, pickedIdx) {
    const q = quiz.questions[quiz.index];
    if (quiz.done.has(q.uiIndex)) return;
    quiz.done.add(q.uiIndex);

    const isCorrect = pickedIdx === q.answer;
    if (isCorrect) {
      quiz.correct += 1;
      if (quiz.reviewMode) clearMistake(q.chapterId, q.uiIndex);
    } else if (!quiz.reviewMode) {
      recordMistake(q.chapterId, q.uiIndex);
    }

    const opts = $all(".q-option", $("#question-card"));
    opts.forEach((b) => (b.disabled = true));
    const correctBtn = $('.q-option[data-ti="' + q.answer + '"]', $("#question-card"));
    if (correctBtn) correctBtn.classList.add("correct");
    if (!isCorrect) btn.classList.add("wrong");

    const fb = $("#feedback-card");
    fb.classList.remove("hidden");
    $("#feedback-verdict").textContent = isCorrect ? "✅ 正确" : "❌ 答错了";
    $("#feedback-verdict").className = "feedback-verdict " + (isCorrect ? "good" : "bad");
    $("#feedback-explain").textContent = q.explain;
    $("#feedback-en").innerHTML =
      "<b>面试英语模板句</b>" + q.en;
    fb.scrollIntoView({ behavior: "smooth", block: "nearest" });

    const last = quiz.index === quiz.total - 1;
    $("#feedback-next").textContent = last ? "查看结果" : "下一题";
    $("#feedback-next").onclick = last ? finishChapter : nextQuestion;
  }

  function nextQuestion() {
    quiz.index += 1;
    renderQuestion();
  }

  function finishChapter() {
    if (quiz.reviewMode) {
      const remaining = mistakeCount();
      const cleared = quiz.total - quiz.correct;
      const gained = quiz.correct * 8;
      addXp(gained);
      const rankBefore = rankOf(state.saved.xp - gained);
      const rankAfter = rankOf(state.saved.xp);

      $("#done-icon").textContent = remaining === 0 ? "🏆" : "💪";
      $("#done-title").textContent = "考前突击完成";
      $("#done-score").textContent =
        "攻克 " + quiz.correct + " / " + quiz.total + " 题" +
        (remaining > 0 ? "，还剩 " + remaining + " 道错题待复习" : "，错题已全部清零 🎉");
      $("#done-xp-gain").textContent = gained;

      const lv = $("#levelup-box");
      if (rankBefore.name !== rankAfter.name) {
        lv.classList.remove("hidden");
        $("#levelup-title").textContent = rankAfter.name + " " + rankAfter.icon;
      } else {
        lv.classList.add("hidden");
      }
      quiz = null;
      showScreen("screen-chapter-done");
      refreshPlayer();
      return;
    }

    const gained = quiz.correct * 8;
    addXp(gained);
    state.saved.best[quiz.chapterId] = {
      correct: quiz.correct,
      total: quiz.total,
      xp: gained,
    };
    save();

    const rankBefore = rankOf(state.saved.xp - gained);
    const rankAfter = rankOf(state.saved.xp);
    const ch = CHAPTERS.find((c) => c.id === quiz.chapterId);

    $("#done-icon").textContent = quiz.correct === quiz.total ? "🏆" : quiz.correct >= quiz.total / 2 ? "🎉" : "💪";
    $("#done-title").textContent = ch ? ch.name + " 完成" : "完成";
    $("#done-score").textContent =
      "答对 " + quiz.correct + " / " + quiz.total + " 题";
    $("#done-xp-gain").textContent = gained;

    const lv = $("#levelup-box");
    if (rankBefore.name !== rankAfter.name) {
      lv.classList.remove("hidden");
      $("#levelup-title").textContent = rankAfter.name + " " + rankAfter.icon;
    } else {
      lv.classList.add("hidden");
    }
    showScreen("screen-chapter-done");
    refreshPlayer();
  }

  /* ---------- 链条拼搭 ---------- */
  let chain = null; // { mode, data, slots, pool, timer, interval }

  const CHAIN_LABELS = {
    en: "P&L 链条排序（英文）",
    jp: "P&L 链条排序（日文）",
    match: "日英术语匹配",
    bs: "B/S 借贷分配",
  };

  function startChainGame(mode) {
    $("#chain-mode-title").textContent = CHAIN_LABELS[mode] || "拼搭";
    const targets = [];
    const pool = [];

    if (mode === "en") {
      CHAIN_EN.forEach((name, i) => targets.push({ name, order: i }));
      pool.push(...shuffle(CHAIN_EN));
    } else if (mode === "jp") {
      CHAIN_JP.forEach((name, i) => targets.push({ name, order: i }));
      pool.push(...shuffle(CHAIN_JP));
    } else if (mode === "match") {
      MATCH_JP_EN.forEach((pair, i) => targets.push({ name: pair.jp, order: i, expect: pair.en }));
      pool.push(...shuffle(MATCH_JP_EN.map((p) => p.en)));
    } else if (mode === "bs") {
      targets.push({ name: "資産 Assets", order: 0, group: "asset" });
      targets.push({ name: "負債・純資産 Liabilities & Equity", order: 1, group: "equity" });
      pool.push(...shuffle(BS_ITEMS.map((it) => it.jp + " · " + it.en)));
    }

    chain = {
      mode,
      targets,
      pool,
      assigned: new Array(targets.length).fill(null), // poolItem index
      activeSlot: -1,
      timer: 60,
      interval: null,
      wrongFlash: null,
    };
    showScreen("screen-chain-game");
    renderChain();
    startChainTimer();
  }

  function renderChain() {
    const hintMap = {
      en: "把英文损益表科目按正确顺序放入槽位",
      jp: "把日文损益表科目按正确顺序放入槽位",
      match: "点击英文术语，放入对应的日文科目下方",
      bs: "判断每个科目属于资产，还是负债・纯资产",
    };
    $("#chain-hint").textContent = hintMap[chain.mode];

    /* Targets */
    const targetsWrap = $("#chain-targets");
    targetsWrap.innerHTML = "";
    chain.targets.forEach((t, ti) => {
      const slot = document.createElement("div");
      slot.className = "chain-slot" + (ti === chain.activeSlot ? " active" : "");
      slot.dataset.ti = ti;
      if (chain.mode === "bs") {
        slot.classList.add("order");
        slot.innerHTML = "<b>" + t.name + "</b><span class='slot-sub'>点击选中，再从下方卡片放入</span>";
      } else if (chain.mode === "match") {
        slot.innerHTML = "<b class='slot-name'>" + t.name + "</b><span class='slot-sub'>点击选中 ↓</span>";
      } else {
        slot.textContent = "↓ 第 " + (ti + 1) + " 位（点击选中）";
      }
      slot.addEventListener("click", () => selectSlot(ti));
      targetsWrap.appendChild(slot);
    });

    /* Pool */
    const poolWrap = $("#chain-pool");
    poolWrap.innerHTML = "";
    chain.pool.forEach((item, pi) => {
      const card = document.createElement("div");
      card.className = "chain-card";
      card.textContent = item;
      card.dataset.pi = pi;
      card.addEventListener("click", () => pickPoolCard(pi, card));
      poolWrap.appendChild(card);
    });

    /* 若已有关卡结果则还原 */
    syncSlotViews();

    $("#chain-result").classList.add("hidden");
    $("#chain-timer").textContent = chain.timer + "s";
  }

  /* 点击槽位：选中或取消选中；已填的槽位点击 = 退回卡片 */
  function selectSlot(ti) {
    if (chain.assigned[ti] !== null) {
      /* 退回该槽位的卡片 */
      const pi = chain.assigned[ti];
      chain.assigned[ti] = null;
      chain.activeSlot = -1;
      const cardEl = $('.chain-card[data-pi="' + pi + '"]', $("#chain-pool"));
      if (cardEl) {
        cardEl.classList.remove("used");
        cardEl.classList.remove("wrong-flash");
      }
      const slot = $('.chain-slot[data-ti="' + ti + '"]', $("#chain-targets"));
      if (slot) {
        slot.classList.remove("filled", "wrong", "active");
        const t = chain.targets[ti];
        if (chain.mode === "bs") {
          slot.innerHTML = "<b>" + t.name + "</b><span class='slot-sub'>点击选中，再从下方卡片放入</span>";
        } else if (chain.mode === "match") {
          slot.innerHTML = "<b class='slot-name'>" + t.name + "</b><span class='slot-sub'>点击选中 ↓</span>";
        } else {
          slot.textContent = "↓ 第 " + (ti + 1) + " 位（点击选中）";
        }
        slot.addEventListener("click", () => selectSlot(ti));
      }
      return;
    }
    chain.activeSlot = chain.activeSlot === ti ? -1 : ti;
    syncSlotViews();
  }

  /* 同步所有槽位的高亮与填充状态 */
  function syncSlotViews() {
    chain.targets.forEach((t, ti) => {
      const slot = $('.chain-slot[data-ti="' + ti + '"]', $("#chain-targets"));
      if (!slot) return;
      slot.classList.toggle("active", ti === chain.activeSlot);
      const pi = chain.assigned[ti];
      if (pi === null) return;
      const ok = chain.mode === "bs" ? checkPlacement(ti) === true : checkPlacement(ti);
      slot.classList.toggle("filled", true);
      slot.classList.toggle("wrong", !ok);
      const item = chain.pool[pi];
      if (chain.mode === "bs") {
        slot.innerHTML = "<b>" + item + "</b>" + (ok ? "" : "<span class='slot-sub'>❌ 放错</span>");
      } else if (chain.mode === "match") {
        slot.innerHTML = "<b class='slot-name'>" + t.name + "</b><b class='slot-val'>" + item + "</b>" + (ok ? "" : "<span class='slot-sub'>❌ 不匹配</span>");
      } else {
        slot.innerHTML = "<b>" + item + "</b>" + (ok ? "" : "<span class='slot-sub'>❌ 顺序错</span>");
      }
      /* 保持点击可以退回 */
      slot.onclick = () => selectSlot(ti);
    });
  }

  /* 点击池卡片 → 放入选中的槽位；无选中则放入第一个空槽 */
  function pickPoolCard(pi, cardEl) {
    if (cardEl.classList.contains("used")) return;

    let slotIndex = -1;
    if (
      chain.activeSlot >= 0 &&
      chain.assigned[chain.activeSlot] === null
    ) {
      slotIndex = chain.activeSlot;
    } else {
      slotIndex = findFreeSlot(pi);
    }
    if (slotIndex === -1) return;

    wireSlot(slotIndex, pi, cardEl);
    chain.activeSlot = -1;
    syncSlotViews();
    checkWin();
  }

  function findFreeSlot(poolIdx) {
    for (let i = 0; i < chain.assigned.length; i++) {
      if (chain.assigned[i] === null) {
        /* 已放置在其他槽的卡片不能重复用 */
        if (chain.assigned.includes(poolIdx)) continue;
        return i;
      }
    }
    return -1;
  }

  function wireSlot(ti, pi, cardEl) {
    chain.assigned[ti] = pi;
    cardEl.classList.add("used");
    if (!checkPlacement(ti)) {
      flashWrong(pi, cardEl, ti);
    }
  }

  function checkPlacement(ti) {
    const t = chain.targets[ti];
    const item = chain.pool[chain.assigned[ti]];
    if (chain.mode === "bs") {
      const bs = BS_ITEMS.find(
        (it) => it.jp + " · " + it.en === item
      );
      return bs && bs.side === t.group;
    }
    if (chain.mode === "match") {
      return item === t.expect;
    }
    /* en / jp：卡片名称必须等于该槽位（位置 t.order）对应的正确科目 */
    const correct = chain.targets.find((x) => x.order === t.order);
    return chain.pool[chain.assigned[ti]] === correct.name;
  }

  function flashWrong(pi, cardEl, ti) {
    cardEl.classList.add("wrong-flash");
    const targetItem = chain.pool[pi];
    if (chain.mode === "bs") {
      const bs = BS_ITEMS.find((it) => it.jp + " · " + it.en === targetItem);
      if (bs) {
        const correctSide = bs.side === "asset" ? "資産" : "負債・純資産";
        showTemporaryHint("❌ 「" + bs.jp + "」属于「" + correctSide + "」");
      }
    }
    setTimeout(() => {
      cardEl.classList.remove("wrong-flash");
      if (chain.mode === "bs") showTemporaryHint("判断科目属于哪一边，答错会提示正确答案");
    }, 1500);
  }

  function showTemporaryHint(msg) {
    const el = $("#chain-hint");
    el.textContent = msg;
    el.style.color = "var(--bad)";
    setTimeout(() => {
      el.style.color = "";
      el.textContent =
        chain.mode === "bs"
          ? "判断每个科目属于资产，还是负债・纯资产"
          : chain.mode === "match"
            ? "点击英文术语，放入对应的日文科目下方"
            : "把科目按正确顺序放入槽位";
    }, 2000);
  }

  function startChainTimer() {
    if (chain.interval) clearInterval(chain.interval);
    chain.interval = setInterval(() => {
      chain.timer -= 1;
      $("#chain-timer").textContent = chain.timer + "s";
      if (chain.timer <= 0) {
        clearInterval(chain.interval);
        showChainResult(false, "⏰ 时间到");
      }
    }, 1000);
  }

  function checkWin() {
    if (chain.assigned.every((v) => v !== null)) {
      clearInterval(chain.interval);
      const allOk = chain.targets.every((_, ti) => checkPlacement(ti));
      showChainResult(allOk, allOk ? "🎉 链条拼搭完成！" : "完成，但有放错的位置");
      if (allOk) addXp(10);
    }
  }

  function showChainResult(ok, msg) {
    $("#chain-result").classList.remove("hidden");
    $("#chain-result-title").textContent = msg;
    $("#chain-result-msg").textContent = ok
      ? "全部正确，+10 经验。日英链条已刻进肌肉记忆。"
      : "看错的部分，再试一局。";
    $("#chain-result").scrollIntoView({ behavior: "smooth", block: "center" });
    refreshPlayer();
    const extra = ok ? " 你获得了 +10 经验。" : "";
    if (!ok) {
      /* 展示正确答案 */
      let explain = "";
      if (chain.mode === "en") explain = "正确顺序：" + CHAIN_EN.join(" → ");
      else if (chain.mode === "jp") explain = "正确顺序：" + CHAIN_JP.join(" → ");
      else if (chain.mode === "match")
        explain = "对照：" + MATCH_JP_EN.map((p) => p.jp + " = " + p.en).join("；");
      else
        explain =
          "资产侧：現金、売掛金、棚卸資産、有形固定資産、のれん；负债/权益侧：借入金、社債、資本金、利益剰余金、自己株式。";
      const msgEl = $("#chain-result-msg");
      msgEl.textContent = msg + extra + " " + explain;
    }
  }

  /* ---------- 每日热身 ---------- */
  let warmup = null;

  function startWarmup() {
    const all = [];
    CHAPTERS.forEach((ch) =>
      ch.questions.forEach((q, qi) =>
        all.push({ ...q, chapterId: ch.id, uiIndex: qi })
      )
    );
    const picked = shuffle(all).slice(0, 5);
    warmup = {
      questions: picked.map((q) => ({
        ...q,
        shuffleOptions: shuffle(q.options.map((t, ti) => ({ t, ti }))),
      })),
      index: 0,
      correct: 0,
      total: picked.length,
    };
    showScreen("screen-warmup");
    renderWarmupQuestion();
  }

  function renderWarmupQuestion() {
    if (!warmup) return;
    const q = warmup.questions[warmup.index];
    $("#warmup-progress").textContent = (warmup.index + 1) + "/" + warmup.total;
    $("#warmup-feedback").classList.add("hidden");
    $("#warmup-done").classList.add("hidden");
    const card = $("#warmup-question");
    card.innerHTML =
      '<span class="q-tag">' + q.tag + "</span>" +
      '<div class="q-text">' + q.q + "</div>" +
      '<div class="q-options"></div>';
    const optsWrap = $(".q-options", card);
    q.shuffleOptions.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "q-option";
      btn.textContent = opt.t;
      btn.dataset.ti = String(opt.ti);
      btn.addEventListener("click", () => pickWarmupAnswer(btn, opt.ti));
      optsWrap.appendChild(btn);
    });
  }

  function pickWarmupAnswer(btn, pickedIdx) {
    const q = warmup.questions[warmup.index];
    const isCorrect = pickedIdx === q.answer;
    if (isCorrect) warmup.correct += 1;
    const opts = $all(".q-option", $("#warmup-question"));
    opts.forEach((b) => (b.disabled = true));
    const correctBtn = $('.q-option[data-ti="' + q.answer + '"]', $("#warmup-question"));
    if (correctBtn) correctBtn.classList.add("correct");
    if (!isCorrect) btn.classList.add("wrong");

    const fb = $("#warmup-feedback");
    fb.classList.remove("hidden");
    $("#warmup-verdict").textContent = isCorrect ? "✅ 正确" : "❌ 答错了";
    $("#warmup-verdict").className = "feedback-verdict " + (isCorrect ? "good" : "bad");
    $("#warmup-explain").textContent = q.explain;
    $("#warmup-en").innerHTML = "<b>面试英语模板句</b>" + q.en;
    fb.scrollIntoView({ behavior: "smooth", block: "nearest" });

    const last = warmup.index === warmup.total - 1;
    $("#warmup-next").textContent = last ? "完成" : "下一题";
    $("#warmup-next").onclick = last ? finishWarmup : () => {
      warmup.index += 1;
      renderWarmupQuestion();
    };
  }

  function finishWarmup() {
    $("#warmup-feedback").classList.add("hidden");
    $("#warmup-question").classList.add("hidden");
    $("#warmup-done").classList.remove("hidden");
    $("#warmup-score").textContent =
      "答对 " + warmup.correct + " / " + warmup.total + " 题。面试开场前 10 分钟，过一遍模板句。";
    $("#warmup-progress").textContent = "5/5";
  }

  /* ---------- 错题本 ---------- */
  function renderErrorBook() {
    const listWrap = $("#errorbook-list");
    const emptyEl = $("#errorbook-empty");
    const keys = Object.keys(state.saved.mistakes || {});
    $("#menu-error-count").textContent = mistakeCount();
    if (keys.length === 0) {
      emptyEl.classList.remove("hidden");
      listWrap.innerHTML = "";
      $("#btn-review-mode").disabled = true;
      $("#btn-review-mode").style.opacity = ".5";
      return;
    }
    emptyEl.classList.add("hidden");
    $("#btn-review-mode").disabled = false;
    $("#btn-review-mode").style.opacity = "1";
    listWrap.innerHTML = "";
    const entries = keys
      .map((key) => ({
        key,
        ...questionFromKey(key),
        info: state.saved.mistakes[key],
      }))
      .filter((e) => e.q)
      .sort((a, b) => b.info.count - a.info.count);
    entries.forEach((e) => {
      const row = document.createElement("div");
      row.className = "error-row";
      const chName = CHAPTERS.find((c) => c.id === e.chapterId)?.name || "";
      row.innerHTML =
        '<div class="error-row-head">' +
        '<span class="error-row-chapter">' + chName + "</span>" +
        '<span class="error-row-count">错 ' + e.info.count + " 次</span>" +
        "</div>" +
        '<div class="error-row-q">' + e.q + "</div>" +
        '<div class="error-row-answer">✅ ' + e.en + "</div>";
      listWrap.appendChild(row);
    });
  }

  function clearAllMistakes() {
    if (confirm("确定清空所有错题记录？")) {
      state.saved.mistakes = {};
      save();
      renderErrorBook();
    }
  }

  /* ---------- 快捷键 ---------- */
  function handleKeydown(e) {
    const active = document.querySelector(".screen.active")?.id;
    if (active === "screen-quiz") {
      if (e.key === "Escape") {
        quiz = null;
        showScreen("screen-chapters");
        return;
      }
      const fbHidden = $("#feedback-card").classList.contains("hidden");
      if (fbHidden) {
        /* 答题中 */
        if (quizMode === "self" && !$("#self-said-ok", $("#question-card"))) {
          /* 自测模式：未显示答案时 Enter 显示答案 */
          if (e.key === "Enter") {
            e.preventDefault();
            $("#btn-show-answer")?.click();
          }
          e.preventDefault();
          return;
        }
        const idx = ["1", "2", "3", "4"].indexOf(e.key);
        if (idx >= 0) {
          const btns = $all("#question-card .q-option");
          if (btns[idx] && !btns[idx].disabled) btns[idx].click();
        }
        e.preventDefault();
      } else {
        /* 反馈中：Enter 下一题 */
        if (e.key === "Enter") {
          e.preventDefault();
          $("#feedback-next").click();
        }
      }
    }
  }

  /* ---------- 事件绑定 ---------- */
  function bindEvents() {
    /* 导航按钮 */
    $all("[data-goto]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-goto");
        if (target === "screen-chapters") renderChapters();
        if (target === "screen-warmup") startWarmup();
        if (target === "screen-errorbook") renderErrorBook();
        showScreen(target);
      });
    });

    /* 答题模式切换 */
    $all(".seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        quizMode = btn.dataset.qmode;
        $all(".seg-btn").forEach((b) => b.classList.toggle("active", b === btn));
        $("#self-test-note").classList.toggle("hidden", quizMode !== "self");
        if (quizMode === "self") {
          $("#quiz-mode-seg").scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });

    /* 退出答题 */
    $("#quiz-back").addEventListener("click", () => {
      quiz = null;
      showScreen("screen-chapters");
    });

    /* 章节完成继续 */
    $("#done-continue").addEventListener("click", () => {
      quiz = null;
      if ($("#done-title").textContent === "考前突击完成") {
        renderErrorBook();
        showScreen("screen-errorbook");
        return;
      }
      renderChapters();
      showScreen("screen-chapters");
    });

    /* 考前突击 */
    $("#btn-review-mode").addEventListener("click", () => {
      startReviewMode();
    });

    /* 清空错题 */
    $("#btn-clear-errors").addEventListener("click", () => {
      clearAllMistakes();
    });

    /* 链条模式选择 */
    $all(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => startChainGame(btn.dataset.mode));
    });

    $("#chain-exit").addEventListener("click", () => {
      if (chain && chain.interval) clearInterval(chain.interval);
      chain = null;
      showScreen("screen-chain");
    });

    $("#chain-again").addEventListener("click", () => {
      if (chain && chain.mode) {
        const m = chain.mode;
        if (chain.interval) clearInterval(chain.interval);
        startChainGame(m);
      }
    });

    /* 重置进度 */
    $("#btn-reset").addEventListener("click", () => {
      if (confirm("确定重置全部进度和经验？")) {
        resetProgress();
        renderChapters();
      }
    });

    /* 快捷键 */
    document.addEventListener("keydown", handleKeydown);

    /* 随机提示 */
    $("#menu-tip").textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
  }

  /* ---------- 启动 ---------- */
  function init() {
    bindEvents();
    refreshPlayer();
    showScreen("screen-menu");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
