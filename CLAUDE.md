# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Install dependencies: `npm install`
- Start Vite dev server: `npm run dev`
- Build Vite UI output into `dist/`: `npm run build`
  - Important: if the user will load `dist/` as an unpacked extension, run `./copy-to-dist.bat <<< ""` immediately after every build. The Vite build alone does not copy all extension runtime files.
- Build a complete unpacked extension artifact: `npm run package:extension`
  - Load `artifacts/chrome-extension` in Chrome for release/manual install flows.
  - `npm run build` alone only builds Vite-managed pages and is not a complete extension directory.
- Development helper after `npm run build`: `./copy-to-dist.bat <<< ""`
  - Copies required extension files into `dist/`: `manifest.json`, `background/`, `content/`, `shared/`, `services/`, `assets/`, and `vendor/`.
  - Run this whenever source changes need to be tested from `dist/` in Chrome.
  - The batch file pauses for a keypress; feed a newline when running from bash.
- Run all tests: `npm test`
- Run one test file: `npm test -- sandbox/controllers/message_handler.test.js`
- Run tests by name: `npm test -- sandbox/controllers/message_handler.test.js -t "renders a final reply"`
- Watch tests: `npm run test:watch`
- Format all files: `npm run format`
- Check formatting: `npm run format:check`
- Unused code scan: `npm run lint:unused`
- Full local check: `npm run check`
- Gemini Web reverse-engineering drift check: `npm run check:gemini-web`
- Package for Chrome Web Store: `npm run package:extension`
- Publish package via Chrome Web Store API: `npm run publish:chrome-webstore`

## Architecture Overview

Gemini Nexus is a Chrome MV3 extension. Runtime code is split by Chrome execution environment, with shared utilities factored under `shared/`.

- `manifest.json` is the extension manifest. Keep its `version` synchronized with `package.json` and `package-lock.json`.
- `vite.config.ts` builds the Vite pages: `sidepanel/index.html`, `sandbox/index.html`, and `settings/index.html`. It also copies `sidepanel/preload.js` during build.
- `background/index.js` is the service worker entry. Background code is responsible for provider dispatch, session prompt loops, browser-control tooling, MCP connections, content-script injection, storage, and Chrome API interactions.
- `sidepanel/` is the extension host page. It manages bridge/state concerns and embeds the isolated chat UI frame.
- `sandbox/` is the isolated chat application and renderer. It owns chat/session UI, markdown/math/code rendering, settings UI, sidebars, input handling, and stream display.
- `content/` injects page-facing scripts such as the selection toolbar and page/image helpers.
- `services/` contains provider adapters and low-level Gemini Web/API/OpenAI-compatible/Anthropic/Web upload/auth/parsing logic.
- `shared/` contains cross-runtime utilities grouped by capability. Use directory `index.js` aggregation entry points instead of adding top-level compatibility files.
- Runtime source filenames generally use `snake_case`; tooling scripts may use `kebab-case`.

## Prompt / Session / Provider Flow

The main chat pipeline crosses several layers:

1. The sandbox UI creates request payloads in `sandbox/controllers/prompt.js` and sends runtime messages through `shared/messaging/`.
2. `background/handlers/session/index.js` routes `SEND_PROMPT`, `CANCEL_PROMPT`, context, quick ask, and TTS messages.
3. `background/handlers/session/prompt_handler.js` builds prompts, runs the tool loop, persists final replies, and emits `GEMINI_STREAM_UPDATE` / `GEMINI_REPLY` messages.
4. `background/managers/session_manager.js` owns auth setup and delegates each request to `background/managers/session/request_dispatcher.js`.
5. `request_dispatcher.js` selects the active provider implementation under `services/providers/` and handles managed context via `background/managers/session/context_manager.js`.
6. `sandbox/controllers/message_handler.js` receives stream/final messages and renders only messages belonging to the visible session while caching background session streams.

Session state is `sessionId`-keyed. Avoid reintroducing single global active-run assumptions: active runs, abort controllers, stream state, cancellation, context, and selected models should be scoped to the relevant session when possible.

## Browser Control and MCP

- Browser-control commands live under `background/control/` and use Chrome DevTools Protocol plus accessibility snapshots. `background/managers/control_manager.js` manages the controlled tab/group state.
- Tool execution for model-emitted JSON tool calls is coordinated from `background/handlers/session/prompt/tool_executor.js` and `tool_loop.js`.
- External MCP support lives under `background/managers/mcp/` and `background/managers/mcp_remote_manager.js`. Multi-server MCP can expose tools by server-specific names.

## Provider Notes

- Provider adapters live in `services/providers/`:
  - Gemini Web reverse provider: `web.js`
  - Gemini official API: `official.js`
  - OpenAI-compatible and dedicated OpenAI-like providers: `openai_compatible.js`
  - Anthropic native Messages API: `anthropic.js`
- Provider/model settings are normalized through `shared/settings/` and `shared/models/`.
- Gemini Web behavior is reverse engineered and can drift. Consult `docs/gemini-web-reverse.md` and run `npm run check:gemini-web` when changing Web-provider auth, upload, RPC, model hash, or temporary-chat code.

## Packaging and Dist

- `dist/` is generated output and changes whenever `npm run build` runs.
- `npm run package:extension` is the canonical complete packaging path and writes `artifacts/chrome-extension`.
- `copy-to-dist.bat` is a local development convenience for loading `dist/` directly as an unpacked extension after a Vite build.

## Testing Structure

Tests are colocated as `*.test.js` near the code they cover. Vite/Vitest uses `test/setup.js` and excludes `dist/` and `artifacts/`. Prefer targeted tests for changed areas before running the full suite.

Common targeted areas:

- Prompt/session UI: `sandbox/controllers/prompt.test.js`, `sandbox/controllers/message_handler.test.js`, `sandbox/controllers/session_flow.test.js`
- Sidebar/input UI: `sandbox/ui/sidebar.test.js`, `sandbox/boot/input_events.test.js`
- Background prompt/session orchestration: `background/handlers/session/prompt_handler.test.js`, `background/managers/session_manager.test.js`, `background/managers/session/request_dispatcher.test.js`
- Provider adapters: `services/providers/*.test.js`
- Packaging/runtime invariants: `scripts/*.test.js`
