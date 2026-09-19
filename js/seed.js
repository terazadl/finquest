/* =========================================================
 * FinQuest 内容 seed 加载器（PRD §10.4）
 * 优先 fetch docs/finquest-content-seed.json（仓库唯一真源）；
 * 失败时（如本地 file:// 直开）回退到 js/seed-fallback.js 的
 * window.SEED_FALLBACK 内嵌副本。游戏逻辑不硬编码内容。
 * ========================================================= */
(function () {
  "use strict";

  const SEED_URL = "docs/finquest-content-seed.json";

  let cached = null;
  let inflight = null;

  function normalizeTermMap(seed) {
    const map = {};
    (seed.termCards || []).forEach(function (c) {
      map[c.id] = c;
    });
    return map;
  }

  /** 幂等加载：返回 Promise<seed> */
  function load() {
    if (cached) return Promise.resolve(cached);
    if (inflight) return inflight;
    inflight = fetch(SEED_URL, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("seed HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        cached = data;
        return cached;
      })
      .catch(function (err) {
        console.warn("seed fetch failed, using fallback:", err);
        cached =
          window.SEED_FALLBACK || { termCards: [], productionItems: [], interviewCards: [] };
        return cached;
      });
    return inflight;
  }

  /** seed 就绪后的便捷读取 */
  function ready() {
    return load().then(function (seed) {
      return {
        data: seed,
        termMap: normalizeTermMap(seed),
      };
    });
  }

  window.FinSeedLoader = { load: load, ready: ready };
})();
