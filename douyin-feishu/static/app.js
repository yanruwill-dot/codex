const els = {
  works: document.querySelector("#works"),
  interactions: document.querySelector("#interactions"),
  topComments: document.querySelector("#topComments"),
  topCollects: document.querySelector("#topCollects"),
  sourceStatus: document.querySelector("#sourceStatus"),
  accountMeta: document.querySelector("#accountMeta"),
  niche: document.querySelector("#niche"),
  persona: document.querySelector("#persona"),
  business: document.querySelector("#business"),
  rowCount: document.querySelector("#rowCount"),
  rows: document.querySelector("#videoRows"),
};

function fmt(n) {
  const value = Number(n || 0);
  if (value >= 10000) return `${(value / 10000).toFixed(value >= 100000 ? 1 : 2)}万`;
  return value.toLocaleString("zh-CN");
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[ch]));
}

function render(payload) {
  const account = payload.account || {};
  const videos = payload.videos || [];
  const total = videos.reduce((sum, v) => sum + Number(v.likes || 0) + Number(v.comments || 0) + Number(v.collects || 0) + Number(v.shares || 0), 0);
  const topComments = Math.max(0, ...videos.map(v => Number(v.comments || 0)));
  const topCollects = Math.max(0, ...videos.map(v => Number(v.collects || 0)));

  els.works.textContent = fmt(videos.length || account.works);
  els.interactions.textContent = fmt(total);
  els.topComments.textContent = fmt(topComments);
  els.topCollects.textContent = fmt(topCollects);
  els.sourceStatus.textContent = payload.source_message || "静态样本已加载";
  els.accountMeta.textContent = `${account.name || "抖音-飞书样本"} · ${videos.length} 条`;
  els.niche.textContent = account.niche || "-";
  els.persona.textContent = account.persona || "-";
  els.business.textContent = account.business_model || "-";
  els.rowCount.textContent = `${videos.length} 条`;

  els.rows.innerHTML = videos.map(v => {
    const interaction = Number(v.likes || 0) + Number(v.comments || 0) + Number(v.collects || 0) + Number(v.shares || 0);
    return `
      <tr>
        <td><a href="${escapeHtml(v.video_url)}" target="_blank" rel="noreferrer">${escapeHtml(v.title)}</a></td>
        <td>${escapeHtml(v.source_account)}</td>
        <td>${fmt(interaction)}</td>
        <td>${escapeHtml(v.scene)}</td>
        <td>${escapeHtml(v.pain_point)}</td>
        <td>${escapeHtml(v.title_method)}</td>
        <td>${escapeHtml(v.copy_structure)}</td>
        <td>${escapeHtml(v.replicable_script)}</td>
        <td>${escapeHtml(v.shooting_advice)}</td>
      </tr>
    `;
  }).join("");
}

async function loadLatest() {
  try {
    const res = await fetch("./data/latest.json", {cache: "no-store"});
    render(await res.json());
  } catch (error) {
    els.sourceStatus.textContent = `样本加载失败：${error.message}`;
  }
}

loadLatest();
