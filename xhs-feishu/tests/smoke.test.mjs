import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const data = JSON.parse(await readFile(new URL("data/latest.json", root), "utf8"));
const html = await readFile(new URL("index.html", root), "utf8");
const app = await readFile(new URL("app.js", root), "utf8");

assert.equal(data.platform, "小红书");
assert.equal(data.backend, "xhs-cli");
assert.ok(data.records.length >= 6, "should expose at least six real records");
assert.ok(data.verified_sample_ids.length >= 3, "should verify three detail records");
assert.ok(data.records.every((item) => item.id && item.title && item.author && item.url));
assert.ok(data.records.every((item) => !JSON.stringify(item).includes("xsec_token")), "public data must not contain xsec_token");
assert.ok(data.records.every((item) => item.likes >= 1000 || item.weighted_engagement >= 3000));
assert.match(html, /id="note-grid"/);
assert.match(html, /id="tutorial"/);
assert.match(html, /media\/xhs-viral-radar-tutorial\.mp4/);
const tutorialVideo = await stat(new URL("media/xhs-viral-radar-tutorial.mp4", root));
assert.ok(tutorialVideo.size > 10_000_000, "tutorial video should be a real encoded asset");
assert.match(app, /data\/latest\.json/);
console.log(`xhs-feishu smoke ok: ${data.records.length} records, ${data.verified_sample_ids.length} verified`);
