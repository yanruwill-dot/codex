const SCORE_DIMENSIONS = [
  { key: "opening", label: "开头冲击", max: 18 },
  { key: "conflict", label: "冲突清晰", max: 16 },
  { key: "suspense", label: "悬念推进", max: 16 },
  { key: "specificity", label: "细节具体", max: 12 },
  { key: "narration", label: "讲述可懂", max: 10 },
  { key: "camera", label: "画面可拍", max: 8 },
  { key: "interaction", label: "互动承接", max: 10 },
  { key: "trust", label: "来源可信", max: 10 },
];

const CONFLICT_TERMS = ["为何", "为什么", "责任", "赔", "赔偿", "撞", "死亡", "无罪", "证据", "起诉", "判", "离婚", "公司", "合同", "违法", "能不能", "有什么用", "决定"];
const DETAIL_TERMS = ["岁", "米", "万", "元", "时速", "分钟", "第", "路口", "金额", "证据", "判决", "合同", "转账", "聊天记录", "监控"];
const RISK_TERMS = ["保证胜诉", "百分百", "包赢", "稳赚", "必然胜诉", "无罪释放", "全额赔偿", "内幕消息"];

function skillScore(record, key) {
  const value = record.skills?.[key];
  const score = typeof value === "object" ? value?.score : 3;
  return Math.max(0, Math.min(5, Number(score) || 0));
}

function normalizedHits(title, terms) {
  return terms.filter(term => title.includes(term)).length;
}

function component(key, label, max, score, reason) {
  return { key, label, max, score: Math.max(0, Math.min(max, Math.round(score))), reason };
}

export function scoreRecord(record) {
  const title = String(record.title || "");
  const opening = skillScore(record, "opening");
  const copy = skillScore(record, "copy");
  const suspense = skillScore(record, "suspense");
  const titleConflict = Math.min(1, normalizedHits(title, CONFLICT_TERMS) / 3);
  const titleSpecificity = Math.min(1, (normalizedHits(title, DETAIL_TERMS) + (title.match(/\d+/g)?.length || 0)) / 4);
  const sourceBase = record.source_status === "direct" ? 1 : record.source_status === "profile_related_title_only" ? .62 : .25;
  const compliance = skillScore(record, "compliance");
  const riskHits = normalizedHits(title, RISK_TERMS);

  const components = [
    component("opening", "开头冲击", 18, opening / 5 * 18, opening >= 4 ? "第一句具备结果、数字或直接问题" : "开头信息密度还不够高"),
    component("conflict", "冲突清晰", 16, (copy / 5 * .6 + titleConflict * .4) * 16, titleConflict >= .34 ? "标题明确放入责任、结果或常识冲突" : "还需要把双方分歧或代价说得更具体"),
    component("suspense", "悬念推进", 16, suspense / 5 * 16, suspense >= 4 ? "结论没有一次说尽，留下责任、证据或结果缺口" : "可把关键结论延后半拍"),
    component("specificity", "细节具体", 12, titleSpecificity * 12, titleSpecificity >= .5 ? "标题里有数字、场景、证据或具体对象" : "建议补一个金额、时间、地点或证据细节"),
    component("narration", "讲述可懂", 10, skillScore(record, "narration") / 5 * 10, skillScore(record, "narration") >= 4 ? "讲述顺序适合先案情后规则" : "需要减少抽象术语，明确案情到规则的顺序"),
    component("camera", "画面可拍", 8, skillScore(record, "camera") / 5 * 8, skillScore(record, "camera") >= 4 ? "已有清晰口播、字幕或案件素材承接" : "画面动作还可以更具体"),
    component("interaction", "互动承接", 10, skillScore(record, "interaction") / 5 * 10, skillScore(record, "interaction") >= 4 ? "评论问题能自然变成下一条选题" : "结尾应换成一个可回答的责任或证据问题"),
    component("trust", "来源可信", 10, (sourceBase * .6 + compliance / 5 * .4) * 10, record.source_status === "direct" ? "有独立公开作品页，可回溯核验" : "目前是账号列表标题，需补独立作品页"),
  ];
  const penalty = Math.min(10, riskHits * 5 + (compliance > 0 && compliance <= 2 ? 4 : 0));
  const rawTotal = components.reduce((sum, item) => sum + item.score, 0);
  const total = Math.max(0, Math.min(100, rawTotal - penalty));
  const tier = total >= 85 ? "高潜结构" : total >= 70 ? "可优化" : "先补结构";
  const weak = components.filter(item => item.score / item.max < .7).sort((a, b) => a.score / a.max - b.score / b.max);
  const recommendations = weak.slice(0, 3).map(item => ({
    key: item.key,
    text: item.key === "opening" ? "把第一句改成具体结果、数字或反常问题" : item.key === "conflict" ? "把责任双方、损失代价或常识反差放进标题" : item.key === "suspense" ? "先留责任、证据或结果缺口，后半段再解释" : item.key === "specificity" ? "补一个金额、时间、地点、证据或行为细节" : item.key === "narration" ? "按案情—证据—规则—行动讲，减少抽象术语" : item.key === "camera" ? "为每个结论配字幕重点或一个可见画面动作" : item.key === "interaction" ? "结尾设置一个能回答的责任比例或证据问题" : "先补独立作品链接，再把它纳入高可信样本",
  }));

  return {
    total,
    tier,
    confidence: record.source_status === "direct" ? "高" : record.source_status === "profile_related_title_only" ? "中" : "低",
    penalty,
    components,
    recommendations,
    note: "这是内容结构的传播潜力分，不是播放量预测、平台排名或法律效果保证。",
  };
}

export function summarizeScores(records) {
  const scores = records.map(record => record.viral_score?.total ?? scoreRecord(record).total);
  const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  const highPotential = scores.filter(score => score >= 85).length;
  const dimensionAverages = Object.fromEntries(SCORE_DIMENSIONS.map(({ key, label, max }) => {
    const values = records.map(record => {
      const score = record.viral_score?.components?.find(item => item.key === key)?.score;
      return score == null ? 0 : score / max * 100;
    });
    return [key, { label, score: values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0 }];
  }));
  return { average, high_potential: highPotential, dimension_averages: dimensionAverages };
}

export { SCORE_DIMENSIONS };
