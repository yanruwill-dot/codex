# OPC 获客智能体 Auth Proxy

GitHub Pages 是静态站点，不能直接读取本机 Codex 或 ChatGPT 登录态。要自动连接 GPT auth，请在同域或反向代理下提供 `/api/openai` 服务，前端会优先使用它；不可用时才提示输入 OpenAI API Key。

## Endpoints

`GET /api/openai/status`

```json
{ "ok": true, "model": "gpt-5.5" }
```

`POST /api/openai/responses`

Request:

```json
{
  "instructions": "system prompt",
  "input": "user input",
  "json": false,
  "models": ["gpt-5.5", "gpt-5.1", "gpt-4.1-mini"]
}
```

Response may be a normal OpenAI Responses API payload, or a compact shape:

```json
{ "output_text": "generated content" }
```

`POST /api/openai/images`

Request:

```json
{ "prompt": "image prompt", "size": "1536x1024" }
```

Response:

```json
{ "data": [{ "b64_json": "..." }] }
```

## Security

Do not expose OpenAI API keys, Codex tokens, or session cookies in frontend code. Keep secrets on the server side and let the browser call only the proxy endpoints above.
