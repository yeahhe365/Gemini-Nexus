# Gemini Web Reverse Contract

Last verified: 2026-08-22 (Gemini 3.7 Flash model contract captured from a live `StreamGenerate` request; older model hashes cross-checked against public reverse catalogs; protocol tokens last captured with `js-reverse` on 2026-05-26, `https://gemini.google.com/app`, locale `zh-CN`).

This document records the Gemini Web assumptions used by the reverse provider. Gemini Web is not a public API, so these details should be treated as a contract that can drift.

## Current Scope

Supported:

- Reuse the logged-in Gemini Web session.
- Send text prompts through `StreamGenerate`.
- Select Gemini Web thinking depth through the native `x-goog-ext-525001261-jspb` side-channel.
- Send Gemini Web temporary-chat requests so native Gemini does not add them to Recent chats.
- Upload image attachments through the current push upload endpoint before `StreamGenerate`.
- Parse streamed text, thoughts, continuation ids, and hosted generated-image URLs.
- Expose the current Gemini Web chat modes:
    - `56fdd199312815e2` -> `3.7 Flash`
    - `fbb127bbb056c959` -> `3.6 Flash` (default)
    - `cf41b0e0dd7d53e5` -> `3.5 Flash-Lite`
    - `e6fa609c3fa255c0` -> `3.1 Pro`

Not claimed as complete:

- Native Gemini Web `ProcessFile` flow. The live app still registers `ProcessFile` (`LbusCb`) and may use it for PDF/text/document paths, but Gemini Nexus currently uploads image attachments through `https://push.clients6.google.com/upload/` and rejects non-image attachments for the Web provider.
- Removed image-preview model routing. `gemini-3.1-flash-image-preview` and `gemini-3-pro-image-preview-11-2025` are intentionally rejected by the Web provider until their current Web request contract is revalidated.
- Native three-id Web conversation continuation. Local history is folded into the prompt because the live Web client rejects the old three-id continuation payload without extra UI-only context.

## Page Tokens

`services/auth.js` extracts these values from the Gemini Web HTML:

| Field              | HTML key | Purpose                       |
| :----------------- | :------- | :---------------------------- |
| `atValue`          | `SNlM0e` | POST body `at` token          |
| `blValue`          | `cfb2h`  | `bl` query value              |
| `fSid`             | `FdrFJe` | `f.sid` query value           |
| `uploadPushId`     | `qKIAYe` | upload `Push-ID` header       |
| `uploadClientPctx` | `Ylro7b` | upload `X-Client-Pctx` header |

The page currently exposes `cfb2h` values like `boq_assistant-bard-web-server_20260521.02_p1`.

## StreamGenerate

The live `BardChatUi` script registers:

- `/assistant.lamda.BardFrontendService/StreamGenerate` -> `RxAFq`
- `/assistant.lamda.BardFrontendService/ProcessFile` -> `LbusCb`

Gemini Nexus posts to:

```text
https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate
```

The Web provider sends these side-channel headers:

- `x-goog-ext-525001261-jspb`
- `x-goog-ext-525005358-jspb`
- `x-goog-ext-73010989-jspb`
- `x-goog-ext-73010990-jspb`

`x-goog-ext-525001261-jspb` carries the selected model hash plus mode and thinking fields. The model catalog lives in `shared/models/web_model_catalog.js` and is the single source for background, sandbox UI, and content toolbar model options.

Current field observations from `BardChatUi`:

| Zero-based index | Meaning                                    |
| :--------------- | :----------------------------------------- |
| `4`              | Selected model hash                        |
| `7`              | Temporary-chat flag                        |
| `8`              | Client capabilities; 3.7 Flash currently uses `[4,5,6,8,4,5,6,8]` |
| `11`             | Legacy model/mode value retained by Nexus  |
| `14`             | Native mode category                       |
| `15`             | Native thinking level                      |
| `16`             | Request UUID                               |

The native Gemini Web thinking enum is:

| Native value | Live script name            | Nexus level mapping         |
| :----------- | :-------------------------- | :-------------------------- |
| `1`          | `THINKING_LEVEL_STANDARD`   | `minimal`, `low`            |
| `2`          | `THINKING_LEVEL_EXTENDED`   | `medium`, `high`            |
| `3`          | `THINKING_LEVEL_DEEP_THINK` | Reserved; not used by Nexus |

Gemini Nexus does not prepend hidden thinking instructions to user prompts. The prompt body is sent as authored by the user; thinking depth is controlled by the native side-channel above.

## Temporary Chat

When the Gemini Web temporary-chat switch is enabled, Nexus mirrors the native page behavior in two places:

- `f.req` inner request payload: zero-based index `45` is set to `true` (proto field 46).
- `x-goog-ext-525001261-jspb`: zero-based index `7` is set to `true`.

The live page script also exposes UI markers such as `gemini_chat_temp`, `is-temporary-chat`, `temporary-chat-header`, and `disable_temp_chat_soft_badge`. These strings are included in the manual drift checker so future Gemini Web changes flag the feature for revalidation.

## Uploads

Current upload flow:

```text
POST https://push.clients6.google.com/upload/
Push-ID: <qKIAYe>
X-Tenant-Id: bard-storage
X-Client-Pctx: <Ylro7b>
X-Goog-Upload-Protocol: resumable
X-Goog-Upload-Command: start
```

Then:

```text
POST <X-Goog-Upload-URL>
X-Goog-Upload-Command: upload, finalize
X-Goog-Upload-Offset: 0
```

The returned `/contrib_service/ttl_1d/...` identifier is inserted into the `StreamGenerate` payload.

## Drift Check

Use the manual drift checker after a Gemini Web update or js-reverse session:

```bash
npm run check:gemini-web -- --html /path/to/gemini-app.html --script /path/to/bard-chat-ui.js
```

For a quick network fetch of the page HTML:

```bash
npm run check:gemini-web -- --url https://gemini.google.com/app
```

Node does not automatically share your interactive Chrome cookies. Use saved js-reverse HTML and script artifacts for logged-in token and script validation. The script intentionally is not part of `npm run check`, because it can require network access, a logged-in browser session, or saved js-reverse artifacts.

## Update Checklist

When Gemini Web drifts:

1. Re-run js-reverse on `https://gemini.google.com/app`.
2. Verify the page tokens above still exist.
3. Verify `StreamGenerate`, `ProcessFile`, upload endpoint, side-channel headers, native thinking markers, temporary-chat markers, and visible model menu entries.
4. Update `shared/models/web_model_catalog.js` if model hashes or labels changed.
5. Update `services/providers/web.js`, `services/upload.js`, or `services/parser.js` only after capturing the new request/response shape.
6. Update this document's verification date and run the relevant tests.
