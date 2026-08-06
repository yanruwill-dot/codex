const els = {
  works: document.querySelector("#works"),
  highIntent: document.querySelector("#highIntent"),
  verifiedSources: document.querySelector("#verifiedSources"),
  nicheCount: document.querySelector("#nicheCount"),
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

function renderMetrics(payload) {
  const account = payload.account || {};
  const niches = new Set(videos.map(video => video.niche).filter(Boolean));
  els.works.textContent = videos.length;
  els.highIntent.textContent = videos.filter(video => video.intent === "高").length;
  els.verifiedSources.textContent = videos.filter(video => video.source_verified).length;
  els.nicheCount.textContent = niches.size || account.niche_count || 0;
}

function renderFilters() {
  const current = els.filter.value || "all";
  const niches = [...new Set(videos.map(video => video.niche).filter(Boolean))];
  els.filter.innerHTML = '<option value="all">全部方向</option>' + niches.map(niche => `<option value="${escapeHtml(niche)}">${escapeHtml(niche)}</option>`).join("");
  els.filter.value = niches.includes(current) ? current : "all";
}

function renderRows() {
  const query = els.search.value.trim().toLowerCase();
  const niche = els.filter.value;
  const filtered = videos.filter(video => {
    const haystack = [video.title, video.source_account, video.niche, video.hook, video.replicable_angle].join(" ").toLowerCase();
    return (niche === "all" || video.niche === niche) && (!query || haystack.includes(query));
  });

  els.rowCount.textContent = `${filtered.length} 条`;
  els.rows.innerHTML = filtered.map((video, index) => `
    <tr>
      <td class="work-cell" data-label="候选作品">
        <span class="rank">${String(index + 1).padStart(2, "0")}</span>
        <div><a class="work-title" href="${escapeHtml(video.source_url)}" target="_blank" rel="noreferrer">${escapeHtml(video.title)}</a><span class="work-account">${escapeHtml(video.source_account)} · ${escapeHtml(video.published_at)} · ${escapeHtml(video.niche)}</span></div>
      </td>
      <td data-label="公开信号"><span class="signal-pill ${video.intent === "高" ? "strong" : ""}">${escapeHtml(video.signal)}</span><span class="sub-value">${video.source_verified ? "来源可回查" : "待复核"}</span></td>
      <td data-label="标题 / 开场钩子"><strong class="hook">${escapeHtml(video.hook)}</strong><span class="sub-value">${escapeHtml(video.title_method)}</span></td>
      <td data-label="内容结构"><span class="structure">${escapeHtml(video.copy_structure)}</span><span class="sub-value">${escapeHtml(video.structure_breakdown)}</span></td>
      <td data-label="法律 IP 复刻方向"><strong class="angle">${escapeHtml(video.replicable_angle)}</strong><span class="sub-value risk">${escapeHtml(video.risk_note)}</span></td>
      <td data-label="来源"><a class="source-link" href="${escapeHtml(video.source_url)}" target="_blank" rel="noreferrer">抖音公开页 ↗</a></td>
    </tr>
  `).join("") || '<tr><td class="empty" colspan="6">没有匹配的候选，换个关键词或方向。</td></tr>';
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
    els.sourceStatus.textContent = payload.source_message || "公开样本已加载";
  } catch (error) {
    els.sourceStatus.textContent = `样本加载失败：${error.message}`;
    els.rows.innerHTML = '<tr><td class="empty" colspan="6">样本暂时无法加载，请检查 data/latest.json。</td></tr>';
  }
}

els.search.addEventListener("input", renderRows);
els.filter.addEventListener("change", renderRows);
loadLatest();
