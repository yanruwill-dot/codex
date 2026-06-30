const advisors = [
  {
    id: "altman",
    name: "山姆·奥特曼",
    org: "OpenAI",
    field: "演讲与共识",
    tag: "共识",
    color: "green",
    lens: "先把问题放进更大的趋势里，看谁会因为这件事形成新共识。",
    questions: ["这个问题背后的时代变化是什么？", "谁会因为这个方案相信一个更大的未来？", "有没有一句话能让团队、客户和伙伴同时点头？"],
    action: "把复杂方案压成一个清晰叙事：为什么现在必须做，为什么你有资格做，为什么别人会参与。",
    doNow: ["写出一句 20 字以内的大主张", "列出 3 个最容易形成共识的人群", "做一页对外说明，讲清现在为什么是窗口期"],
    avoid: "不要一上来讲工具清单，先讲趋势和机会。",
    metric: "别人能不能用一句话复述你的主张。"
  },
  {
    id: "bezos",
    name: "杰夫·贝索斯",
    org: "亚马逊",
    field: "营销增长",
    tag: "增长",
    color: "lime",
    lens: "从客户倒推，把体验、价格、交付和复购拆成飞轮。",
    questions: ["客户真正反复抱怨的是什么？", "哪一个动作会让体验更好、成本更低、复购更高？", "这个方案能不能变成长期飞轮，而不是一次活动？"],
    action: "先写清楚客户承诺，再倒推产品、渠道、履约和复购机制。",
    doNow: ["写一份客户承诺，不超过 3 条", "把成交后 7 天交付流程画出来", "设计一个老客户转介绍动作"],
    avoid: "不要只追新增流量，忽略交付体验和复购。",
    metric: "线索到成交率、首周完课率、转介绍人数。"
  },
  {
    id: "jobs",
    name: "史蒂夫·乔布斯",
    org: "苹果",
    field: "产品洞察",
    tag: "产品",
    color: "cyan",
    lens: "删掉噪音，只保留用户第一眼就能感到不同的核心体验。",
    questions: ["用户第一眼会记住什么？", "哪些功能只是显得很努力，但没有让体验更锋利？", "如果只允许保留一个卖点，应该留下哪一个？"],
    action: "把产品压成一个强主张、一个主界面、一个关键时刻和一个能被复述的体验。",
    doNow: ["删除 50% 次要卖点", "做一个首屏 Demo 或报价页", "把产品命名改成用户听得懂的结果"],
    avoid: "不要把产品讲成课程目录或功能列表。",
    metric: "用户 10 秒内能不能说出它解决什么问题。"
  },
  {
    id: "huang",
    name: "黄仁勋",
    org: "英伟达",
    field: "市场预测",
    tag: "预测",
    color: "emerald",
    lens: "判断底层算力、生态和产业迁移，找未来三年会放大的变量。",
    questions: ["这个行业的瓶颈会被什么技术重新定价？", "谁在产业链里会拿到新的议价权？", "现在布局哪一层，三年后最可能被放大？"],
    action: "把短期生意放到产业周期里，优先押会被趋势放大的能力、渠道和数据资产。",
    doNow: ["列出 3 个未来一年会变便宜的能力", "找一个会被 AI 放大的细分行业", "沉淀数据、案例和流程资产"],
    avoid: "不要只追今天的热点模型，忽略行业迁移。",
    metric: "你的内容、数据和流程能不能复用到下一个行业。"
  },
  {
    id: "musk",
    name: "埃隆·马斯克",
    org: "特斯拉 / SpaceX",
    field: "公关破局",
    tag: "破局",
    color: "yellow",
    lens: "回到第一性原理，找最小可行冲击点，用公开动作打破僵局。",
    questions: ["如果不考虑行业惯例，问题的物理事实是什么？", "什么公开动作能让市场重新讨论你？", "哪一个高风险动作值得被验证，而不是继续开会？"],
    action: "把大问题拆成一个可演示、可传播、可验证的动作，用速度和证据制造突破。",
    doNow: ["做一个公开挑战或真实案例直播", "把承诺变成可验证结果", "用 48 小时做出最小演示"],
    avoid: "不要继续内部讨论，用公开证据逼自己前进。",
    metric: "有没有人因为这个动作主动转发、质疑或咨询。"
  }
];

const modes = {
  growth: {
    label: "营销增长",
    frame: "把注意力、信任、成交和复购串成闭环。",
    output: "增长路径"
  },
  product: {
    label: "产品设计",
    frame: "把人群、痛点、体验和交付压成一个清晰产品。",
    output: "产品决策"
  },
  market: {
    label: "市场预测",
    frame: "判断趋势、变量、周期和下注位置。",
    output: "趋势判断"
  },
  pr: {
    label: "公关破局",
    frame: "找到公开叙事、争议点、证据和传播动作。",
    output: "破局动作"
  },
  strategy: {
    label: "战略选择",
    frame: "在资源有限时判断做什么、不做什么、先做什么。",
    output: "战略排序"
  }
};

const picker = document.querySelector("#advisorPicker");
const questionInput = document.querySelector("#questionInput");
const modeSelect = document.querySelector("#modeSelect");
const runButton = document.querySelector("#runButton");
const copyPromptButton = document.querySelector("#copyPromptButton");
const summaryStrip = document.querySelector("#summaryStrip");
const resultBrief = document.querySelector("#resultBrief");
const advisorOutput = document.querySelector("#advisorOutput");
const finalOutput = document.querySelector("#finalOutput");
let analyzeTimer;

function renderPicker() {
  picker.innerHTML = advisors.map((advisor) => `
    <label class="advisor-toggle ${advisor.color}">
      <input type="checkbox" value="${advisor.id}" checked>
      <span>${advisor.tag}</span>
      <strong>${advisor.name}</strong>
      <small>${advisor.field}</small>
    </label>
  `).join("");
}

function selectedAdvisors() {
  const selectedIds = [...picker.querySelectorAll("input:checked")].map((input) => input.value);
  return advisors.filter((advisor) => selectedIds.includes(advisor.id));
}

function analyze() {
  const question = questionInput.value.trim() || "请先输入一个真实问题。";
  const mode = modes[modeSelect.value] || modes.growth;
  const selected = selectedAdvisors();
  const context = deriveContext(question, mode);

  summaryStrip.innerHTML = `
    <div><span>问题焦点</span><strong>${escapeHtml(context.shortTopic)}</strong></div>
    <div><span>问题类型</span><strong>${escapeHtml(mode.label)}</strong></div>
    <div><span>顾问数量</span><strong>${selected.length} / 5</strong></div>
  `;

  resultBrief.innerHTML = `
    <span>针对这个问题的初步结果</span>
    <strong>${escapeHtml(context.decision)}</strong>
    <p>先把「${escapeHtml(context.shortTopic)}」做成面向 ${escapeHtml(context.audience)} 的 ${escapeHtml(context.deliverable)}，用 ${escapeHtml(context.channel)} 拿到第一批反馈，再用 ${escapeHtml(context.firstMetric)} 判断要不要放大。</p>
  `;

  advisorOutput.innerHTML = selected.map((advisor) => advisorCard(advisor, question, mode, context)).join("");
  finalOutput.innerHTML = finalSynthesis(question, mode, selected, context);
}

function advisorCard(advisor, question, mode, context) {
  const diagnosis = buildDiagnosis(advisor, question, mode, context);
  const actions = buildActions(advisor, context);
  const copySet = buildCopySet(advisor, context);
  return `
    <article class="output-card ${advisor.color}">
      <div class="output-head">
        <span>${escapeHtml(advisor.tag)}</span>
        <div>
          <h3>${escapeHtml(advisor.name)}</h3>
          <p>${escapeHtml(advisor.field)} · ${escapeHtml(advisor.org)}</p>
        </div>
      </div>
      <div class="lens">${escapeHtml(diagnosis.reframe)}</div>
      <dl>
        <div><dt>具体建议</dt><dd><ul>${actions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></dd></div>
        <div><dt>可直接用文案</dt><dd>${copyExamples(copySet)}</dd></div>
        <div><dt>先别做</dt><dd>${escapeHtml(advisor.avoid)}</dd></div>
        <div><dt>验证指标</dt><dd>${escapeHtml(advisor.metric)}</dd></div>
        <div><dt>关键追问</dt><dd>${escapeHtml(advisor.questions[diagnosis.questionIndex])}</dd></div>
      </dl>
    </article>
  `;
}

function deriveContext(question, mode) {
  const clean = question.replace(/\s+/g, " ").trim();
  const shortTopic = clean.length > 34 ? `${clean.slice(0, 34)}...` : clean;
  const audience = matchFirst(question, [
    ["实体老板", /实体|老板|门店|商家|企业主/],
    ["本地商家", /本地|同城|门店|餐饮|美容|零售/],
    ["内容创作者", /公众号|小红书|短视频|博主|创作者/],
    ["私域客户", /私域|社群|微信|朋友圈/],
    ["高意向客户", /客户|用户|线索|咨询/]
  ], "目标客户");
  const deliverable = matchFirst(question, [
    ["可成交课程包", /课程|训练营|课/],
    ["获客转化方案", /获客|引流|线索|成交/],
    ["产品方案", /产品|服务|工具|系统/],
    ["内容增长方案", /内容|公众号|小红书|短视频/],
    ["公关破局动作", /公关|发布|传播|破局/]
  ], mode.output);
  const channel = matchFirst(question, [
    ["公众号", /公众号|文章/],
    ["小红书", /小红书|笔记/],
    ["短视频", /短视频|抖音|视频/],
    ["直播", /直播/],
    ["私域", /私域|社群|朋友圈|微信/]
  ], modeSelect.value === "pr" ? "公开演示" : "内容和私域");
  const firstMetric = matchFirst(question, [
    ["咨询数", /获客|引流|咨询|线索/],
    ["成交率", /卖|成交|转化|价格/],
    ["复购和转介绍", /复购|转介绍|老客户/],
    ["用户复述率", /产品|定位|主张/]
  ], "有效反馈数");
  const keyword = matchFirst(question, [
    ["获客", /获客|引流|线索|咨询/],
    ["课程", /课程|训练营|课/],
    ["短视频", /短视频|抖音|视频/],
    ["社群", /社群|私域|微信/],
    ["方案", /产品|服务|系统|方案/]
  ], "方案");
  const offerLine = `我会先帮你把 ${contextLike(audience)} 的痛点、成交承诺和第一步动作写出来，不保证一夜爆单，但保证先跑出能复盘的反馈。`;
  const decisionByMode = {
    growth: `先做一个小闭环，不要先铺大流量`,
    product: `先压成一个能被复述的产品，不要堆功能`,
    market: `先选最容易被趋势放大的细分人群`,
    pr: `先做一个外部愿意讨论的公开动作`,
    strategy: `先选一个高杠杆动作，砍掉分散动作`
  };

  return {
    raw: clean,
    shortTopic,
    audience,
    deliverable,
    channel,
    firstMetric,
    keyword,
    offerLine,
    decision: decisionByMode[modeSelect.value] || `${mode.label}先落到一个可验证动作`
  };
}

function contextLike(value) {
  return value === "目标客户" ? "目标客户" : value;
}

function matchFirst(text, rules, fallback) {
  const match = rules.find(([, pattern]) => pattern.test(text));
  return match ? match[0] : fallback;
}

function buildActions(advisor, context) {
  const modeSpecific = {
    growth: {
      altman: `把「${context.shortTopic}」改成一句社会共识：为什么 ${context.audience} 现在必须行动。`,
      bezos: `画出 ${context.audience} 从看到 ${context.channel} 到成交、交付、转介绍的飞轮。`,
      jobs: `只保留一个主卖点：让 ${context.audience} 一眼知道这个 ${context.deliverable} 能带来什么结果。`,
      huang: `先选一个最容易被 AI 或成本变化放大的细分行业，不要一开始覆盖所有人。`,
      musk: `围绕「${context.shortTopic}」做一次 48 小时公开挑战，用真实反馈验证 ${context.firstMetric}。`
    },
    product: {
      altman: `把 ${context.deliverable} 定义成一种新能力，而不是一堆模块。`,
      bezos: `写清 ${context.audience} 买完第 1 天、第 3 天、第 7 天分别拿到什么。`,
      jobs: `做一个极简产品页，只放痛点、结果、案例、价格和行动按钮。`,
      huang: `把交付过程沉淀成模板、数据和流程资产，方便复制到下一个行业。`,
      musk: `先做最小可演示版本，让 ${context.audience} 直接看到真实产出。`
    },
    market: {
      altman: `把市场叙事放到能力重估：会做这件事的人和不会做的人差距会拉开。`,
      bezos: `验证 ${context.audience} 是否持续痛，而不是只对一次活动有兴趣。`,
      jobs: `用一个细分人群做尖，先让「谁最该买」变得非常清楚。`,
      huang: `判断哪个环节会被技术降本，优先占住会被放大的位置。`,
      musk: `找一个同行不敢公开承诺的结果，做可验证实验。`
    },
    pr: {
      altman: `设计一个外部愿意讨论的命题，而不是只说你要推广 ${context.deliverable}。`,
      bezos: `公关话题要回到 ${context.audience} 的收益，别只讲创始人或团队很厉害。`,
      jobs: `发布一个让人一眼记住的演示，让复杂问题变成可观看的结果。`,
      huang: `用行业趋势或成本变化支撑观点，避免只靠情绪制造热闹。`,
      musk: `用公开挑战制造冲突：把承诺放到台前，让市场验证 ${context.firstMetric}。`
    },
    strategy: {
      altman: `先统一一句战略主张，避免团队对「${context.shortTopic}」各讲各的。`,
      bezos: `优先做能提升 ${context.audience} 体验、信任和复购的环节。`,
      jobs: `砍掉不够锋利的模块，先把 ${context.deliverable} 做成标杆。`,
      huang: `把短期收入和长期资产一起设计，别只做一次性交付。`,
      musk: `选一个高杠杆动作先干，不要同时铺 5 条线。`
    }
  };
  const specific = modeSpecific[modeSelect.value]?.[advisor.id];
  return specific ? [specific, ...advisor.doNow.slice(0, 2)] : advisor.doNow;
}

function buildCopySet(advisor, context) {
  const hooks = {
    altman: {
      moment: "时代窗口",
      promise: `让 ${context.audience} 看懂为什么现在必须重做 ${context.deliverable}`,
      tone: "先讲趋势，再讲选择"
    },
    bezos: {
      moment: "客户结果",
      promise: `让 ${context.audience} 明确买完之后第一周会得到什么`,
      tone: "少讲自己，多讲客户能拿到的确定收益"
    },
    jobs: {
      moment: "第一眼心动",
      promise: `把 ${context.deliverable} 讲成一个一听就懂的结果`,
      tone: "短、狠、聚焦，只留一个主卖点"
    },
    huang: {
      moment: "趋势红利",
      promise: `告诉 ${context.audience} 哪个能力正在被 AI 重新定价`,
      tone: "用未来变化解释今天为什么要行动"
    },
    musk: {
      moment: "公开验证",
      promise: `用一次真实挑战证明 ${context.deliverable} 不是空话`,
      tone: "把承诺放到台前，让市场看结果"
    }
  };
  const hook = hooks[advisor.id] || hooks.bezos;
  const offer = context.offerLine;

  return [
    {
      label: "朋友圈文案",
      text: `很多 ${context.audience} 现在不是缺努力，而是缺一套能持续带来 ${context.firstMetric} 的方法。我准备用「${context.shortTopic}」做一个小样板：不讲大词，只看 7 天内能不能跑出真实反馈。想看过程的，可以私信我「${context.keyword}」。`
    },
    {
      label: "口播文案",
      text: `如果你是 ${context.audience}，现在最危险的不是不会用工具，而是还在用过去的方法做获客和成交。我的建议是先别铺大流量，先做一个小闭环：一个清晰卖点、一条内容、一次演示、一个成交动作。${offer}。`
    },
    {
      label: "短视频文案",
      text: `开头：${context.audience} 做增长，别一上来追流量。中段：先把「${context.shortTopic}」拆成客户痛点、成交承诺、交付证明。结尾：我会用 7 天做一次验证，看 ${context.firstMetric} 能不能起来，想要模板评论「${context.keyword}」。`
    },
    {
      label: "社群文案",
      text: `今晚我想在群里拆一个真实问题：${context.raw}。按 ${advisor.name} 的思路，重点不是多发内容，而是先抓住 ${hook.moment}：${hook.promise}。我先发一版方案，大家可以直接拿去改自己的行业。`
    },
    {
      label: "顾问提醒",
      text: `${advisor.name} 这一路的重点：${hook.tone}。这条文案发出去后，只看一个结果：有没有人追问、私信、转发或愿意给真实案例。`
    }
  ];
}

function copyExamples(items) {
  return `
    <div class="copy-grid">
      ${items.map((item) => `
        <section class="copy-chip">
          <strong>${escapeHtml(item.label)}</strong>
          <p>${escapeHtml(item.text)}</p>
        </section>
      `).join("")}
    </div>
  `;
}

function buildDiagnosis(advisor, question, mode, context) {
  const lengthSignal = question.length > 90 ? "问题已经有很多信息，先把主线压短，否则团队会各抓一段。" : "问题还比较短，先补齐目标客户、交付物和成功标准。";
  const modeHints = {
    growth: {
      reframe: `${advisor.name} 会把「${context.shortTopic}」看成增长闭环：${context.channel}、信任、成交、复购能不能连起来。${lengthSignal}`,
      risk: "只做内容热闹，不做成交路径和复盘指标。"
    },
    product: {
      reframe: `${advisor.name} 会先把它看成产品取舍问题：${context.audience} 最痛什么、承诺什么、第一眼看到什么。${lengthSignal}`,
      risk: "功能越加越多，用户反而不知道为什么要买。"
    },
    market: {
      reframe: `${advisor.name} 会先看趋势：${context.audience} 的这个需求是不是会被 AI、渠道和成本结构继续放大。${lengthSignal}`,
      risk: "把短期热点误判成长期市场。"
    },
    pr: {
      reframe: `${advisor.name} 会先找公共议题：什么话题能让外部愿意讨论「${context.shortTopic}」，而不是只听你自卖自夸。${lengthSignal}`,
      risk: "有传播姿态，但没有证据和可演示动作。"
    },
    strategy: {
      reframe: `${advisor.name} 会先做排序：围绕 ${context.deliverable}，哪件事最能改变局面，哪些事应该暂时不做。${lengthSignal}`,
      risk: "资源平均分配，最后每条线都不够锋利。"
    }
  };
  return {
    ...modeHints[modeSelect.value],
    questionIndex: Math.abs(advisor.id.length + question.length + mode.label.length) % advisor.questions.length
  };
}

function finalSynthesis(question, mode, selected, context) {
  const advisorNames = selected.map((advisor) => advisor.name).join("、");
  return `
    <article class="final-card">
      <p class="kicker">Board Decision</p>
      <h3>针对「${escapeHtml(context.shortTopic)}」的 7 天动作</h3>
      <p>这个问题用 ${escapeHtml(advisorNames)} 的组合来拆，结论是：先服务 ${escapeHtml(context.audience)}，把 ${escapeHtml(context.deliverable)} 做成一个可演示、可成交、可复盘的小闭环。</p>
      <ol>
        <li>今天写出一句主张：给 ${escapeHtml(context.audience)}，解决什么，几天看到什么结果。</li>
        <li>明天做一个极简产品页，只放痛点、结果、案例、价格和行动按钮。</li>
        <li>第 3 天用 ${escapeHtml(context.channel)} 发一条观点内容，测试是否有人追问。</li>
        <li>第 4-6 天做一次公开演示或直播，用真实案例证明结果。</li>
        <li>第 7 天复盘 3 个指标：${escapeHtml(context.firstMetric)}、成交数、用户复述率。</li>
      </ol>
      <div class="publish-pack">
        <h4>今天直接发这 4 条</h4>
        <p><strong>朋友圈：</strong>很多 ${escapeHtml(context.audience)} 不是缺流量，而是缺一个能被验证的小闭环。我会用 7 天拆「${escapeHtml(context.shortTopic)}」，只看真实反馈。</p>
        <p><strong>口播：</strong>如果你也在做 ${escapeHtml(context.deliverable)}，先别急着铺渠道，先把目标客户、成交承诺和演示案例讲清楚。</p>
        <p><strong>短视频：</strong>开头讲痛点，中段给方法，结尾留动作：想要模板，评论「${escapeHtml(context.keyword)}」。</p>
        <p><strong>社群：</strong>今晚我在群里拆一个真实案例，主题是「${escapeHtml(context.shortTopic)}」，目标是跑出 ${escapeHtml(context.firstMetric)}。</p>
      </div>
      <button class="ghost-button" type="button" id="copyResultButton">复制本次复盘提示词</button>
    </article>
  `;
}

function buildPrompt() {
  const selected = selectedAdvisors();
  const mode = modes[modeSelect.value] || modes.growth;
  const question = questionInput.value.trim();
  return `请用五人专属顾问系统分析这个问题。

问题：${question}
问题类型：${mode.label}

请使用这些思维镜头：
${selected.map((advisor) => `- ${advisor.name}（${advisor.field}）：${advisor.lens}`).join("\n")}

输出格式：
1. 每位顾问给 3 条具体建议
2. 每位顾问给朋友圈文案、口播文案、短视频文案、社群文案
3. 每位顾问指出 1 条先别做的事
4. 每位顾问给 1 个验证指标
5. 找出五人意见的冲突和共识
6. 合成一个 7 天可执行计划，按天列动作`;
}

document.addEventListener("click", async (event) => {
  if (event.target.id === "copyResultButton") {
    await copyText(buildPrompt(), event.target);
  }
});

runButton.addEventListener("click", analyze);
questionInput.addEventListener("input", scheduleAnalyze);
modeSelect.addEventListener("change", analyze);
picker.addEventListener("change", analyze);
copyPromptButton.addEventListener("click", async () => copyText(buildPrompt(), copyPromptButton));

function scheduleAnalyze() {
  window.clearTimeout(analyzeTimer);
  analyzeTimer = window.setTimeout(analyze, 180);
}

async function copyText(text, button) {
  const previous = button.textContent;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    button.textContent = "已复制";
  } catch {
    button.textContent = "请手动复制";
  }
  window.setTimeout(() => {
    button.textContent = previous;
  }, 1300);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

renderPicker();
analyze();
