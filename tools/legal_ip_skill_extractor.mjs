import fs from "node:fs";

const root = new URL("..", import.meta.url);
const latestPath = new URL("douyin-feishu/data/latest.json", root);
const corpusPath = new URL("douyin-feishu/data/legal_corpus.json", root);
const outputPath = new URL("douyin-feishu/data/skill_registry.json", root);
const latest = JSON.parse(fs.readFileSync(latestPath, "utf8"));
const corpus = JSON.parse(fs.readFileSync(corpusPath, "utf8"));

const dimensions = ["opening", "copy", "suspense", "narration", "camera", "interaction", "compliance"];
const records = latest.legal_ip_library || [];
const patterns = Object.fromEntries(dimensions.map(dimension => {
  const counts = {};
  for (const record of records) {
    const value = record.skills?.[dimension];
    const label = typeof value === "string" ? value : value?.label;
    if (label) counts[label] = (counts[label] || 0) + 1;
  }
  return [dimension, Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }))];
}));

const byCreator = {};
for (const record of records) {
  byCreator[record.creator] ||= { creator: record.creator, sample_count: 0, source_count: 0, patterns: {} };
  byCreator[record.creator].sample_count += 1;
  if (record.source_status === "direct") byCreator[record.creator].source_count += 1;
  for (const dimension of dimensions) {
    const value = record.skills?.[dimension];
    const label = typeof value === "string" ? value : value?.label;
    if (label) byCreator[record.creator].patterns[dimension] ||= {};
    if (label) byCreator[record.creator].patterns[dimension][label] = (byCreator[record.creator].patterns[dimension][label] || 0) + 1;
  }
}

const registry = {
  version: "0.2.0",
  generated_at: new Date().toISOString(),
  source_note: latest.legal_ip_note,
  dimensions,
  records,
  patterns,
  creators: Object.values(byCreator),
  legal_corpus: corpus,
  skill_prompt: "先选择一个账号的高频开头和悬念，再从官方法源库挑选相关法律入口；输出场景、证据、规则、边界和镜头，不把法条改写成个案结论。",
};
fs.writeFileSync(outputPath, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`generated skill_registry records=${records.length} laws=${corpus.length}`);
