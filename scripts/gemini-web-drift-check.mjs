#!/usr/bin/env node
// @ts-check
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import '../shared/models/web_model_catalog.js';

/**
 * @typedef {{ missingTokens: string[], tokenValues: Record<string, string | null>, locale: string | null }} HtmlReport
 * @typedef {{ hasStreamGenerateRpc: boolean, hasProcessFileRpc: boolean, hasPushUploadEndpoint: boolean, missingUploadHeaders: string[], missingStreamHeaders: string[], missingModelHashes: string[], missingThinkingMarkers: string[], missingTemporaryChatMarkers: string[] }} ScriptReport
 * @typedef {{ html: HtmlReport | null, script: ScriptReport | null }} SourceReport
 * @typedef {SourceReport & { ok: boolean, failures: string[] }} GeminiWebDriftReport
 */

export const GEMINI_WEB_EXPECTATIONS = Object.freeze({
    pageUrl: 'https://gemini.google.com/app',
    htmlTokens: Object.freeze(['SNlM0e', 'cfb2h', 'FdrFJe', 'qKIAYe', 'Ylro7b']),
    streamRpcPath: '/assistant.lamda.BardFrontendService/StreamGenerate',
    streamRpcId: 'RxAFq',
    processFileRpcPath: '/assistant.lamda.BardFrontendService/ProcessFile',
    processFileRpcId: 'LbusCb',
    uploadEndpoint: 'https://push.clients6.google.com/upload/',
    uploadHeaders: Object.freeze(['Push-ID', 'X-Tenant-Id', 'X-Client-Pctx']),
    streamHeaderExtensions: Object.freeze(['525001261', '525005358', '73010989', '73010990']),
    nativeThinkingMarkers: Object.freeze([
        'THINKING_LEVEL_STANDARD',
        'THINKING_LEVEL_EXTENDED',
        'THINKING_LEVEL_DEEP_THINK',
        'THINKING_LEVEL_MEDIUM',
    ]),
    temporaryChatMarkers: Object.freeze([
        'gemini_chat_temp',
        'is-temporary-chat',
        'temporary-chat-header',
        'disable_temp_chat_soft_badge',
    ]),
});

function extractConfiguredModelHashes() {
    const catalog =
        /** @type {{ GeminiNexusWebModelCatalog: { getSupportedWebModelValues: () => string[] } }} */ (
            /** @type {unknown} */ (globalThis)
        ).GeminiNexusWebModelCatalog;

    return /** @type {{ getSupportedWebModelValues: () => string[] }} */ (
        catalog
    ).getSupportedWebModelValues();
}

/**
 * @param {string} source
 * @param {string} value
 */
function hasString(source, value) {
    return String(source || '').includes(value);
}

/**
 * @param {string} source
 * @param {readonly string[] | string[]} values
 */
function collectMissing(source, values) {
    return values.filter((value) => !hasString(source, value));
}

/**
 * @param {string} html
 * @returns {HtmlReport}
 */
function inspectHtml(html) {
    /** @type {Record<string, string | null>} */
    const tokenValues = {};
    for (const token of GEMINI_WEB_EXPECTATIONS.htmlTokens) {
        const match = new RegExp(`"${token}"\\s*:\\s*"([^"]+)"`).exec(html);
        tokenValues[token] = match?.[1] || null;
    }

    return {
        missingTokens: GEMINI_WEB_EXPECTATIONS.htmlTokens.filter((token) => !tokenValues[token]),
        tokenValues,
        locale: html.match(/<html[^>]*\slang="([^"]+)"/)?.[1] || null,
    };
}

/**
 * @param {string} script
 * @returns {ScriptReport}
 */
function inspectScript(script) {
    const expectedModelHashes = extractConfiguredModelHashes();
    const missingStreamHeaders = collectMissing(
        script,
        GEMINI_WEB_EXPECTATIONS.streamHeaderExtensions
    );

    return {
        hasStreamGenerateRpc:
            hasString(script, GEMINI_WEB_EXPECTATIONS.streamRpcPath) &&
            hasString(script, GEMINI_WEB_EXPECTATIONS.streamRpcId),
        hasProcessFileRpc:
            hasString(script, GEMINI_WEB_EXPECTATIONS.processFileRpcPath) &&
            hasString(script, GEMINI_WEB_EXPECTATIONS.processFileRpcId),
        hasPushUploadEndpoint: hasString(script, GEMINI_WEB_EXPECTATIONS.uploadEndpoint),
        missingUploadHeaders: collectMissing(script, GEMINI_WEB_EXPECTATIONS.uploadHeaders),
        missingStreamHeaders,
        missingModelHashes: collectMissing(script, expectedModelHashes),
        missingThinkingMarkers: collectMissing(
            script,
            GEMINI_WEB_EXPECTATIONS.nativeThinkingMarkers
        ),
        missingTemporaryChatMarkers: collectMissing(
            script,
            GEMINI_WEB_EXPECTATIONS.temporaryChatMarkers
        ),
    };
}

/**
 * @param {SourceReport} report
 * @returns {string[]}
 */
function buildFailures(report) {
    /** @type {string[]} */
    const failures = [];

    if (!report.html && !report.script) {
        failures.push('No Gemini Web sources provided. Pass --html, --script, or --url.');
    }

    if (report.html?.missingTokens?.length) {
        failures.push(`Missing HTML tokens: ${report.html.missingTokens.join(', ')}`);
    }

    if (report.script) {
        if (!report.script.hasStreamGenerateRpc) {
            failures.push('Missing StreamGenerate RPC mapping.');
        }
        if (!report.script.hasProcessFileRpc) {
            failures.push('Missing ProcessFile RPC mapping.');
        }
        if (!report.script.hasPushUploadEndpoint) {
            failures.push('Missing current push upload endpoint.');
        }
        if (report.script.missingUploadHeaders.length) {
            failures.push(
                `Missing upload headers: ${report.script.missingUploadHeaders.join(', ')}`
            );
        }
        if (report.script.missingStreamHeaders.length) {
            failures.push(
                `Missing stream side-channel headers: ${report.script.missingStreamHeaders.join(', ')}`
            );
        }
        if (report.script.missingModelHashes.length) {
            failures.push(
                `Missing configured model hashes: ${report.script.missingModelHashes.join(', ')}`
            );
        }
        if (report.script.missingThinkingMarkers.length) {
            failures.push(
                `Missing native thinking markers: ${report.script.missingThinkingMarkers.join(', ')}`
            );
        }
        if (report.script.missingTemporaryChatMarkers.length) {
            failures.push(
                `Missing temporary chat markers: ${report.script.missingTemporaryChatMarkers.join(', ')}`
            );
        }
    }

    return failures;
}

/**
 * @param {{ html?: string, script?: string }} [sources]
 * @returns {GeminiWebDriftReport}
 */
export function inspectGeminiWebSources({ html = '', script = '' } = {}) {
    /** @type {SourceReport} */
    const report = {
        html: html ? inspectHtml(html) : null,
        script: script ? inspectScript(script) : null,
    };

    const failures = buildFailures(report);

    return {
        ...report,
        ok: failures.length === 0,
        failures,
    };
}

/**
 * @param {string[]} args
 * @returns {Promise<{ help?: boolean, html: string, script: string }>}
 */
async function readSourceFromArgs(args) {
    if (args.includes('--help') || args.includes('-h')) {
        return { help: true, html: '', script: '' };
    }

    /**
     * @param {string} flag
     */
    const getArgValue = (flag) => {
        const index = args.indexOf(flag);
        return index === -1 ? null : args[index + 1] || null;
    };

    const htmlFile = getArgValue('--html');
    const scriptFile = getArgValue('--script');
    const url = getArgValue('--url');

    let html = '';
    let script = '';

    if (htmlFile) {
        html = await readFile(htmlFile, 'utf8');
    } else if (url) {
        const response = await fetch(url, { credentials: 'include' });
        html = await response.text();
    }

    if (scriptFile) {
        script = await readFile(scriptFile, 'utf8');
    }

    return { html, script };
}

/**
 * @param {GeminiWebDriftReport} report
 */
function printReport(report) {
    const redactedHtml = report.html
        ? {
              ...report.html,
              tokenValues: Object.fromEntries(
                  Object.entries(report.html.tokenValues).map(([key, value]) => [
                      key,
                      value ? `${String(value).slice(0, 8)}...` : null,
                  ])
              ),
          }
        : null;

    console.log(
        JSON.stringify(
            {
                ok: report.ok,
                failures: report.failures,
                html: redactedHtml,
                script: report.script,
            },
            null,
            2
        )
    );
}

function printUsage() {
    console.log(`Usage:
  npm run check:gemini-web -- --html /path/to/gemini-app.html --script /path/to/bard-chat-ui.js
  npm run check:gemini-web -- --url https://gemini.google.com/app

Use saved js-reverse HTML/script artifacts for logged-in token and script contract validation.`);
}

async function main() {
    const sources = await readSourceFromArgs(process.argv.slice(2));
    if (sources.help) {
        printUsage();
        return;
    }
    const report = inspectGeminiWebSources(sources);
    printReport(report);

    if (!report.ok) {
        process.exitCode = 1;
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
}
