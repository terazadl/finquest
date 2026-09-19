# PRD · FinQuest 改版：日英财务表达（Recognition → Production）（2026-09-19 · Rev 2）

| 字段 | 内容 |
|---|---|
| Site | https://terazadl.github.io/finquest/ |
| 产品名 | 财务面试大师 · FinQuest |
| 文档日期 | 2026-09-19（Rev 1 同日；Rev 2 补充内容工程与模拟面试） |
| 作者 | 交互 / 学习体验（agent draft，Rev 2 修订） |
| 目标读者 | Lei Deng / andy · coding agent · 可选美编 |
| 用户 | Lei Deng（andy）— 日英双语财务面试表达训练 |
| 栈 | 静态站（GitHub Pages）· 本地进度（XP / 错题本）· 中文壳 RPG |
| 体验分（审计） | 5/10（2026-09-19）— 识别强、产出弱 |
| Agent 路径 | `docs/PRD-FinQuest改版-2026-09-19.md`、`docs/验证测试-FinQuest改版-2026-09-19.md` |
| 配对验收 | 验证测试-FinQuest改版-2026-09-19.md |

## Rev 2 变更记录

| 变更 | 位置 | 原因 |
|---|---|---|
| 新增 §4 Track E：模拟面试（Mock interview session） | P1 | 漏斗第 4 层原有单卡，缺"连续作答"编排 |
| 新增 §10 内容数据模型与规模 | 全局 | 原 PRD 只写交互、无数据结构，agent 无法落地 |
| 新增 §11 判分规则 | Track B2 | 打字产出缺"怎么算对"的可执行定义 |
| 朗读对照（Read-aloud mirror）并入 Track B2 | 产出层 | 打字练不到"嘴"；零成本口述中间方案 |
| Track A 补充"反馈自解释"验收 | AC | 实测链条拼搭 `❌` 无说明、无撤销，难以理解 |
| 验证测试新增 T-B4 / T-E1 / S5 | 配对文档 | 覆盖朗读、模拟面试、IME/移动端输入 |

---

## §0 Meta · 现状快照

### 现网能力（2026-09-19 实测确认）

| 模块 | 现状 | 与目标的关系 |
|---|---|---|
| 中文壳 RPG | 称号 / XP / 闯关章节 | 保留；动机层有效 |
| P&L 链条排序 EN | 科目排序（识别） | 保留为 Recognition 层 |
| P&L 链条排序 JA | 日本科目名排序 | 保留 |
| 日英术语匹配 | JA ↔ EN 配对 | 保留；需升级为双语卡 |
| B/S 科目分类 | 借贷两边归类 | 保留 |
| 每日热身 / 测验 | 选择题 + 答错给英文模板句 | 模板只读 → 需可产出 |
| 错题本 | 收录错题 | 多为再刷识别；需强制再产出 |
| UI 语言 | 中文壳固定 | P1 可选 EN/JA UI |

### 审计结论（5/10）

**强**：术语识别、链条结构、JA↔EN 匹配、答错后给英文模板句（有"看见"产出）。
**弱**：用户几乎不需要自己产出 EN/JA；答错后体验不可恢复（槽位/机会被吃掉且有 `❌` 无解释）；面试场景缺少"第一人称 + 追问"卡片；中文壳与日英学习目标略错位。

**一句话**：现在是优秀的 recognition trainer，距离用户目标 **bilingual FINANCIAL EXPRESSION（日英财务表达）** 仍差半步。

### 本轮优先级总览

| Track | 优先级 | 主题 |
|---|---|---|
| A | P0 | UX：错答可恢复 + 反馈自解释（undo / 显示正确配对） |
| B | P0 | Learning：双语卡 · 产出模式（打字 + 朗读对照）· 面试模板卡 |
| C | P1 | 错题本再产出 · 每日热身混练 · UI 语言选项 |
| E | P1 | 模拟面试：3–4 题连答 + 追问 + 计时 + 结束点评 |
| D | P2 | 词源小注（可选 enrichment）· 轻量录音转写（不做 ASR 评分） |

---

## §1 Problem

用户要练的是：在财务面试里，用日语和英语把 P&L / B/S / 关键比率说清楚（**表达 / production**），而不是只在 UI 里认出科目名或点对选择题。

现网路径以"排序 / 匹配 / 四选一"为主：

- 答对 = 识别成功，XP 涨，但口腔肌肉与键盘肌肉未动。
- 答错 = 看见英文模板，但下一题按钮直接带走；错题本往往再刷同一识别题。
- 无"中文 cue → 打出英文""英文 cue → 选出/打出日文"的强制产出环。
- 无面试卡：第一人称陈述 + 追问 + {vars} 填空。
- 无模拟面试编排：即便有了单卡，也没有"连续作答 + 追问 + 计时"的完整演练。

**结果**：识别分高、面试开口仍卡；产品名"面试大师"与实际训练环不完全对齐。

---

## §2 Goal / Non-goal

### Goals

- 学习主轴从 Recognition 推进到 Structure → Production → Mock interview。
- **P0**：错答可恢复（undo 或等价"不消耗本轮机会/槽位"）**且反馈自解释**（显示正确配对 / 差异），降低惩罚感、提高试错。
- **P0**：术语以 **JA | EN | 各一句用法** 双语卡呈现；新增至少两种产出模式：
  - 中文 cue 打 EN（打字）；
  - 中文/EN cue 打或选 JA（选作移动端降级）；
  - **朗读对照**（读标准句 → 展开文稿自查）作为口述轻量层。
- **P0**：面试模板卡 = 第一人称陈述 + 追问 + {vars}，用户须填/说一遍才算过。
- **P1**：模拟面试（3–4 题连答 + 追问 + 计时 + 结束点评）；错题本清错须再产出；每日热身混入产出题；可选 EN/JA UI 壳。
- **P2**：词源仅作可选小注；轻量录音+转写可选；不做完整 ASR 自动评分。

### Non-goals（本轮不做）

- 全站重皮肤 / 换 RPG 世界观大改
- 服务端账号、云同步、付费墙
- 完整语音评分引擎 / 发音打分模型
- 把词源（etymology）做成主路径或合入门禁（见 §5）
- 替换现有 P&L/B/S 识别玩法（保留，降为入门层）
- 教材级会计课（保持"面试表达 trainer"定位）
- 开放作文级自由文本批改（首版只做短空 / 短句）

---

## §3 Principle · Recognition → Structure → Production → Mock interview

训练漏斗（实现与文案都应对齐）：

| 层 | 用户行为 | 现网 | 本轮 |
|---|---|---|---|
| Recognition | 认出科目 / 选对义项 | 强 | 保留 |
| Structure | 排对 P&L 链、分清 B/S 两边 | 强 | 保留 + 双语卡补用法 |
| Production | 自己打出 / 选出 / 读出 EN 或 JA | 弱（只读模板） | P0 补齐（打字 + 朗读） |
| Mock interview | 第一人称连答 + 应答追问 + 计时 | 几乎无 | P1 补齐（Track E） |

门禁原则：

- Recognition 通关不能替代 Production 通关（XP 可给，但"面试就绪"徽章/章节须含产出题）。
- 错题本离开条件 = 再产出正确，而非再点对选择题。
- 词源、语音等 enrichment 永不挡住上述漏斗进度。

---

## §4 Tracks

### Track A · P0 UX fix — 错答可恢复 + 反馈自解释

**问题**：限时链 / 匹配 / 测验中，点错即锁死或白白消耗机会；链条拼搭放错只显示 `❌`（实测在小字号下像减号），无说明、无撤销入口，用户不敢试、学不到"差一点对了"。

**产品决策**：

1. 提供明确 **Undo / 撤销上一步**（至少在非提交终态前可用），或等价策略：首次错误不消耗本轮槽位/生命，显示"再试一次"，第二次错才记入错题本并推进。
2. Undo/再试按钮必须**可见、可发现**（不隐藏：在槽位/选项卡片旁放显式按钮，或长按/明确的图标 + tooltip）。
3. **反馈自解释**：放错后除了标记，须显示**正确配对是什么**（例：`❌ ここは「売上原価 / Cost of sales」`）或差异说明（`该科目属于资产侧，不是负债侧`），不再只给一个无声的 `❌`。
4. 最终仍错的题目进入错题本（与现逻辑兼容）。

**验收要点**：见测试 T-A1；合入 P0 必须过。不要求无限续命、不作弊式刷 XP。Undo 次数可限（如每题 1 次）。

### Track B · P0 Learning — 双语卡 · 产出 · 面试卡

#### B1 · 双语术语卡（JA | EN | usage×1 each）

每张核心术语卡至少四格：

| 区 | 内容 |
|---|---|
| JA | 日本科目/说法（例：売上高） |
| EN | 英语标准说法（例：Revenue / Net sales） |
| JA usage | 一句日语用法（面试口语级） |
| EN usage | 一句英语用法（面试口语级） |

展示：并排 side-by-side（桌面并排；窄屏可上下但标签仍 JA/EN 成对）。匹配题、错题本、面试卡均应能回到这张卡。

#### B2 · 产出模式（至少三种）

| 模式 | Cue | 用户动作 | 判分 |
|---|---|---|---|
| Type EN | 中文（或 JA）提示 | 键盘输入英文关键术语/短句 | 规范答案 + 可接受变体表；大小写宽松（见 §11） |
| Type/Select JA | EN 或中文提示 | 输入日文 或 从短列表选正确 JA | 选对或输入命中规范形（全角/半角/送假名宽松） |
| **朗读对照（Read-aloud mirror）** | 显示 EN 或 JA 标准句 | 用户朗读 → 点击展开下方隐藏文稿自我对照 | 无自动评分；提供"听到自己 vs 标准"的对照机会 |

朗读对照实现成本≈0：本质是"标准句 + 一个展开/收起按钮"，可复用现有 en / explain 字段。建议放在每张面试模板卡与产出题反馈区。

P0 不必上开放短文自由批改；短空即可。每日热身 / 闯关末关须混入 ≥1 产出题。

#### B3 · 面试模板卡（Mock interview atom）

单卡结构：

- 第一人称陈述（EN 与/或 JA）：用户可见模板，但须填 {vars} 或默写关键空才算完成。
- Follow-up 追问（1 条）：例 "How does that differ from the balance sheet?"
- {vars}：如 {period} {metric} {company} — 替换后读/打一遍。

示例（EN）：

> "In our {period} P&L, {metric} came in at …, which sits below gross profit but above operating income."
> Follow-up: "Where would that show on the B/S?"

中文壳可保留说明；学习正文以 JA/EN 为主。

### Track C · P1 — 错题本再产出 · 热身混练 · UI 语言

| 项 | 说明 |
|---|---|
| 错题本 | 清错条件 = 再产出（Type EN 或 Type/Select JA），禁止"再点同一四选一即移除"作为唯一路径 |
| 每日热身 | 10 分钟池：识别 + 结构 + ≥1 产出 + 可选 1 张面试卡片段 |
| UI 语言 | 可选壳语言 ZH（默认）/ EN / JA；学习内容始终 JA+EN 并排，不随壳消失 |

### Track E · P1 — 模拟面试（Mock interview session）

**目的**：漏斗第 4 层成形，从"单张模板卡"升级为"连续作答编排"，最贴近真实面试。

**最小可行设计**：

- 从"面试卡池"抽 3–4 张卡，构成一次 session（可按章节/主题过滤）。
- 流程：题目显示（含第一人称模板与 {vars}）→ 用户作答（打字或朗读对照）→ 自动进入 1 条 follow-up → 下一题。总计时（建议 5 分钟，可选）。
- 结束页：显示覆盖了哪些考点、每题的完成状态、错得最多的概念（链接回错题本/术语卡）。
- 不做自动打分；"完成"= 每题至少产出过一次（打字命中或朗读后自评"完成"）。

**验收**：见测试 T-E1；P1 合入门禁。

### Track D · P2 — 词源小注 · 轻语音（非 ASR 评分）

见 §5。实现上：

- 术语卡可展开"词源小注"（可选）；默认折叠；永不作为关卡锁。
- 可选：浏览器 MediaRecorder 录音 + 本地/轻量转写展示（用户自查）；不做自动发音打分、不阻塞 XP。

---

## §5 词源（Etymology）· 产品意见

**结论：v1 不把词源当主焦点（Not primary）。**

| 维度 | 判断 |
|---|---|
| 用户目标 | 日英财务表达 / production，不是语源学 |
| 词源价值 | 对部分人有助记：EN Latin/French 词根（如 revenue ← revenir）；JA 漢語 vs 外来語对照（利益 vs プロフィット） |
| 风险 | 做成主路径会稀释面试开口时间，并变成"又一篇阅读" |
| 优先级 | P2 enrichment |
| 形态 | 可选"词源小注"挂在术语卡上，默认折叠 |
| 门禁 | 绝不 gate 进度；绝不作 P0 merge gate（验收见 T-D1） |

**一句话给 agent**：先做完 A/B（可恢复错答 + 产出 + 面试卡），词源有余力再加一行小注即可。

---

## §6 User Stories + Acceptance Criteria

### US-1 · 错答可恢复 + 反馈自解释（Track A · P0）

作为备考用户，我希望点错一次后还能撤销或再试而不白耗本轮机会，并且告诉我正确配对是什么，以便敢试、从"差一点"里学到结构。

**AC**

| # | 内容 |
|---|---|
| AC1 | 在匹配/排序/选择题的可恢复窗口内，存在可见的 Undo 或"再试一次"（文案二选一或并存，但行为明确） |
| AC2 | 首次错误不立即以"终局失败"结算本轮（或等价：不消耗最后一次槽位）；第二次策略产品自洽即可 |
| AC3 | Undo/再试后，用户仍可到达正确状态并获得本应有的结构反馈 |
| AC4 | **放错后显示正确配对 / 差异说明**（不是只有一个无声 `❌`） |
| AC5 | 最终仍错的题目进入错题本（与现逻辑兼容） |

### US-2 · 双语并排术语卡（Track B1 · P0）

作为日英双语学习者，我希望每个核心科目同时看到 JA、EN 和各一句用法，以便建立对照而非只记单语标签。

**AC**

| # | 内容 |
|---|---|
| AC1 | 卡上同时有 JA 与 EN 标签区（side-by-side 或成对堆叠） |
| AC2 | JA、EN 各至少一句 usage（面试口语级，非词典堆砌） |
| AC3 | 从匹配题结果 / 错题本 / 面试卡可回到同一术语卡 |

### US-3 · 中文 cue → 打出英文（Track B2 · P0）

作为面试候选人，我希望看到中文提示后自己打出英文术语或短句，以便练 production 而非再点选项。

**AC**

| # | 内容 |
|---|---|
| AC1 | 存在 Type EN 题型；cue 为中文（可附 JA 提示） |
| AC2 | 提交后有对错反馈；可接受变体表（如 Revenue / Net sales） |
| AC3 | 仅点选四选一不能算完成本题型 |

### US-4 · 打出或选出日文（Track B2 · P0）

作为面向日企/双语岗位的用户，我希望根据 EN/中文 cue 打出或选出正确日文科目，以便 JA 侧也会主动表达。

**AC**

| # | 内容 |
|---|---|
| AC1 | Type JA 或 Select JA 至少一种上线；推荐 Type 优先、Select 作移动端降级 |
| AC2 | 判分对規範形友好（全角半角、常见送假名变体可配置，见 §11） |
| AC3 | 闯关或热身池中可抽到该题型 |

### US-5 · 朗读对照（Track B2 · P0，口述轻量层）

作为需要用"嘴"表达的面试者，我希望在产出题和模板卡旁能朗读标准句并自查，以便提前练口头肌肉。

**AC**

| # | 内容 |
|---|---|
| AC1 | 标准句区域有"朗读 / 显示文稿"展开控件（可用文本，不必录音） |
| AC2 | 展开后先看到对标提示（如"注意 revenue 重音"或"決算 vs 決済 发音不同"），再看到文稿 |
| AC3 | 不朗读也可通关（它是强化项，不 gate 进度） |

### US-6 · 面试模板卡（Track B3 · P0）

作为即将面试的用户，我希望用第一人称模板 + 追问 + {vars} 练完整回答，以便开口时有结构。

**AC**

| # | 内容 |
|---|---|
| AC1 | 卡含第一人称陈述（EN 和/或 JA）、一条 follow-up、至少一处 {var} |
| AC2 | 用户须完成填空或等效产出动作后，才标记"本卡完成" |
| AC3 | 只读展示模板、点"下一题"不算完成（相对现网"看完模板就过"的升级） |

### US-7 · 错题本须再产出（Track C · P1）

作为考前刷错题的用户，我希望清错必须再产出一遍，以便错题本真正补 production 漏洞。

**AC**

| # | 内容 |
|---|---|
| AC1 | 错题本条目的"移除/标记掌握"路径含 Type EN 或 Type/Select JA |
| AC2 | 禁止唯一路径为"再做同一道四选一且点对" |
| AC3 | 再产出失败则保留在错题本 |

### US-8 · 每日热身混练（Track C · P1）

作为面试前只有 10 分钟的用户，我希望热身里混有识别、结构与产出，以便热的是嘴和手而不只是眼。

**AC**

| # | 内容 |
|---|---|
| AC1 | 单次热身题包含 ≥1 道产出题（US-3 或 US-4） |
| AC2 | 可含 1 个面试卡片段（US-6 简化版亦可） |
| AC3 | 结束反馈区分"识别正确"与"产出正确"计数（轻量即可） |

### US-9 · 模拟面试（Track E · P1）

作为临近面试的用户，我希望有连续 3–4 题 + 追问 + 计时的演练，以便在真实节奏下检验自己。

**AC**

| # | 内容 |
|---|---|
| AC1 | 一次 session 包含 3–4 张面试卡（可按章节过滤） |
| AC2 | 每题后可进入 1 条 follow-up；session 有总计时（默认 5 分钟，可关） |
| AC3 | 结束页展示：覆盖考点、每题完成状态、最弱概念（链接错题本/术语卡） |
| AC4 | "完成"定义 = 每题至少产出过一次（打字命中或朗读后自评）；无自动打分 |

### US-10 · UI 语言选项（Track C · P1）

作为更习惯 EN/JA 壳的用户，我希望可选界面语言，以便减少中文壳干扰；学习内容仍 JA+EN。

**AC**

| # | 内容 |
|---|---|
| AC1 | 设置中可选 ZH / EN / JA 壳文案 |
| AC2 | 切换壳语言不隐藏双语术语卡的 JA\|EN |
| AC3 | 默认保持 ZH（兼容现网用户） |

### US-11 · 词源小注可选且不挡进度（Track D · P2）

作为喜欢词根记忆的用户，我希望能展开词源小注，但不希望它变成关卡条件。

**AC**

| # | 内容 |
|---|---|
| AC1 | 小注默认折叠或入口次要 |
| AC2 | 不读词源也可通关、拿 XP、清错题 |
| AC3 | P0 发版不因缺少词源而 FAIL（见 T-D1） |

---

## §7 Agent paste prompts

编码 agent 可直接复制下列块（按 Track 分批；先 A/B 再 C/E/D）。

### Prompt A — P0 UX 错答可恢复 + 反馈自解释

```text
FinQuest Track A P0 (static trainer https://terazadl.github.io/finquest/):
Make wrong answers recoverable AND self-explanatory.
- Add visible Undo OR "try again" so a first miss does not consume the round slot / final failure.
- After a wrong placement/mismatch, show the CORRECT pairing or difference (e.g. "ここは「売上原価 / Cost of sales」"), not just a silent ❌.
- Second miss may lock & send to wrongbook as today.
- Do not allow infinite XP farming via undo.
- Keep Chinese shell; touch matching, P&L sort, quiz flows where a mis-tap currently feels punishing.
Acceptance: T-A1 in docs/验证测试-FinQuest改版-2026-09-19.md must PASS.
```

### Prompt B — P0 Learning 双语卡 + 产出（打字/朗读） + 面试卡

```text
FinQuest Track B P0 (bilingual FINANCIAL EXPRESSION, not vocab-only):
1) Term card: JA | EN | one JA usage | one EN usage; side-by-side on desktop.
2) Production modes: (a) type EN from ZH cue; (b) type or select JA from EN/ZH cue (fuzzy accept-list OK, see PRD §11);
   (c) READ-ALOUD mirror: show standard EN/JA sentence + collapsible transcript for self-check (no ASR grading).
3) Interview template card: 1st-person line + one follow-up + {vars}; user must fill/produce before complete.
   Reading template alone is NOT complete.
Principle: Recognition → Structure → Production → Mock interview. Recognition alone must not grant "interview ready".
Etymology is OUT OF SCOPE for this prompt (P2 later).
Acceptance: T-B1, T-B2, T-B3, T-B4 PASS.
```

### Prompt C — P1 错题本 / 热身 / UI 语言

```text
FinQuest Track C P1:
- Wrongbook mastery requires re-produce (type EN or type/select JA), not only re-tap MCQ.
- Daily warmup mix includes ≥1 production item; optional mini interview card.
- Optional UI language ZH|EN|JA; learning cards stay JA+EN bilingual.
Do not build ASR grading. Etymology still optional P2.
Acceptance: T-C1 PASS; UI lang smoke OK.
```

### Prompt E — P1 模拟面试

```text
FinQuest Track E P1 (mock interview session):
- Draw 3-4 interview cards (filterable by chapter/theme) into one session.
- Flow: prompt (+1st-person template & {vars}) → user answers (type or read-aloud) → one follow-up → next; optional 5-min timer.
- End screen: covered topics, per-question completion, weakest concepts (link to wrongbook/term card).
- No auto-grading; "complete" = produced at least once per question (typed hit or read-aloud self-marked done).
Acceptance: T-E1 PASS.
```

### Prompt D — P2 词源 + 轻录音

```text
FinQuest Track D P2:
- Etymology "小注" optional, collapsed by default, on term cards. NEVER gates progress or XP.
- Optional MediaRecorder recording + local transcript for self review; no pronunciation scoring.
Acceptance: T-D1 PASS (non-blocking behavior).
```

---

## §8 发布与门禁

| 级别 | 必须 PASS | 不可挡合并 |
|---|---|---|
| P0 merge | T-A1, T-B1, T-B2, T-B3, T-B4 | T-D1（词源）、完整 ASR |
| P1 follow-up | T-C1, T-E1 + UI 语言冒烟 | 词源完善度 |
| P2 | T-D1 行为（可选且不挡） | — |

XP / 称号可保留；新增"产出题完成数"轻量统计即可，无需重做成长体系。

---

## §9 附录 · 术语与例句示例（实现参考，非完整词表）

| JA | EN | JA usage（短） | EN usage（短） |
|---|---|---|---|
| 売上高 | Revenue / Net sales | 今期の売上高は前年比で伸びました。 | Revenue grew year over year in the period. |
| 売上原価 | Cost of goods sold (COGS) | 原価率が改善しています。 | COGS improved as a share of sales. |
| 営業利益 | Operating income | 営業利益ベースで説明します。 | I'll walk through operating income first. |
| 総資産 | Total assets | 貸借対照表の借方合計です。 | That's total assets on the B/S. |

（词源小注示例，P2：Revenue ← re- + venire「回来」→ 流入的收益；非 P0。）

---

## §10 内容数据模型与规模（Rev 2 新增）

> 缺此节则 agent 只能做空壳交互。以下 JSON 为落地契约，首版按此 seed。

### 10.1 术语卡 TermCard

```json
{
  "id": "tc_revenue",
  "ja": "売上高",
  "en": "Revenue",
  "enAlt": ["Net sales", "Sales"],
  "jaUsage": "今期の売上高は前年比で伸びました。",
  "enUsage": "Revenue grew year over year in the period.",
  "context": "P&L",
  "readAloudHint": "注意 revenue 重音在第一个音节：REV-en-ue。",
  "etymologyNote": "Revenue ← re- + venire「回来」→ 流入的收益（P2）。",
  "wrongPairWarning": "決算（settlement of accounts）≠ 決済（payment）。"
}
```

### 10.2 产出题 ProductionItem（Type EN / Type JA）

```json
{
  "id": "pi_01",
  "type": "type_en",              // type_en | type_ja | select_ja
  "cue": "请写出「收入」的英文：",
  "cueJa": "「売上高」を英語で言うと？",
  "accepted": ["Revenue", "Net sales", "Sales"],   // 判分 see §11
  "termCardId": "tc_revenue",
  "feedback": "Revenue 是收入；Net sales 是净销售额。"
}
```

### 10.3 面试模板卡 InterviewCard

```json
{
  "id": "ic_01",
  "topic": "P&L 讲解",
  "templateEn": "In our {period} P&L, {metric} came in at …, which sits below gross profit but above operating income.",
  "templateJa": "今期の損益計算書では、{metric}が…でした。売上総利益の下、営業利益の上に位置します。",
  "vars": ["{period}", "{metric}"],
  "followUpEn": "Where would that show on the balance sheet?",
  "followUpJa": "それは貸借対照表のどこに表示されますか？",
  "keys": ["metric", "gross profit", "operating income"]
}
```

### 10.4 内容规模与上线顺序（建议）

| 批次 | 内容 | 数量 |
|---|---|---|
| Batch 1（P0 必需） | P&L 核心科目卡 + Type EN/Type JA + 面试卡（P&L 讲解、営業/経常对比） | 术语卡 ≥12 · 产出题 ≥10 · 面试卡 ≥4 |
| Batch 2（P0 补充） | B/S、现金流、关键比率卡 | 术语卡 +10 · 产出题 +8 · 面试卡 +3 |
| Batch 3（P1） | 模拟面试池扩充、热身混练题、错题再产出绑定 | 面试卡 +8 · 产出题 +10 |

判分与题库都以 `docs/` 下同一 JSON seed（`docs/finquest-content-seed.json`，另行交付）为准；实现从 seed 加载，不硬编码在 game.js。

---

## §11 判分规则（Rev 2 新增）

### 11.1 Type EN

1. 规范化：trim、折叠空白、全角→半角（字母/数字）、去行尾标点（`.` `,`）。
2. 命中判定（优先级从高到低）：
   - 与 `accepted` 任一完全相等（规范化后）→ 对；
   - `accepted` 任一包含于输入，或输入包含于 `accepted`（短句类，长度≥4）→ 对；
   - 均不中 → 错，反馈给出 `accepted[0]` 与"你差在哪"的提示（如仅一个字母/空格不同，提示近似）。
3. 大小写不敏感。

### 11.2 Type JA

1. 规范化：trim、去全角/半角空格、平假名⇄片假名不强制（可配置 `allowedVariants`）、去掉常见送假名差异（如「キャッシュフロー」↔「キャッシュ・フロー」，以 `variants` 字段配置）。
2. 命中：与 `accepted` 任一（或 `variants`）匹配 → 对；否则错。
3. 首版不要求给出罗马字输入，IME 正常即可（移动端冒烟见 S5）。

### 11.3 朗读对照（无机器判分）

- "完成"由用户自评（展开文稿后点"我读了 / 差不多"）。
- 系统只提供：标准句、读音提示（`readAloudHint`）、易混警示（`wrongPairWarning`）。

### 11.4 边界

- 不做语义相似度/LLM 判分（首版）。
- 不做填空题的上下文敏感批改（首版只判术语/短句）。
- 判分函数放 `js/scoring.js` 独立单元，便于测试。

---

## §12 Rev 2 自检

| 检查 | 结果 |
|---|---|
| 三个盲区（内容工程 / Mock interview / 口述）已补齐 | ✅ §4 Track E · §10 · §11 · B2 朗读对照 |
| Track A 反馈自解释已入验收 | ✅ US-1 AC4 · T-A1 |
| 词源维持 P2 且不挡合并 | ✅ §5 · §8 · T-D1 |
| agent 可直接按 Track 实现 | ✅ §7 Prompts A–E |
| 内容 seed 有落地位置 | ✅ §10.4（docs/finquest-content-seed.json） |

EOF · PRD-FinQuest改版-2026-09-19 Rev 2
