import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("左侧导航会打开对应功能，而不是只改变选中颜色", () => {
  for (const target of ["workspace", "tasks", "data", "knowledge", "settings"]) {
    assert.match(html, new RegExp(`data-nav-target=["']${target}["']`), `缺少 ${target} 导航目标`);
  }
  assert.match(html, /function activateNavigation/);
  assert.match(html, /scrollIntoView/);
});

test("公开页面不会错误连接访问者电脑的本地发布代理", () => {
  assert.doesNotMatch(html, /const publishApiBase\s*=\s*["']http:\/\/127\.0\.0\.1:8788\/api["']/);
  assert.match(html, /function getPublishApiBase/);
  assert.match(html, /公开页面/);
  assert.match(html, /location\.protocol/);
});

test("系统状态不再把历史进程号和旧版本冒充实时状态", () => {
  assert.doesNotMatch(html, /pid 740|gateway_state|codex-cli 0\.139\.0/);
  assert.match(html, /id=["']environmentMode["']/);
  assert.match(html, /id=["']publishChannelState["']/);
});
