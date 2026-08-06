const els = {
  works: document.querySelector("#works"),
  stars: document.querySelector("#stars"),
  quickstarts: document.querySelector("#quickstarts"),
  methodCount: document.querySelector("#methodCount"),
  sourceStatus: document.querySelector("#sourceStatus"),
  rowCount: document.querySelector("#rowCount"),
  rows: document.querySelector("#videoRows"),
  search: document.querySelector("#searchInput"),
  filter: document.querySelector("#nicheFilter"),
};

let videos = [];

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

async function loadLatest() {
  try {
    const response = await fetch("./data/latest.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    videos = payload.videos || [];
    renderMetrics(payload);
    renderFilters();
    renderRows();
  } catch (error) {
    els.sourceStatus.textContent = `项目加载失败：${error.message}`;
    els.rows.innerHTML = '<tr><td class="empty" colspan="6">项目暂时无法加载，请检查 data/latest.json。</td></tr>';
  }
}

els.search.addEventListener("input", renderRows);
els.filter.addEventListener("change", renderRows);
loadLatest();
