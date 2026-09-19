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
    refreshErrorCount();
  }

  function clearMistake(chapterId, uiIndex) {
    const key = qidOf(chapterId, uiIndex);
    if (state.saved.mistakes) delete state.saved.mistakes[key];
    save();
    refreshErrorCount();
  }

  function refreshErrorCount() {
    const el = $("#menu-error-count");
    if (el) el.textContent = mistakeCount();
  }

  function mistakeCount() {
    return state.saved.mistakes ? Object.keys(state.saved.mistakes).length : 0;
  }

  /* 按错题记录还原题目对象（含解析信息）
   * 支持两态：
   *  - 章节题: "pl:3" → DATA 里的对象（无 accepted）
   *  - 产出题: "prod:pi_01" → seed 里的 ProductionItem（无 chain options 语义）
   */
  function questionFromKey(key) {
    const idx = key.indexOf(":");
    const chapterId = key.slice(0, idx);
    const rest = key.slice(idx + 1);
    if (chapterId === "prod") {
      return FinSeedLoader.ready().then(function ({ data }) {
        const p = (data.productionItems || []).find(function (x) { return x.id === rest; });
        if (!p) return null;
        return { chapterId: "prod", uiIndex: rest, isProd: true, ...p };
      });
    }
    const ch = CHAPTERS.find((c) => c.id === chapterId);
    if (!ch) return null;
    const q = ch.questions[Number(rest)];
    if (!q) return null;
    return { chapterId, uiIndex: Number(rest), ...q };
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

  /* 考前突击：只刷错题，答对则清除（含产出题） */
  function startReviewMode() {
    const keys = Object.keys(state.saved.mistakes || {});
    if (keys.length === 0) return;
    Promise.all(keys.map(questionFromKey)).then(function (resolved) {
      const questions = resolved
        .filter(Boolean)
        .map(function (q) {
          if (q.isProd) return q;
          return {
            ...q,
            shuffleOptions: shuffle(q.options.map((t, ti) => ({ t, ti }))),
          };
        });
      if (questions.length === 0) return;
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
    });
  }

  /* 单题再产出：错题本每行按钮直达 */
  function startSingleReview(key) {
    Promise.resolve(questionFromKey(key)).then(function (q) {
      if (!q) return;
      quiz = {
        chapterId: "review",
        reviewMode: true,
        questions: [q],
        index: 0,
        correct: 0,
        total: 1,
        done: new Set(),
      };
      $("#quiz-title").textContent = FinI18n.t("quiz.review_title");
      showScreen("screen-quiz");
      renderQuestion();
    });
  }

  /* 考前突击：产出题（错题里的 Type EN / Type JA / Select JA） */
  function renderReviewProd(q) {
    const card = $("#question-card");
    const typeLabel =
      q.type === "type_en" ? "⌨️ 打出英文" : q.type === "type_ja" ? "⌨️ 打出日文" : "👇 选答案";
    card.innerHTML =
      '<span class="q-tag">📕 错题 · 产出 · ' + typeLabel + "</span>" +
      '<div class="q-text">' + esc(q.cue) + "</div>" +
      (q.cueJa ? '<div class="prod-hint">🇯🇵 ' + esc(q.cueJa) + "</div>" : "") +
      '<div class="prod-input-area"></div>' +
      '<div class="shortcut-hint' + (q.type === "select_ja" ? "" : "") + '" style="text-align:center;font-size:12px;color:var(--muted);margin-top:10px">答对自动移出错题本 · <kbd>Enter</kbd> 提交 · <kbd>Esc</kbd> 退出</div>';
    const area = $(".prod-input-area", card);
    if (q.type === "select_ja") {
      const optWrap = document.createElement("div");
      optWrap.className = "prod-options";
      (q.options || []).forEach(function (opt) {
        const btn = document.createElement("button");
        btn.className = "q-option";
        btn.textContent = opt;
        btn.dataset.oi = opt;
        btn.addEventListener("click", function () {
          submitReviewProd(q, btn, opt);
        });
        optWrap.appendChild(btn);
      });
      area.appendChild(optWrap);
    } else {
      const inputWrap = document.createElement("div");
      inputWrap.className = "prod-input-wrap";
      inputWrap.innerHTML =
        '<input type="text" id="review-prod-input" placeholder="' +
        (q.type === "type_en" ? "Type English…" : "日本語で入力…") +
        '" autocomplete="off" autocapitalize="off" spellcheck="false">' +
        '<button class="prod-submit" id="review-prod-submit">提交</button>';
      area.appendChild(inputWrap);
      const input = $("#review-prod-input", card);
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          submitReviewProd(q, null, input.value, true);
        }
      });
      $("#review-prod-submit", card).addEventListener("click", function () {
        submitReviewProd(q, null, input.value, true);
      });
      input.focus();
    }
  }

  function submitReviewProd(q, btn, val, useJudge) {
    let ok;
    if (btn) {
      ok = q.accepted.includes(btn.textContent);
      const opts = $all(".q-option", $("#question-card"));
      opts.forEach(function (b) {
        b.disabled = true;
        b.classList.toggle("correct", q.accepted.includes(b.textContent));
        b.classList.toggle("wrong", b === btn && !ok);
      });
    } else if (useJudge) {
      const judge = q.type === "type_ja" ? FinScore.judgeJa : FinScore.judgeEn;
      const res = judge(val, q.accepted);
      ok = res.ok;
      const input = $("#review-prod-input");
      if (input) input.disabled = true;
    }
    if (ok) {
      quiz.done.add(q.uiIndex);
      quiz.correct += 1;
      clearMistake(q.chapterId, q.uiIndex);
    }
    const fb = $("#feedback-card");
    fb.classList.remove("hidden");
    $("#feedback-verdict").textContent = ok ? "✅ 答对了，移出错题本" : "❌ 还没过关";
    $("#feedback-verdict").className = "feedback-verdict " + (ok ? "good" : "bad");
    $("#feedback-explain").textContent = q.feedback || "参考答案：" + q.accepted.join(" / ");
    $("#feedback-en").innerHTML = "<b>参考答案</b>" + q.accepted.join(" / ");
    fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const last = quiz.index === quiz.total - 1;
    $("#feedback-next").textContent = last ? "查看结果" : "下一题";
    $("#feedback-next").onclick = last ? finishChapter : nextQuestion;
  }

  /* 考前突击：选择题错题 → 产出自评（Track C · US-7：清错不能只是再点选项）
   * 显示原题（无选项），要求先口头/打字组织答案，再展开模板句对照，最后自评。 */
  function renderReviewMCSelf(q) {
    const card = $("#question-card");
    card.innerHTML =
      '<span class="q-tag">📕 错题 · ' + esc(q.tag) + "</span>" +
      '<div class="q-text">' + esc(q.q) + "</div>" +
      '<div class="prod-options" style="margin-top:10px">' +
      '<div class="self-prompt">' + FinI18n.t("quiz.review_produce_prompt") + "</div>" +
      '<div class="readaloud-box">' +
      '<div class="readaloud-hint">🎧 朗读对照：先自己说/默写，再展开模板句逐句核对。</div>' +
      '<button class="readaloud-toggle" id="review-ra-toggle">👁️ 展开模板句对照</button>' +
      '<div class="readaloud-text hidden" id="review-ra-text">' +
      '<div class="readaloud-sentence"><span class="sen-label">EN</span>' + esc(q.en) + "</div>" +
      (q.explain ? '<div class="readaloud-hint" style="margin-top:8px">💡 ' + esc(q.explain) + "</div>" : "") +
      "</div>" +
      "</div>" +
      '<div class="self-verdict-btns" style="margin-top:12px">' +
      '<button class="self-verdict-btn good" id="review-mc-ok">' + FinI18n.t("quiz.review_said_ok") + "</button>" +
      '<button class="self-verdict-btn bad" id="review-mc-no">' + FinI18n.t("quiz.review_keep") + "</button>" +
      "</div>" +
      '<div class="shortcut-hint" style="text-align:center;font-size:12px;color:var(--muted);margin-top:10px"><kbd>Esc</kbd> 退出</div>' +
      "</div>";
    $("#review-ra-toggle", card).addEventListener("click", function () {
      $("#review-ra-text", card).classList.toggle("hidden");
    });
    $("#review-mc-ok", card).addEventListener("click", function () {
      quiz.done.add(q.uiIndex);
      quiz.correct += 1;
      clearMistake(q.chapterId, q.uiIndex);
      renderReviewMCSelfFeedback(q, true);
    });
    $("#review-mc-no", card).addEventListener("click", function () {
      quiz.done.add(q.uiIndex);
      renderReviewMCSelfFeedback(q, false);
    });
  }

  function renderReviewMCSelfFeedback(q, ok) {
    const card = $("#question-card");
    const last = quiz.index === quiz.total - 1;
    card.innerHTML =
      '<div class="feedback-verdict ' + (ok ? "good" : "bad") + '">' +
      (ok ? "✅ " + FinI18n.t("quiz.review_said_ok") : "❌ " + FinI18n.t("quiz.review_keep")) +
      "</div>" +
      '<p class="feedback-explain">' + (ok ? "已经把它从错题本移出。" : "没关系，本轮先保留，之后再刷。") + "</p>" +
      '<p class="feedback-en"><b>' + FinI18n.t("template_en") + "</b>" + esc(q.en) + "</p>" +
      '<button class="primary-btn" id="review-mc-next">' + (last ? FinI18n.t("view_result") : FinI18n.t("next")) + "</button>";
    $("#review-mc-next", card).addEventListener("click", function () {
      last ? finishChapter() : nextQuestion();
    });
  }

  function renderQuestion() {
    if (!quiz) return;
    const q = quiz.questions[quiz.index];
    $("#quiz-progress").textContent = (quiz.index + 1) + "/" + quiz.total;
    $("#feedback-card").classList.add("hidden");
    const card = $("#question-card");

    if (quiz.reviewMode) {
      if (q.isProd) {
        renderReviewProd(q);
        return;
      }
      renderReviewMCSelf(q);
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
      ? FinI18n.t("shortcut.choice")
      : FinI18n.t("shortcut.self");
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
    $("#feedback-en").innerHTML = "<b>" + FinI18n.t("template_en") + "</b>" + q.en;
    fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const last = quiz.index === quiz.total - 1;
    $("#feedback-next").textContent = last ? FinI18n.t("view_result") : FinI18n.t("next");
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
    $("#feedback-verdict").textContent = isCorrect ? FinI18n.t("correct") : FinI18n.t("wrong");
    $("#feedback-verdict").className = "feedback-verdict " + (isCorrect ? "good" : "bad");
    $("#feedback-explain").textContent = q.explain;
    $("#feedback-en").innerHTML =
      "<b>" + FinI18n.t("template_en") + "</b>" + q.en;
    fb.scrollIntoView({ behavior: "smooth", block: "nearest" });

    const last = quiz.index === quiz.total - 1;
    $("#feedback-next").textContent = last ? FinI18n.t("view_result") : FinI18n.t("next");
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
      lastMove: null, // { ti, pi } 最近一次放置，供撤销
    };
    showScreen("screen-chain-game");
    renderChain();
    startChainTimer();
  }

  function renderChain() {
    chain.lastMove = null;
    $("#chain-hint").textContent = chainHintDefault();

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
    refreshUndoButton();
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
    chain.lastMove = { ti, pi };
    refreshUndoButton();
    cardEl.classList.add("used");
    if (!checkPlacement(ti)) {
      flashWrong(pi, cardEl, ti);
    }
  }

  /* Track A：显式「撤回上一步」——可见、可发现，不隐藏在交互细节里 */
  function refreshUndoButton() {
    const btn = $("#chain-undo");
    if (!btn) return;
    const hasMove = chain && chain.lastMove && chain.assigned[chain.lastMove.ti] === chain.lastMove.pi;
    btn.classList.toggle("hidden", !hasMove);
  }

  function undoLastMove() {
    if (!chain || !chain.lastMove) return;
    const { ti, pi } = chain.lastMove;
    /* 若该位置已被后续操作覆盖（不该发生），退回仍按 lastMove 恢复卡片可用性 */
    if (chain.assigned[ti] === pi) {
      chain.assigned[ti] = null;
      const cardEl = $('.chain-card[data-pi="' + pi + '"]', $("#chain-pool"));
      if (cardEl) cardEl.classList.remove("used", "wrong-flash");
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
    }
    chain.lastMove = null;
    chain.activeSlot = -1;
    showTemporaryHint(FinI18n.t("chain.undo_done"));
    refreshUndoButton();
    syncSlotViews();
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
    const t = chain.targets[ti];
    let msg = "";
    if (chain.mode === "bs") {
      const bs = BS_ITEMS.find((it) => it.jp + " · " + it.en === targetItem);
      if (bs) {
        const correctSide = bs.side === "asset" ? "資産" : "負債・純資産";
        msg = FinI18n.t("chain.wrong_side", { item: bs.jp, side: correctSide, target: t.name });
      }
    } else if (chain.mode === "match") {
      msg = FinI18n.t("chain.wrong_match", { n: ti + 1, name: t.name, expect: t.expect, got: targetItem });
    } else {
      /* en / jp：该槽位（order=ti）对应的正确科目名 */
      const correct = chain.targets.find((x) => x.order === t.order);
      msg = FinI18n.t("chain.wrong_pos", { n: ti + 1, correct: correct.name, got: targetItem });
    }
    if (msg) showTemporaryHint(msg);
    setTimeout(() => {
      cardEl.classList.remove("wrong-flash");
      showTemporaryHint(chainHintDefault());
    }, 2500);
  }

  function chainHintDefault() {
    if (!chain) return "";
    return chain.mode === "bs"
      ? FinI18n.t("chain.hint_bs")
      : chain.mode === "match"
        ? FinI18n.t("chain.hint_match")
        : chain.mode === "jp"
          ? FinI18n.t("chain.hint_jp")
          : FinI18n.t("chain.hint_en");
  }

  function showTemporaryHint(msg) {
    const el = $("#chain-hint");
    el.textContent = msg;
    el.style.color = "var(--bad)";
    setTimeout(() => {
      el.style.color = "";
      el.textContent = chainHintDefault();
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
      chain.lastMove = null;
      refreshUndoButton();
      const allOk = chain.targets.every((_, ti) => checkPlacement(ti));
      showChainResult(allOk, allOk ? "🎉 链条拼搭完成！" : "完成，但有放错的位置");
      if (allOk) addXp(10);
    }
  }

  function showChainResult(ok, msg) {
    $("#chain-result").classList.remove("hidden");
    $("#chain-result-title").textContent = msg;
    $("#chain-result-msg").textContent = ok
      ? FinI18n.t("chain.win_msg")
      : FinI18n.t("again");
    $("#chain-result").scrollIntoView({ behavior: "smooth", block: "center" });
    refreshPlayer();
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
      msgEl.textContent = msg + " " + explain;
    }
  }

  /* ---------- 每日热身（Track C：混入产出题 + 分类统计） ---------- */
  let warmup = null; // { questions, index, recogCorrect, prodCorrect, total, recogTotal, prodTotal }

  function startWarmup() {
    const all = [];
    CHAPTERS.forEach((ch) =>
      ch.questions.forEach((q, qi) =>
        all.push({ ...q, chapterId: ch.id, uiIndex: qi })
      )
    );
    const picks = [];
    const mcPool = shuffle(all);
    /* 4 道识别题 */
    picks.push.apply(
      picks,
      mcPool.slice(0, 4).map((q) => ({
        ...q,
        isProd: false,
        shuffleOptions: shuffle(q.options.map((t, ti) => ({ t, ti }))),
      }))
    );
    /* 2 道产出题：优先取 type_en / select_ja（select 在移动端也能点），mix type_ja */
    FinSeedLoader.ready().then(function ({ data }) {
      const prodPool = shuffle(data.productionItems || []);
      prodPool.slice(0, 2).forEach(function (p) {
        picks.push({ ...p, isProd: true });
      });
      warmup = {
        questions: shuffle(picks),
        index: 0,
        recogCorrect: 0,
        prodCorrect: 0,
        total: picks.length,
        recogTotal: picks.filter((q) => !q.isProd).length,
        prodTotal: picks.filter((q) => q.isProd).length,
      };
      $("#warmup-progress").textContent = "1/" + warmup.total;
      showScreen("screen-warmup");
      renderWarmupQuestion();
    });
  }

  function renderWarmupQuestion() {
    if (!warmup) return;
    const q = warmup.questions[warmup.index];
    $("#warmup-progress").textContent = (warmup.index + 1) + "/" + warmup.total;
    $("#warmup-feedback").classList.add("hidden");
    $("#warmup-done").classList.add("hidden");
    const card = $("#warmup-question");
    card.classList.remove("hidden");

    if (q.isProd) {
      const typeLabel =
        q.type === "type_en" ? FinI18n.t("prod.type_en") : q.type === "type_ja" ? FinI18n.t("prod.type_ja") : FinI18n.t("prod.select");
      card.innerHTML =
        '<span class="q-tag">⚡ 热身 · ' + typeLabel + "</span>" +
        '<div class="q-text">' + esc(q.cue) + "</div>" +
        (q.cueJa ? '<div class="prod-hint">🇯🇵 ' + esc(q.cueJa) + "</div>" : "") +
        '<div class="prod-input-area"></div>';
      const area = $(".prod-input-area", card);
      if (q.type === "select_ja") {
        const optWrap = document.createElement("div");
        optWrap.className = "prod-options";
        (q.options || []).forEach(function (opt) {
          const btn = document.createElement("button");
          btn.className = "q-option";
          btn.textContent = opt;
          btn.dataset.oi = opt;
          btn.addEventListener("click", function () {
            submitWarmupProd(null, opt);
          });
          optWrap.appendChild(btn);
        });
        area.appendChild(optWrap);
      } else {
        const inputWrap = document.createElement("div");
        inputWrap.className = "prod-input-wrap";
        inputWrap.innerHTML =
          '<input type="text" id="warmup-prod-input" placeholder="' +
          (q.type === "type_en" ? "Type English…" : "日本語で入力…") +
          '" autocomplete="off" autocapitalize="off" spellcheck="false">' +
          '<button class="prod-submit" id="warmup-prod-submit">' + FinI18n.t("prod.submit") + "</button>";
        area.appendChild(inputWrap);
        const input = $("#warmup-prod-input", card);
        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter") {
            e.preventDefault();
            submitWarmupProd(input.value, null);
          }
        });
        $("#warmup-prod-submit", card).addEventListener("click", function () {
          submitWarmupProd(input.value, null);
        });
        input.focus();
      }
      return;
    }

    card.innerHTML =
      '<span class="q-tag">⚡ 热身 · ' + esc(q.tag) + "</span>" +
      '<div class="q-text">' + esc(q.q) + "</div>" +
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

  /* 热身产出题提交（打字判分或选项） */
  function submitWarmupProd(val, opt) {
    const q = warmup.questions[warmup.index];
    let ok;
    if (opt) {
      ok = q.accepted.includes(opt);
      const opts = $all(".q-option", $("#warmup-question"));
      opts.forEach(function (b) {
        b.disabled = true;
        b.classList.toggle("correct", q.accepted.includes(b.textContent));
        b.classList.toggle("wrong", b.textContent === opt && !ok);
      });
    } else {
      const judge = q.type === "type_ja" ? FinScore.judgeJa : FinScore.judgeEn;
      const res = judge(val, q.accepted);
      ok = res.ok;
      const input = $("#warmup-prod-input");
      if (input) input.disabled = true;
    }
    if (ok) warmup.prodCorrect += 1;

    const fb = $("#warmup-feedback");
    fb.classList.remove("hidden");
    $("#warmup-verdict").textContent = ok ? FinI18n.t("correct") : FinI18n.t("prod.deviation");
    $("#warmup-verdict").className = "feedback-verdict " + (ok ? "good" : "bad");
    $("#warmup-explain").textContent = q.feedback || "";
    $("#warmup-en").innerHTML = "<b>" + FinI18n.t("answer_ref") + "</b>" + esc(q.accepted.join(" / "));
    fb.scrollIntoView({ behavior: "smooth", block: "nearest" });

    const last = warmup.index === warmup.total - 1;
    $("#warmup-next").textContent = last ? FinI18n.t("finish") : FinI18n.t("next");
    $("#warmup-next").onclick = last ? finishWarmup : () => {
      warmup.index += 1;
      renderWarmupQuestion();
    };
  }

  function pickWarmupAnswer(btn, pickedIdx) {
    const q = warmup.questions[warmup.index];
    const isCorrect = pickedIdx === q.answer;
    if (isCorrect) warmup.recogCorrect += 1;
    const opts = $all(".q-option", $("#warmup-question"));
    opts.forEach((b) => (b.disabled = true));
    const correctBtn = $('.q-option[data-ti="' + q.answer + '"]', $("#warmup-question"));
    if (correctBtn) correctBtn.classList.add("correct");
    if (!isCorrect) btn.classList.add("wrong");

    const fb = $("#warmup-feedback");
    fb.classList.remove("hidden");
    $("#warmup-verdict").textContent = isCorrect ? FinI18n.t("correct") : FinI18n.t("wrong");
    $("#warmup-verdict").className = "feedback-verdict " + (isCorrect ? "good" : "bad");
    $("#warmup-explain").textContent = q.explain;
    $("#warmup-en").innerHTML = "<b>" + FinI18n.t("template_en") + "</b>" + esc(q.en);
    fb.scrollIntoView({ behavior: "smooth", block: "nearest" });

    const last = warmup.index === warmup.total - 1;
    $("#warmup-next").textContent = last ? FinI18n.t("finish") : FinI18n.t("next");
    $("#warmup-next").onclick = last ? finishWarmup : () => {
      warmup.index += 1;
      renderWarmupQuestion();
    };
  }

  function finishWarmup() {
    $("#warmup-feedback").classList.add("hidden");
    $("#warmup-question").classList.add("hidden");
    $("#warmup-done").classList.remove("hidden");
    $("#warmup-score").textContent = FinI18n.t("warmup.score", {
      a: "" + warmup.recogCorrect, b: "" + warmup.recogTotal,
      c: "" + warmup.prodCorrect, d: "" + warmup.prodTotal,
    });
    $("#warmup-progress").textContent = warmup.total + "/" + warmup.total;
  }

  /* ---------- 错题本 ---------- */
  function renderErrorBook() {
    const listWrap = $("#errorbook-list");
    const emptyEl = $("#errorbook-empty");
    const keys = Object.keys(state.saved.mistakes || {});
    refreshErrorCount();
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
    Promise.all(keys.map(function (key) {
      return Promise.resolve(questionFromKey(key)).then(function (q) {
        return q ? { key, ...q, info: state.saved.mistakes[key] } : null;
      });
    })).then(function (entries) {
      entries = entries
        .filter(Boolean)
        .sort(function (a, b) { return b.info.count - a.info.count; });
      entries.forEach(function (e) {
        const row = document.createElement("div");
        row.className = "error-row";
        if (e.isProd) {
          const typeLabel =
            e.type === "type_en" ? "⌨️ 产出·英文" : e.type === "type_ja" ? "⌨️ 产出·日文" : "👇 产出·选择";
          row.innerHTML =
            '<div class="error-row-head">' +
            '<span class="error-row-chapter">' + typeLabel + "</span>" +
            '<span class="error-row-count">' + FinI18n.t("errorbook.wrong_count", { n: e.info.count }) + "</span>" +
            "</div>" +
            '<div class="error-row-q">' + esc(e.cue) + "</div>" +
            '<div class="error-row-answer">✅ ' + esc((e.accepted || []).join(" / ")) + "</div>" +
            '<button class="errorbook-repro" data-key="' + e.key + '">' + FinI18n.t("errorbook.reproduce") + "</button>" +
            '<div class="error-row-en">' + FinI18n.t("errorbook.prod_will") + "</div>";
          listWrap.appendChild(row);
          const b = row.querySelector(".errorbook-repro");
          b.addEventListener("click", function () {
            startSingleReview(b.getAttribute("data-key"));
          });
          return;
        }
        const chName = CHAPTERS.find((c) => c.id === e.chapterId)?.name || "";
        row.innerHTML =
          '<div class="error-row-head">' +
          '<span class="error-row-chapter">' + chName + "</span>" +
          '<span class="error-row-count">' + FinI18n.t("errorbook.wrong_count", { n: e.info.count }) + "</span>" +
          "</div>" +
          '<div class="error-row-q">' + esc(e.q) + "</div>" +
          '<div class="error-row-answer">✅ ' + esc(e.en || "") + "</div>" +
          '<button class="errorbook-repro" data-key="' + e.key + '">' + FinI18n.t("errorbook.reproduce") + "</button>" +
          '<div class="error-row-en">' + FinI18n.t("errorbook.mc_will") + "</div>";
        listWrap.appendChild(row);
        const b = row.querySelector(".errorbook-repro");
        b.addEventListener("click", function () {
          startSingleReview(b.getAttribute("data-key"));
        });
      });
    });
  }

  function clearAllMistakes() {
    if (confirm("确定清空所有错题记录？")) {
      state.saved.mistakes = {};
      save();
      renderErrorBook();
    }
  }

  /* ---------- Track B1 · 双语术语卡 ---------- */
  let cardsFilter = "all";

  function renderCards(filter) {
    cardsFilter = filter || cardsFilter;
    const wrap = $("#cards-list");
    if (!wrap) return;
    FinSeedLoader.ready().then(function ({ data, termMap }) {
      wrap.innerHTML = "";
      const list = (data.termCards || []).filter(function (c) {
        return cardsFilter === "all" || c.context === cardsFilter;
      });
      if (list.length === 0) {
        wrap.innerHTML = '<p class="errorbook-empty">该分类暂无术语卡。</p>';
        return;
      }
      list.forEach(function (c) {
        const card = document.createElement("div");
        card.className = "term-card";
        const alt = c.enAlt && c.enAlt.length ? " · " + c.enAlt.join(" / ") : "";
        card.innerHTML =
          '<div class="term-card-head">' +
          '<span class="term-card-ja">' + esc(c.ja) + "</span>" +
          '<span class="term-card-en">' + esc(c.en) + "</span>" +
          (alt ? '<span class="term-card-alt">' + esc(alt) + "</span>" : "") +
          "</div>" +
          '<div class="term-card-usages">' +
          '<div class="term-usage lang-ja">🇯🇵&nbsp; ' + esc(c.jaUsage) + "</div>" +
          '<div class="term-usage lang-en">🇬🇧&nbsp; ' + esc(c.enUsage) + "</div>" +
          "</div>" +
          '<div class="term-card-hints">' +
          '<div class="term-hint-read">🎧 读音：' + esc(c.readAloudHint || "") + "</div>" +
          (c.wrongPairWarning
            ? '<div class="term-hint-warn">⚠️ ' + esc(c.wrongPairWarning) + "</div>"
            : "") +
          "</div>" +
          (c.etymologyNote
            ? '<div class="term-etymology">' +
              '<button class="term-etymology-toggle" data-etym="' + c.id + '">📖 词源小注（可选）</button>' +
              '<div class="term-etymology-body hidden" data-etym-body="' + c.id + '">' +
              esc(c.etymologyNote) +
              "</div></div>"
            : "");
        wrap.appendChild(card);
      });
      /* 词源折叠 */
      $all(".term-etymology-toggle", wrap).forEach(function (btn) {
        btn.addEventListener("click", function () {
          const body = $('[data-etym-body="' + btn.dataset.etym + '"]', wrap);
          if (body) body.classList.toggle("hidden");
        });
      });
    });
  }

  /* ---------- Track B2 · 产出训练（打字） ---------- */
  let prod = null; // { items, index, correct, total }

  function startProduction() {
    FinSeedLoader.ready().then(function ({ data }) {
      const all = data.productionItems || [];
      if (all.length === 0) return;
      const items = shuffle(all).slice(0, 6);
      prod = { items, index: 0, correct: 0, total: items.length };
      $("#prod-progress").textContent = "1/" + items.length;
      showScreen("screen-production");
      renderProductionQ();
    });
  }

  function renderProductionQ() {
    if (!prod) return;
    const item = prod.items[prod.index];
    $("#prod-progress").textContent = prod.index + 1 + "/" + prod.total;
    $("#prod-feedback").classList.add("hidden");
    $("#prod-done").classList.add("hidden");
    const card = $("#prod-question");
    const typeLabel =
      item.type === "type_en"
        ? "⌨️ 打出英文"
        : item.type === "type_ja"
          ? "⌨️ 打出日文"
          : "👇 选答案";
    card.innerHTML =
      '<span class="q-tag">' + typeLabel + (item.termCardId ? " · " + esc(item.termCardId) : "") + "</span>" +
      '<div class="q-text">' + esc(item.cue) + "</div>" +
      (item.cueJa ? '<div class="prod-hint">🇯🇵 ' + esc(item.cueJa) + "</div>" : "") +
      '<div class="prod-input-area"></div>';
    const area = $(".prod-input-area", card);
    if (item.type === "select_ja") {
      const optWrap = document.createElement("div");
      optWrap.className = "prod-options";
      (item.options || []).forEach(function (opt, i) {
        const btn = document.createElement("button");
        btn.className = "q-option";
        btn.textContent = opt;
        btn.dataset.oi = i;
        btn.addEventListener("click", function () {
          finishProductionItem(btn, opt);
        });
        optWrap.appendChild(btn);
      });
      area.appendChild(optWrap);
    } else {
      const inputWrap = document.createElement("div");
      inputWrap.className = "prod-input-wrap";
      inputWrap.innerHTML =
        '<input type="text" id="prod-input" placeholder="' +
        (item.type === "type_en" ? "Type English…" : "日本語で入力…") +
        '" autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="text">' +
        '<button class="prod-submit" id="prod-submit">提交</button>';
      area.appendChild(inputWrap);
      const input = $("#prod-input", area);
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          submitProduction(input);
        }
      });
      $("#prod-submit", area).addEventListener("click", function () {
        submitProduction(input);
      });
      input.focus();
    }
  }

  function submitProduction(input) {
    const item = prod.items[prod.index];
    const value = input.value;
    if (!value.trim()) return;
    const judge =
      item.type === "type_ja" ? FinScore.judgeJa : FinScore.judgeEn;
    const res = judge(value, item.accepted);
    finishProductionItem(null, null, res);
  }

  /* 结算一道产出题：标记选项（select 模式）、反馈、朗读对照、错题记录 */
  function finishProductionItem(btn, opt, res) {
    const item = prod.items[prod.index];
    if (btn) {
      const opts = $all(".q-option", $("#prod-question"));
      opts.forEach(function (b) {
        b.disabled = true;
        b.classList.toggle("correct", item.accepted.includes(b.textContent));
        b.classList.toggle("wrong", b === btn && !item.accepted.includes(opt));
      });
    }
    const ok = res ? res.ok : item.accepted.includes(opt);
    if (ok) prod.correct += 1;

    const fb = $("#prod-feedback");
    fb.classList.remove("hidden");
    const verdict = $("#prod-verdict");
    verdict.textContent = ok ? "✅ 正确" : "❌ 有偏差";
    verdict.className = "feedback-verdict " + (ok ? "good" : "bad");
    $("#prod-explain").textContent = item.feedback || "";
    const correctLine = $("#prod-correct-line");
    if (!ok) {
      correctLine.classList.remove("hidden");
      correctLine.textContent = "参考答案：" + item.accepted.join(" / ");
      recordMistake("prod", item.id);
    } else {
      correctLine.classList.add("hidden");
    }
    /* 朗读对照：挂对应术语卡 */
    renderReadAloud(item.termCardId);
    fb.scrollIntoView({ behavior: "smooth", block: "nearest" });

    const last = prod.index === prod.total - 1;
    $("#prod-next").textContent = last ? "查看结果" : "下一题";
    $("#prod-next").onclick = last ? finishProduction : nextProduction;
  }

  /* 朗读对照（Track B2 Read-aloud mirror）：先给提示，展开后才显示文稿 */
  function renderReadAloud(termCardId) {
    const box = $("#prod-readaloud");
    if (!box) return;
    FinSeedLoader.ready().then(function ({ termMap }) {
      const c = termMap[termCardId];
      if (!c) {
        box.innerHTML = "";
        return;
      }
      box.innerHTML =
        '<div class="readaloud-hint">🎧 朗读对照：先自己读一遍下面的标准句（可打开文稿逐句自检）。不朗读也能通关。</div>' +
        '<button class="readaloud-toggle" id="ra-toggle">👁️ 展开标准文稿对照</button>' +
        '<div class="readaloud-text hidden" id="ra-text">' +
        '<div class="readaloud-sentence"><span class="sen-label">EN</span>' + esc(c.enUsage) + "</div>" +
        '<div class="readaloud-sentence"><span class="sen-label">JA</span>' + esc(c.jaUsage) + "</div>" +
        (c.readAloudHint
          ? '<div class="readaloud-hint" style="margin-top:8px">🎧 ' + esc(c.readAloudHint) + "</div>"
          : "") +
        "</div>";
      $("#ra-toggle", box).addEventListener("click", function () {
        $("#ra-text", box).classList.toggle("hidden");
      });
    });
  }

  function nextProduction() {
    prod.index += 1;
    renderProductionQ();
  }

  function finishProduction() {
    $("#prod-question").classList.add("hidden");
    $("#prod-feedback").classList.add("hidden");
    $("#prod-done").classList.remove("hidden");
    const gained = prod.correct * 8;
    addXp(gained);
    $("#prod-score").innerHTML =
      "打出正确 " + prod.correct + " / " + prod.total +
      " 题，获得 <b>+" + gained + "</b> 经验。" +
      "<br>答错的题已进错题本，考前突击会再看见。";
    $("#prod-progress").textContent = prod.total + "/" + prod.total;
    refreshPlayer();
  }

  /* ---------- Track B3 · 面试演练（模板卡 + 朗读对照） ---------- */
  let interview = null; // { items, index, done, total }

  function startInterview() {
    FinSeedLoader.ready().then(function ({ data }) {
      const all = data.interviewCards || [];
      if (all.length === 0) return;
      const items = shuffle(all).slice(0, 3);
      interview = { items, index: 0, done: 0, total: items.length };
      $("#iv-progress").textContent = "1/" + items.length;
      showScreen("screen-interview");
      renderInterviewQ();
    });
  }

  function renderInterviewQ() {
    if (!interview) return;
    const card = interview.items[interview.index];
    $("#iv-progress").textContent = interview.index + 1 + "/" + interview.total;
    $("#iv-done").classList.add("hidden");
    const wrap = $("#iv-card");
    wrap.classList.remove("hidden");
    wrap.innerHTML =
      '<span class="iv-topic">' + esc(card.topic) + "</span>" +
      '<div class="iv-section-title">🟦 第一人称模板（EN）· 大声读出来，替换 {} 为真实场景</div>' +
      '<div class="iv-template">' + escVars(card.templateEn) + "</div>" +
      '<div class="iv-section-title">🟪 第一人称模板（JA）</div>' +
      '<div class="iv-template">' + escVars(card.templateJa) + "</div>" +
      '<div class="iv-section-title">🔧 变量示例</div>' +
      '<div class="iv-vars-grid">' +
      card.vars
        .map(function (v) {
          const ex = varExample(v);
          return '<div class="iv-var-row"><b>' + esc(v) + "</b> → " + esc(ex) + "</div>";
        })
        .join("") +
      "</div>" +
      '<div class="iv-section-title">❓ 追问（Follow-up）</div>' +
      '<div class="iv-followup">EN：' + esc(card.followUpEn) + "<br>JA：" + esc(card.followUpJa) + "</div>" +
      '<div class="readaloud-box">' +
      '<div class="readaloud-hint">🎧 朗读对照：读 EN 或 JA 一句，展开文稿逐字自检。</div>' +
      '<button class="readaloud-toggle" id="iv-ra-toggle">👁️ 展开文稿对照</button>' +
      '<div class="readaloud-text hidden" id="iv-ra-text">' +
      '<div class="readaloud-sentence"><span class="sen-label">EN</span>' + esc(card.templateEn) + "</div>" +
      '<div class="readaloud-sentence"><span class="sen-label">JA</span>' + esc(card.templateJa) + "</div>" +
      "</div>" +
      "</div>" +
      '<div class="iv-actions">' +
      '<button class="primary-btn" id="iv-done-btn">✅ 我朗读 / 说过了（自评）</button>' +
      "</div>";
    $("#iv-ra-toggle", wrap).addEventListener("click", function () {
      $("#iv-ra-text", wrap).classList.toggle("hidden");
    });
    $("#iv-done-btn", wrap).addEventListener("click", function () {
      interview.done += 1;
      const last = interview.index === interview.total - 1;
      if (last) {
        finishInterview();
      } else {
        wrap.classList.add("hidden");
        interview.index += 1;
        renderInterviewQ();
      }
    });
  }

  function finishInterview() {
    const iv = interview;
    interview = null;
    $("#iv-card").classList.add("hidden");
    $("#iv-done").classList.remove("hidden");
    /* 覆盖考点与关键概念汇总 */
    const topics = iv.items.map(function (c) { return c.topic; }).join(" · ");
    let keys = [];
    iv.items.forEach(function (c) { keys = keys.concat(c.keys); });
    const uniq = Array.from(new Set(keys)).slice(0, 12).join(" / ");
    $("#iv-summary").innerHTML =
      "完成 <b>" + iv.done + " / " + iv.total + "</b> 张模板卡。" +
      "<br>覆盖考点：" + esc(topics) +
      "<br>关键概念：" + esc(uniq) +
      "<br>建议：回到「错题本」或「双语术语卡」巩固不熟的词。";
    $("#iv-progress").textContent = iv.total + "/" + iv.total;
  }

  /* ---------- Track E · 模拟面试（连答 + 追问 + 计时 + 结束页） ---------- */
  let mock = null; // { items, index, phase, done, total, timer, interval }

  const MOCK_SECONDS = 300;

  function startMock() {
    FinSeedLoader.ready().then(function ({ data }) {
      const all = data.interviewCards || [];
      if (all.length === 0) return;
      const items = shuffle(all).slice(0, 4);
      mock = {
        items,
        index: 0,
        phase: "template", // 'template' | 'followup'
        done: 0,
        total: items.length,
        timer: MOCK_SECONDS,
        interval: null,
      };
      $("#mock-progress") && ($("#mock-progress").textContent = "1/" + items.length);
      showScreen("screen-mock");
      renderMockQ();
      startMockTimer();
    });
  }

  function renderMockQ() {
    if (!mock) return;
    const card = mock.items[mock.index];
    $("#mock-done").classList.add("hidden");
    const wrap = $("#mock-card");
    wrap.classList.remove("hidden");
    const phase = mock.phase;
    /* 用户自评按钮文案 */
    const actionLabel =
      phase === "template"
        ? FinI18n.t("mock.see_followup")
        : FinI18n.t("mock.answered");
    const phaseLabel =
      phase === "template" ? FinI18n.t("mock.phase_template") : FinI18n.t("mock.phase_followup");
    /* 展示模板句或追问 */
    const body =
      phase === "template"
        ? '<div class="iv-section-title">🟦 EN 第一人称模板（朗读后自评）</div>' +
          '<div class="iv-template">' + escVars(card.templateEn) + "</div>" +
          '<div class="iv-section-title">🟪 JA 第一人称模板</div>' +
          '<div class="iv-template">' + escVars(card.templateJa) + "</div>" +
          '<div class="iv-section-title">🔧 变量示例</div>' +
          '<div class="iv-vars-grid">' +
          card.vars.map(function (v) { return '<div class="iv-var-row"><b>' + esc(v) + "</b> → " + esc(varExample(v)) + "</div>"; }).join("") +
          "</div>"
        : '<div class="iv-section-title">❓ 追问</div>' +
          '<div class="iv-followup">EN：' + esc(card.followUpEn) + "<br>JA：" + esc(card.followUpJa) + "</div>";
    wrap.innerHTML =
      '<span class="iv-topic">' + esc(card.topic) + " · " + (mock.index + 1) + "/" + mock.total + "</span>" +
      '<div class="mock-phase" id="mock-phase">' + phaseLabel + "</div>" +
      body +
      '<div class="readaloud-box">' +
      '<div class="readaloud-hint">🎧 朗读对照：先自己读/答，再展开文稿逐句核对。</div>' +
      '<button class="readaloud-toggle" id="mock-ra-toggle">👁️ 展开文稿对照</button>' +
      '<div class="readaloud-text hidden" id="mock-ra-text">' +
      (phase === "template"
        ? '<div class="readaloud-sentence"><span class="sen-label">EN</span>' + esc(card.templateEn) + "</div>" +
          '<div class="readaloud-sentence"><span class="sen-label">JA</span>' + esc(card.templateJa) + "</div>"
        : '<div class="readaloud-sentence"><span class="sen-label">EN</span>' + esc(card.followUpEn) + "</div>" +
          '<div class="readaloud-sentence"><span class="sen-label">JA</span>' + esc(card.followUpJa) + "</div>") +
      "</div>" +
      "</div>" +
      '<div class="iv-actions">' +
      '<button class="primary-btn" id="mock-act">' + actionLabel + "</button>" +
      "</div>";
    $("#mock-ra-toggle", wrap).addEventListener("click", function () {
      $("#mock-ra-text", wrap).classList.toggle("hidden");
    });
    $("#mock-act", wrap).addEventListener("click", function () {
      if (mock.phase === "template") {
        mock.phase = "followup";
        renderMockQ();
        return;
      }
      mock.done += 1;
      const last = mock.index === mock.total - 1;
      if (last) {
        finishMock();
      } else {
        mock.index += 1;
        mock.phase = "template";
        renderMockQ();
      }
    });
  }

  function startMockTimer() {
    if (mock.interval) clearInterval(mock.interval);
    mock.interval = setInterval(function () {
      mock.timer -= 1;
      const t = $("#mock-timer");
      if (t) t.textContent = FinI18n.t("mock.sec", { s: mock.timer });
      if (mock.timer <= 0) {
        clearInterval(mock.interval);
        finishMock(true);
      }
    }, 1000);
  }

  function finishMock(timeout) {
    if (mock.interval) clearInterval(mock.interval);
    const m = mock;
    mock = null;
    $("#mock-card").classList.add("hidden");
    $("#mock-done").classList.remove("hidden");
    const topics = m.items.map(function (c) { return c.topic; }).join(" · ");
    let keys = [];
    m.items.forEach(function (c) { keys = keys.concat(c.keys); });
    const uniq = Array.from(new Set(keys)).slice(0, 12).join(" / ");
    $("#mock-summary").innerHTML =
      FinI18n.t("mock.done_summary", { a: m.done, b: m.total, topics: esc(topics) }) +
      (timeout ? "<br>" + FinI18n.t("mock.timeout_hint") : "") +
      "<br>" + FinI18n.t("mock.weak") + esc(uniq);
    const t = $("#mock-timer");
    if (t) t.textContent = "0s";
  }

  /* ---------- Track B · 展示辅助 ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escVars(s) {
    /* 高亮 {var} */
    return esc(s).replace(/\{([^}]+)\}/g, '<span class="var">{' + "$1" + "}</span>");
  }

  function varExample(v) {
    const ex = {
      "{period}": "last fiscal year (前期)",
      "{metric}": "gross margin (売上総利益率)",
      "{company}": "our company / 当社",
      "{revenue}": "approximately 5 billion yen",
      "{basis}": "industry reports & peer comparisons",
    };
    return ex[v] || v + "（换成实际值）";
  }


  /* ---------- 快捷键 ---------- */
  function handleKeydown(e) {
    const active = document.querySelector(".screen.active")?.id;
    if (active === "screen-production" && e.key === "Escape") {
      prod = null;
      showScreen("screen-menu");
      return;
    }
    if (active === "screen-interview" && e.key === "Escape") {
      interview = null;
      showScreen("screen-menu");
      return;
    }
    if (active === "screen-mock" && e.key === "Escape") {
      if (mock && mock.interval) clearInterval(mock.interval);
      mock = null;
      showScreen("screen-menu");
      return;
    }
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
        if (target === "screen-cards") renderCards("all");
        if (target === "screen-production") startProduction();
        if (target === "screen-interview") startInterview();
        if (target === "screen-mock") startMock();
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

    /* Track A：链条撤回上一步 */
    $("#chain-undo").addEventListener("click", () => {
      undoLastMove();
    });

    /* Track B1：术语卡筛选 */
    $all("#cards-filter .seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        $all("#cards-filter .seg-btn").forEach((b) => b.classList.toggle("active", b === btn));
        renderCards(btn.dataset.cfilter);
      });
    });

    /* Track B2：产出训练退出 / 再练 */
    $("#prod-back").addEventListener("click", () => {
      prod = null;
      showScreen("screen-menu");
    });
    $("#prod-again").addEventListener("click", () => {
      startProduction();
    });

    /* Track B3：面试演练退出 / 再来 */
    $("#iv-back").addEventListener("click", () => {
      interview = null;
      showScreen("screen-menu");
    });
    $("#iv-again").addEventListener("click", () => {
      startInterview();
    });

    /* Track E：模拟面试 */
    $("#mock-back").addEventListener("click", () => {
      if (mock && mock.interval) clearInterval(mock.interval);
      mock = null;
      showScreen("screen-menu");
    });
    $("#mock-again").addEventListener("click", () => {
      startMock();
    });

    /* 语言切换（US-10） */
    $all(".lang-switch .seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        FinI18n.setLang(btn.dataset.lang);
        $all(".lang-switch .seg-btn").forEach((b) => b.classList.toggle("active", b === btn));
      });
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
    FinI18n.applyStatic();
    /* 语言高亮 */
    const cur = FinI18n.lang();
    $all(".lang-switch .seg-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.lang === cur);
    });
    showScreen("screen-menu");
  }

  /* 语言切换后重渲染当前屏的动态内容（章节名、菜单提示等） */
  window.FinQuestRefreshLang = function () {
    const active = document.querySelector(".screen.active")?.id;
    if (active === "screen-menu") {
      $("#menu-tip").textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
    }
    if (active === "screen-chapters") renderChapters();
    if (active === "screen-quiz" && quiz) renderQuestion();
    if (active === "screen-chain") { }
    if (active === "screen-warmup" && warmup) renderWarmupQuestion();
    if (active === "screen-cards") renderCards(cardsFilter);
    if (active === "screen-errorbook") renderErrorBook();
    if (active === "screen-production" && prod) renderProductionQ();
    if (active === "screen-interview" && interview) renderInterviewQ();
    if (active === "screen-mock" && mock) renderMockQ();
  };

  document.addEventListener("DOMContentLoaded", init);
})();
