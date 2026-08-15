#!/usr/bin/env python3
"""Capture real Xiaohongshu search results and build a safe public snapshot."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import subprocess
import sys
import urllib.request
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DATA = ROOT / "data" / "latest.json"
PUBLIC_COVERS = ROOT / "covers"
DEFAULT_PRIVATE_ROOT = Path(__file__).resolve().parents[3] / "outputs" / "xhs-feishu-captures"


def run_xhs(*args: str) -> dict:
    proc = subprocess.run(
        ["xhs", *args, "--json"], check=False, capture_output=True, text=True, timeout=90
    )
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or proc.stdout.strip() or "xhs command failed")
    start = proc.stdout.find("{")
    if start < 0:
        raise RuntimeError("xhs returned no JSON")
    payload = json.loads(proc.stdout[start:])
    if not payload.get("ok"):
        raise RuntimeError(payload.get("error") or "xhs returned ok=false")
    return payload


def count(value: object) -> int:
    try:
        return int(str(value or "0").replace(",", ""))
    except ValueError:
        return 0


def download_cover(url: str, note_id: str) -> str:
    if not url:
        return ""
    request = urllib.request.Request(
        url.replace("http://", "https://", 1),
        headers={"User-Agent": "Mozilla/5.0", "Referer": "https://www.xiaohongshu.com/"},
    )
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            body = response.read()
            content_type = response.headers.get_content_type()
    except Exception as exc:
        print(f"cover unavailable for {note_id}: {exc}", file=sys.stderr)
        return ""
    if len(body) < 500:
        return ""
    suffix = ".jpg" if content_type in {"image/jpeg", "image/jpg"} else ".webp"
    digest = hashlib.sha256(body).hexdigest()[:12]
    PUBLIC_COVERS.mkdir(parents=True, exist_ok=True)
    filename = f"xhs-{note_id}-{digest}{suffix}"
    (PUBLIC_COVERS / filename).write_bytes(body)
    return f"./covers/{filename}"


def normalize_item(item: dict, query: str) -> dict | None:
    if item.get("model_type") != "note":
        return None
    note_id = str(item.get("id") or "")
    card = item.get("note_card") or {}
    title = str(card.get("display_title") or "").strip()
    if not note_id or not title:
        return None
    user = card.get("user") or {}
    stats = card.get("interact_info") or {}
    likes = count(stats.get("liked_count"))
    collects = count(stats.get("collected_count"))
    comments = count(stats.get("comment_count"))
    shares = count(stats.get("shared_count"))
    weighted = likes + collects * 1.35 + comments * 2.4 + shares * 1.8
    viral_score = min(100, round(math.log10(max(weighted, 1)) * 20))
    tags = card.get("corner_tag_info") or []
    published = next((str(tag.get("text")) for tag in tags if tag.get("type") == "publish_time"), "未知")
    return {
        "id": note_id,
        "query": query,
        "title": title,
        "author": str(user.get("nickname") or user.get("nick_name") or "未知作者"),
        "type": "视频" if card.get("type") == "video" else "图文",
        "published": published,
        "likes": likes,
        "collects": collects,
        "comments": comments,
        "shares": shares,
        "weighted_engagement": round(weighted),
        "viral_score": viral_score,
        "url": f"https://www.xiaohongshu.com/explore/{note_id}",
        "_cover_url": str((card.get("cover") or {}).get("url_default") or ""),
        "_read_url": f"https://www.xiaohongshu.com/explore/{note_id}?xsec_token={item.get('xsec_token', '')}&xsec_source=pc_search",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Capture and rank real Xiaohongshu posts")
    parser.add_argument("queries", nargs="*", default=["AI智能体", "AI工具", "AI获客"])
    parser.add_argument("--limit", type=int, default=12)
    parser.add_argument("--private-root", type=Path, default=DEFAULT_PRIVATE_ROOT)
    args = parser.parse_args()
    now = datetime.now(ZoneInfo("Asia/Shanghai"))
    run_dir = args.private_root / now.strftime("%Y%m%d-%H%M%S")
    run_dir.mkdir(parents=True, exist_ok=True)
    all_items: dict[str, dict] = {}
    query_counts: dict[str, int] = {}

    for query in args.queries:
        payload = run_xhs("search", query, "--sort", "popular")
        (run_dir / f"raw-{hashlib.sha256(query.encode()).hexdigest()[:8]}.json").write_text(
            json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        found = 0
        for raw_item in payload.get("data", {}).get("items", []):
            item = normalize_item(raw_item, query)
            if not item:
                continue
            found += 1
            existing = all_items.get(item["id"])
            if not existing or item["weighted_engagement"] > existing["weighted_engagement"]:
                all_items[item["id"]] = item
        query_counts[query] = found

    ranked = sorted(all_items.values(), key=lambda item: item["weighted_engagement"], reverse=True)
    viral = [item for item in ranked if item["likes"] >= 1000 or item["weighted_engagement"] >= 3000][: args.limit]
    if not viral:
        raise RuntimeError("No result passed the viral threshold")

    verified_ids: list[str] = []
    for item in viral[:3]:
        try:
            detail = run_xhs("read", item["_read_url"])
            if detail.get("data"):
                verified_ids.append(item["id"])
        except Exception as exc:
            print(f"detail verification failed for {item['id']}: {exc}", file=sys.stderr)

    for item in viral:
        item["cover"] = download_cover(item.pop("_cover_url"), item["id"])
        item["verified"] = item["id"] in verified_ids
        item.pop("_read_url", None)

    snapshot = {
        "schema_version": 1,
        "platform": "小红书",
        "backend": "xhs-cli",
        "captured_at": now.isoformat(timespec="seconds"),
        "queries": list(args.queries),
        "query_counts": query_counts,
        "candidate_count": len(all_items),
        "viral_threshold": "点赞 >= 1000，或加权互动 >= 3000",
        "record_count": len(viral),
        "verified_sample_ids": verified_ids,
        "records": viral,
    }
    PUBLIC_DATA.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_DATA.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")
    (run_dir / "normalized-public.json").write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"ok": True, "record_count": len(viral), "verified_count": len(verified_ids), "public_data": str(PUBLIC_DATA), "private_raw": str(run_dir)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
