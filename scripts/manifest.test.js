import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

async function listJavaScriptFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = await Promise.all(
        entries.map(async (entry) => {
            const entryPath = path.join(directory, entry.name);

            if (entry.isDirectory()) {
                return listJavaScriptFiles(entryPath);
            }

            if (entry.isFile() && entryPath.endsWith('.js') && !entryPath.endsWith('.test.js')) {
                return [entryPath.split(path.sep).join('/')];
            }

            return [];
        })
    );

    return files.flat().sort();
}

const classicContentSupportFiles = [
    'shared/config/constants_global.js',
    'shared/dom/crop_global.js',
    'shared/media/watermark_remover_global.js',
    'shared/media/youtube_global.js',
    'shared/models/web_model_catalog.js',
    'shared/models/web_thinking_global.js',
    'shared/ui/copy_feedback.js',
    'shared/utils/id_global.js',
];

describe('manifest content scripts', () => {
    it('declares the native tab group permission used by browser control', async () => {
        const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));

        expect(manifest.permissions).toContain('tabGroups');
    });

    it('declares an Alt shortcut for quick ask', async () => {
        const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));

        expect(manifest.commands['quick-ask'].suggested_key).toEqual({
            default: 'Alt+Q',
            mac: 'Alt+Q',
        });
    });

    it('declares a browser-level shortcut for area OCR', async () => {
        const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));

        expect(manifest.commands['area-ocr'].suggested_key).toEqual({
            default: 'Alt+O',
            mac: 'Alt+O',
        });
    });

    it('uses Chromium-compatible macOS command modifiers', async () => {
        const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
        const macShortcuts = Object.values(manifest.commands).flatMap((command) =>
            command.suggested_key?.mac ? [command.suggested_key.mac] : []
        );

        expect(macShortcuts).not.toContain('Option+Q');
        expect(macShortcuts).not.toContain('Option+O');
    });

    it('uses explicit icon assets for each manifest icon size', async () => {
        const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));

        expect(manifest.icons).toEqual({
            16: 'assets/icons/icon-16.png',
            32: 'assets/icons/icon-32.png',
            48: 'assets/icons/icon-48.png',
            128: 'assets/icons/icon-128.png',
        });
        expect(manifest.action.default_icon).toEqual({
            16: 'assets/icons/icon-16.png',
            32: 'assets/icons/icon-32.png',
            48: 'assets/icons/icon-48.png',
            128: 'assets/icons/icon-128.png',
        });
    });

    it('does not request the downloads permission when downloads use DOM anchors', async () => {
        const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));

        expect(manifest.permissions).not.toContain('downloads');
    });

    it('does not repeat host permissions already covered by all urls', async () => {
        const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));

        expect(manifest.host_permissions).toContain('<all_urls>');
        expect(manifest.host_permissions).not.toContain('https://gemini.google.com/*');
    });

    it('does not inject content scripts into local MHTML archives', async () => {
        const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));

        for (const entry of manifest.content_scripts) {
            expect(entry.exclude_globs).toEqual(
                expect.arrayContaining(['*.mhtml*', '*.mht*', '*.MHTML*', '*.MHT*'])
            );
        }
    });

    it('uses a lightweight all-frame bridge for iframe shortcut capture', async () => {
        const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
        const bridgeEntry = manifest.content_scripts.find((entry) =>
            entry.js?.includes('content/shortcut_frame_bridge.js')
        );

        expect(bridgeEntry).toMatchObject({
            matches: ['<all_urls>'],
            js: ['content/shortcut_frame_bridge.js'],
            run_at: 'document_start',
            all_frames: true,
            match_about_blank: true,
        });
    });

    it('runs the Gemini page watermark cleanup in the main world only on Gemini pages', async () => {
        const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
        const geminiEntry = manifest.content_scripts.find((entry) =>
            entry.js?.includes('content/gemini_watermark_page.js')
        );

        expect(geminiEntry).toMatchObject({
            matches: ['https://gemini.google.com/*', 'https://business.gemini.google/*'],
            js: [
                'content/gemini_watermark_page.js',
                'vendor/gemini-watermark-remover/content_main.js',
            ],
            run_at: 'document_start',
            world: 'MAIN',
        });
    });

    it('runs the Gemini watermark bridge in an isolated document-start script', async () => {
        const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
        const geminiBridgeEntry = manifest.content_scripts.find((entry) =>
            entry.js?.includes('content/gemini_watermark_bridge.js')
        );

        expect(geminiBridgeEntry).toMatchObject({
            matches: ['https://gemini.google.com/*', 'https://business.gemini.google/*'],
            js: ['content/gemini_watermark_bridge.js'],
            run_at: 'document_start',
        });
        expect(geminiBridgeEntry.world).toBeUndefined();
    });

    it('loads the page guard before any content script with side effects', async () => {
        const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
        const listedFiles = manifest.content_scripts.flatMap((entry) => entry.js ?? []);

        expect(listedFiles[0]).toBe('content/page_guard.js');
        expect(listedFiles.indexOf('content/page_guard.js')).toBeLessThan(
            listedFiles.indexOf('content/shortcuts.js')
        );
        expect(listedFiles.indexOf('content/page_guard.js')).toBeLessThan(
            listedFiles.indexOf('content/index.js')
        );
    });

    it('lists every runtime content script file exactly once', async () => {
        const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
        const listedFiles = manifest.content_scripts.flatMap((entry) => entry.js ?? []);
        const uniqueListedFiles = [...new Set(listedFiles)].sort();
        const runtimeContentFiles = [
            ...(await listJavaScriptFiles('content')),
            ...classicContentSupportFiles,
            'vendor/gemini-watermark-remover/content_main.js',
            'vendor/gemini-watermark-remover/page_process_runtime.js',
        ].sort();

        expect(listedFiles).toHaveLength(uniqueListedFiles.length);
        expect(uniqueListedFiles).toEqual(runtimeContentFiles);
    });

    it('loads content model metadata before scripts that render or submit model choices', async () => {
        const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
        const listedFiles = manifest.content_scripts.flatMap((entry) => entry.js ?? []);
        const configIndex = listedFiles.indexOf('shared/config/constants_global.js');
        const catalogIndex = listedFiles.indexOf('shared/models/web_model_catalog.js');
        const thinkingIndex = listedFiles.indexOf('shared/models/web_thinking_global.js');
        const modelOptionsIndex = listedFiles.indexOf('content/toolbar/model_options.js');

        expect(configIndex).toBeGreaterThan(-1);
        expect(catalogIndex).toBeGreaterThan(-1);
        expect(thinkingIndex).toBeGreaterThan(-1);
        expect(modelOptionsIndex).toBeGreaterThan(-1);
        expect(configIndex).toBeLessThan(catalogIndex);
        expect(catalogIndex).toBeLessThan(thinkingIndex);
        expect(thinkingIndex).toBeLessThan(modelOptionsIndex);
        for (const dependentFile of [
            'content/toolbar/templates.js',
            'content/toolbar/ui/toolbar_ui.js',
            'content/toolbar/actions.js',
        ]) {
            expect(modelOptionsIndex).toBeLessThan(listedFiles.indexOf(dependentFile));
        }
    });

    it('loads YouTube summary helpers before the page summary controller', async () => {
        const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
        const listedFiles = manifest.content_scripts.flatMap((entry) => entry.js ?? []);
        const controllerIndex = listedFiles.indexOf('content/youtube_summary.js');

        expect(controllerIndex).toBeGreaterThan(-1);
        for (const helperFile of [
            'shared/config/constants_global.js',
            'shared/models/web_model_catalog.js',
            'shared/media/youtube_global.js',
            'content/youtube_summary_i18n.js',
            'content/youtube_summary_model.js',
            'content/youtube_summary_render.js',
            'content/youtube_summary_view.js',
        ]) {
            expect(listedFiles.indexOf(helperFile), helperFile).toBeLessThan(controllerIndex);
        }
    });

    it('loads content toolbar layout helpers before toolbar view controllers', async () => {
        const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
        const listedFiles = manifest.content_scripts.flatMap((entry) => entry.js ?? []);
        const layoutIndex = listedFiles.indexOf('content/toolbar/view/layout.js');

        expect(layoutIndex).toBeGreaterThan(-1);
        expect(listedFiles).not.toContain('content/toolbar/view/utils.js');
        for (const dependentFile of [
            'content/toolbar/view/widget.js',
            'content/toolbar/view/window.js',
            'content/toolbar/view/index.js',
            'content/toolbar/events.js',
        ]) {
            expect(layoutIndex).toBeLessThan(listedFiles.indexOf(dependentFile));
        }
    });

    it('loads content toolbar helper controllers before their consumers', async () => {
        const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
        const listedFiles = manifest.content_scripts.flatMap((entry) => entry.js ?? []);
        const dragControllerIndex = listedFiles.indexOf('content/toolbar/drag_controller.js');
        const inputManagerIndex = listedFiles.indexOf('content/toolbar/input_manager.js');
        const customSelectionToolsIndex = listedFiles.indexOf(
            'content/toolbar/ui/custom_selection_tools.js'
        );
        const translationTargetStoreIndex = listedFiles.indexOf(
            'content/toolbar/ui/translation_target_store.js'
        );

        expect(dragControllerIndex).toBeGreaterThan(-1);
        expect(inputManagerIndex).toBeGreaterThan(-1);
        expect(customSelectionToolsIndex).toBeGreaterThan(-1);
        expect(translationTargetStoreIndex).toBeGreaterThan(-1);
        expect(listedFiles).not.toContain('content/toolbar/utils/drag.js');
        expect(listedFiles).not.toContain('content/toolbar/utils/input.js');
        expect(dragControllerIndex).toBeLessThan(
            listedFiles.indexOf('content/toolbar/ui/toolbar_ui.js')
        );
        expect(customSelectionToolsIndex).toBeLessThan(
            listedFiles.indexOf('content/toolbar/ui/toolbar_ui.js')
        );
        expect(translationTargetStoreIndex).toBeLessThan(
            listedFiles.indexOf('content/toolbar/ui/toolbar_ui.js')
        );
        expect(inputManagerIndex).toBeLessThan(
            listedFiles.indexOf('content/toolbar/controller.js')
        );
    });

    it('only exposes web accessible resources that exist in the source tree', async () => {
        const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
        const resources = manifest.web_accessible_resources.flatMap(
            (entry) => entry.resources ?? []
        );

        for (const resource of resources) {
            const pathToCheck = resource.endsWith('/*') ? resource.slice(0, -2) : resource;
            await expect(stat(pathToCheck), resource).resolves.toBeTruthy();
        }
    });

    it('copies the toolbar logo into dist for unpacked extension loading', async () => {
        const copyScript = await readFile('copy-to-dist.bat', 'utf8');

        expect(copyScript).toContain('copy "%ROOT%logo.png" "%DIST%\\logo.png"');
    });
});
