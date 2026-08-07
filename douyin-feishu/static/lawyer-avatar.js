const $ = selector => document.querySelector(selector);
const els = {
  creatorSelect: $("#creatorSelect"), skillFocus: $("#skillFocus"), lawSelect: $("#lawSelect"), lawSourceLink: $("#lawSourceLink"), lawSourceTitle: $("#lawSourceTitle"), lawSourceMeta: $("#lawSourceMeta"), lawSourceUse: $("#lawSourceUse"), metricRecords: $("#metricRecords"), metricLaws: $("#metricLaws"), subject: $("#subject"), facts: $("#facts"), evidence: $("#evidence"), goal: $("#goal"), jurisdiction: $("#jurisdiction"), tone: $("#toneSelect"), form: $("#caseForm"), outputTitle: $("#outputTitle"), outputEmpty: $("#outputEmpty"), outputContent: $("#outputContent"), copyOutput: $("#copyOutput"), clearOutput: $("#clearOutput"), loadSample: $("#loadSample"), exportPersona: $("#exportPersona"), runStatus: $("#runStatus"), traceRows: $("#traceRows"), gateCount: $("#gateCount"), gateFacts: $("#gateFacts"), gateLaw: $("#gateLaw"), gateCompliance: $("#gateCompliance"), personaSpecialty: $("#personaSpecialty"), modeTabs: $("#modeTabs"),
};

let registry = { records: [], legal_corpus: [] };
let mode = "consult";
let lastResult = "";

const modeTitles = { consult: "分身回复草案", script: "20 秒口播骨架", audit: "发布前合规审计" };
const skillLabels = { opening: "开头", copy: "文案", suspense: "悬念", narration: "讲述", camera: "镜头", interaction: "互动", compliance: "边界" };

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function currentCreator() {
  return els.creatorSelect.value || "交通事故律师余逸飞";
}

function creatorRecords() {
  return registry.records.filter(record => record.creator === currentCreator());
}

function selectedLaw() {
  return registry.legal_corpus.find(law => law.id === els.lawSelect.value) || registry.legal_corpus[0] || {};
}

function topRecord() {
  return [...creatorRecords()].sort((a, b) => (b.viral_score?.total || 0) - (a.viral_score?.total || 0))[0] || registry.records[0];
}

function updateStatus(text, running = false) {
  els.runStatus.classList.toggle("running", running);
  els.runStatus.innerHTML = `<i></i>${escapeHtml(text)}`;
}

function renderProfile() {
  const records = creatorRecords();
  const top = topRecord();
  const labels = ["opening", "copy", "suspense", "narration", "camera", "interaction"].map(key => top?.skills?.[key]?.label).filter(Boolean);
  els.skillFocus.innerHTML = labels.slice(0, 4).map(label => `<span>${escapeHtml(label)}</span>`).join("");
  els.personaSpecialty.textContent = top ? `${top.creator} · ${labels.slice(0, 3).join(" · ")}` : "等待样本接入";
  els.traceRows.innerHTML = `<div class="trace-row"><i></i><div><strong>参考账号结构</strong><small>${escapeHtml(currentCreator())} · ${records.length} 条公开样本</small></div></div><div class="trace-row"><i></i><div><strong>最高结构分</strong><small>${top ? `${top.viral_score?.total || "—"} 分 · ${top.title}` : "暂无样本"}</small></div></div><div class="trace-row"><i></i><div><strong>分身表达规则</strong><small>${escapeHtml(top?.copy_summary || "先事实，再法源，再行动")}</small></div></div>`;
}

function renderLaws() {
  els.lawSelect.innerHTML = registry.legal_corpus.map(law => `<option value="${escapeHtml(law.id)}">${escapeHtml(law.title.replace(/^中华人民共和国/, ""))}</option>`).join("");
  updateLawSource();
}

function updateLawSource() {
  const law = selectedLaw();
  els.lawSourceLink.href = law.source_url || "https://flk.npc.gov.cn/";
  els.lawSourceTitle.textContent = law.title || "等待选择法源";
  els.lawSourceMeta.textContent = law.status ? `${law.status} · 施行 ${law.effective_date}` : "官方来源待接入";
  els.lawSourceUse.textContent = law.content_use || "生成前先回到官方原文复核。";
}

function gateState() {
  const count = [els.gateFacts, els.gateLaw, els.gateCompliance].filter(input => input.checked).length;
  els.gateCount.textContent = `${count} / 3`;
  document.querySelectorAll(".gate-list i").forEach((dot, index) => dot.classList.toggle("off", ![els.gateFacts, els.gateLaw, els.gateCompliance][index].checked));
}

function factGaps() {
  const gaps = [];
  if (!els.facts.value.trim()) gaps.push("时间、地点与关键行为");
  if (!els.evidence.value.trim()) gaps.push("证据类型与当前持有情况");
  if (!els.jurisdiction.value.includes("中国大陆")) gaps.push("适用地区与具体程序");
  return gaps;
}

function riskHits(text) {
  return ["保证胜诉", "百分百", "包赢", "稳赚", "一定能", "必然胜诉", "全额赔偿", "内幕消息"].filter(term => text.includes(term));
}

function buildConsult() {
  const law = selectedLaw();
  const gaps = factGaps();
  const subject = els.subject.value.trim();
  const facts = els.facts.value.trim() || "当前还没有输入具体事实";
  const lead = gaps.length && els.gateFacts.checked ? `先说边界：仅凭“${subject}”和当前输入，不能直接判断责任、赔偿金额或胜诉结果。现在最需要补齐的是：${gaps.join("、")}。` : `先把问题拆开：${subject}。当前记录的事实是：${facts}。接下来要把事实、证据和适用规则一一对应。`;
  const actions = ["固定原始证据，不只保留截图或转述", "记录时间线：谁在什么时间、什么地点做了什么", `回到《${law.title || "相关法律"}》及对应司法解释核对适用条款`, "把对方主张、己方目标和可接受方案分开记录"];
  const risks = riskHits(`${subject} ${facts} ${els.goal.value}`);
  return { title: modeTitles.consult, text: lead, cards: [{ label: "事实缺口", html: gaps.length ? `<ul>${gaps.map(gap => `<li>${escapeHtml(gap)}</li>`).join("")}</ul>` : "当前输入已具备基础事实，可进入证据核验。" }, { label: "下一步动作", html: `<ul>${actions.map(action => `<li>${escapeHtml(action)}</li>`).join("")}</ul>` }, { label: "法源方向", type: "source", html: `<a href="${escapeHtml(law.source_url)}" target="_blank" rel="noreferrer">${escapeHtml(law.title || "官方法律入口")} ↗</a><small>${escapeHtml(law.content_use || "回到官方原文复核")}</small>` }, { label: "风险边界", type: "risk", html: risks.length ? `发现绝对化表达：${risks.map(hit => `“${escapeHtml(hit)}”`).join("、")}。发布前改为条件化表达。` : "没有发现明显绝对化承诺；仍需结合完整案情和地区规则复核。" }] };
}

function buildScript() {
  const law = selectedLaw();
  const top = topRecord();
  const subject = els.subject.value.trim() || "一个看似简单的法律问题";
  const facts = els.facts.value.trim() || "先补时间、地点、行为、损失和证据";
  const opening = els.tone.value === "sharp" ? `${subject}，真正决定结果的，可能不是你第一眼看到的那件事。` : `${subject}，先别急着问能不能赔，先看三个事实。`;
  const close = "你遇到的是同类问题吗？先把时间线和证据整理好，再结合当地规则核对。";
  return { title: modeTitles.script, text: opening, script: [{ time: "00–03s", label: "开头钩子", text: opening }, { time: "03–10s", label: "案情与悬念", text: `只讲已知事实：${facts}。悬念放在责任、证据和${law.title || "法源"}如何对应，不提前宣布结果。` }, { time: "10–16s", label: "规则转译", text: `用“事实—证据—规则”解释，不把法条直接改写成个案结论；参考结构：${top?.skills?.narration?.label || "先案情后规则"}。` }, { time: "16–20s", label: "互动与边界", text: close }], cards: [{ label: "推荐镜头", html: "正面口播 + 关键事实字幕 + 证据类型卡片" }, { label: "结构来源", html: `${escapeHtml(top?.creator || "法律 IP 样本")} · ${escapeHtml(top?.skills?.opening?.label || "问题直入")}` }, { label: "法源入口", type: "source", html: `<a href="${escapeHtml(law.source_url)}" target="_blank" rel="noreferrer">${escapeHtml(law.title || "官方法律入口")} ↗</a><small>只作为复核入口</small>` }, { label: "发布边界", type: "risk", html: "不承诺结果，不虚构金额、证据和裁判，不泄露个人隐私。" }] };
}

function buildAudit() {
  const allText = `${els.subject.value} ${els.facts.value} ${els.evidence.value} ${els.goal.value}`;
  const hits = riskHits(allText);
  const gaps = factGaps();
  const law = selectedLaw();
  const items = hits.length ? hits.map(hit => `把“${hit}”改成“需结合事实、证据和最新有效文本判断”`) : ["没有发现明显的绝对化承诺", "继续检查是否把标题当成完整案情", "继续检查是否把法条写成确定的个案结论"];
  return { title: modeTitles.audit, text: hits.length ? `这段输入暂时不能直接发布：发现 ${hits.length} 个高风险确定性表达。先改写，再进入人工复核。` : "这段输入通过基础词面审计，但“通过”不等于法律结论正确，仍需要人工复核事实、法源和地区规则。", cards: [{ label: "发现的问题", type: hits.length ? "risk" : "source", html: `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` }, { label: "事实完整度", html: gaps.length ? `还缺：${escapeHtml(gaps.join("、"))}` : "已提供基础事实和证据描述" }, { label: "绑定法源", type: "source", html: `<a href="${escapeHtml(law.source_url)}" target="_blank" rel="noreferrer">${escapeHtml(law.title || "官方法律入口")} ↗</a><small>${escapeHtml(law.status || "状态待复核")}</small>` }, { label: "人工复核点", html: "具体案情、证据真实性、地区规则、司法解释、时效和利益冲突。" }] };
}

function renderResult(result) {
  els.outputTitle.textContent = result.title;
  els.outputEmpty.hidden = true;
  els.outputContent.hidden = false;
  els.outputContent.innerHTML = `<div class="result-lead"><span>分身第一判断</span><p>${escapeHtml(result.text)}</p></div>${result.script ? `<div class="result-script">${result.script.map(beat => `<div class="script-beat"><b>${escapeHtml(beat.time)}</b><div><strong>${escapeHtml(beat.label)}</strong><p>${escapeHtml(beat.text)}</p></div></div>`).join("")}</div>` : ""}<div class="result-grid">${result.cards.map(card => `<article class="result-card ${card.type || ""}"><span class="result-card-label">${escapeHtml(card.label)}</span>${card.html}</article>`).join("")}</div>`;
  lastResult = `${result.title}\n\n${result.text}\n\n${result.cards.map(card => `${card.label}\n${card.html.replace(/<[^>]+>/g, " ")}`).join("\n\n")}`;
}

function loadSample() {
  els.subject.value = "摩托车撞人后，家属能不能找公司赔？";
  els.facts.value = "夜间，摩托车时速约70公里，在T字路口发生碰撞，造成一人死亡。家属认为车辆属于公司管理，正在考虑索赔。";
  els.evidence.value = "行车记录仪、现场监控、交警责任认定书、车辆登记和公司管理记录、医疗与丧葬票据。";
  els.goal.value = "先做咨询分流，再改成一条20秒法律口播。";
  els.lawSelect.value = "civil-code";
  updateLawSource();
  updateStatus("示例已载入");
}

function generate(event) {
  event.preventDefault();
  updateStatus("分身正在整理", true);
  window.setTimeout(() => {
    if (!els.subject.value.trim()) { updateStatus("请先输入问题"); els.subject.focus(); return; }
    const result = mode === "script" ? buildScript() : mode === "audit" ? buildAudit() : buildConsult();
    renderResult(result);
    updateStatus("已生成 · 待人工复核");
  }, 180);
}

function exportSkill() {
  const top = topRecord();
  const lawLines = registry.legal_corpus.slice(0, 5).map(law => `- [${law.title}](${law.source_url})：${law.focus.join("、")}`).join("\n");
  const text = `# 法律行业 AI 分身 Skill\n\n> 本文件是内容研究、咨询分流和口播生成的角色规则，不替代律师执业判断。\n\n## 角色定位\n\n- 角色：法律行业 AI 分身\n- 参考账号：${currentCreator()}\n- 当前模式：${modeTitles[mode]}\n- 表达顺序：先事实缺口，再证据，再法源，再下一步\n\n## 分身门禁\n\n1. 不把公开标题当完整案情。\n2. 不把法条改写成确定的个案结论。\n3. 不承诺胜诉，不虚构金额、证据、裁判和当事人信息。\n4. 发现事实缺口时先追问，不用想象补齐。\n5. 发布前执行绝对化表达和隐私风险审计。\n\n## 参考结构\n\n- 开头：${top?.skills?.opening?.label || "问题直入"}\n- 文案：${top?.skills?.copy?.label || "事实 + 责任追问"}\n- 悬念：${top?.skills?.suspense?.label || "责任或证据缺口"}\n- 讲述：${top?.skills?.narration?.label || "先案情后规则"}\n- 镜头：${top?.skills?.camera?.label || "口播 + 字幕重点"}\n- 互动：${top?.skills?.interaction?.label || "留下可回答的问题"}\n\n## 法源入口\n\n${lawLines}\n\n## 使用方式\n\n1. 输入当事人问题、已知事实、证据和目标。\n2. 选择咨询分流、20秒口播或合规审计。\n3. 生成后查看事实缺口、法源链接、风险提示和人工复核点。\n4. 通过人工复核后，再进入正式文书或平台发布流程。\n`;
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = "legal-lawyer-ai-persona-skill.md"; link.click(); URL.revokeObjectURL(url);
  updateStatus("分身 Skill 已导出");
}

async function copyOutput() {
  if (!lastResult) { updateStatus("请先生成结果"); return; }
  try { await navigator.clipboard.writeText(lastResult); updateStatus("结果已复制"); } catch { updateStatus("浏览器未开放剪贴板"); }
}

function clearOutput() {
  lastResult = ""; els.outputContent.hidden = true; els.outputEmpty.hidden = false; els.outputTitle.textContent = modeTitles[mode]; updateStatus("等待输入");
}

async function loadData() {
  try {
    const response = await fetch("./data/skill_registry.json", { cache: "no-store" });
    registry = await response.json();
    els.metricRecords.textContent = registry.records.length;
    els.metricLaws.textContent = registry.legal_corpus.length;
    const creators = [...new Set(registry.records.map(record => record.creator))];
    els.creatorSelect.innerHTML = creators.map(creator => `<option value="${escapeHtml(creator)}">${escapeHtml(creator)}</option>`).join("");
    renderLaws(); renderProfile(); gateState();
  } catch (error) {
    updateStatus(`数据加载失败：${error.message}`);
  }
}

els.creatorSelect.addEventListener("change", () => { renderProfile(); updateStatus("参考账号已切换"); });
els.lawSelect.addEventListener("change", updateLawSource);
els.form.addEventListener("submit", generate);
els.loadSample.addEventListener("click", loadSample);
els.copyOutput.addEventListener("click", copyOutput);
els.clearOutput.addEventListener("click", clearOutput);
els.exportPersona.addEventListener("click", exportSkill);
[els.gateFacts, els.gateLaw, els.gateCompliance].forEach(input => input.addEventListener("change", gateState));
els.modeTabs.querySelectorAll(".mode-tab").forEach(button => button.addEventListener("click", () => {
  mode = button.dataset.mode;
  els.modeTabs.querySelectorAll(".mode-tab").forEach(tab => { const active = tab === button; tab.classList.toggle("active", active); tab.setAttribute("aria-selected", active); });
  els.outputTitle.textContent = modeTitles[mode];
  clearOutput();
}));
loadData();
