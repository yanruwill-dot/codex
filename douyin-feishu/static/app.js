const els = {
  works: document.querySelector("#works"),
  stars: document.querySelector("#stars"),
  quickstarts: document.querySelector("#quickstarts"),
  methodCount: document.querySelector("#methodCount"),
  sourceStatus: document.querySelector("#sourceStatus"),
  rowCount: document.querySelector("#rowCount"),
  rows: document.querySelector("#videoRows"),
  creatorRows: document.querySelector("#creatorRows"),
  creatorCount: document.querySelector("#creatorCount"),
  skillTabs: document.querySelector("#skillTabs"),
  skillSearch: document.querySelector("#skillSearch"),
  skillSummary: document.querySelector("#skillSummary"),
  skillBars: document.querySelector("#skillBars"),
  exportSkill: document.querySelector("#exportSkill"),
  copySkillPrompt: document.querySelector("#copySkillPrompt"),
  skillActionStatus: document.querySelector("#skillActionStatus"),
  lawSearch: document.querySelector("#lawSearch"),
  lawRows: document.querySelector("#lawRows"),
  lawCount: document.querySelector("#lawCount"),
  search: document.querySelector("#searchInput"),
  filter: document.querySelector("#nicheFilter"),
};

let videos = [];
let legalLibrary = [];
let legalStatus = [];
let legalCorpus = [];
let selectedCreator = "all";

const skillLabels = {
  opening: "开头钩子",
  copy: "文案结构",
  suspense: "悬念机制",
  narration: "讲述方式",
  camera: "画面镜头",
  interaction: "互动动作",
  compliance: "合规边界",
};

const barDimensions = ["opening", "suspense", "narration", "camera"];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

function formatCount(value) {
  const count = Number(value || 0);
  if (count >= 10000) return `${(count / 10000).toFixed(count >= 100000 ? 1 : 2)}万`;
  return count.toLocaleString("zh-CN");
}

function renderMetrics(payload) {
  const totalStars = videos.reduce((sum, video) => sum + Number(video.stars || 0), 0);
  els.works.textContent = videos.length;
  els.stars.textContent = formatCount(totalStars);
  els.quickstarts.textContent = videos.filter(video => video.has_quick_start).length;
  els.methodCount.textContent = videos.filter(video => video.specific_method).length;
  els.sourceStatus.textContent = payload.source_message || "公开仓库数据已加载";
}

function renderFilters() {
  const current = els.filter.value || "all";
  const niches = [...new Set(videos.map(video => video.niche).filter(Boolean))];
  els.filter.innerHTML = '<option value="all">全部分类</option>' + niches.map(niche => `<option value="${escapeHtml(niche)}">${escapeHtml(niche)}</option>`).join("");
  els.filter.value = niches.includes(current) ? current : "all";
}

function renderRows() {
  const query = els.search.value.trim().toLowerCase();
  const niche = els.filter.value;
  const filtered = videos.filter(video => {
    const haystack = [video.title, video.source_account, video.niche, video.hook, video.specific_method, video.copy_structure, video.has_quick_start ? "Quick Start 安装" : ""].join(" ").toLowerCase();
    return (niche === "all" || video.niche === niche) && (!query || haystack.includes(query));
  });

  els.rowCount.textContent = `${filtered.length} 条`;
  els.rows.innerHTML = filtered.map((video, index) => `
    <tr>
      <td class="work-cell" data-label="项目 / 定位">
        <span class="rank">${String(index + 1).padStart(2, "0")}</span>
        <div><a class="work-title" href="${escapeHtml(video.source_url)}" target="_blank" rel="noreferrer">${escapeHtml(video.title)}</a><span class="work-account">${escapeHtml(video.source_account)} · ${escapeHtml(video.updated_at)} · ${escapeHtml(video.niche)}</span></div>
      </td>
      <td data-label="仓库信号"><span class="signal-pill ${video.stars >= 100000 ? "strong" : ""}">${escapeHtml(video.signal)}</span><span class="sub-value">${formatCount(video.forks)} forks · ${escapeHtml(video.license)}</span></td>
      <td data-label="内容入口"><strong class="hook">${escapeHtml(video.hook)}</strong><span class="sub-value">${escapeHtml(video.title_method)}</span></td>
      <td data-label="为什么容易被试用"><span class="structure">${escapeHtml(video.copy_structure)}</span><span class="sub-value">${escapeHtml(video.structure_breakdown)}</span></td>
      <td data-label="具体方法"><strong class="angle">${escapeHtml(video.specific_method)}</strong><span class="sub-value risk">${escapeHtml(video.boundary_note)}</span></td>
      <td data-label="来源"><a class="source-link" href="${escapeHtml(video.source_url)}" target="_blank" rel="noreferrer">GitHub 仓库 ↗</a></td>
    </tr>
  `).join("") || '<tr><td class="empty" colspan="6">没有匹配的项目，换个关键词或分类。</td></tr>';
}

function skillValue(item, key) {
  const value = item.skills?.[key];
  return typeof value === "string" ? { label: value, score: 3 } : (value || { label: "待拆解", score: 0 });
}

function skillItems() {
  const query = (els.skillSearch.value || "").trim().toLowerCase();
  return legalLibrary.filter(item => {
    const creatorMatch = selectedCreator === "all" || item.creator === selectedCreator;
    const haystack = [item.creator, item.title, item.copy_summary, item.source_status, ...Object.entries(skillLabels).flatMap(([key, label]) => [label, skillValue(item, key).label])].join(" ").toLowerCase();
    return creatorMatch && (!query || haystack.includes(query));
  });
}

function renderSkillTabs() {
  const creators = legalStatus.length ? legalStatus : [...new Set(legalLibrary.map(item => item.creator))].map(name => ({ name, target_count: 30 }));
  const allLabel = `全部样本 <small>${legalLibrary.length}</small>`;
  els.skillTabs.innerHTML = `<button class="skill-tab ${selectedCreator === "all" ? "active" : ""}" data-creator="all" role="tab" aria-selected="${selectedCreator === "all"}">${allLabel}</button>` + creators.map(item => {
    const count = legalLibrary.filter(record => record.creator === item.name).length;
    const verified = item.verified_count ?? count;
    const state = count ? `${verified}直链/${item.target_count || 30}` : "待核验";
    return `<button class="skill-tab ${selectedCreator === item.name ? "active" : ""} ${count ? "" : "muted"}" data-creator="${escapeHtml(item.name)}" role="tab" aria-selected="${selectedCreator === item.name}">${escapeHtml(item.name)} <small>${state}</small></button>`;
  }).join("");
  els.skillTabs.querySelectorAll(".skill-tab").forEach(button => button.addEventListener("click", () => {
    selectedCreator = button.dataset.creator;
    renderSkillDashboard();
  }));
}

function renderSkillSummary(items) {
  const creators = new Set(items.map(item => item.creator));
  const highHook = items.filter(item => skillValue(item, "opening").score >= 4).length;
  const highSuspense = items.filter(item => skillValue(item, "suspense").score >= 4).length;
  const direct = items.filter(item => item.source_status === "direct").length;
  const cards = [
    ["当前样本", items.length, "公开作品结构化记录"],
    ["账号数量", creators.size, selectedCreator === "all" ? "已进入技能库" : "当前筛选账号"],
    ["强开头", highHook, "开头评分 4 分及以上"],
    ["强悬念", highSuspense, "悬念评分 4 分及以上"],
    ["独立链接", direct, "可直接回到公开作品页"],
  ];
  els.skillSummary.innerHTML = cards.map(([label, value, note]) => `<article><span>${escapeHtml(label)}</span><strong>${formatCount(value)}</strong><small>${escapeHtml(note)}</small></article>`).join("");
}

function renderSkillBars(items) {
  els.skillBars.innerHTML = barDimensions.map(key => {
    const counts = {};
    items.forEach(item => {
      const label = skillValue(item, key).label;
      counts[label] = (counts[label] || 0) + 1;
    });
    const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const max = ranked[0]?.[1] || 1;
    return `<article class="skill-bar-card"><div class="skill-bar-head"><span>${escapeHtml(skillLabels[key])}</span><small>TOP PATTERNS</small></div>${ranked.map(([label, count]) => `<div class="skill-bar-row"><div><span>${escapeHtml(label)}</span><b>${count}</b></div><i><em style="width:${Math.round(count / max * 100)}%"></em></i></div>`).join("") || '<p class="skill-empty">暂无匹配样本</p>'}</article>`;
  }).join("");
}

function renderSkillSamples(items) {
  els.creatorCount.textContent = `${items.length} 条样本 · ${new Set(items.map(item => item.creator)).size} 个账号`;
  els.creatorRows.innerHTML = items.map((item, index) => {
    const sourceNote = item.source_status === "direct" ? "独立公开作品页" : "账号公开列表标题";
    return `<article class="copy-card skill-card">
      <div class="copy-card-top"><span class="copy-rank">${String(index + 1).padStart(2, "0")}</span><span class="copy-tag">${escapeHtml(item.creator)}</span><span class="copy-date">${escapeHtml(item.published_at || "日期未返回")}</span></div>
      <h3><a href="${escapeHtml(item.source_url)}" target="_blank" rel="noreferrer">${escapeHtml(item.title)}</a></h3>
      <div class="copy-block"><span>文案拆解</span><p>${escapeHtml(item.copy_summary || item.title)}</p></div>
      <div class="skill-chip-grid">${Object.entries(skillLabels).map(([key, label]) => { const value = skillValue(item, key); return `<div class="skill-chip"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value.label)}</strong><i aria-label="评分 ${value.score || 0} / 5"><em style="width:${Math.min(100, Number(value.score || 0) / 5 * 100)}%"></em></i></div>`; }).join("")}</div>
      <div class="skill-card-foot"><span>${escapeHtml(sourceNote)}</span><a class="source-link" href="${escapeHtml(item.source_url)}" target="_blank" rel="noreferrer">打开公开页 ↗</a></div>
    </article>`;
  }).join("") || `<div class="skill-empty-panel"><strong>这个账号还没有进入已核验样本</strong><span>需要抖音主页、抖音号或作品链接，才能继续补齐技能数据。</span></div>`;
}

function renderSkillDashboard() {
  const items = skillItems();
  renderSkillTabs();
  renderSkillSummary(items);
  renderSkillBars(items);
  renderSkillSamples(items);
}

function renderLawCorpus() {
  const query = (els.lawSearch.value || "").trim().toLowerCase();
  const filtered = legalCorpus.filter(law => [law.title, law.category, ...(law.focus || []), law.content_use].join(" ").toLowerCase().includes(query));
  els.lawCount.textContent = `${legalCorpus.length} 部`;
  els.lawRows.innerHTML = filtered.map(law => `<article class="law-card">
    <div class="law-card-top"><span class="law-type">${escapeHtml(law.category)}</span><span class="law-status">${escapeHtml(law.status)}</span></div>
    <h3>${escapeHtml(law.title)}</h3>
    <p>${escapeHtml(law.content_use)}</p>
    <div class="law-focus">${(law.focus || []).map(topic => `<span>${escapeHtml(topic)}</span>`).join("")}</div>
    <div class="law-card-foot"><span>施行 ${escapeHtml(law.effective_date)}</span><a class="source-link" href="${escapeHtml(law.source_url)}" target="_blank" rel="noreferrer">官方原文 ↗</a></div>
  </article>`).join("") || '<div class="skill-empty-panel"><strong>没有匹配的法源</strong><span>换一个法律名称或企业合规主题。</span></div>';
}

function buildSkillMarkdown(items) {
  const sourceNames = [...new Set(items.map(item => item.creator))].join("、") || "法律 IP 样本库";
  const patterns = Object.entries(skillLabels).map(([key, label]) => {
    const counts = {};
    items.forEach(item => { const value = skillValue(item, key).label; counts[value] = (counts[value] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return `- ${label}：${top ? `${top[0]}（${top[1]}条）` : "待补样本"}`;
  }).join("\n");
  const laws = legalCorpus.slice(0, 4).map(law => `- [${law.title}](${law.source_url})：${law.focus.join("、")}`).join("\n");
  return `# 法律 IP 内容 Skill\n\n> 从公开内容样本提取的可复用结构。生成具体案件内容前，必须回到官方法源和事实证据复核。\n\n## 当前来源\n\n- 账号：${sourceNames}\n- 样本数：${items.length}\n- 导出时间：${new Date().toISOString()}\n\n## 稳定模式\n\n${patterns}\n\n## 调用步骤\n\n1. 用第一句抛出具体场景、反常问题或结果冲突。\n2. 用案件细节推进，不虚构当事人、金额、证据和裁判结果。\n3. 把悬念放在责任、证据或救济路径上，后半段再给规则解释。\n4. 按“案情—证据—规则—行动—边界”组织口播和镜头。\n5. 选择相关官方法源，只作为复核入口，不把法条改写成个案结论。\n6. 结尾提醒：事实、证据、地区规则、司法解释和最新有效文本需进一步核验。\n\n## 官方法源入口\n\n${laws}\n\n## 内容边界\n\n不承诺胜诉，不泄露隐私，不把公开标题当成完整案情，不复制他人原文或固定表达。\n`;
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename; link.click();
  URL.revokeObjectURL(url);
}

async function copySkillPrompt() {
  const items = skillItems();
  const prompt = `调用法律 IP 内容 Skill：参考${[...new Set(items.map(item => item.creator))].join("、") || "当前样本"}的高频结构，输出一条原创法律行业短视频，包含开头、案情、悬念、证据、规则、镜头、互动和合规边界；法源只从官方数据库复核，不承诺个案结果。`;
  try {
    await navigator.clipboard.writeText(prompt);
    els.skillActionStatus.textContent = "调用指令已复制";
  } catch {
    els.skillActionStatus.textContent = "浏览器未开放剪贴板，请手动复制导出的 Skill";
  }
}

async function loadLatest() {
  try {
    const [latestResponse, registryResponse] = await Promise.all([
      fetch("./data/latest.json", { cache: "no-store" }),
      fetch("./data/skill_registry.json", { cache: "no-store" }),
    ]);
    if (!latestResponse.ok) throw new Error(`HTTP ${latestResponse.status}`);
    const payload = await latestResponse.json();
    const registry = registryResponse.ok ? await registryResponse.json() : {};
    videos = payload.videos || [];
    legalLibrary = registry.records || payload.legal_ip_library || [];
    legalStatus = payload.legal_ip_status || [];
    legalCorpus = registry.legal_corpus || [];
    renderMetrics(payload);
    renderFilters();
    renderRows();
    renderSkillDashboard();
    renderLawCorpus();
  } catch (error) {
    els.sourceStatus.textContent = `项目加载失败：${error.message}`;
    els.rows.innerHTML = '<tr><td class="empty" colspan="6">项目暂时无法加载，请检查 data/latest.json。</td></tr>';
    els.creatorRows.innerHTML = '<p class="empty">法律 IP Skills 样本暂时无法加载。</p>';
  }
}

els.search.addEventListener("input", renderRows);
els.filter.addEventListener("change", renderRows);
els.skillSearch.addEventListener("input", renderSkillDashboard);
els.lawSearch.addEventListener("input", renderLawCorpus);
els.exportSkill.addEventListener("click", () => {
  const items = skillItems();
  downloadText(`legal-ip-skill-${selectedCreator === "all" ? "library" : selectedCreator}.md`, buildSkillMarkdown(items));
  els.skillActionStatus.textContent = `已导出 ${items.length} 条样本的 Skill`;
});
els.copySkillPrompt.addEventListener("click", copySkillPrompt);
loadLatest();
