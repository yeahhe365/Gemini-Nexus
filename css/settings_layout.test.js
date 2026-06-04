import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';

const readCss = (file) => {
    const relativePath = file.startsWith('./') ? file : `./${file}`;
    return readFile(new URL(relativePath, import.meta.url), 'utf8');
};

describe('settings layout styles', () => {
    it('keeps modal scrolling vertical and contained', async () => {
        const settingsCss = await readCss('./settings.css');

        expect(settingsCss).toMatch(
            /\.settings-modal\s+\[hidden\]\s*{[^}]*display:\s*none\s*!important/s
        );
        expect(settingsCss).toMatch(
            /\.settings-content\s+\[hidden\]\s*{[^}]*display:\s*none\s*!important/s
        );
        expect(settingsCss).toMatch(/\.settings-content\s*{[^}]*overflow:\s*hidden/s);
        expect(settingsCss).toMatch(/\.settings-content\s*{[^}]*min-height:\s*0/s);
        expect(settingsCss).toMatch(/\.settings-body\s*{[^}]*min-height:\s*0/s);
        expect(settingsCss).toMatch(/\.settings-body\s*{[^}]*overflow-x:\s*hidden/s);
        expect(settingsCss).toMatch(/\.settings-body\s*{[^}]*padding:\s*16px 20px 24px/s);
    });

    it('keeps the redesigned settings shell dense and task-focused', async () => {
        const settingsCss = await readCss('./settings.css');
        const controlsCss = await readCss('./settings_controls.css');

        expect(settingsCss).toMatch(
            /\.settings-content\.split-layout\s*{[^}]*width:\s*min\(920px,\s*calc\(100vw - 32px\)\)/s
        );
        expect(settingsCss).toMatch(
            /\.settings-content\.split-layout\s*{[^}]*border-radius:\s*8px/s
        );
        expect(settingsCss).toMatch(/\.settings-page\s*{[^}]*align-items:\s*center/s);
        expect(settingsCss).toMatch(/\.settings-page\s*{[^}]*padding:\s*24px/s);
        expect(settingsCss).toMatch(/\.settings-page\s*{[^}]*background:\s*var\(--bg-body\)/s);
        expect(settingsCss).toMatch(
            /\.settings-page\s+\.settings-content\s*{[^}]*min-height:\s*0/s
        );
        expect(settingsCss).not.toContain('min-height: 100vh;');
        expect(settingsCss).not.toContain('var(--bg-primary)');
        expect(settingsCss).toMatch(
            /\.settings-main\s+\.settings-header\s*{[^}]*position:\s*sticky/s
        );
        expect(settingsCss).toMatch(/\.settings-sidebar\s*{[^}]*width:\s*232px/s);
        expect(controlsCss).toMatch(/\.setting-panel\s*{[^}]*border-radius:\s*8px/s);
        expect(controlsCss).not.toMatch(/\.setting-panel\s*{[^}]*transform:/s);
    });

    it('keeps the settings surface quiet instead of framed by many divider lines', async () => {
        const settingsCss = await readCss('./settings.css');
        const controlsCss = await readCss('./settings_controls.css');
        const formsCss = await readCss('./settings_forms.css');
        const mcpCss = await readCss('./settings_mcp.css');
        const customToolsCss = await readCss('./settings_custom_tools.css');

        expect(settingsCss).toMatch(/\.settings-content\.split-layout\s*{[^}]*border:\s*none/s);
        expect(settingsCss).toMatch(/\.settings-sidebar\s*{[^}]*border-right:\s*none/s);
        expect(settingsCss).toMatch(/\.settings-sidebar-header\s*{[^}]*border-bottom:\s*none/s);
        expect(settingsCss).toMatch(
            /\.settings-main\s+\.settings-header\s*{[^}]*border-bottom:\s*none/s
        );
        expect(settingsCss).not.toContain('.settings-tab.active::after');
        expect(controlsCss).toMatch(/\.setting-panel\s*{[^}]*border:\s*none/s);
        expect(controlsCss).toMatch(
            /\.setting-panel\s+\.settings-section-offset\s*{[^}]*border-top:\s*none/s
        );
        expect(formsCss).toMatch(/\.setting-radio-option\s*{[^}]*border:\s*none/s);
        expect(formsCss).toMatch(/\.setting-shortcut-row\s*{[^}]*border:\s*none/s);
        expect(mcpCss).toMatch(/\.mcp-tool-list\s*{[^}]*border:\s*none/s);
        expect(mcpCss).toMatch(/\.mcp-tool-group\s*{[^}]*border:\s*none/s);
        expect(customToolsCss).toMatch(/\.custom-selection-tool-row\s*{[^}]*border:\s*none/s);
    });

    it('keeps mobile settings navigation compact without nested card treatment', async () => {
        const settingsCss = await readCss('./settings.css');

        expect(settingsCss).toMatch(
            /@media\s*\(max-width:\s*720px\)[\s\S]*\.settings-sidebar\s*{[^}]*padding:\s*10px 12px/s
        );
        expect(settingsCss).toMatch(
            /@media\s*\(max-width:\s*720px\)[\s\S]*\.settings-main\s+\.settings-body\s*{[^}]*padding:\s*16px/s
        );
        expect(settingsCss).not.toContain('border-radius: 24px');
        expect(settingsCss).not.toContain('linear-gradient(135deg, var(--primary), #a855f7)');
    });

    it('lets settings form controls override compact shortcut widths', async () => {
        const formsCss = await readCss('./settings_forms.css');

        expect(formsCss).toMatch(/\.settings-input\.settings-full-input\s*{[^}]*width:\s*100%/s);
        expect(formsCss).toMatch(/\.settings-input\.settings-select\s*{[^}]*width:\s*100%/s);
    });

    it('hides webpage-context controls only when no page context is available', async () => {
        const inputCss = await readCss('./input.css');
        const headerCss = await readCss('./header.css');

        expect(inputCss).not.toMatch(/body\.host-tab\s+\.tool-btn\.context-aware/s);
        expect(inputCss).toMatch(
            /body:not\(\.has-page-context\)\s+\.tool-btn\.context-aware\s*{[^}]*display:\s*none/s
        );
        expect(inputCss).not.toMatch(/body\.layout-wide\s+\.tool-btn\.context-aware/s);
        expect(headerCss).toMatch(
            /body\.host-tab:not\(\.has-page-context\)\s+#open-full-page-btn\s*{[^}]*display:\s*none/s
        );
        expect(headerCss).not.toMatch(
            /@media\s*\(max-width:\s*600px\)[\s\S]*#open-full-page-btn\s*{[^}]*display:\s*none/s
        );
        expect(headerCss).not.toContain('.corner-btn');
    });
});
