/* =========================================================
 * FinQuest 判分单元（PRD §11）
 * 独立于 game.js，便于单测与替换。
 * ========================================================= */
(function () {
  "use strict";

  /* --- 规范化 --- */

  /* EN：trim → 全角字母数字转半角 → 折叠空白 → 去行尾标点 → 小写 */
  function normEn(s) {
    return String(s || "")
      .trim()
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (c) {
        return String.fromCharCode(c.charCodeAt(0) - 0xfee0);
      })
      .replace(/[\uFF0C\u3001,.;。．！？!?]$/g, "")
      .replace(/[.,;:!?()\-–—/]+$/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  /* JA：trim → 去全半角空格 → 去片假名長音符「ー」与中黑「・」→ 片假名归一为平假名 → 小写 */
  function normJa(s) {
    return String(s || "")
      .trim()
      .replace(/[\s\u3000]/g, "")
      .replace(/[ー・]/g, "")
      .replace(/[\u30A1-\u30F6]/g, function (c) {
        /* 片假名 → 平假名（ヴ 等无平假名映射的保持原样） */
        var code = c.charCodeAt(0) - 0x60;
        return code >= 0x3041 && code <= 0x3096 ? String.fromCharCode(code) : c;
      })
      .toLowerCase();
  }

  /* --- 命中判定（PRD §11.1 / 11.2） --- */

  function judgeEn(input, accepted) {
    const i = normEn(input);
    if (!i) return { ok: false, normalized: i };
    const list = (accepted || []).map(normEn);
    for (let idx = 0; idx < list.length; idx++) {
      if (i === list[idx]) return { ok: true, matched: accepted[idx] };
    }
    /* 包含 / 被包含：短句类（长度 ≥ 4）口径宽松 */
    for (let idx = 0; idx < list.length; idx++) {
      const a = list[idx];
      if (a.length >= 4 && (i.includes(a) || a.includes(i))) {
        return { ok: true, matched: accepted[idx] };
      }
    }
    return { ok: false, normalized: i };
  }

  function judgeJa(input, accepted) {
    const i = normJa(input);
    if (!i) return { ok: false, normalized: i };
    const list = (accepted || []).map(normJa);
    for (let idx = 0; idx < list.length; idx++) {
      if (i === list[idx]) return { ok: true, matched: accepted[idx] };
    }
    return { ok: false, normalized: i };
  }

  /* 导出 */
  window.FinScore = { normEn, normJa, judgeEn, judgeJa };
})();
