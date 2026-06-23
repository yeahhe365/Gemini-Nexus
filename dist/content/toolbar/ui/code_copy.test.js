// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

async function installCodeCopyHandler() {
    await import('./code_copy.js');
}

function renderCodeBlock() {
    document.body.innerHTML = `
        <div class="code-block-wrapper">
            <button class="copy-code-btn">Copy</button>
            <pre><code>const answer = 42;</code></pre>
        </div>
    `;
}

describe('CodeCopyHandler', () => {
    beforeEach(async () => {
        vi.resetModules();
        renderCodeBlock();
        globalThis.navigator.clipboard = {
            writeText: vi.fn(async () => {}),
        };
        globalThis.window.GeminiToolbarStrings = {
            copied: 'Copied!',
        };
        globalThis.window.GeminiCopyFeedback = {
            showCopied: vi.fn(),
        };
        await installCodeCopyHandler();
    });

    it('copies the closest wrapped code block and shows feedback on the clicked button', async () => {
        const handler = new window.GeminiCodeCopyHandler();
        const copyButton = document.querySelector('.copy-code-btn');

        handler.handle({
            target: copyButton,
        });
        await Promise.resolve();

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const answer = 42;');
        expect(window.GeminiCopyFeedback.showCopied).toHaveBeenCalledWith(copyButton, 'Copied!');
    });

    it('ignores clicks outside copy buttons', () => {
        const handler = new window.GeminiCodeCopyHandler();

        handler.handle({
            target: document.body,
        });

        expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
        expect(window.GeminiCopyFeedback.showCopied).not.toHaveBeenCalled();
    });
});
