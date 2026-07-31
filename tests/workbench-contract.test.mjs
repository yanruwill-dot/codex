import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
const dashboard = fs.readFileSync(path.join(root, "media-data-dashboard", "index.html"), "utf8");
const media = JSON.parse(
  fs.readFileSync(path.join(root, "media-data-dashboard", "media-data.json"), "utf8"),
);

test("home makes the content dashboard the primary workbench entry", () => {
  assert.match(home, /一个入口，/);
  assert.match(home, /打开全部[\s\S]*AI 工作/);
  assert.match(home, /href="\.\/media-data-dashboard\/"/);
  assert.match(home, /你只要看这 6 个数/);
  assert.doesNotMatch(home, /十二个入口/);
  assert.doesNotMatch(home, /card-body/);
});

test("home uses a concise Apple-style editorial hierarchy", () => {
  assert.match(home, /backdrop-filter: saturate\(180%\) blur\(22px\)/);
  assert.match(home, /--radius: 30px/);
  assert.match(home, /日常工作的三个入口/);
  assert.match(home, /从内容到增长/);
  assert.match(home, /品牌与实验/);
  assert.equal((home.match(/class="project-card(?:\s|")/g) || []).length, 12);
});

test("every local workbench link has a real target", () => {
  const hrefs = [...home.matchAll(/href="\.\/([^"#?]+\/)"/g)].map((match) => match[1]);
  for (const href of new Set(hrefs)) {
    assert.ok(fs.existsSync(path.join(root, href, "index.html")), `missing ${href}`);
  }
});

test("copied dashboard is self-contained and backed by real media data", () => {
  assert.match(dashboard, /颜汝内容数据中台/);
  assert.match(dashboard, /href="\.\.\/">Codex 工作台/);
  assert.ok(Array.isArray(media.works) && media.works.length > 0);
  assert.ok(Array.isArray(media.metricWorks) && media.metricWorks.length > 0);
  assert.ok(media.summary && typeof media.summary === "object");
  assert.ok(Array.isArray(media.platforms) && media.platforms.length > 0);
});
