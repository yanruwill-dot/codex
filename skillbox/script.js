const menuButton = document.querySelector(".menu-btn");
const navTargets = ["#scan", "#mcp", "#top"];

menuButton?.addEventListener("click", () => {
  const next = navTargets.shift();
  if (!next) return;
  navTargets.push(next);
  document.querySelector(next)?.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelectorAll(".skill-card, .node, .film-card").forEach((item) => {
  item.addEventListener("pointermove", (event) => {
    const rect = item.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * -8;
    item.style.transform = `perspective(900px) rotateX(${y}deg) rotateY(${x}deg)`;
  });

  item.addEventListener("pointerleave", () => {
    item.style.transform = "";
  });
});

const skills = Array.isArray(window.SKILLS_DATA) ? window.SKILLS_DATA : [];
const tableBody = document.querySelector("#skillsTableBody");
const skillSearch = document.querySelector("#skillSearch");
const skillCount = document.querySelector("#skillCount");
const scenarioFilter = document.querySelector("#scenarioFilter");
let activeScenario = "all";
const PRIMARY_FILTER_KEYS = ["copy", "wechat", "xhs", "short-video", "growth", "live", "retail"];
const SCENARIO_PRIORITY_KEYS = ["xhs", "wechat", "short-video", "live", "retail", "growth", "copy", "design", "data", "automation", "engineering", "office"];

const SCENARIOS = [
  {
    key: "copy",
    label: "专门文案",
    icon: "文",
    className: "cyan",
    keywords: ["copy", "文案", "hook", "email", "cold-email", "ad-creative", "sales-copy", "mimeng", "khazix", "humanizer", "标题"],
    scene: "适合写广告文案、销售话术、标题、钩子、邮件和不同平台的转化表达。"
  },
  {
    key: "wechat",
    label: "公众号",
    icon: "微",
    className: "green",
    keywords: ["wechat", "公众号", "文章", "article", "aihot", "daily-ai-news", "yanru-wechat", "wechat-official", "wechat-polished", "wechat-practical", "公众号文章"],
    scene: "适合做公众号选题、长文写作、配图排版、草稿发布和公开页核验。"
  },
  {
    key: "xhs",
    label: "小红书",
    icon: "红",
    className: "pink",
    keywords: ["xhs", "xiaohongshu", "redbook", "小红书", "social-carousel", "social-card", "xhs-image"],
    scene: "适合做小红书封面、图文卡片、笔记结构、种草表达和多图内容包装。"
  },
  {
    key: "short-video",
    label: "短视频",
    icon: "影",
    className: "violet",
    keywords: ["video", "短视频", "youtube", "heygen", "remotion", "voiceover", "jingle", "animation", "hyperframes", "视频"],
    scene: "适合做短视频脚本、口播、分镜、配音、动画、剪辑和视频素材生产。"
  },
  {
    key: "growth",
    label: "引流获客",
    icon: "客",
    className: "amber",
    keywords: ["lead", "获客", "引流", "seo", "paid-ads", "referral", "launch", "cro", "agent-reach", "marketing", "campaign", "ab-test", "cold-email", "signup", "onboarding"],
    scene: "适合做流量入口、转化页面、投放创意、SEO、私域承接和增长实验。"
  },
  {
    key: "live",
    label: "直播",
    icon: "播",
    className: "blue",
    keywords: ["live", "直播", "口播", "voiceover", "avatar", "heygen-avatar", "real-person", "sales-script"],
    scene: "适合做直播脚本、主播话术、口播素材、虚拟人视频和现场转化节奏。"
  },
  {
    key: "retail",
    label: "零售",
    icon: "零",
    className: "green",
    keywords: ["retail", "零售", "电商", "商品", "product", "1688", "shopify", "sales", "pricing", "brush", "sales-enablement", "travel-sales"],
    scene: "适合做商品图、货架表达、销售资料、定价策略、电商上架和门店成交辅助。"
  },
  {
    key: "design",
    label: "设计视觉",
    icon: "设",
    className: "pink",
    keywords: ["design", "figma", "image", "poster", "logo", "moodboard", "scene", "shot", "cowart", "illustration", "视觉", "海报"],
    scene: "适合做页面、海报、配图、品牌视觉、设计稿生成和视觉 QA。"
  },
  {
    key: "data",
    label: "数据报告",
    icon: "数",
    className: "cyan",
    keywords: ["data", "analytics", "kpi", "metric", "dashboard", "report", "market-sizing", "postgres", "spreadsheet", "表格"],
    scene: "适合做指标体系、数据诊断、图表看板、经营报告和市场测算。"
  },
  {
    key: "automation",
    label: "自动化执行",
    icon: "自",
    className: "amber",
    keywords: ["browser", "playwright", "mcp", "automation", "workflow", "agent", "task", "lark", "airtable", "api", "publish", "sync"],
    scene: "适合连接浏览器、API、MCP、表格、文档和发布工具，把流程跑成自动化。"
  },
  {
    key: "engineering",
    label: "工程开发",
    icon: "码",
    className: "violet",
    keywords: ["code", "github", "review", "testing", "python", "frontend", "backend", "typescript", "lsp", "debug", "refactor", "security", "plugin", "mcp-integration"],
    scene: "适合写代码、查 bug、做测试、审查 PR、搭插件和维护工程质量。"
  },
  {
    key: "office",
    label: "办公文档",
    icon: "办",
    className: "blue",
    keywords: ["doc", "pdf", "ppt", "slide", "powerpoint", "document", "minutes", "meeting", "note", "wiki", "office", "文档"],
    scene: "适合做 PPT、PDF、Word、会议纪要、知识库、培训材料和正式文档交付。"
  }
];

const FALLBACK_SCENARIO = {
  key: "workflow",
  label: "通用工作流",
  icon: "流",
  className: "cyan",
  scene: "适合把一次性任务整理成可复用流程，用在研究、生产、检查和复盘。"
};

const INDUSTRIES = [
  {
    name: "教育培训",
    icon: "教",
    fit: "适合把课程、直播课、训练营和私域答疑做成选题、课件、海报、短视频和转化话术。",
    skills: ["customer-research", "article-outline", "powerpoint", "xiaohongshu-cards", "yanru-wechat-publisher"]
  },
  {
    name: "本地生活",
    icon: "店",
    fit: "适合餐饮、美业、到店服务，用来做活动文案、小红书笔记、团购页、门店引流和复购提醒。",
    skills: ["ad-creative", "xhs-images", "page-cro", "paid-ads", "analytics-tracking"]
  },
  {
    name: "零售电商",
    icon: "货",
    fit: "适合商品上架、卖点提炼、详情页、直播话术、商品图和投放素材生产。",
    skills: ["brush", "images2", "pricing-strategy", "sales-enablement", "form-cro"]
  },
  {
    name: "B2B 工业",
    icon: "工",
    fit: "适合做官网 SEO、询盘页、产品资料、技术白皮书、RFQ 内容和出海线索承接。",
    skills: ["competitor-alternatives", "ai-seo", "programmatic-seo", "site-architecture", "lead-magnets"]
  },
  {
    name: "直播电商",
    icon: "播",
    fit: "适合把商品卖点拆成直播脚本、主播话术、切片短视频、复盘表和下一轮测试计划。",
    skills: ["sales-enablement", "heygen-video", "video-editing-automation", "ad-creative", "metric-diagnostics"]
  },
  {
    name: "咨询服务",
    icon: "咨",
    fit: "适合把专家经验产品化，产出诊断问卷、方案书、报价页、案例文章和客户跟进话术。",
    skills: ["paseo", "copywriting", "powerpoint", "document-release", "sales-enablement"]
  },
  {
    name: "企业内训",
    icon: "训",
    fit: "适合沉淀 SOP、培训课件、内部知识库、会议纪要、复盘报告和自动化执行清单。",
    skills: ["得到大脑（Get笔记）", "nutrient-document-processing", "airtable-cli", "notebooklm", "task-router"]
  },
  {
    name: "品牌与内容团队",
    icon: "品",
    fit: "适合做选题库、公众号、小红书、短视频、视觉风格、发布排期和效果复盘。",
    skills: ["content-strategy", "wechat-polished-publisher", "xhs-image2-publisher", "remotion-video-studio", "kpi-reporting"]
  }
];

const COMBOS = [
  {
    title: "公众号引流链路",
    outcome: "从热点或产品观点，做成公众号长文、配图、草稿和公开页核验。",
    nodes: ["benchmark", "article-outline", "images2", "yanru-wechat-publisher", "verification-loop"],
    prompt: "请使用 article-outline、images2、yanru-wechat-publisher，把我这段素材做成颜汝风格公众号文章，配 3 张正文图，生成可预览 HTML，并检查没有内部标签。素材：我想讲中小老板用 AI 不是学工具，而是把销售、交付和复盘流程标准化。"
  },
  {
    title: "小红书种草链路",
    outcome: "从一个产品或课程卖点，拆成小红书封面、多图卡片、正文和话题标签。",
    nodes: ["customer-research", "xiaohongshu-cards", "images2", "xhs-image2-publisher", "verification-loop"],
    prompt: "请使用 customer-research、xiaohongshu-cards、xhs-image2-publisher，把这个产品做成 6 张小红书图文卡片和一篇笔记。产品：面向长沙实体老板的 AI 获客训练营，主打 7 天搭建内容获客流程。要求：标题有冲突感，正文像老板说人话。"
  },
  {
    title: "零售商品转化链路",
    outcome: "把商品卖点变成详情页、商品图、销售话术和投放测试素材。",
    nodes: ["product-marketing-context", "brush", "images2", "ad-creative", "page-cro"],
    prompt: "请使用 product-marketing-context、brush、images2、ad-creative、page-cro，帮我优化一个零售商品的卖点和详情页。商品：一款适合办公室人群的便携养生茶包，客单价 99 元，目标是提高下单率。请输出商品卖点、详情页结构、3 条广告文案、3 张图的提示词。"
  },
  {
    title: "直播成交链路",
    outcome: "把产品资料拆成直播脚本、主播话术、短视频切片和复盘指标。",
    nodes: ["customer-research", "sales-enablement", "heygen-video", "video-editing-automation", "metric-diagnostics"],
    prompt: "请使用 customer-research、sales-enablement、heygen-video、video-editing-automation、metric-diagnostics，为一场直播做成交脚本。产品：AI 私教课，价格 1999 元，目标用户是想用 AI 提升获客能力的老板。请输出直播结构、开场 3 分钟话术、逼单话术、短视频切片标题和复盘指标。"
  },
  {
    title: "B2B 询盘链路",
    outcome: "从行业关键词和产品资料，做成 SEO 页面、白皮书、询盘表单和线索跟进。",
    nodes: ["competitor-alternatives", "ai-seo", "site-architecture", "lead-magnets", "analytics-tracking"],
    prompt: "请使用 competitor-alternatives、ai-seo、site-architecture、lead-magnets、analytics-tracking，为一家 B2B 工业公司设计询盘获客页面。行业：工业传感器，目标客户是海外采购和工程师。请输出页面结构、SEO 标题、白皮书大纲、询盘表单字段和跟进邮件。"
  }
];

const EXAMPLES = [
  {
    title: "教育培训：一场课变成全平台素材",
    input: "请使用 customer-research、article-outline、powerpoint、xiaohongshu-cards、wechat-polished-publisher，帮我把这场课做成招生素材。课程：AI 获客自动化实战课，面向 30 到 50 岁实体老板，痛点是不知道怎么用 AI 真正带来客户。请输出：公众号文章、小红书 6 页卡片、朋友圈短文、课程海报文案、报名页结构。"
  },
  {
    title: "本地生活：门店活动引流",
    input: "请使用 ad-creative、xhs-images、page-cro、paid-ads、analytics-tracking，为一家长沙皮肤管理门店设计 7 天引流活动。客单价 399 元，主推新客体验套餐。要求：不要夸大效果，不写医疗承诺，输出小红书笔记、团购页文案、朋友圈文案、投放测试角度和数据复盘表。"
  },
  {
    title: "零售电商：商品详情页和短视频",
    input: "请使用 brush、images2、pricing-strategy、sales-enablement、video-editing-automation，帮我把一款 99 元办公室养生茶包做成可卖素材。请输出：商品卖点、详情页模块、主图提示词、直播 1 分钟话术、短视频 5 条标题、价格锚点。"
  },
  {
    title: "B2B 工业：询盘页面",
    input: "请使用 competitor-alternatives、ai-seo、programmatic-seo、site-architecture、lead-magnets，帮我为工业传感器公司做一个英文询盘页面方案。目标客户是海外采购和工程师。请输出：页面结构、关键词、技术资料下载钩子、询盘表单字段、跟进邮件模板。"
  },
  {
    title: "直播电商：一场直播的成交脚本",
    input: "请使用 customer-research、sales-enablement、heygen-video、ad-creative、metric-diagnostics，为一场 AI 课程直播写成交脚本。产品价格 1999 元，目标用户是老板。请输出：直播流程、开场、痛点放大、案例讲法、限时优惠话术、复盘指标。"
  },
  {
    title: "企业内训：把经验沉淀成 SOP",
    input: "请使用 得到大脑（Get笔记）、nutrient-document-processing、airtable-cli、notebooklm、task-router，把我们公司一次销售复盘整理成 SOP。素材：客户来源混乱、销售跟进不及时、成交话术不统一。请输出：问题诊断、标准流程、表格字段、会议纪要、下次自动化检查清单。"
  }
];

function renderSkills(rows) {
  if (!tableBody || !skillCount) return;
  const enrichedRows = rows.map(enrichSkill);
  tableBody.innerHTML = enrichedRows.map(({ skill, scenario }) => `
    <article class="skill-index-card">
      <div class="skill-icon ${escapeHtml(scenario.className)}" aria-hidden="true">${escapeHtml(scenario.icon)}</div>
      <div class="skill-index-main">
        <div class="skill-index-topline">
          <span class="scenario-badge ${escapeHtml(scenario.className)}">${escapeHtml(scenario.label)}</span>
          <span class="skill-source">${escapeHtml(compactSource(skill.source))}</span>
        </div>
        <h3>${escapeHtml(skill.name)}</h3>
        <p class="skill-scene">${escapeHtml(scenario.scene)}</p>
        <p class="skill-function">${escapeHtml(skill.function)}</p>
      </div>
    </article>
  `).join("");
  skillCount.textContent = `${rows.length} / ${skills.length} skills`;
}

function enrichSkill(skill) {
  return {
    skill,
    scenario: findScenario(skill)
  };
}

function findScenario(skill) {
  const haystack = `${skill.name} ${skill.function}`.toLowerCase();
  const orderedScenarios = SCENARIO_PRIORITY_KEYS
    .map((key) => SCENARIOS.find((scenario) => scenario.key === key))
    .filter(Boolean);
  return orderedScenarios.find((scenario) => {
    return scenario.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
  }) || FALLBACK_SCENARIO;
}

function compactSource(source) {
  return String(source ?? "").replace(/^~\//, "").replace(/\/SKILL\.md$/, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

skillSearch?.addEventListener("input", () => {
  renderFilteredSkills();
});

function renderScenarioFilter() {
  if (!scenarioFilter) return;
  const buttons = [
    { key: "all", label: "全部", icon: "全", className: "cyan" },
    ...PRIMARY_FILTER_KEYS.map((key) => SCENARIOS.find((scenario) => scenario.key === key)).filter(Boolean)
  ];
  scenarioFilter.innerHTML = buttons.map((scenario) => `
    <button class="scenario-pill ${scenario.key === activeScenario ? "active" : ""}" type="button" data-scenario="${escapeHtml(scenario.key)}">
      <span class="pill-icon ${escapeHtml(scenario.className)}">${escapeHtml(scenario.icon)}</span>
      ${escapeHtml(scenario.label)}
    </button>
  `).join("");
}

scenarioFilter?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-scenario]");
  if (!button) return;
  activeScenario = button.dataset.scenario || "all";
  renderScenarioFilter();
  renderFilteredSkills();
});

function renderFilteredSkills() {
  const q = skillSearch?.value.trim().toLowerCase() || "";
  const rows = skills.filter((skill) => {
    const scenario = findScenario(skill);
    const text = `${skill.name} ${skill.function} ${skill.source} ${scenario.label} ${scenario.scene}`.toLowerCase();
    const matchesQuery = !q || text.includes(q);
    const matchesScenario = activeScenario === "all" || scenario.key === activeScenario;
    return matchesQuery && matchesScenario;
  });
  renderSkills(rows);
}

function renderIndustries() {
  const industryGrid = document.querySelector("#industryGrid");
  if (!industryGrid) return;
  industryGrid.innerHTML = INDUSTRIES.map((industry) => `
    <article class="industry-card">
      <div class="industry-icon" aria-hidden="true">${escapeHtml(industry.icon)}</div>
      <h3>${escapeHtml(industry.name)}</h3>
      <p>${escapeHtml(industry.fit)}</p>
      <div class="mini-skill-row">
        ${industry.skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join("")}
      </div>
    </article>
  `).join("");
}

function renderCombos() {
  const comboBoard = document.querySelector("#comboBoard");
  if (!comboBoard) return;
  comboBoard.innerHTML = COMBOS.map((combo, index) => `
    <article class="combo-card">
      <div class="combo-head">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <div>
          <h3>${escapeHtml(combo.title)}</h3>
          <p>${escapeHtml(combo.outcome)}</p>
        </div>
      </div>
      <div class="flow-graph" aria-label="${escapeHtml(combo.title)}流程图">
        ${combo.nodes.map((node) => `<span>${escapeHtml(node)}</span>`).join("")}
      </div>
      <button class="copy-example" type="button" data-copy="${escapeHtml(combo.prompt)}">复制这条组合输入</button>
    </article>
  `).join("");
}

function renderExamples() {
  const exampleGrid = document.querySelector("#exampleGrid");
  if (!exampleGrid) return;
  exampleGrid.innerHTML = EXAMPLES.map((example) => `
    <article class="example-card">
      <h3>${escapeHtml(example.title)}</h3>
      <div class="example-input">${escapeHtml(example.input)}</div>
      <button class="copy-example" type="button" data-copy="${escapeHtml(example.input)}">复制输入内容</button>
    </article>
  `).join("");
}

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy]");
  if (!button) return;
  const text = button.dataset.copy || "";
  const original = button.textContent;
  try {
    await copyText(text);
    button.textContent = "已复制";
  } catch {
    button.textContent = "请手动复制";
  }
  window.setTimeout(() => {
    button.textContent = original;
  }, 1300);
});

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!copied) throw new Error("copy failed");
}

renderScenarioFilter();
renderFilteredSkills();
renderIndustries();
renderCombos();
renderExamples();
