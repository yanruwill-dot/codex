#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import json
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any


BACKEND = "http://127.0.0.1:8789/v1/chat/completions"
HEALTH = "http://127.0.0.1:8789/health"
ONE_PIXEL_PNG = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8"
    "/x8AAwMCAO+/p9sAAAAASUVORK5CYII="
)


def json_bytes(payload: dict[str, Any]) -> bytes:
    return json.dumps(payload, ensure_ascii=False).encode("utf-8")


def post_json(url: str, payload: dict[str, Any], timeout: int) -> dict[str, Any]:
    req = urllib.request.Request(
        url,
        data=json_bytes(payload),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get_json(url: str, timeout: int) -> dict[str, Any]:
    with urllib.request.urlopen(url, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def extract_content(payload: dict[str, Any]) -> str:
    choices = payload.get("choices") or []
    if choices:
        message = choices[0].get("message") or {}
        content = message.get("content")
        if isinstance(content, str):
            return content
    return str(payload.get("output_text") or "")


class Handler(BaseHTTPRequestHandler):
    server_version = "OPCCodexShim/0.1"

    def _headers(self, status: int, content_type: str = "application/json; charset=utf-8") -> None:
        origin = self.headers.get("Origin") or "*"
        self.send_response(status)
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Content-Type", content_type)

    def _json(self, status: int, payload: dict[str, Any]) -> None:
        body = json_bytes(payload)
        self._headers(status)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self._headers(204)
        self.end_headers()

    def do_GET(self) -> None:
        if self.path.rstrip("/") in {"", "/api/openai", "/api/openai/status"}:
            try:
                backend = get_json(HEALTH, 8)
                self._json(200, {"ok": True, "provider": "opc-codex-shim", "backend": backend})
            except Exception as exc:
                self._json(502, {"ok": False, "error": {"message": str(exc)}})
            return
        self._json(404, {"error": {"message": "not found"}})

    def do_POST(self) -> None:
        length = int(self.headers.get("Content-Length", "0"))
        try:
            body = json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception as exc:
            self._json(400, {"error": {"message": f"invalid JSON: {exc}"}})
            return

        path = self.path.rstrip("/")
        if path == "/api/openai/responses":
            instructions = str(body.get("instructions") or "")
            user_input = str(body.get("input") or "")
            model = (body.get("models") or ["gpt-5.4-mini"])[0]
            prompt = user_input
            if body.get("json"):
                prompt += "\n\n请只输出合法 JSON，不要 Markdown 代码块。"
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": instructions},
                    {"role": "user", "content": prompt},
                ],
            }
            try:
                result = post_json(BACKEND, payload, timeout=220)
                text = extract_content(result)
                self._json(
                    200,
                    {
                        "output_text": text,
                        "choices": [{"message": {"content": text}}],
                        "raw": result,
                    },
                )
            except urllib.error.HTTPError as exc:
                detail = exc.read().decode("utf-8", errors="ignore")[-1200:]
                self._json(exc.code, {"error": {"message": detail or str(exc)}})
            except Exception as exc:
                self._json(502, {"error": {"message": str(exc)}})
            return

        if path == "/api/openai/images":
            self._json(200, {"data": [{"b64_json": ONE_PIXEL_PNG}], "note": "image generation placeholder from local OPC shim"})
            return

        self._json(404, {"error": {"message": "not found"}})


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8790)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"opc-codex-api-shim listening on http://{args.host}:{args.port}/api/openai", flush=True)
    server.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
