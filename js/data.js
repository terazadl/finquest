/* =========================================================
 * FinQuest 题库
 * 内容基于面试考点：P&L 链条、日美口径、比率、三表联动、
 * 财务建模 and 面试英语表达。
 * ========================================================= */

const CHAPTERS = [
  {
    id: "pl",
    icon: "⚡",
    name: "P&L 损益表链条",
    desc: "上次面试卡住的起点，先打牢",
    questions: [
      {
        tag: "损益表",
        q: "A profit and loss statement (損益計算書) shows a company's…",
        options: [
          "assets, liabilities and equity at a specific point in time",
          "revenue, expenses and profit over a specific period",
          "cash received and paid during a period",
          "shareholder changes during a year",
        ],
        answer: 1,
        explain:
          "P&L 是「期间报表」：反映一段时间内的收入、费用和利润。资产负债表（B/S）才是时点报表；现金流表反映现金收支。",
        en: "A P&L shows a company's revenue, expenses, and profit over a specific period.",
      },
      {
        tag: "毛利",
        q: "Gross profit (売上総利益) is calculated as…",
        options: [
          "Revenue − Cost of sales",
          "Revenue − Selling, general and administrative expenses",
          "Revenue − Income tax",
          "Revenue − Total liabilities",
        ],
        answer: 0,
        explain:
          "Revenue 减去 cost of sales（销售成本/売上原価）就是 gross profit，即毛利。SG&A 是下一步才扣的费用。",
        en: "Revenue minus cost of sales gives gross profit.",
      },
      {
        tag: "营业利润",
        q: "Operating profit (営業利益) reflects…",
        options: [
          "the company's total net worth",
          "profit from the company's core business",
          "profit after all one-time gains",
          "cash flow from financing activities",
        ],
        answer: 1,
        explain:
          "营业利润是核心业务产生的利润：gross profit − SG&A。它是衡量主营赚钱能力的关键指标。",
        en: "Operating profit reflects the profitability of the company's core business.",
      },
      {
        tag: "链条",
        q: "Which is the correct order in the Japanese income statement?",
        options: [
          "Revenue → Gross profit → Operating profit → Ordinary profit → Net profit",
          "Revenue → Net profit → Operating profit → Gross profit",
          "Operating profit → Revenue → Ordinary profit → Gross profit",
          "Gross profit → Revenue → Net profit → Ordinary profit",
        ],
        answer: 0,
        explain:
          "日本报表链条：売上高 → 売上総利益 → 営業利益 → 経常利益 → 特別損益 → 税引前当期純利益 → 当期純利益。",
        en: "Revenue → Gross profit → Operating profit → Ordinary profit → Net profit.",
      },
      {
        tag: "経常利益",
        q: "経常利益 (ordinary profit) is different from 営業利益 (operating profit) because it additionally includes…",
        options: [
          "depreciation and amortization",
          "recurring non-operating items such as interest income and interest expense",
          "all extraordinary losses",
          "income tax expense",
        ],
        answer: 1,
        explain:
          "核心记忆点：営業利益只看核心业务；経常利益还包含经常性营业外收支（利息收入/支出、汇兑损益等）。这就是你上次被问的题。",
        en: "Operating profit comes from the core business, while ordinary profit also includes recurring non-operating items such as interest income and interest expense.",
      },
      {
        tag: "一次性",
        q: "After ordinary profit, 特別利益・特別損失 (extraordinary items) appear. After these, the next line is…",
        options: [
          "net profit directly",
          "income before income taxes (税引前当期純利益)",
          "gross profit",
          "operating profit",
        ],
        answer: 1,
        explain:
          "特别损益之后是税引前当期純利益（income before income taxes），再减去法人税等（income tax expense）才是当期純利益（net profit）。",
        en: "After extraordinary items, we get income before income taxes; after tax, we arrive at net profit.",
      },
      {
        tag: "收尾",
        q: "When presenting a P&L analysis, which closing line shows you actually analyze, not just recite?",
        options: [
          "That is all.",
          "I would verify every number with the auditor.",
          "I would also look at profit margins and year-on-year changes to judge the quality and sustainability of earnings.",
          "I would ask the accountant to recalculate.",
        ],
        answer: 2,
        explain:
          "加一句「我会同时看利润率的变化和同比趋势」能让 HR 觉得你不只是会背链条，而是在做分析。这是加分收尾。",
        en: "I would also look at profit margins and year-on-year changes to judge the quality and sustainability of the earnings.",
      },
      {
        tag: "记忆链",
        q: "Complete the memory chain: Revenue → COGS → Gross profit → SG&A → Operating profit → … → Net profit",
        options: [
          "Non-operating items → Ordinary profit → Extraordinary items → Tax",
          "Tax → Ordinary profit → Non-operating items",
          "Extraordinary items → Tax → Ordinary profit",
          "Ordinary profit → Tax → Extraordinary items",
        ],
        answer: 0,
        explain:
          "完整日本链条：Revenue → COGS → Gross profit → SG&A → Operating profit → Non-operating items → Ordinary profit → Extraordinary items → Tax → Net profit。",
        en: "Revenue, cost of sales, gross profit, SG&A, operating profit, non-operating items, ordinary profit, extraordinary items, tax, net profit.",
      },
    ],
  },
  {
    id: "gaap",
    icon: "🇯🇵🇺🇸",
    name: "日美口径对照",
    desc: "J-GAAP vs US GAAP，讲清楚日本特色科目",
    questions: [
      {
        tag: "日美差异",
        q: "Under US GAAP or IFRS, is there a line item called 経常利益 (ordinary profit)?",
        options: [
          "Yes, it is mandatory",
          "No, it is a Japanese reporting convention",
          "Yes, only under IFRS",
          "No, but there is a similar one called EBITDA",
        ],
        answer: 1,
        explain:
          "経常利益是日本报表特有的小计。US GAAP / IFRS 里营业利润之后直接列 other income / finance income 等项目，再到税前利润。面试提到它时最好补一句这是日本惯例。",
        en: "Ordinary profit is a Japanese reporting convention. Under US GAAP or IFRS, the same items appear as other income or finance costs between operating profit and pretax income.",
      },
      {
        tag: "日美差异",
        q: "In the US-style income statement, after operating income, interest income and interest expense usually appear under…",
        options: [
          "Extraordinary items",
          "Other income / (expense)",
          "Cost of sales",
          "Retained earnings",
        ],
        answer: 1,
        explain:
          "美式报表把利息、投资收益、汇兑损益等并进 other income/(expense)，不像日本单独列営業外収益・費用并算出経常利益。",
        en: "Under US GAAP, interest and other recurring items are shown as other income and expense below operating income.",
      },
      {
        tag: "特别损益",
        q: "What is the status of 特別利益・特別損失 (extraordinary items) under US GAAP?",
        options: [
          "They are required on every income statement",
          "They were abolished as a separate category",
          "They appear only in the balance sheet",
          "They are renamed as operating expenses",
        ],
        answer: 1,
        explain:
          "US GAAP 从 2015 年起取消了 extraordinary items 独立分类；IFRS 也早已不用。只有 discontinued operations（非継続事業）在美式报表里单列。日本报表仍保留特别损益栏。",
        en: "Extraordinary items were abolished under US GAAP; only discontinued operations are shown separately.",
      },
      {
        tag: "术语",
        q: "当期純利益 in English is…",
        options: [
          "Retained earnings",
          "Net income / Net profit",
          "Earnings before tax",
          "Comprehensive income",
        ],
        answer: 1,
        explain:
          "当期純利益 = net income / net profit（净利润）。注意别和利益剰余金（retained earnings，留存收益，是 B/S 项目）搞混。",
        en: "Net income is the bottom-line profit after tax in a period.",
      },
      {
        tag: "资本成本",
        q: "自己資本利益率 is the Japanese term for…",
        options: [
          "ROA (Return on Assets)",
          "ROE (Return on Equity)",
          "Current ratio",
          "P/E ratio",
        ],
        answer: 1,
        explain:
          "自己資本利益率 = ROE = 当期純利益 ÷ 自己資本（equity）。别和総資産利益率（ROA）混淆。",
        en: "ROE (Return on Equity) = net profit divided by shareholders' equity.",
      },
      {
        tag: "术语",
        q: "自己資本比率 (equity ratio) means…",
        options: [
          "Total assets ÷ equity",
          "Equity ÷ total assets",
          "Debt ÷ equity",
          "Cash ÷ total liabilities",
        ],
        answer: 1,
        explain:
          "自己資本比率 = 自己資本 ÷ 総資産（equity ratio），衡量财务稳健度。注意别和银行资本充足率（CAR，Basel 指标）混为一谈。",
        en: "The equity ratio measures equity as a percentage of total assets.",
      },
      {
        tag: "对照",
        q: "A Japanese company reports 営業利益 100, 営業外収益 30, 営業外費用 10. 経常利益 is…",
        options: ["100", "130", "120", "90"],
        answer: 2,
        explain:
          "経常利益 = 営業利益 + 営業外収益 − 営業外費用 = 100 + 30 − 10 = 120。再往后扣特别损益和税才是净利润。",
        en: "Ordinary profit = operating profit + non-operating income − non-operating expenses.",
      },
      {
        tag: "对照",
        q: "Which statement best answers a foreign interviewer who asks about 経常利益?",
        options: [
          "It is the same as EBITDA.",
          "It is a Japanese subtotal: operating profit plus recurring non-operating items, such as interest, before tax.",
          "It is profit before depreciation.",
          "It only exists in the balance sheet.",
        ],
        answer: 1,
        explain:
          "对外国人讲経常利益的正确姿势：先定义（营业利润＋经常性营业外收支，税前），再补一句这是日本报表惯例。",
        en: "Ordinary profit is operating profit plus recurring non-operating items such as interest income and expense, before tax. It is a Japanese reporting convention.",
      },
    ],
  },
  {
    id: "ratio",
    icon: "📊",
    name: "关键比率分析",
    desc: "margin、ROE、流动比率，会算也会说",
    questions: [
      {
        tag: "毛利率",
        q: "Gross margin is…",
        options: [
          "gross profit ÷ revenue",
          "operating profit ÷ revenue",
          "net profit ÷ equity",
          "total liabilities ÷ total assets",
        ],
        answer: 0,
        explain:
          "毛利率 = 毛利 ÷ 收入：衡量产品本身赚钱能力，还没扣期间费用。",
        en: "Gross margin = gross profit ÷ revenue.",
      },
      {
        tag: "营业利润率",
        q: "Operating margin measures…",
        options: [
          "how efficient the core business is",
          "how much shareholders receive",
          "how fast inventory turns over",
          "how much tax the company pays",
        ],
        answer: 0,
        explain:
          "营业利润率 = 营业利润 ÷ 收入，反映核心业务的经营效率。FA 分析里最常看的 margin 之一。",
        en: "Operating margin = operating profit ÷ revenue; it measures the efficiency of the core business.",
      },
      {
        tag: "ROE",
        q: "ROE (Return on Equity) = …",
        options: [
          "Net profit ÷ Total assets",
          "Net profit ÷ Shareholders' equity",
          "Revenue ÷ Equity",
          "Operating profit ÷ Net profit",
        ],
        answer: 1,
        explain:
          "ROE = 净利润 ÷ 股东权益（自己資本）。是股东回报的经典指标，也是日本企业「资本效率」讨论的焦点。",
        en: "ROE measures how much profit a company generates for each yen of shareholders' equity.",
      },
      {
        tag: "偿债能力",
        q: "Current ratio is used to judge…",
        options: [
          "long-term growth potential",
          "short-term solvency",
          "shareholder returns",
          "market share",
        ],
        answer: 1,
        explain:
          "流动比率 = 流动资产 ÷ 流动负债，衡量短期偿债能力。银行信贷审查里必看——正是你建行的老本行。",
        en: "The current ratio (current assets ÷ current liabilities) measures short-term solvency.",
      },
      {
        tag: "估值",
        q: "株価収益率 (P/E ratio) is…",
        options: [
          "Price per share ÷ Earnings per share",
          "Earnings per share ÷ Price",
          "Market cap ÷ Book value",
          "Book value ÷ Price",
        ],
        answer: 0,
        explain:
          "P/E = 股价 ÷ 每股收益，最常用的估值倍数。P/B = 股价 ÷ 每股净资产（株価純資産倍率）。時価総額 = market capitalization。",
        en: "The P/E ratio is the share price divided by earnings per share.",
      },
      {
        tag: "盈利质量",
        q: "To judge whether a profit is sustainable, which comparison is most useful?",
        options: [
          "Operating profit vs Ordinary profit",
          "Revenue vs Total assets",
          "Inventory vs Receivables",
          "Cash vs Long-term debt",
        ],
        answer: 0,
        explain:
          "对比营业利润和经常利润能看出多少利润来自非主营（利息、汇兑等），判断盈利质量。一次性的特别收益占比越高，利润越不扎实。",
        en: "I compare ordinary profit with operating profit to see how much depends on non-operating items.",
      },
      {
        tag: "水平对比",
        q: "In a ratio analysis talk, which framing is best?",
        options: [
          "State the ratio and stop.",
          "Compare the ratio with the previous period and with peer companies.",
          "Compare the ratio with the CEO's salary.",
          "Only mention the ratio if it is below 100%.",
        ],
        answer: 1,
        explain:
          "比率要「同比 + 同业」双对比才有意义：变化来自行业还是公司自身？这是分析和背诵的分界线。",
        en: "I compare these ratios with the previous period and with peer companies to see whether the change comes from the industry or from this company.",
      },
      {
        tag: "速记",
        q: "Match correctly: ROA = …",
        options: [
          "Net profit ÷ Total assets",
          "Net profit ÷ Equity",
          "Operating profit ÷ Revenue",
          "Current assets ÷ Current liabilities",
        ],
        answer: 0,
        explain:
          "ROA = 净利润 ÷ 总资产（総資産利益率），衡量全部资产的产出效率。ROE 看股东，ROA 看全部资产。",
        en: "ROA shows how efficiently a company uses its total assets to generate profit.",
      },
    ],
  },
  {
    id: "statements",
    icon: "🔗",
    name: "三张表联动",
    desc: "B/S、P&L、现金流怎么咬合，含财务建模",
    questions: [
      {
        tag: "恒等式",
        q: "The balance sheet identity is…",
        options: [
          "Assets = Liabilities + Equity",
          "Assets = Revenue − Expenses",
          "Revenue = Assets + Liabilities",
          "Equity = Assets × Liabilities",
        ],
        answer: 0,
        explain:
          "B/S 恒等式：资产 = 负债 + 股东权益（純資産）。这是所有财务分析的起点。",
        en: "The basic balance sheet equation is assets equal liabilities plus equity.",
      },
      {
        tag: "时点与期间",
        q: "Which pair is correct about the timing of financial statements?",
        options: [
          "B/S is a point-in-time; P&L and CF statement cover a period",
          "P&L is a point-in-time; B/S covers a period",
          "All three cover a period",
          "All three are point-in-time",
        ],
        answer: 0,
        explain:
          "资产负债表是时点报表（某一时刻），损益表和现金流表是期间报表（一段时间）。一句话讲清三种报表的区别。",
        en: "The balance sheet is a snapshot at a point in time, while the income statement and cash flow statement cover a period.",
      },
      {
        tag: "利润与现金",
        q: "A company's profit grows but operating cash flow declines. A likely cause is…",
        options: [
          "an increase in accounts receivable or inventory (working capital)",
          "a decrease in revenue",
          "higher interest rates only",
          "lower employee salaries",
        ],
        answer: 0,
        explain:
          "利润按权责发生制确认，现金按实际收支。应收增加或存货积压时，利润先确认而现金没到账。高频 case，务必会讲。",
        en: "Profit can grow while cash flow declines if receivables or inventory increase — profit is recognized before cash is collected.",
      },
      {
        tag: "现金流",
        q: "Cash flow from financing activities includes…",
        options: [
          "borrowing and repaying debt, issuing shares, paying dividends",
          "sales to customers",
          "purchasing equipment",
          "depreciation charges",
        ],
        answer: 0,
        explain:
          "融资活动现金流：借还款、发股、分红等。销售是经营现金流，购设备是投资现金流，折旧是非现金费用。",
        en: "Financing activities include borrowing, issuing equity, and paying dividends.",
      },
      {
        tag: "EBITDA",
        q: "EBITDA is best described as…",
        options: [
          "Earnings before interest, taxes, depreciation and amortization",
          "Earnings before income tax and dividends",
          "Net profit plus working capital",
          "Equity before intangible assets",
        ],
        answer: 0,
        explain:
          "EBITDA ≈ 营业利润 + 折旧摊销（税前利息前）。外企 FA 岗爱问；用于去掉资本结构和税的影响比较经营能力。",
        en: "EBITDA removes the effects of financing and non-cash depreciation to compare operating performance.",
      },
      {
        tag: "建模",
        q: "When someone asks you to build a simple financial model, the best first step is…",
        options: [
          "identify the key business drivers (volume, price, cost) and their relationships",
          "open Excel and type a large forecast number",
          "copy last year's P&L exactly",
          "ask for the CEO's opinion",
        ],
        answer: 0,
        explain:
          "财务建模的本质是「先把业务变量找出来」（用户、价格、成本等驱动因素），再用公式联动。面试不会让你现场建模，而是考你会不会先想驱动因素。",
        en: "I would build the model on key drivers such as volume, price, and cost, then test assumptions against historical data.",
      },
      {
        tag: "建模",
        q: "Revenue model: 收入 = 用户数 × 付费率 × 客单价。If the user base doubles and everything else stays the same, revenue…",
        options: [
          "stays the same",
          "doubles",
          "halves",
          "becomes unknown",
        ],
        answer: 1,
        explain:
          "收入模型里用户数翻倍、其他不变，收入翻倍。这就是模型感：先明确乘数关系，再谈假设。",
        en: "If the user base doubles, revenue doubles, assuming the other drivers stay constant.",
      },
      {
        tag: "建模",
        q: "Which is a good way to describe sensitivity analysis in an interview?",
        options: [
          "I run scenarios with different assumptions and see how sensitive the result is to each driver.",
          "I only calculate the best case.",
          "I hide the assumptions to make the result look good.",
          "Sensitivity means changing the accounting standard.",
        ],
        answer: 0,
        explain:
          "敏感性/情景分析：改变假设看结果变化幅度，找出最关键变量。这在银行授信里就是「压力测试」的雏形。",
        en: "I run scenarios and test how sensitive the result is to each assumption, to identify the key drivers and risks.",
      },
    ],
  },
  {
    id: "speaking",
    icon: "🎤",
    name: "面试英语表达",
    desc: "把知识说成英语模板句，开场就能用",
    questions: [
      {
        tag: "开场",
        q: "HR asks: “Could you explain a P&L?” Which opening is strongest?",
        options: [
          "A P&L shows a company's revenue, expenses, and profit over a specific period.",
          "P&L is very long and complicated.",
          "It is similar to a balance sheet.",
          "I will show you an Excel file.",
        ],
        answer: 0,
        explain:
          "开场直接给一句话定义（期间报表：收入、费用、利润），再展开链条。别绕弯子。",
        en: "A P&L shows a company's revenue, expenses, and profit over a specific period.",
      },
      {
        tag: "对比题",
        q: "“What is the difference between operating profit and ordinary profit?” Best answer:",
        options: [
          "Operating profit comes from the core business; ordinary profit also includes recurring non-operating items such as interest income and interest expense.",
          "They are exactly the same.",
          "Operating profit is after tax, ordinary profit is before tax.",
          "Ordinary profit is only used in China.",
        ],
        answer: 0,
        explain:
          "这是你面试卡住的原题。标准答案一句搞定：一个是核心业务，一个还含经常性营业外收支。重复背到张口就来。",
        en: "Operating profit reflects the core business, while ordinary profit also includes recurring non-operating income and expenses, such as interest income and interest expense.",
      },
      {
        tag: "结合报表",
        q: "“How do the three statements link?” Best answer:",
        options: [
          "Net profit flows from the P&L into retained earnings on the balance sheet and is reconciled through the cash flow statement.",
          "They are completely independent.",
          "The P&L is always equal to the balance sheet.",
          "Cash flow comes only from the balance sheet.",
        ],
        answer: 0,
        explain:
          "三表联动：P&L 的净利润滚入 B/S 的留存收益，现金流表把净利润调整为实际现金。一句话即可讲清。",
        en: "Net profit from the P&L increases retained earnings on the balance sheet, while the cash flow statement explains the difference between profit and cash.",
      },
      {
        tag: "不会的题",
        q: "You don't know an exact figure. Which is the right response?",
        options: [
          "I don't have the exact figure now, but my initial view is that… I would verify this with the company's IR materials.",
          "I definitely know it, it is 100%.",
          "(Silence for 30 seconds)",
          "I am sorry, I cannot do finance.",
        ],
        answer: 0,
        explain:
          "「没记住精确数字」的救命句：承认没数 + 给思路 + 说会用 IR 资料核实。绝不瞎编数字。",
        en: "I don't have the exact figure at the moment, but my initial view is that… I would verify this using the company's IR materials or reliable industry data.",
      },
      {
        tag: "case",
        q: "A case question starts. What do you say first?",
        options: [
          "Before I answer, may I clarify the objective and the scope?",
          "(Launch into a memorized answer)",
          "I need 10 minutes to think.",
          "Please give me the answer.",
        ],
        answer: 0,
        explain:
          "case 题先确认目标和范围（目的、时间段、指标定义），展示结构化思考，而不是急着背稿。",
        en: "Before I answer, may I clarify the objective and the scope?",
      },
      {
        tag: "分析汇报",
        q: "“How would you present a financial analysis to management?” Best answer:",
        options: [
          "Lead with the conclusion, then key drivers, risks, and a recommendation, supported by clear numbers.",
          "Read every number aloud from the start.",
          "Only mention the good numbers.",
          "Email a 100-page spreadsheet.",
        ],
        answer: 0,
        explain:
          "向上汇报的结构：先结论 → 关键驱动因素 → 风险 → 建议，用数据支撑。这正是 Amazon「右臂」岗位要的能力。",
        en: "I lead with the conclusion, then explain the key drivers and risks, and finish with a clear recommendation.",
      },
      {
        tag: "行业分析",
        q: "“How would you analyze a company's industry?” Best first step:",
        options: [
          "Define the market size, growth, customers, and competitors.",
          "Ask for the stock price.",
          "Memorize its annual report cover.",
          "Skip the industry and analyze only one product.",
        ],
        answer: 0,
        explain:
          "行业分析框架起点：市场规模与增长、客户、竞争、替代品——再进入公司自身财务分析。",
        en: "First, I would define the market size and growth, then analyze customers, competitors, and alternatives.",
      },
      {
        tag: "收束",
        q: "You realize your answer is getting long and messy. Which phrase rescues you?",
        options: [
          "Let me summarize this in two points. First… Second…",
          "Sorry, I am totally lost.",
          "Never mind, next question.",
          "Actually my answer has 10 more points.",
        ],
        answer: 0,
        explain:
          "救命句：用「总结成两点」强行收束，立刻恢复结构。面试官看到的是你有控制力，而不是慌乱。",
        en: "Let me summarize this in two points. First… Second…",
      },
    ],
  },
];

/* =========================================================
 * 链条拼搭数据
 * ========================================================= */

/* P&L 英文链条（正确顺序） */
const CHAIN_EN = [
  "Revenue",
  "Cost of sales",
  "Gross profit",
  "SG&A expenses",
  "Operating profit",
  "Non-operating items",
  "Ordinary profit",
  "Extraordinary items",
  "Income tax",
  "Net profit",
];

/* P&L 日文链条（正确顺序） */
const CHAIN_JP = [
  "売上高",
  "売上原価",
  "売上総利益",
  "販売費及び一般管理費",
  "営業利益",
  "営業外収益・費用",
  "経常利益",
  "特別利益・損失",
  "法人税等",
  "当期純利益",
];

/* 日英术语匹配（左：日文，右：英文） */
const MATCH_JP_EN = [
  { jp: "売上高", en: "Revenue" },
  { jp: "売上総利益", en: "Gross profit" },
  { jp: "営業利益", en: "Operating profit" },
  { jp: "経常利益", en: "Ordinary profit" },
  { jp: "当期純利益", en: "Net profit" },
  { jp: "自己資本利益率", en: "ROE" },
  { jp: "総資産利益率", en: "ROA" },
  { jp: "株価収益率", en: "P/E ratio" },
  { jp: "時価総額", en: "Market cap" },
  { jp: "流動比率", en: "Current ratio" },
];

/* B/S 借贷分配（side: 'asset' 或 'equity' 负债/权益） */
const BS_ITEMS = [
  { side: "asset", jp: "現金及び預金", en: "Cash and deposits" },
  { side: "asset", jp: "売掛金", en: "Accounts receivable" },
  { side: "asset", jp: "棚卸資産", en: "Inventory" },
  { side: "asset", jp: "有形固定資産", en: "PP&E (Property, plant & equipment)" },
  { side: "asset", jp: "のれん", en: "Goodwill" },
  { side: "equity", jp: "短期借入金", en: "Short-term borrowings" },
  { side: "equity", jp: "社債", en: "Bonds payable" },
  { side: "equity", jp: "資本金", en: "Share capital" },
  { side: "equity", jp: "利益剰余金", en: "Retained earnings" },
  { side: "equity", jp: "自己株式", en: "Treasury stock" },
];

/* 等级表 */
const RANKS = [
  { name: "实习分析师", icon: "📝", xp: 0 },
  { name: "分析师", icon: "📊", xp: 100 },
  { name: "高级分析师", icon: "📈", xp: 250 },
  { name: "经理", icon: "🗂️", xp: 500 },
  { name: "高级经理", icon: "💼", xp: 800 },
  { name: "董事", icon: "🏛️", xp: 1200 },
  { name: "财务总监", icon: "👑", xp: 1800 },
];

/* 每日首页提示 */
const TIPS = [
  "先热身后闯关：链条题 30 秒能唤醒记忆，直接治「没预热卡壳」。",
  "P&L 链条必背：Revenue → COGS → Gross profit → SG&A → Operating → Ordinary → Net。",
  "経常利益是日本惯例：外企 HR 前记得补一句 it's a Japanese reporting convention。",
  "不会的数字要说 I don't have the exact figure, but… 再给思路，绝不编数。",
  "case 先澄清：Before I answer, may I clarify the objective and scope?",
  "一句话讲清三表：B/S 是时点，P&L 和 CF 是期间。",
  "営業 vs 経常就一句：核心业务 vs 核心业务＋经常性营业外收支。",
  "答完报表加一句 margin 分析，是你和应届生的区别。",
  "面试前一天：只过关键词链，不过长稿，保持「对话感」。",
];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
