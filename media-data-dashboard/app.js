const state = {
  year: 2026,
  month: 6,
  selectedDay: 27,
  activeView: "media",
  overview: null,
  topics: [],
  media: null,
  mediaSource: "metrics",
  mediaTab: "brain",
  mediaEvaluation: null,
  viralModel: null,
  visibleMediaWorks: [],
  industryGroup: "insurance",
  marketMode: "cross-border",
};

const industryProfileIds = {
  education: {
    domestic: "education-training",
    "cross-border": "education-cross-border",
  },
  insurance: {
    domestic: "insurance-cn",
    "cross-border": "insurance-cn-hk",
  },
  manufacturing: {
    domestic: "manufacturing-cn",
    "cross-border": "manufacturing-cross-border",
  },
  "new-retail": {
    domestic: "new-retail-cn",
    "cross-border": "new-retail-cross-border",
  },
};

const industryTopicPlaceholders = {
  "education-training": "例如：职业技能课值不值得报？先看课程任务、练习反馈与退费边界",
  "education-cross-border": "例如：海外课程怎么选？先核对项目资质、申请条件、真实费用与学习支持",
  "insurance-cn": "例如：家庭医疗险怎么选？先看责任范围、健康告知、续保条件与服务边界",
  "insurance-cn-hk": "例如：境内保险和港险怎么比？先看保障责任、缴费续期与长期服务",
  "manufacturing-cn": "例如：采购第一次询盘，工厂先把参数、工艺、交期和质检说清楚",
  "manufacturing-cross-border": "例如：海外客户第一次询价，工厂先说清规格、MOQ、质检与贸易条款",
  "new-retail-cn": "例如：同一款商品线上线下转化不同，先查人群、货盘、价格与履约",
  "new-retail-cross-border": "例如：产品出海前别急着投流，先核对市场、合规、定价、履约与退货",
};

function selectedIndustryId() {
  return industryProfileIds[state.industryGroup]?.[state.marketMode] || "insurance-cn-hk";
}

function syncIndustryControls() {
  for (const id of ["topicIndustryGroup", "generationIndustryGroup"]) {
    const control = document.querySelector(`#${id}`);
    if (control) control.value = state.industryGroup;
  }
  for (const id of ["topicMarketMode", "generationMarketMode"]) {
    const control = document.querySelector(`#${id}`);
    if (control) control.value = state.marketMode;
  }
  const topic = document.querySelector("#generationTopic");
  if (topic) topic.placeholder = industryTopicPlaceholders[selectedIndustryId()];
}

const viewNames = {
  overview: "获客总览",
  media: "AI 获客大脑",
  planning: "流量规划",
  topics: "选题中心",
  content: "内容生产",
  publish: "矩阵发布",
  leads: "线索回收",
};

const endpointNames = {
  overview: ["总览聚合", "/api/operation/overview"],
  topics: ["真实选题库", "/api/topics"],
  contentGeneration: ["内容生成", "/api/content/generate"],
  accountStatus: ["平台账号状态", "/api/system/status"],
  publishQueue: ["发布任务队列", "/api/content/publish"],
  leads: ["线索统计", "D1 / leads"],
};

const calendarGrid = document.querySelector("#calendarGrid");
const calendarMonth = document.querySelector("#calendarMonth");
const selectedDate = document.querySelector("#selectedDate");
const projectMenu = document.querySelector("#projectMenu");
const toast = document.querySelector("#toast");
const modalBackdrop = document.querySelector("#modalBackdrop");
const modalTitle = document.querySelector("#modalTitle");
const apiDrawer = document.querySelector("#apiDrawer");
const drawerBackdrop = document.querySelector("#drawerBackdrop");

const eventDays = new Set([2, 5, 8, 12, 15, 18, 22, 24, 27, 29]);
const eventPresets = {
  27: [
    ["blue-event", "发布：产品出海前先核对市场、合规与履约", "10:30 · 小红书图文", "待发"],
    ["violet-event", "复用：改写公众号深度版", "14:00 · 微信公众号", "生成中"],
    ["green-event", "回查：昨日内容咨询数据", "18:30 · 线索归因", "自动"],
  ],
  29: [
    ["blue-event", "发布：海外采购询价先说清规格与交期", "11:00 · 抖音短视频", "待发"],
    ["green-event", "更新：四行业跨境需求样本库", "16:00 · 选题中心", "自动"],
  ],
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderCalendar() {
  const firstDay = new Date(state.year, state.month, 1);
  const monthDays = new Date(state.year, state.month + 1, 0).getDate();
  const previousDays = new Date(state.year, state.month, 0).getDate();
  const offset = (firstDay.getDay() + 6) % 7;
  calendarMonth.textContent = `${state.year} 年 ${state.month + 1} 月`;
  calendarGrid.innerHTML = "";

  for (let index = 0; index < 42; index += 1) {
    const button = document.createElement("button");
    button.className = "day";
    let day;
    let current = true;
    if (index < offset) {
      day = previousDays - offset + index + 1;
      current = false;
      button.classList.add("muted");
    } else if (index >= offset + monthDays) {
      day = index - offset - monthDays + 1;
      current = false;
      button.classList.add("muted");
    } else {
      day = index - offset + 1;
    }
    button.textContent = day;
    if (current && eventDays.has(day)) button.classList.add("has-event");
    if (current && state.year === 2026 && state.month === 6 && day === 27) button.classList.add("today");
    if (current && day === state.selectedDay) button.classList.add("selected");
    button.addEventListener("click", () => {
      if (!current) return;
      state.selectedDay = day;
      renderCalendar();
      renderEvents(day);
    });
    calendarGrid.appendChild(button);
  }
}

function renderEvents(day) {
  selectedDate.textContent = `${String(state.month + 1).padStart(2, "0")} 月 ${String(day).padStart(2, "0")} 日`;
  const events = eventPresets[day] || [
    ["blue-event", "生成今日行业主选题内容", "10:00 · 内容生产", "待执行"],
  ];
  document.querySelector("#eventCount").textContent = `${events.length} 项`;
  document.querySelector("#eventsList").innerHTML = events.map(([color, title, meta, status]) => `
    <button class="event-item ${color}"><i></i><div><b>${escapeHtml(title)}</b><small>${escapeHtml(meta)}</small></div><span>${escapeHtml(status)}</span></button>
  `).join("");
}

function showToast(message) {
  toast.querySelector("p").textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function openModal(title) {
  modalTitle.textContent = title;
  modalBackdrop.classList.add("open");
  window.setTimeout(() => document.querySelector("#modalName").focus(), 80);
}

function closeModal() {
  modalBackdrop.classList.remove("open");
}

function openApiDrawer() {
  apiDrawer.classList.add("open");
  drawerBackdrop.classList.add("open");
  if (!state.overview) loadOverview();
}

function closeApiDrawer() {
  apiDrawer.classList.remove("open");
  drawerBackdrop.classList.remove("open");
}

function switchView(view) {
  if (!viewNames[view]) return;
  state.activeView = view;
  document.querySelectorAll("[data-view-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.viewPanel === view);
  });
  document.querySelectorAll(".side-nav button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  document.querySelector("#breadcrumbCurrent").textContent = viewNames[view];
  document.body.classList.toggle("media-mode", view === "media");
  document.querySelector("#sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (view === "topics" && !state.topics.length) loadTopics();
  if (view === "publish") renderPublish();
  if (view === "overview") renderOverview();
  if (view === "media" && !state.media) loadMedia();
}

function formatMetric(value) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  if (number >= 10000) return `${(number / 10000).toFixed(number >= 100000 ? 0 : 1)}万`;
  return number.toLocaleString("zh-CN");
}

function metricValue(work, key) {
  const value = work?.[key];
  return value === null || value === undefined || value === "" ? null : Number(value);
}

function mediaSourceRows() {
  if (!state.media) return [];
  return state.mediaSource === "metrics" ? state.media.metricWorks || [] : state.media.works || [];
}

function percentile(values, ratio) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) * ratio)];
}

const mediaPatterns = [
  { id: "counter", label: "反常识判断", description: "先否定旧做法，再给一个明确的新判断。", test: (work) => /别|不是|千万|为什么|不会|没有|不说|才发现/.test(work.title || "") },
  { id: "person", label: "具体对象", description: "标题直接点出老板、企业、工厂、老师或创作者。", test: (work) => /老板|企业|工厂|校长|老师|创作者|创业|商家/.test(work.title || "") },
  { id: "proof", label: "实测与证据", description: "用“我做了、我看了、实测、教程”降低空泛感。", test: (work) => /我|实测|教程|内训|参加|亲测|案例/.test(work.title || "") },
  { id: "method", label: "方法与步骤", description: "标题承诺一个可以照着做的方法、步骤或工具。", test: (work) => /方法|步骤|怎么|如何|工具|提示词|原理|打法/.test(work.title || "") },
  { id: "number", label: "数字结构", description: "用明确数字压缩信息，让读者先知道会得到多少。", test: (work) => /[0-9一二三四五六七八九十两]/.test(work.title || "") },
  { id: "short", label: "短而明确", description: "标题控制在 24 个字以内，只讲一个判断。", test: (work) => (work.title || "").replace(/\s/g, "").length <= 24 },
  { id: "video", label: "视频表达", description: "高表现内容更多采用视频承载演示与判断。", test: (work) => work.contentType === "video" },
];

function mediaWorkKey(work) {
  return `${work.platform || ""}:${work.id || ""}`;
}

function matchedMediaPatterns(work) {
  return mediaPatterns.filter((pattern) => pattern.test(work));
}

function evaluateMediaWorks() {
  const generatedAt = Date.parse(state.media?.generatedAt || "") || Date.now();
  const rows = (state.media?.metricWorks || []).filter((work) => {
    const views = metricValue(work, "views");
    const age = generatedAt - chronologicalTime(work);
    return views !== null && views >= 0 && age >= 48 * 60 * 60 * 1000;
  });
  const groups = new Map();
  for (const work of rows) {
    if (!groups.has(work.platform)) groups.set(work.platform, []);
    groups.get(work.platform).push(work);
  }
  const benchmarks = {};
  const eligible = [];
  for (const [platform, works] of groups.entries()) {
    const values = works.map((work) => metricValue(work, "views"));
    const medianValue = percentile(values, .5);
    const benchmark = {
      count: values.length,
      median: medianValue,
      topCut: percentile(values, .8),
      lowCut: medianValue * .35,
    };
    benchmarks[platform] = benchmark;
    if (benchmark.count >= 8 && benchmark.median >= 50) eligible.push(...works);
  }
  const good = eligible
    .filter((work) => metricValue(work, "views") >= Math.max(100, benchmarks[work.platform].topCut))
    .sort((a, b) => metricValue(b, "views") / benchmarks[b.platform].median - metricValue(a, "views") / benchmarks[a.platform].median);
  const stop = eligible
    .filter((work) => metricValue(work, "views") <= benchmarks[work.platform].lowCut)
    .sort((a, b) => metricValue(a, "views") / benchmarks[a.platform].median - metricValue(b, "views") / benchmarks[b.platform].median);
  const patterns = mediaPatterns.map((pattern) => {
    const goodCount = good.filter(pattern.test).length;
    const allCount = eligible.filter(pattern.test).length;
    const rate = good.length ? goodCount / good.length : 0;
    const baseRate = eligible.length ? allCount / eligible.length : 0;
    return { ...pattern, count: goodCount, rate, lift: rate - baseRate };
  }).filter((pattern) => pattern.count >= 2 && pattern.rate >= .2)
    .sort((a, b) => (b.rate + Math.max(0, b.lift) * 2) - (a.rate + Math.max(0, a.lift) * 2))
    .slice(0, 4);
  return { rows, eligible, good, stop, patterns, benchmarks };
}

function chronologicalTime(work) {
  const value = String(work.publishedAt || "").replace(" ", "T");
  return Date.parse(value) || 0;
}

function rawViralScore(work, factorStats) {
  return factorStats.reduce((score, factor) => score + (factor.test(work) ? factor.weight : 0), 0);
}

function labelViralRows(rows, exactTop = false) {
  const groups = new Map();
  for (const work of rows) {
    if (!groups.has(work.platform)) groups.set(work.platform, []);
    groups.get(work.platform).push(work);
  }
  const labeled = [];
  for (const works of groups.values()) {
    if (exactTop) {
      const topCount = Math.max(1, Math.ceil(works.length * .2));
      const ranked = [...works].sort((a, b) =>
        metricValue(b, "views") - metricValue(a, "views") || chronologicalTime(b) - chronologicalTime(a));
      labeled.push(...ranked.map((work, index) => ({ work, actual: index < topCount })));
      continue;
    }
    const topCut = percentile(works.map((work) => metricValue(work, "views")), .8);
    labeled.push(...works.map((work) => ({ work, actual: metricValue(work, "views") >= topCut })));
  }
  return labeled;
}

function fitViralModel(rows) {
  const train = labelViralRows(rows);
  const positive = train.filter((item) => item.actual);
  const factors = mediaPatterns.map((pattern) => {
    const positiveMatches = positive.filter((item) => pattern.test(item.work)).length;
    const allMatches = train.filter((item) => pattern.test(item.work)).length;
    const positiveRate = (positiveMatches + 1) / (positive.length + 2);
    const baseRate = (allMatches + 1) / (train.length + 2);
    const lift = positiveRate - baseRate;
    return {
      ...pattern,
      positiveMatches,
      positiveRate,
      baseRate,
      lift,
      weight: Math.max(-.25, Math.min(.25, lift)),
    };
  }).sort((a, b) => b.lift - a.lift);
  const trainingScores = train.map((item) => rawViralScore(item.work, factors));
  return {
    train,
    factors,
    trainingScores,
    threshold: percentile(trainingScores, .8),
  };
}

function scoreViralRows(model, rows, exactTop = false) {
  const scored = labelViralRows(rows, exactTop).map((item) => ({
    ...item,
    predicted: rawViralScore(item.work, model.factors) >= model.threshold,
  }));
  const truePositive = scored.filter((item) => item.predicted && item.actual).length;
  const predicted = scored.filter((item) => item.predicted).length;
  const actual = scored.filter((item) => item.actual).length;
  return {
    samples: scored.length,
    predicted,
    actual,
    truePositive,
    precision: predicted ? truePositive / predicted : null,
    recall: actual ? truePositive / actual : null,
    baseline: scored.length ? actual / scored.length : null,
  };
}

function backtestViralModel(model) {
  const scored = model.test.map((item) => ({
    ...item,
    score: rawViralScore(item.work, model.factors),
  }));
  const predicted = scored.filter((item) => item.score >= model.threshold);
  const actual = scored.filter((item) => item.actual);
  const truePositive = predicted.filter((item) => item.actual).length;
  return {
    samples: scored.length,
    predicted: predicted.length,
    actual: actual.length,
    precision: predicted.length ? truePositive / predicted.length : null,
    recall: actual.length ? truePositive / actual.length : null,
    baseline: scored.length ? actual.length / scored.length : null,
  };
}

function rollingViralBacktest(rows) {
  const groups = new Map();
  for (const work of rows) {
    if (!groups.has(work.platform)) groups.set(work.platform, []);
    groups.get(work.platform).push(work);
  }
  const orderedGroups = [...groups.values()]
    .map((works) => [...works].sort((a, b) => chronologicalTime(a) - chronologicalTime(b)));
  const boundaries = [.5, .625, .75, .875, 1];
  const folds = [];
  for (let foldIndex = 0; foldIndex < 4; foldIndex += 1) {
    const trainRows = [];
    const testRows = [];
    for (const ordered of orderedGroups) {
      const start = Math.max(5, Math.floor(ordered.length * boundaries[foldIndex]));
      const end = foldIndex === 3
        ? ordered.length
        : Math.max(start + 1, Math.floor(ordered.length * boundaries[foldIndex + 1]));
      const test = ordered.slice(start, end);
      if (test.length < 2) continue;
      trainRows.push(...ordered.slice(0, start));
      testRows.push(...test);
    }
    if (!trainRows.length || !testRows.length) continue;
    const model = fitViralModel(trainRows);
    folds.push({
      fold: foldIndex + 1,
      ...scoreViralRows(model, testRows, true),
      factorLifts: Object.fromEntries(model.factors.map((factor) => [factor.id, factor.lift])),
    });
  }
  const totals = folds.reduce((sum, fold) => ({
    samples: sum.samples + fold.samples,
    predicted: sum.predicted + fold.predicted,
    actual: sum.actual + fold.actual,
    truePositive: sum.truePositive + fold.truePositive,
  }), { samples: 0, predicted: 0, actual: 0, truePositive: 0 });
  const factorStability = mediaPatterns.map((pattern) => {
    const lifts = folds.map((fold) => fold.factorLifts[pattern.id] || 0);
    return {
      ...pattern,
      positiveFolds: lifts.filter((lift) => lift > 0).length,
      averageLift: lifts.length ? lifts.reduce((sum, lift) => sum + lift, 0) / lifts.length : 0,
    };
  }).sort((a, b) => b.averageLift - a.averageLift);
  return {
    ...totals,
    folds,
    factorStability,
    precision: totals.predicted ? totals.truePositive / totals.predicted : null,
    recall: totals.actual ? totals.truePositive / totals.actual : null,
    baseline: totals.samples ? totals.actual / totals.samples : null,
  };
}

function trainViralModel(rows) {
  const generatedAt = Date.parse(state.media?.generatedAt || "") || Date.now();
  const matureRows = rows.filter((work) => generatedAt - chronologicalTime(work) >= 48 * 60 * 60 * 1000);
  const groups = new Map();
  for (const work of matureRows) {
    if (!groups.has(work.platform)) groups.set(work.platform, []);
    groups.get(work.platform).push(work);
  }
  const trainRows = [];
  const testRows = [];
  for (const works of groups.values()) {
    const ordered = [...works].sort((a, b) => chronologicalTime(a) - chronologicalTime(b));
    if (ordered.length < 8) continue;
    const splitAt = Math.min(ordered.length - 3, Math.max(5, Math.floor(ordered.length * .7)));
    trainRows.push(...ordered.slice(0, splitAt));
    testRows.push(...ordered.slice(splitAt));
  }
  const model = fitViralModel(trainRows);
  model.test = labelViralRows(testRows);
  model.backtest = backtestViralModel(model);
  model.rolling = rollingViralBacktest(matureRows);
  model.matureSamples = matureRows.length;
  return model;
}

function predictViralPotential(title, platform, contentType, model) {
  const work = { title: title.trim(), platform, contentType };
  const rawScore = rawViralScore(work, model.factors);
  const lower = model.trainingScores.filter((score) => score < rawScore).length;
  const equal = model.trainingScores.filter((score) => score === rawScore).length;
  const rank = model.trainingScores.length ? (lower + equal * .5) / model.trainingScores.length : .5;
  const score = Math.round(20 + rank * 72);
  const matched = model.factors.filter((factor) => factor.weight > 0 && factor.test(work)).slice(0, 3);
  const missing = model.factors.filter((factor) => factor.weight > 0 && !factor.test(work)).slice(0, 2);
  const band = rawScore >= model.threshold ? "结构较强" : rank >= .5 ? "可测试" : "结构偏弱";
  return { work, rawScore, rank, score, band, matched, missing };
}

function renderViralPrediction(result) {
  const target = document.querySelector("#viralPredictionResult");
  const reasons = result.matched.length
    ? `已有：${result.matched.map((factor) => factor.label).join("、")}。`
    : "目前没有命中历史高表现结构。";
  const action = result.missing.length
    ? `优先补：${result.missing.map((factor) => factor.label).join("或")}。`
    : "结构信号已够，发布后重点看真实留存与互动。";
  target.className = `viral-result ${result.band === "结构较强" ? "high" : result.band === "结构偏弱" ? "low" : ""}`;
  target.innerHTML = `
    <div><small>${escapeHtml(result.band)}</small><b>${result.score}</b><span>/ 100</span></div>
    <p>${escapeHtml(reasons)}${escapeHtml(action)}</p>
  `;
}

function renderViralAnalysis() {
  const model = state.viralModel;
  if (!model) return;
  const rolling = model.rolling;
  const strongest = rolling.factorStability
    .filter((factor) => factor.positiveFolds === rolling.folds.length && factor.averageLift > 0)
    .slice(0, 3);
  const representative = state.mediaEvaluation?.good || [];
  document.querySelector("#viralModelState").textContent = `${model.matureSamples} 条成熟样本 · 只做结构提醒`;
  document.querySelector("#viralCauseList").innerHTML = strongest.length ? strongest.map((factor, index) => {
    const example = representative.find((work) => factor.test(work));
    const evidence = `4 段都为正 · 平均高于基准 ${Math.round(factor.averageLift * 100)} 个百分点`;
    const exampleUrl = safeWorkUrl(example);
    return `
      <div class="viral-cause">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <div><b>${escapeHtml(factor.label)}</b><p>${escapeHtml(factor.description)}</p><small>${escapeHtml(evidence)}</small></div>
        ${exampleUrl ? `<a href="${escapeHtml(exampleUrl)}">看样本 ↗</a>` : ""}
      </div>
    `;
  }).join("") : '<div class="empty-state"><b>样本还不够稳定</b><span>继续回传数据后自动更新。</span></div>';

  const result = rolling;
  const percent = (value) => value === null ? "样本不足" : `${Math.round(value * 100)}%`;
  document.querySelector("#viralBacktestSamples").textContent = formatMetric(result.samples);
  document.querySelector("#viralBacktestPrecision").textContent = percent(result.precision);
  document.querySelector("#viralBacktestBaseline").textContent = percent(result.baseline);
  document.querySelector("#viralBacktestRecall").textContent = percent(result.recall);
  const delta = result.precision === null || result.baseline === null ? null : result.precision - result.baseline;
  document.querySelector("#viralBacktestVerdict").textContent = delta === null
    ? "验证样本不足，暂不报告命中率。"
    : `命中率只比基准高 ${Math.round(delta * 100)} 个百分点，不能作为发布门槛；当前只做结构提醒。`;
  document.querySelector("#viralBacktestFolds").innerHTML = result.folds.map((fold) => `
    <div>
      <small>第 ${fold.fold} 段</small>
      <b>${percent(fold.precision)}</b>
      <span>基准 ${percent(fold.baseline)}</span>
    </div>
  `).join("");
}

function switchMediaTab(tab) {
  if (!["brain", "decision", "viral"].includes(tab)) return;
  state.mediaTab = tab;
  document.querySelectorAll("[data-media-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.mediaTab === tab);
  });
  document.querySelectorAll("[data-media-tab-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.mediaTabPanel !== tab;
  });
}

function workPatternSummary(work) {
  const labels = matchedMediaPatterns(work).map((pattern) => pattern.label);
  return labels.slice(0, 2).join(" · ") || "主题明确";
}

function safeWorkUrl(work) {
  return typeof work?.url === "string" && /^https?:\/\//.test(work.url) ? work.url : "";
}

function safeCoverUrl(work) {
  return typeof work?.cover === "string" && /^\.\/covers\/[a-z0-9._-]+$/i.test(work.cover)
    ? work.cover
    : "";
}

function contentTypeLabel(work) {
  const labels = {
    video: "视频",
    article: "文章",
    imageText: "图文",
    dynamic: "动态",
  };
  return labels[work?.contentType] || "内容";
}

function featuredMediaRows(rows, limit = 5) {
  const selected = [];
  const selectedKeys = new Set();
  const seenPlatforms = new Set();
  for (const work of rows) {
    if (seenPlatforms.has(work.platform)) continue;
    selected.push(work);
    selectedKeys.add(mediaWorkKey(work));
    seenPlatforms.add(work.platform);
    if (selected.length === limit) return selected;
  }
  for (const work of rows) {
    if (selectedKeys.has(mediaWorkKey(work))) continue;
    selected.push(work);
    if (selected.length === limit) break;
  }
  return selected;
}

function renderMediaDecisionList(target, rows, kind) {
  const evaluation = state.mediaEvaluation;
  const container = document.querySelector(target);
  container.innerHTML = rows.length ? rows.map((work, index) => {
    const benchmark = evaluation.benchmarks[work.platform];
    const ratio = metricValue(work, "views") / benchmark.median;
    const comparison = kind === "good"
      ? `${ratio.toFixed(ratio >= 10 ? 0 : 1)}× 平台中位`
      : `仅为平台中位 ${Math.round(ratio * 100)}%`;
    const cover = safeCoverUrl(work);
    const content = `
        <span class="media-signal-rank">${String(index + 1).padStart(2, "0")}</span>
        <span class="media-signal-cover">${cover
          ? `<img src="${escapeHtml(cover)}" alt="${escapeHtml(`${work.title || "作品"}封面`)}" loading="lazy" />`
          : `<small>${escapeHtml(work.platform?.slice(0, 1) || "封")}</small>`}</span>
        <span class="media-signal-copy"><b>${escapeHtml(work.title || "未命名作品")}</b><small>${escapeHtml(work.platform)} · ${escapeHtml(contentTypeLabel(work))} · ${escapeHtml(workPatternSummary(work))}</small></span>
        <span class="media-signal-score"><b>${formatMetric(work.views)}</b><small>播放/阅读 · ${formatMetric(work.interactions)} 互动</small></span>
        <span class="media-signal-compare">${escapeHtml(comparison)}</span>
      `;
    const url = safeWorkUrl(work);
    return url
      ? `<a class="media-decision-row ${kind}" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${content}</a>`
      : `<div class="media-decision-row ${kind} no-link">${content}</div>`;
  }).join("") : '<div class="empty-state"><b>还没有足够证据</b><span>继续回传同平台作品，达到可比较样本后再判断。</span></div>';
}

function renderMediaDecisionBoard() {
  const evaluation = state.mediaEvaluation;
  if (!evaluation) return;
  renderMediaDecisionList("#mediaGoodList", featuredMediaRows(evaluation.good), "good");
  renderMediaDecisionList("#mediaBadList", featuredMediaRows(evaluation.stop), "bad");
}

function hasBrainNumber(value) {
  return value !== null && value !== "" && Number.isFinite(Number(value));
}

function dashboardValue(value) {
  return hasBrainNumber(value) ? formatMetric(Number(value)) : "—";
}

function renderDataDashboard() {
  const media = state.media;
  const summary = media?.summary || {};
  const coverage = media?.coverage || {};
  const mediaReady = Boolean(media?.generatedAt);
  const evaluation = state.mediaEvaluation;
  const connected = coverage.connectedPlatforms;
  const total = coverage.totalPlatforms;

  const systemState = document.querySelector("#brainSystemState");
  systemState.className = `data-sync-state ${mediaReady ? "online" : "offline"}`;
  systemState.innerHTML = `<i></i>${mediaReady ? "数据已更新" : "正在更新"}`;
  document.querySelector("#brainStatusDetail").textContent = mediaReady
    ? `共 ${dashboardValue(summary.works)} 条作品，${dashboardValue(summary.withMetrics)} 条已有真实播放或阅读数据。`
    : "正在读取真实平台数据。";

  document.querySelector("#brainPerceptionValue").textContent = hasBrainNumber(connected) && hasBrainNumber(total)
    ? `${connected}/${total}`
    : "—";
  document.querySelector("#brainPerceptionDetail").textContent = Array.isArray(coverage.missingPlatforms) && coverage.missingPlatforms.length
    ? `待接：${coverage.missingPlatforms.join("、")}`
    : mediaReady ? "平台数据已接通" : "正在读取";
  document.querySelector("#brainJudgementValue").textContent = mediaReady ? dashboardValue(summary.withMetrics) : "—";
  document.querySelector("#brainJudgementDetail").textContent = "有播放或阅读数据";
  document.querySelector("#brainGenerationValue").textContent = evaluation ? dashboardValue(evaluation.eligible.length) : "—";
  document.querySelector("#brainGenerationDetail").textContent = "发布满 48 小时，可同平台比较";
  document.querySelector("#brainDistributionValue").textContent = evaluation ? dashboardValue(evaluation.good.length) : "—";
  document.querySelector("#brainDistributionDetail").textContent = "值得继续做";
  document.querySelector("#brainLearningValue").textContent = evaluation ? dashboardValue(evaluation.stop.length) : "—";
  document.querySelector("#brainLearningDetail").textContent = "建议停掉或重做";
  document.querySelector("#brainTotalViews").textContent = mediaReady ? dashboardValue(summary.views) : "—";
  document.querySelector("#brainTotalInteractions").textContent = mediaReady
    ? `${dashboardValue(summary.interactions)} 次互动`
    : "正在汇总互动";

  document.querySelector("#brainActionTitle").textContent = evaluation
    ? `${dashboardValue(evaluation.good.length)} 条值得继续做，${dashboardValue(evaluation.stop.length)} 条需要停掉或重做。`
    : "正在判断哪些内容值得继续做";
  document.querySelector("#brainActionProof").textContent = evaluation
    ? `判断基于 ${dashboardValue(evaluation.eligible.length)} 条发布满 48 小时的作品，只在同一平台内比较。`
    : "只比较同平台、发布满 48 小时的作品。";
  document.querySelector("#brainActionSource").textContent = "空数据不算 0，不跨平台硬比";

  const updatedAt = mediaReady
    ? new Date(media.generatedAt).toLocaleString("zh-CN", { hour12: false })
    : "—";
  document.querySelector("#brainEvidenceTime").textContent = mediaReady ? `更新于 ${updatedAt}` : "—";
  const platforms = [...(media?.platforms || [])]
    .sort((a, b) => Number(b.metrics || 0) - Number(a.metrics || 0) || Number(b.works || 0) - Number(a.works || 0))
    .filter((platform) => Number(platform.metrics || 0) > 0)
    .slice(0, 5);
  document.querySelector("#brainEvidenceList").innerHTML = platforms.length
    ? platforms.map((platform) => `
      <div class="data-platform-row">
        <span>${escapeHtml(String(platform.platform || "平台").slice(0, 1))}</span>
        <div><b>${escapeHtml(platform.platform || "未知平台")}</b><small>${dashboardValue(platform.metrics)} 条有数据 · ${dashboardValue(platform.views)} 播放/阅读</small></div>
        <strong>中位 ${dashboardValue(platform.medianViews)}</strong>
      </div>
    `).join("")
    : '<div class="empty-state"><b>还没有平台数据</b><span>数据到达后按平台显示。</span></div>';
}

function mediaStatus(work) {
  if (work.publishStatus === "失败") return "失败";
  return work.metricStatus || "等待回传";
}

function renderMediaTable() {
  const keyword = document.querySelector("#mediaSearch").value.trim().toLowerCase();
  const platform = document.querySelector("#mediaPlatformFilter").value;
  const status = document.querySelector("#mediaStatusFilter").value;
  const rows = mediaSourceRows().filter((work) => {
    const haystack = `${work.title || ""} ${work.topic || ""} ${work.account || ""}`.toLowerCase();
    return (!keyword || haystack.includes(keyword))
      && (platform === "all" || work.platform === platform)
      && (status === "all" || mediaStatus(work) === status);
  });
  state.visibleMediaWorks = rows;
  document.querySelector("#mediaResultSummary").textContent = `${rows.length} 条记录 · 点击标题直接打开平台作品`;
  const body = document.querySelector("#mediaTableBody");
  body.innerHTML = rows.length ? rows.map((work) => {
    const statusName = mediaStatus(work);
    const analysis = work.analysis || {};
    return `
      <tr>
        <td>${safeWorkUrl(work)
          ? `<a class="media-work-button" href="${escapeHtml(safeWorkUrl(work))}"><b>${escapeHtml(work.title || "未命名作品")}</b><small>${escapeHtml(work.publishedAt || "时间未知")} · ${escapeHtml(work.topic || "待归类")}</small></a>`
          : `<span class="media-work-button"><b>${escapeHtml(work.title || "未命名作品")}</b><small>${escapeHtml(work.publishedAt || "时间未知")} · ${escapeHtml(work.topic || "待归类")}</small></span>`}</td>
        <td><span class="media-platform-tag">${escapeHtml(work.platform || "未知")}</span></td>
        <td><strong>${formatMetric(work.views)}</strong></td>
        <td><strong>${formatMetric(work.interactions)}</strong></td>
        <td><span class="media-data-status ${statusName === "已回传" ? "live" : statusName === "失败" ? "risk" : ""}">${escapeHtml(statusName)}</span></td>
        <td><span class="media-stage">${escapeHtml(analysis.stage || "待拆解")}</span></td>
      </tr>
    `;
  }).join("") : '<tr><td colspan="6"><div class="empty-state"><b>没有匹配作品</b><span>调整搜索词、平台或数据状态。</span></div></td></tr>';
}

function renderMedia() {
  const data = state.media;
  if (!data) return;
  document.querySelector("#mediaSyncState").textContent = "真实数据已接通";
  document.querySelector("#mediaSyncTime").textContent = `更新于 ${new Date(data.generatedAt).toLocaleString("zh-CN", { hour12: false })}`;
  state.mediaEvaluation = evaluateMediaWorks();
  state.viralModel = trainViralModel(state.mediaEvaluation.eligible);
  const rolling = state.viralModel.rolling;
  const strongest = rolling.factorStability
    .find((factor) => factor.positiveFolds === rolling.folds.length && factor.averageLift > 0);
  document.querySelector("#mediaGoodCount").textContent = formatMetric(state.mediaEvaluation.good.length);
  document.querySelector("#mediaStopCount").textContent = formatMetric(state.mediaEvaluation.stop.length);
  document.querySelector("#mediaCoreInsight").textContent = strongest
    ? `先复制「${strongest.label}」，它通过了四段时间回测。`
    : "先继续积累同平台数据，现在不急着下结论。";
  document.querySelector("#mediaInsightProof").textContent = strongest
    ? `四段都为正，平均比基准高 ${Math.round(strongest.averageLift * 100)} 个百分点；结论来自 ${state.viralModel.matureSamples} 条成熟作品。`
    : "只有同平台样本足够，才会进入“值得复制”或“应该停止”。";

  const platformSelect = document.querySelector("#mediaPlatformFilter");
  const current = platformSelect.value;
  platformSelect.innerHTML = '<option value="all">全部平台</option>'
    + (data.platforms || []).map((item) => `<option value="${escapeHtml(item.platform)}">${escapeHtml(item.platform)}</option>`).join("");
  platformSelect.value = [...platformSelect.options].some((option) => option.value === current) ? current : "all";
  renderMediaDecisionBoard();
  renderMediaTable();
  renderViralAnalysis();
  renderDataDashboard();
}

async function loadMedia({ notify = false } = {}) {
  document.querySelector("#mediaSyncState").textContent = "正在读取真实数据";
  try {
    const response = await fetch("./media-data.json", { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) throw new Error(payload.error || `HTTP ${response.status}`);
    state.media = payload;
    renderMedia();
    document.querySelector(".system-status").classList.remove("offline");
    document.querySelector("#systemStatusTitle").textContent = "媒体数据已接通";
    document.querySelector("#systemStatusDetail").textContent = `${payload.coverage?.connectedPlatforms || 0} 个平台正在回传`;
    if (notify) showToast(`已读取 ${payload.summary?.works || 0} 条发布记录并完成拆解`);
  } catch (error) {
    document.querySelector("#mediaSyncState").textContent = "数据暂不可用";
    document.querySelector("#mediaSyncTime").textContent = error instanceof Error ? error.message : "读取失败";
    if (notify) showToast("数据读取失败，已保留当前筛选条件");
  }
}

function exportMediaRows() {
  const rows = state.visibleMediaWorks;
  if (!rows.length) return showToast("当前没有可导出的记录");
  const columns = [
    ["平台", "platform"], ["发布时间", "publishedAt"], ["作品", "title"], ["主题", "topic"],
    ["阅读或播放", "views"], ["互动", "interactions"], ["数据状态", "metricStatus"],
    ["诊断环节", "analysis.stage"], ["下一步动作", "analysis.action"],
  ];
  const read = (row, key) => key.split(".").reduce((value, part) => value?.[part], row);
  const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [
    columns.map(([label]) => quote(label)).join(","),
    ...rows.map((row) => columns.map(([, key]) => quote(read(row, key))).join(",")),
  ].join("\n");
  const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `颜汝新媒体作品复盘_${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
  showToast(`已导出 ${rows.length} 条记录`);
}

function renderEndpointRows(targetId) {
  const target = document.querySelector(`#${targetId}`);
  const endpoints = state.overview?.endpoints || {};
  target.innerHTML = Object.entries(endpointNames).map(([key, [name, path]]) => {
    const status = endpoints[key] || "error";
    const statusName = status === "online" ? "已连接" : status === "offline" ? "服务离线" : "未检测";
    return `<div class="endpoint-row ${escapeHtml(status)}"><i></i><div><b>${escapeHtml(name)}</b><small>${escapeHtml(path)}</small></div><span>${statusName}</span></div>`;
  }).join("");
}

function renderOverview() {
  const data = state.overview;
  const counts = data?.counts || {};
  document.querySelector("#metricTopics").textContent = counts.topics ?? "—";
  document.querySelector("#metricDrafts").textContent = counts.drafts ?? "—";
  document.querySelector("#metricWeeklyDrafts").textContent = `本周 ${counts.weeklyDrafts ?? "—"} 条`;
  document.querySelector("#metricJobs").textContent = counts.activeJobs ?? "—";
  document.querySelector("#metricLeads").textContent = counts.leads ?? "—";
  document.querySelector("#metricWeeklyLeads").textContent = `本周 ${counts.weeklyLeads ?? "—"} 条`;
  document.querySelector("#leadTotal").textContent = counts.leads ?? "—";
  document.querySelector("#leadWeekly").textContent = counts.weeklyLeads ?? "—";
  const topicBadge = document.querySelector("#topicBadge");
  const publishBadge = document.querySelector("#publishBadge");
  const leadBadge = document.querySelector("#leadBadge");
  if (topicBadge) topicBadge.textContent = counts.topics ?? "—";
  if (publishBadge) publishBadge.textContent = counts.activeJobs ?? "—";
  if (leadBadge) leadBadge.textContent = counts.leads ?? "—";

  const topics = data?.topics || [];
  document.querySelector("#overviewTopics").innerHTML = topics.length
    ? topics.map((topic) => `<div class="record-row"><div><b>${escapeHtml(topic.title)}</b><small>${escapeHtml(topic.angle || topic.summary)}</small></div><span>${Number(topic.inquiryCount || 0)} 条询单</span></div>`).join("")
    : '<div class="empty-state"><b>暂无已核验选题</b><span>选题接口正常，当前数据库没有满足门槛的记录。</span></div>';
  renderEndpointRows("overviewEndpoints");
  renderDataDashboard();
}

function renderTopics() {
  const keyword = document.querySelector("#topicSearch").value.trim().toLowerCase();
  const filter = document.querySelector("#topicFilter").value;
  const topics = state.topics.filter((topic) => {
    const matches = `${topic.title} ${topic.angle} ${topic.summary}`.toLowerCase().includes(keyword);
    return matches && (filter !== "high" || Number(topic.inquiryCount || 0) >= 10);
  });
  document.querySelector("#topicResultCount").textContent = `${topics.length} 个结果`;
  document.querySelector("#topicBoard").innerHTML = topics.length
    ? topics.map((topic) => `
      <article class="topic-card">
        <span>${escapeHtml(topic.platform || "已核验选题")}</span>
        <h3>${escapeHtml(topic.title)}</h3>
        <p>${escapeHtml(topic.angle || topic.summary || "暂无摘要")}</p>
        <div class="topic-meta"><span>${Number(topic.followerCount || 0)} 粉 · ${Number(topic.inquiryCount || 0)} 条询单</span><button data-use-topic="${escapeHtml(topic.id)}">生成内容</button></div>
      </article>
    `).join("")
    : '<div class="module-card empty-state"><b>没有匹配结果</b><span>清空搜索词或等待选题采集接口写入新数据。</span></div>';
  document.querySelectorAll("[data-use-topic]").forEach((button) => {
    button.addEventListener("click", () => {
      const topic = state.topics.find((item) => item.id === button.dataset.useTopic);
      document.querySelector("#generationTopic").value = topic?.title || "";
      syncIndustryControls();
      switchView("content");
      showToast("选题已带入内容生产");
    });
  });
}

function renderPublish() {
  const accounts = state.overview?.accounts || [];
  const jobs = state.overview?.jobs || [];
  document.querySelector("#accountGrid").innerHTML = accounts.length
    ? accounts.map((account) => {
      const name = account.accountName || account.name || account.platform || "已连接账号";
      const platform = account.platform || account.type || "内容平台";
      return `<div class="account-card"><span>${escapeHtml(String(platform).slice(0, 1))}</span><div><b>${escapeHtml(name)}</b><small>${escapeHtml(platform)}</small></div><i>已连接</i></div>`;
    }).join("")
    : '<div class="empty-state"><b>暂未读取到平台账号</b><span>发布桥离线或尚未上报账号心跳。</span></div>';
  document.querySelector("#publishJobs").innerHTML = jobs.length
    ? jobs.map((job) => `<div class="record-row"><div><b>${escapeHtml(job.account_name || job.platform || "发布任务")}</b><small>${escapeHtml(job.error || job.draft_id || job.id)}</small></div><span>${escapeHtml(job.status)}</span></div>`).join("")
    : '<div class="empty-state"><b>暂无发布任务</b><span>这里只读取队列，不会自动提交正式发布。</span></div>';
}

function setApiUnavailable(message) {
  const statusBox = document.querySelector(".system-status");
  if (state.activeView === "media" && state.media) {
    statusBox.classList.remove("offline");
    document.querySelector("#systemStatusTitle").textContent = "媒体数据已接通";
    document.querySelector("#systemStatusDetail").textContent = `${state.media.coverage?.connectedPlatforms || 0} 个平台正在回传`;
  } else {
    statusBox.classList.add("offline");
    document.querySelector("#systemStatusTitle").textContent = "API 暂未连接";
    document.querySelector("#systemStatusDetail").textContent = message;
  }
  document.querySelector("#drawerHealthTitle").textContent = "服务不可用";
  document.querySelector("#drawerHealthDetail").textContent = message;
  document.querySelector(".drawer-summary").classList.add("offline");
  state.overview = { endpoints: {} };
  renderEndpointRows("endpointList");
  renderOverview();
}

async function loadOverview({ notify = false } = {}) {
  document.querySelector("#overviewUpdated").textContent = "正在同步";
  try {
    const response = await fetch("/api/operation/overview", { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
    state.overview = payload;
    const bridgeOnline = Boolean(payload.bridgeOnline);
    document.querySelector(".system-status").classList.toggle("offline", !bridgeOnline);
    document.querySelector("#systemStatusTitle").textContent = bridgeOnline ? "自动化运行中" : "数据 API 已连接";
    document.querySelector("#systemStatusDetail").textContent = bridgeOnline
      ? `${payload.counts?.activeJobs || 0} 个发布任务运行中`
      : "本机生成/发布桥当前离线";
    document.querySelector(".drawer-summary").classList.toggle("offline", !bridgeOnline);
    document.querySelector("#drawerHealthTitle").textContent = bridgeOnline ? "全部核心服务在线" : "数据在线，自动化桥离线";
    document.querySelector("#drawerHealthDetail").textContent = `更新于 ${new Date(payload.generatedAt).toLocaleTimeString("zh-CN", { hour12: false })}`;
    document.querySelector("#overviewUpdated").textContent = "刚刚更新";
    renderEndpointRows("endpointList");
    renderOverview();
    renderPublish();
    if (notify) showToast("API 状态已刷新");
  } catch (error) {
    setApiUnavailable(error instanceof Error ? error.message : "无法读取接口");
    if (notify) showToast("API 暂不可用，页面功能仍可浏览");
  }
}

async function loadTopics({ notify = false } = {}) {
  const board = document.querySelector("#topicBoard");
  board.innerHTML = '<div class="module-card empty-state"><b>正在读取真实选题</b><span>连接 /api/topics</span></div>';
  try {
    const query = new URLSearchParams({ industryId: selectedIndustryId() });
    const response = await fetch(`/api/topics?${query}`, { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
    state.topics = Array.isArray(payload.topics) ? payload.topics : [];
    renderTopics();
    if (notify) showToast(`已读取 ${state.topics.length} 个核验选题`);
  } catch (error) {
    board.innerHTML = `<div class="module-card empty-state"><b>选题接口暂不可用</b><span>${escapeHtml(error instanceof Error ? error.message : "请求失败")}</span></div>`;
  }
}

async function submitGeneration(event) {
  event.preventDefault();
  const button = document.querySelector("#generateButton");
  const result = document.querySelector("#generationResult");
  const platformMap = {
    xiaohongshu: "小红书图文",
    wechat: "公众号文章",
    douyin: "抖音视频",
  };
  button.disabled = true;
  button.textContent = "正在提交…";
  result.className = "job-result";
  result.textContent = "正在连接内容生成 API…";
  try {
    const response = await fetch("/api/content/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phase: "copy",
        industryId: selectedIndustryId(),
        topic: document.querySelector("#generationTopic").value.trim(),
        platform: platformMap[document.querySelector("#generationPlatform").value],
        tone: "yanru",
        aspectRatio: "3:4",
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
    result.className = "job-result success";
    result.textContent = `任务已进入真实队列\n\n任务编号：${payload.draft?.id || "已创建"}\n状态：${payload.draft?.status || "copy_queued"}\n服务：${payload.provider || "codex-local"}`;
    showToast("内容任务已创建");
    await loadOverview();
  } catch (error) {
    result.className = "job-result error";
    result.textContent = `未创建任务\n\n${error instanceof Error ? error.message : "生成接口请求失败"}\n\n系统没有伪造成功，也没有重复提交。`;
  } finally {
    button.disabled = false;
    button.textContent = "创建生成任务";
  }
}

document.querySelector("#projectSwitcher").addEventListener("click", (event) => {
  event.stopPropagation();
  projectMenu.classList.toggle("open");
});
document.querySelectorAll(".project-menu button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".project-menu button").forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
    document.querySelector("#projectSwitcher span").textContent = button.querySelector("span").textContent;
    projectMenu.classList.remove("open");
    showToast(`已切换到「${button.querySelector("span").textContent}」`);
  });
});
document.addEventListener("click", () => projectMenu.classList.remove("open"));

document.querySelectorAll("[data-modal]").forEach((button) => {
  const titles = { new: "新建获客项目", edit: "编辑获客项目", assets: "管理获客资料", task: "添加获客动作" };
  button.addEventListener("click", () => openModal(titles[button.dataset.modal]));
});
document.querySelectorAll("[data-edit]").forEach((button) => {
  const titles = { strategy: "编辑获客增长主线", quarter: "编辑季度流量重点", month: "编辑本月执行清单", calendar: "编辑获客日历" };
  button.addEventListener("click", () => openModal(titles[button.dataset.edit]));
});
document.querySelectorAll(".objective").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".objective").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    showToast(`已聚焦目标：${button.querySelector("b").textContent}`);
  });
});
document.querySelectorAll(".side-nav button").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
document.querySelectorAll("[data-open-view]").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.openView)));

document.querySelector("#prevMonth").addEventListener("click", () => {
  state.month -= 1;
  if (state.month < 0) { state.month = 11; state.year -= 1; }
  state.selectedDay = 1;
  renderCalendar();
  renderEvents(1);
});
document.querySelector("#nextMonth").addEventListener("click", () => {
  state.month += 1;
  if (state.month > 11) { state.month = 0; state.year += 1; }
  state.selectedDay = 1;
  renderCalendar();
  renderEvents(1);
});
document.querySelector("#todayButton").addEventListener("click", () => {
  state.year = 2026;
  state.month = 6;
  state.selectedDay = 27;
  renderCalendar();
  renderEvents(27);
});

document.querySelector("#menuButton").addEventListener("click", () => document.querySelector("#sidebar").classList.toggle("open"));
document.addEventListener("click", (event) => {
  const sidebar = document.querySelector("#sidebar");
  const menuButton = document.querySelector("#menuButton");
  if (window.innerWidth <= 860 && sidebar.classList.contains("open") && !sidebar.contains(event.target) && !menuButton.contains(event.target)) {
    sidebar.classList.remove("open");
  }
});
document.querySelector("#closeModal").addEventListener("click", closeModal);
document.querySelector("#cancelModal").addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (event) => { if (event.target === modalBackdrop) closeModal(); });
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
    closeApiDrawer();
  }
});
document.querySelector("#modalForm").addEventListener("submit", (event) => {
  event.preventDefault();
  closeModal();
  showToast("获客规划已保存，执行清单已同步更新");
});
document.querySelector("#apiConsoleButton").addEventListener("click", openApiDrawer);
document.querySelector("#apiStatusButton").addEventListener("click", openApiDrawer);
document.querySelector("#closeApiDrawer").addEventListener("click", closeApiDrawer);
drawerBackdrop.addEventListener("click", closeApiDrawer);
document.querySelector("#drawerRefresh").addEventListener("click", () => loadOverview({ notify: true }));
document.querySelector("#refreshOverview").addEventListener("click", () => loadOverview({ notify: true }));
document.querySelector("#refreshTopics").addEventListener("click", () => loadTopics({ notify: true }));
document.querySelector("#refreshPublish").addEventListener("click", () => loadOverview({ notify: true }));
document.querySelector("#topicSearch").addEventListener("input", renderTopics);
document.querySelector("#topicFilter").addEventListener("change", renderTopics);
for (const id of ["topicIndustryGroup", "generationIndustryGroup"]) {
  document.querySelector(`#${id}`).addEventListener("change", (event) => {
    state.industryGroup = event.target.value;
    state.topics = [];
    syncIndustryControls();
    if (id === "topicIndustryGroup") loadTopics();
  });
}
for (const id of ["topicMarketMode", "generationMarketMode"]) {
  document.querySelector(`#${id}`).addEventListener("change", (event) => {
    state.marketMode = event.target.value;
    state.topics = [];
    syncIndustryControls();
    if (id === "topicMarketMode") loadTopics();
  });
}
document.querySelector("#generationForm").addEventListener("submit", submitGeneration);
document.querySelector("#mediaSearch").addEventListener("input", renderMediaTable);
document.querySelector("#mediaPlatformFilter").addEventListener("change", renderMediaTable);
document.querySelector("#mediaStatusFilter").addEventListener("change", renderMediaTable);
document.querySelector("#refreshMediaButton").addEventListener("click", () => loadMedia({ notify: true }));
document.querySelector("#exportMediaButton").addEventListener("click", exportMediaRows);
document.querySelectorAll("[data-media-tab]").forEach((button) => {
  button.addEventListener("click", () => switchMediaTab(button.dataset.mediaTab));
});
document.querySelectorAll("[data-brain-action-tab]").forEach((button) => {
  button.addEventListener("click", () => switchMediaTab(button.dataset.brainActionTab));
});
switchMediaTab(state.mediaTab);
document.querySelector("#viralPredictForm").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!state.viralModel) return showToast("历史模型还在加载");
  const title = document.querySelector("#viralTitle").value.trim();
  if (!title) return;
  renderViralPrediction(predictViralPotential(
    title,
    document.querySelector("#viralPlatform").value,
    document.querySelector("#viralContentType").value,
    state.viralModel,
  ));
});
document.querySelectorAll("[data-media-source]").forEach((button) => {
  button.addEventListener("click", () => {
    state.mediaSource = button.dataset.mediaSource;
    document.querySelectorAll("[data-media-source]").forEach((item) => item.classList.toggle("active", item === button));
    document.querySelector("#mediaStatusFilter").value = "all";
    renderMediaTable();
  });
});

renderCalendar();
renderEvents(27);
syncIndustryControls();
loadMedia();
loadOverview();
