import { BaseActionHandler } from '../base.js';

export class WaitActions extends BaseActionHandler {
    async waitFor({ text, timeout = 5000 }) {
        const targets = Array.isArray(text) ? text : [text];
        const normalizedTargets = targets
            .map((value) => String(value || '').trim())
            .filter(Boolean);

        if (normalizedTargets.length === 0) {
            return "Error: 'text' must include at least one non-empty value.";
        }

        const timeoutMs = Number.isFinite(timeout) && timeout > 0 ? timeout : 5000;
        const result = await this.cmd('Runtime.evaluate', {
            expression: `
                (async () => {
                    const targets = ${JSON.stringify(normalizedTargets)};
                    const timeoutMs = ${JSON.stringify(timeoutMs)};
                    const getPageText = () => document.body ? document.body.innerText || document.body.textContent || '' : '';
                    const findMatch = () => targets.find((target) => getPageText().includes(target)) || null;
                    const existing = findMatch();
                    if (existing) return existing;

                    return await new Promise((resolve) => {
                        const startedAt = Date.now();
                        let done = false;
                        let observer = null;

                        const finish = (value) => {
                            if (done) return;
                            done = true;
                            if (observer) observer.disconnect();
                            resolve(value);
                        };

                        const check = () => {
                            const match = findMatch();
                            if (match) finish(match);
                        };

                        if (document.body) {
                            observer = new MutationObserver(check);
                            observer.observe(document.body, {
                                childList: true,
                                subtree: true,
                                characterData: true,
                            });
                        }

                        setTimeout(() => finish(null), Math.max(0, timeoutMs - (Date.now() - startedAt)));
                    });
                })()
            `,
            awaitPromise: true,
            returnByValue: true,
        });

        const matchedText = result?.result?.value;
        if (matchedText) {
            return `Found text: ${matchedText}`;
        }

        return `Timed out waiting for text: ${normalizedTargets.join(', ')}`;
    }
}
