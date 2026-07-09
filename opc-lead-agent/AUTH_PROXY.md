# OPC 获客智能体本机 Codex API

OPC 页面默认直连本机 Codex Relay：

`http://127.0.0.1:8787/api/openai`

如果本机 Relay 未配对，接口会返回：

```json
{"error":{"code":"unauthorized","message":"Pair this device with the Codex Relay server."}}
```

完成配对后，前端会优先走本机 Codex API；不可用时才提示输入 OpenAI API Key 或自定义代理地址。

## Endpoints

`GET /status`

```json
{ "ok": true, "model": "gpt-5.5" }
```

`POST /responses`

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

`POST /images`

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
