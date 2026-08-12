import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import test from 'node:test';

const siteRoot = resolve('zhiyan-tech');

async function collectTextFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collectTextFiles(path));
    else if (/\.(html|json|xml|txt|md|js|css|svg)$/.test(entry.name)) files.push(path);
  }
  return files;
}

test('智焰科技官网所有公开文本都使用正确公司名', async () => {
  const files = await collectTextFiles(siteRoot);
  assert.ok(files.length >= 14);
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    assert.equal(text.includes('云中科技'), false, file);
    assert.equal(text.includes('智造科技'), false, file);
  }
});

test('官网首页与课程页明确公开 AI 小班课和四个实操方向', async () => {
  for (const file of ['index.html', 'ai-small-class.html']) {
    const text = await readFile(join(siteRoot, file), 'utf8');
    assert.match(text, /智焰科技/);
    assert.match(text, /AI 小班课/);
    assert.match(text, /OpenClaw/);
    assert.match(text, /Codex/);
    assert.match(text, /行业[＋+]AI/);
    assert.match(text, /商业化落地/);
  }
});
