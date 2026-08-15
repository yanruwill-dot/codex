# 小红书爆款雷达

运行真实抓取并更新公开快照：

```bash
cd /Users/will/Documents/New\ project\ 3/codex
python3 xhs-feishu/scripts/capture_xhs.py
```

也可以在命令后传入关键词。原始返回保存在仓库外的 `outputs/xhs-feishu-captures/`，其中可能包含临时搜索令牌，不提交。`data/latest.json` 是去敏后的公开快照，封面下载到 `covers/`。

## 教学视频

页面内置 50 秒竖屏教学视频，演示关键词抓取、爆款筛选、原帖回看与互动指标排序。资产位于 `media/xhs-viral-radar-tutorial.mp4`，页面使用原生 HTML5 播放器和延迟加载。

爆款门槛：点赞不少于 1000，或 `点赞 + 收藏×1.35 + 评论×2.4 + 分享×1.8` 不少于 3000。前三条会调用详情读取做抽样核验。
