/* =========================================================
 * FinQuest UI 壳语言（Track C · US-10）
 * 学习内容（题目、术语卡、模板句）保持 JA+EN 双语，不随壳切换。
 * 用法：
 *   FinI18n.t("key")      取当前语言文案
 *   FinI18n.setLang("en") 切换并刷新 [data-i18n] 静态元素
 *   FinI18n.lang()        当前语言
 * 语言持久化在 localStorage "finquest_lang"，默认 zh。
 * ========================================================= */
(function () {
  "use strict";

  var DICT = {
    /* ---- 英雄区 / 主菜单 ---- */
    "hero.badge": { zh: "面试专用", en: "INTERVIEW PREP", ja: "面接対策" },
    "hero.title": { zh: "财务面试大师", en: "Finance Interview Master", ja: "財務面接マスター" },
    "hero.subtitle": { zh: "FinQuest · 闯关 RPG ＋ 链条拼搭", en: "FinQuest · Quest RPG + P&L Builder", ja: "FinQuest · クエスト＋チェーン組み立て" },
    "hero.xp": { zh: "经验", en: "XP", ja: "経験値" },
    "m.chapters": { zh: "闯关模式", en: "Chapter Quest", ja: "チャプタークエスト" },
    "m.chapters.sub": { zh: "五章财务知识，经验升级", en: "Five chapters of finance, earn XP", ja: "5章の財務知識、経験値アップ" },
    "m.chain": { zh: "链条拼搭", en: "P&L Builder", ja: "チェーン組み立て" },
    "m.chain.sub": { zh: "P&L 排序 · 日英匹配 · 限时", en: "P&L sort · JA/EN match · timed", ja: "P&L並び替え・日英マッチ・時間制限" },
    "m.warmup": { zh: "每日热身前 10 分钟", en: "10-Minute Daily Warmup", ja: "毎日ウォームアップ10分" },
    "m.warmup.sub": { zh: "识别 + 产出混练，面试前专用", en: "Recognition + production mix", ja: "識別＋アウトプット混練、面接前用" },
    "m.cards": { zh: "双语术语卡", en: "Bilingual Terms", ja: "バイリンガル用語カード" },
    "m.cards.sub": { zh: "JA | EN | 各一句用法 · 朗读提示 · 易混警示", en: "JA|EN usage, reading hints, pitfalls", ja: "JA|EN各一文・発音ヒント・混同注意" },
    "m.prod": { zh: "产出训练 · 打字", en: "Typing Practice", ja: "アウトプット練習（入力）" },
    "m.prod.sub": { zh: "中文 cue 打出日/英术语，练「说得出」", en: "Type EN/JA terms from a cue", ja: "ヒントから日英用語を打つ" },
    "m.mock": { zh: "模拟面试", en: "Mock Interview", ja: "模擬面接" },
    "m.mock.sub": { zh: "3–4 题连答 · 追问 · 计时", en: "Multi-question session with follow-ups", ja: "3〜4問＋追問＋タイマー" },
    "m.iv": { zh: "面试演练 · 模板卡", en: "Interview Cards", ja: "面接テンプレートカード" },
    "m.iv.sub": { zh: "第一人称答句 + 追问 + 朗读对照", en: "1st-person replies + follow-ups", ja: "一人称回答＋フォローアップ" },
    "m.errorbook": { zh: "错题本", en: "Wrong Book", ja: "間違いノート" },
    "m.errorbook.sub": { zh: "错题数量", en: "Wrong count", ja: "間違い数" },
    "m.review.desc": { zh: "考前只刷错题", en: "Review only wrong items", ja: "間違いだけを復習" },
    "m.reset": { zh: "重置进度", en: "Reset Progress", ja: "進捗リセット" },
    "m.reset.sub": { zh: "清空本地保存的成绩", en: "Clear saved progress", ja: "保存済みの進捗を消去" },
    "m.lang": { zh: "界面语言", en: "Language", ja: "言語" },

    /* ---- 通用 ---- */
    "back": { zh: "← 返回", en: "← Back", ja: "← 戻る" },
    "exit": { zh: "← 退出", en: "← Exit", ja: "← 終了" },
    "next": { zh: "下一题", en: "Next", ja: "次へ" },
    "finish": { zh: "完成", en: "Finish", ja: "完了" },
    "view_result": { zh: "查看结果", en: "View Result", ja: "結果を見る" },
    "to_menu": { zh: "返回主菜单", en: "Back to Menu", ja: "メニューへ戻る" },
    "again": { zh: "再来一局", en: "Play Again", ja: "もう一度" },
    "change_mode": { zh: "换模式", en: "Change Mode", ja: "モード変更" },
    "correct": { zh: "✅ 正确", en: "✅ Correct", ja: "✅ 正解" },
    "wrong": { zh: "❌ 答错了", en: "❌ Wrong", ja: "❌ 不正解" },
    "template_en": { zh: "面试英语模板句", en: "EN template to memorize", ja: "面接で使える英語テンプレ" },
    "answer_ref": { zh: "参考答案", en: "Answer", ja: "回答例" },
    "wrongbook_added": { zh: "（已加入错题本）", en: "(added to wrong book)", ja: "（間違いノートに追加）" },

    /* ---- 章节 / 答题 ---- */
    "quiz.mode_label": { zh: "答题方式", en: "Answer mode", ja: "回答形式" },
    "quiz.seg_choice": { zh: "选择题", en: "Multiple Choice", ja: "選択問題" },
    "quiz.seg_self": { zh: "自测（隐藏选项）", en: "Self-test (hidden options)", ja: "自測（選択肢を隠す）" },
    "quiz.self_note": { zh: "自测模式：不看选项，先在脑中组织英语答案，再点「显示答案」对照，最后自评。", en: "Self-test: organize your English answer first, then reveal and self-grade.", ja: "自測モード：選択肢を見ずに英語で答えを組み立て、答えを表示して自己採点。" },
    "quiz.show_answer": { zh: "👁️ 显示答案", en: "👁️ Show Answer", ja: "👁️ 答えを見る" },
    "quiz.self_ok": { zh: "✅ 自评正确", en: "✅ I said it well", ja: "✅ 言えた" },
    "quiz.self_no": { zh: "❌ 标记为错题", en: "❌ Did not say it well", ja: "❌ うまく言えなかった" },
    "quiz.review_title": { zh: "考前突击 · 错题", en: "Review · Wrong Items", ja: "間違いノート復習" },
    "quiz.review_prod_hint": { zh: "答对自动移出错题本 · <kbd>Enter</kbd> 提交 · <kbd>Esc</kbd> 退出", en: "Answer removes it from the book · <kbd>Enter</kbd> submit · <kbd>Esc</kbd> exit", ja: "正解でノートから削除 · <kbd>Enter</kbd> 送信 · <kbd>Esc</kbd> 終了" },
    "quiz.review_said_ok": { zh: "✅ 我说出来了，移出错题本", en: "✅ I produced it — remove", ja: "✅ 言えたので削除" },
    "quiz.review_keep": { zh: "❌ 还没说好，保留", en: "❌ Keep it for later", ja: "❌ まだ言えないので残す" },
    "quiz.review_produce_prompt": { zh: "不看选项，用英语口头或打字说出答案；然后展开模板句对照，最后自评。", en: "Say or type your answer first, then reveal the template and self-grade.", ja: "選択肢を見ずに英語で答えを言う／打つ。テンプレを表示して自己採点。" },

    /* ---- 章节完成 ---- */
    "done.title": { zh: "章节完成！", en: "Chapter complete!", ja: "チャプター完了！" },
    "done.xp": { zh: "获得经验", en: "XP gained", ja: "獲得経験値" },
    "done.levelup": { zh: "🎉 升级了！现在是", en: "🎉 Level up! Now", ja: "🎉 レベルアップ！現在" },
    "done.continue": { zh: "继续", en: "Continue", ja: "続ける" },
    "done.review_done": { zh: "考前突击完成", en: "Review complete", ja: "復習完了" },

    /* ---- 链条拼搭 ---- */
    "chain.title": { zh: "链条拼搭", en: "P&L Builder", ja: "チェーン組み立て" },
    "chain.mode_en": { zh: "P&L 链条排序（英文）", en: "P&L Chain (EN)", ja: "P&Lチェーン（英語）" },
    "chain.mode_en.sub": { zh: "把损益表科目按正确顺序排好", en: "Sort P&L items in order", ja: "損益項目を正しい順に並べる" },
    "chain.mode_jp": { zh: "P&L 链条排序（日文）", en: "P&L Chain (JA)", ja: "P&Lチェーン（日本語）" },
    "chain.mode_jp.sub": { zh: "日本科目名的顺序", en: "Order of Japanese items", ja: "日本語の勘定科目の順序" },
    "chain.mode_match": { zh: "日英术语匹配", en: "JA ↔ EN Match", ja: "日英用語マッチ" },
    "chain.mode_match.sub": { zh: "日文科目 ↔ 英文说法", en: "Match Japanese items to English", ja: "日本語科目と英語を対応" },
    "chain.mode_bs": { zh: "B/S 科目匹配", en: "B/S Sides", ja: "B/S区分" },
    "chain.mode_bs.sub": { zh: "资产负债表借贷两边", en: "Assets vs Liabilities & Equity", ja: "資産 vs 負債・純資産" },
    "chain.undo": { zh: "↩️ 撤回上一步", en: "↩️ Undo", ja: "↩️ 元に戻す" },
    "chain.done_title": { zh: "完成！", en: "Done!", ja: "完了！" },
    "chain.all_ok": { zh: "🎉 链条拼搭完成！", en: "🎉 Chain complete!", ja: "🎉 チェーン完成！" },
    "chain.has_wrong": { zh: "完成，但有放错的位置", en: "Done, but some are wrong", ja: "完了、ただし間違いあり" },
    "chain.timeout": { zh: "⏰ 时间到", en: "⏰ Time's up", ja: "⏰ 時間切れ" },
    "chain.win_msg": { zh: "全部正确，+10 经验。日英链条已刻进肌肉记忆。", en: "All correct, +10 XP. The chain is in your muscle memory.", ja: "全問正解、経験値+10。チェーンを覚えた。" },
    "chain.undo_done": { zh: "↩️ 已撤回上一步，可以重新放置", en: "↩️ Undone — place again", ja: "↩️ 元に戻しました。置き直せます" },

    /* ---- 热身 ---- */
    "warmup.title": { zh: "每日热身 · 6 题", en: "Daily Warmup · 6", ja: "ウォームアップ・6問" },
    "warmup.note": { zh: "识别 + 产出混练：4 道选择题 + 2 道打字产出。", en: "Recognition + production: 4 MC + 2 typing.", ja: "識別＋アウトプット：4問選択＋2問入力。" },
    "warmup.done_title": { zh: "热身完毕 🔥", en: "Warmup done 🔥", ja: "ウォームアップ完了 🔥" },
    "warmup.score": { zh: "识别答对 {a}/{b}，产出答对 {c}/{d}。面试开场前 10 分钟，过一遍模板句。", en: "Recognition {a}/{b}, production {c}/{d}. Review templates before the interview.", ja: "識別 {a}/{b}、アウトプット {c}/{d}。面接前にテンプレを確認。" },

    /* ---- 错题本 ---- */
    "errorbook.title": { zh: "错题本", en: "Wrong Book", ja: "間違いノート" },
    "errorbook.review": { zh: "🎯 考前突击 · 只刷错题", en: "🎯 Review Only Wrong", ja: "🎯 間違いだけ復習" },
    "errorbook.clear": { zh: "🗑️ 清空错题", en: "🗑️ Clear Wrong Book", ja: "🗑️ 間違いを消去" },
    "errorbook.empty": { zh: "🎉 暂无错题，继续保持！", en: "🎉 No wrong items!", ja: "🎉 間違いなし！" },
    "errorbook.reproduce": { zh: "🎯 再产出这道题", en: "🎯 Re-produce this", ja: "🎯 この問題を再アウトプット" },
    "errorbook.wrong_count": { zh: "错 {n} 次", en: "Wrong x{n}", ja: "間違い{n}回" },
    "errorbook.prod_will": { zh: "考前突击会要求再产出（打字/选择），答对自动移出。", en: "Review asks you to re-produce this; answering removes it.", ja: "復習で再アウトプットが必要。正解で削除。" },
    "errorbook.mc_will": { zh: "考前突击不再只点选项：要求口头/打字产出模板句后自评移出。", en: "Review requires producing the answer (say/type), not just re-tapping options.", ja: "復習では選択肢を選ぶだけではダメ。口頭・入力で答えて自己採点。" },

    /* ---- 术语卡 ---- */
    "cards.title": { zh: "双语术语卡", en: "Bilingual Terms", ja: "バイリンガル用語カード" },
    "cards.note": { zh: "每张卡：日本说法 | 英文说法 | 各一句面试口语用法。点「词源」可展开小注（P2 可不看）。", en: "JA term | EN term | one usage sentence each. Etymology is optional.", ja: "日本語・英語・各一文。語源は任意（オプション）。" },
    "cards.etym": { zh: "📖 词源小注（可选）", en: "📖 Etymology (optional)", ja: "📖 語源メモ（任意）" },
    "cards.read": { zh: "🎧 读音：", en: "🎧 Reading: ", ja: "🎧 発音：" },
    "cards.filter_all": { zh: "全部", en: "All", ja: "すべて" },

    /* ---- 产出训练 ---- */
    "prod.title": { zh: "产出训练 · 打字", en: "Typing Practice", ja: "アウトプット練習（入力）" },
    "prod.note": { zh: "把「看懂」变成「说得出」：只看提示，自己打出日/英术语。", en: "Turn recognition into production: type the JA/EN term from the cue.", ja: "「分かる」を「言える」に：ヒントから用語を打つ。" },
    "prod.submit": { zh: "提交", en: "Submit", ja: "送信" },
    "prod.deviation": { zh: "❌ 有偏差", en: "❌ Not quite", ja: "❌ 惜しい" },
    "prod.done_title": { zh: "产出训练完成 ⌨️", en: "Typing done ⌨️", ja: "入力練習完了 ⌨️" },
    "prod.score": { zh: "打出正确 {a} / {b} 题，获得 <b>+{c}</b> 经验。答错的题已进错题本。", en: "Correct {a}/{b}, <b>+{c}</b> XP. Wrong items went to the book.", ja: "正解 {a}/{b}、経験値<b>+{c}</b>。間違いはノートへ。" },
    "prod.again": { zh: "再练一组", en: "Another round", ja: "もう1セット" },
    "prod.hint_en": { zh: "请写出「", en: "Write the English for 「", ja: "「" },
    "prod.type_en": { zh: "⌨️ 打出英文", en: "⌨️ Type EN", ja: "⌨️ 英語を入力" },
    "prod.type_ja": { zh: "⌨️ 打出日文", en: "⌨️ Type JA", ja: "⌨️ 日本語を入力" },
    "prod.select": { zh: "👇 选答案", en: "👇 Choose", ja: "👇 選択" },

    /* ---- 面试演练 / 模拟面试 ---- */
    "iv.title": { zh: "面试演练 · 模板卡", en: "Interview Cards", ja: "面接テンプレートカード" },
    "iv.done_title": { zh: "演练完成 🎙️", en: "Drill done 🎙️", ja: "練習完了 🎙️" },
    "iv.said": { zh: "✅ 我朗读 / 说过了（自评）", en: "✅ I read / said it (self)", ja: "✅ 読んだ／言えた（自己）" },
    "iv.again": { zh: "再来一轮", en: "Another round", ja: "もう1ターン" },
    "mock.title": { zh: "模拟面试 · 计时", en: "Mock Interview · Timed", ja: "模擬面接・タイマー" },
    "mock.sec": { zh: "剩余 {s}s", en: "{s}s left", ja: "残り{s}秒" },
    "mock.phase_template": { zh: "① 看题 → 朗读模板 → 自评", en: "Read the template aloud, self-grade", ja: "テンプレを読んで自己採点" },
    "mock.phase_followup": { zh: "② 追问 → 作答 → 自评", en: "Answer the follow-up, self-grade", ja: "フォローアップに答えて自己採点" },
    "mock.see_followup": { zh: "我读 / 说过了 → 看追问", en: "Done → Next: follow-up", ja: "読んだ → フォローアップへ" },
    "mock.answered": { zh: "我答完追问 → 下一题", en: "Answered → Next question", ja: "答えた → 次の問題へ" },
    "mock.done_title": { zh: "模拟面试结束 🎙️", en: "Mock interview over 🎙️", ja: "模擬面接終了 🎙️" },
    "mock.done_summary": { zh: "完成 {a}/{b} 题（追问也答完）。覆盖考点：{topics}", en: "Completed {a}/{b} incl. follow-ups. Topics: {topics}", ja: "{a}/{b}問完了（追問含む）。テーマ：{topics}" },
    "mock.weak": { zh: "建议巩固概念：", en: "Review concepts: ", ja: "復習をおすすめ：", },
    "mock.timeout_hint": { zh: "（时间到，按已完成结算）", en: "(time up — settled as complete)", ja: "（時間切れ — 完了で確定）" },

    /* ---- 链条反馈（自解释） ---- */
    "chain.wrong_pos": { zh: "❌ 第 {n} 位应该是「{correct}」，不是「{got}」。点「↩️ 撤回上一步」重放", en: "❌ Slot {n} should be 「{correct}」, not 「{got}」. Use Undo and re-place", ja: "❌ {n}番目は「{correct}」、実際は「{got}」。元に戻して置き直し" },
    "chain.wrong_side": { zh: "❌ 「{item}」属于「{side}」，不是「{target}」", en: "❌ 「{item}」belongs to «{side}», not «{target}»", ja: "❌ 「{item}」は「{side}」、ここは「{target}」" },
    "chain.wrong_match": { zh: "❌ 第 {n} 位「{name}」应对应「{expect}」，不是「{got}」", en: "❌ Slot {n}「{name}」→「{expect}」, not 「{got}」", ja: "❌ {n}番目「{name}」は「{expect}」、実際は「{got}」" },
    "chain.hint_en": { zh: "把英文损益表科目按正确顺序放入槽位", en: "Place EN P&L items in order", ja: "英語の損益項目を順に置く" },
    "chain.hint_jp": { zh: "把日文损益表科目按正确顺序放入槽位", en: "Place JA P&L items in order", ja: "日本語の損益項目を順に置く" },
    "chain.hint_match": { zh: "点击英文术语，放入对应的日文科目下方", en: "Click an EN term, place under its JA item", ja: "英語を選び、日本語項目の下に置く" },
    "chain.hint_bs": { zh: "判断每个科目属于资产，还是负债・纯资产", en: "Classify each item: asset or L&E", ja: "資産か負債・純資産かを判断" },

    /* ---- 快捷键 ---- */
    "shortcut.choice": { zh: "快捷键：<kbd>1</kbd>-<kbd>4</kbd> 选择 · <kbd>Enter</kbd> 下一题 · <kbd>Esc</kbd> 退出", en: "Keys: <kbd>1</kbd>-<kbd>4</kbd> answer · <kbd>Enter</kbd> next · <kbd>Esc</kbd> exit", ja: "キー：<kbd>1</kbd>-<kbd>4</kbd> 回答 · <kbd>Enter</kbd> 次へ · <kbd>Esc</kbd> 終了" },
    "shortcut.self": { zh: "快捷键：<kbd>Enter</kbd> 显示答案 · <kbd>Esc</kbd> 退出", en: "Keys: <kbd>Enter</kbd> reveal · <kbd>Esc</kbd> exit", ja: "キー：<kbd>Enter</kbd> 表示 · <kbd>Esc</kbd> 終了" }
  };

  var STORE_KEY = "finquest_lang";
  var lang = "zh";
  try {
    lang = localStorage.getItem(STORE_KEY) || "zh";
  } catch (e) { /* ignore */ }
  if (!DICT["hero.title"][lang]) lang = "zh";

  function t(key, vars) {
    var entry = DICT[key];
    if (!entry) return key;
    var s = entry[lang] != null ? entry[lang] : entry.zh;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]);
      });
    }
    return s;
  }

  /* 刷新所有 [data-i18n] 静态元素（也包含 title 属性可选） */
  function applyStatic() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
    });
  }

  function setLang(l) {
    lang = DICT["hero.title"][l] ? l : "zh";
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) { /* ignore */ }
    applyStatic();
    // 通知游戏层重渲染当前屏（章节名/菜单提示等）
    if (window.FinQuestRefreshLang) window.FinQuestRefreshLang();
  }

  function langNow() { return lang; }

  window.FinI18n = { t: t, setLang: setLang, lang: langNow, applyStatic: applyStatic };
})();
