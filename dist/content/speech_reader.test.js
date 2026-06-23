import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';

async function installSpeechReader() {
    await import('./speech_reader.js');
}

describe('GeminiSpeechReader', () => {
    beforeEach(async () => {
        vi.resetModules();
        const dom = new JSDOM(
            '<!doctype html><html><body><main>Hello world. 你好世界。</main><script>ignored</script></body></html>'
        );
        globalThis.window = dom.window;
        globalThis.document = dom.window.document;
        Object.defineProperty(globalThis, 'navigator', {
            value: dom.window.navigator,
            configurable: true,
        });
        globalThis.SpeechSynthesisUtterance = class {
            constructor(text) {
                this.text = text;
            }
        };
        await installSpeechReader();
    });

    it('splits long text into readable chunks', () => {
        const chunks = window.GeminiSpeechReaderUtils.splitText(
            `${'a'.repeat(190)}. Short sentence.`
        );

        expect(chunks.length).toBeGreaterThan(1);
        expect(chunks.every((chunk) => chunk.length <= 180)).toBe(true);
    });

    it('reads page text while ignoring script content', () => {
        const text = window.GeminiSpeechReaderUtils.getPageText();

        expect(text).toContain('Hello world');
        expect(text).not.toContain('ignored');
    });

    it('starts reading text with the browser fallback and toggles to stop while speaking', async () => {
        const speechSynthesis = {
            speaking: false,
            cancel: vi.fn(),
            speak: vi.fn(),
        };
        const reader = new window.GeminiSpeechReader({ speechSynthesis, runtime: null });

        await expect(reader.readSelection('Hello world')).resolves.toEqual({
            status: 'started',
            title: 'Read selection',
            chunks: 1,
        });
        expect(speechSynthesis.speak).toHaveBeenCalledTimes(1);

        speechSynthesis.speaking = true;
        await expect(reader.readSelection('Hello again')).resolves.toEqual({
            status: 'stopped',
            title: 'Read selection',
        });
        expect(speechSynthesis.cancel).toHaveBeenCalledTimes(2);
    });

    it('uses Gemini Web TTS audio when the extension runtime is available', async () => {
        const runtime = {
            sendMessage: vi.fn(async () => ({
                status: 'success',
                audioBase64: btoa('ogg-data'),
                mimeType: 'audio/ogg',
            })),
        };
        const audio = {
            play: vi.fn(async () => {}),
            pause: vi.fn(),
            removeAttribute: vi.fn(),
        };
        const AudioCtor = vi.fn(() => audio);
        const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:tts');
        const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

        try {
            const reader = new window.GeminiSpeechReader({
                speechSynthesis: null,
                runtime,
                AudioCtor,
            });

            await expect(reader.readSelection('Hello from Gemini')).resolves.toEqual({
                status: 'started',
                title: 'Read selection',
                chunks: 1,
                provider: 'gemini',
            });

            expect(runtime.sendMessage).toHaveBeenCalledWith({
                action: 'GEMINI_TTS',
                text: 'Hello from Gemini',
                locale: navigator.language || 'zh-CN',
                sourcePath: '/app',
            });
            expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
            expect(AudioCtor).toHaveBeenCalledWith('blob:tts');
            expect(audio.play).toHaveBeenCalledTimes(1);
        } finally {
            createObjectURL.mockRestore();
            revokeObjectURL.mockRestore();
        }
    });
});
