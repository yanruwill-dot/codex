const state = { records: [], query: "", sort: "score" };
const compact = new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 1 });
const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
const metric = (value) => value >= 10000 ? compact.format(value) : new Intl.NumberFormat("zh-CN").format(value);

function render() {
  const needle = state.query.trim().toLowerCase();
  const records = state.records.filter((item) => [item.title, item.author, item.query, item.type].join(" ").toLowerCase().includes(needle)).sort((a, b) => state.sort === "likes" ? b.likes - a.likes : state.sort === "collects" ? b.collects - a.collects : state.sort === "comments" ? b.comments - a.comments : b.weighted_engagement - a.weighted_engagement);
  document.querySelector("#result-count").textContent = records.length;
  document.querySelector("#note-grid").innerHTML = records.length ? records.map((item, index) => `
    <article class="note-card">
      <a class="cover-wrap" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
        ${item.cover ? `<img src="${escapeHtml(item.cover)}" alt="${escapeHtml(item.title)}" loading="lazy">` : `<span class="cover-fallback">XHS</span>`}
        <span class="rank">${String(index + 1).padStart(2, "0")}</span><span class="type-chip">${escapeHtml(item.type)}</span>
      </a>
      <div class="note-body">
        <div class="note-source"><span>${escapeHtml(item.query)}</span><span>${escapeHtml(item.published)}</span></div>
        <h3><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a></h3>
        <p class="author">${escapeHtml(item.author)} ${item.verified ? '<span class="verified">详情已核验</span>' : ''}</p>
        <dl class="engagement"><div><dt>赞</dt><dd>${metric(item.likes)}</dd></div><div><dt>藏</dt><dd>${metric(item.collects)}</dd></div><div><dt>评</dt><dd>${metric(item.comments)}</dd></div><div><dt>享</dt><dd>${metric(item.shares)}</dd></div></dl>
        <div class="score-line"><span>爆款分</span><strong>${item.viral_score}</strong><i><em style="width:${item.viral_score}%"></em></i></div>
        <a class="source-button" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">打开小红书原帖 ↗</a>
      </div>
    </article>`).join("") : '<p class="empty-state">没有匹配的帖子，换个关键词试试。</p>';
}

async function loadData() {
  const status = document.querySelector("#load-status");
  status.textContent = "正在读取最新抓取快照…";
  try {
    const response = await fetch(`./data/latest.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    state.records = data.records || [];
    const captured = new Date(data.captured_at);
    document.querySelector("#captured-at").textContent = Number.isNaN(captured.valueOf()) ? data.captured_at : captured.toLocaleString("zh-CN", { hour12: false });
    document.querySelector("#candidate-count").textContent = data.candidate_count;
    document.querySelector("#verified-count").textContent = data.verified_sample_ids?.length || 0;
    document.querySelector("#query-list").textContent = data.queries.join(" · ");
    document.querySelector("#threshold").textContent = data.viral_threshold;
    status.textContent = `已载入 ${state.records.length} 条真实爆款快照`;
    status.className = "load-status ok";
    render();
  } catch (error) {
    status.textContent = `数据载入失败：${error.message}`;
    status.className = "load-status error";
  }
}

document.querySelector("#search-input").addEventListener("input", (event) => { state.query = event.target.value; render(); });
document.querySelector("#sort-select").addEventListener("change", (event) => { state.sort = event.target.value; render(); });
document.querySelector("#refresh-button").addEventListener("click", loadData);
loadData();
