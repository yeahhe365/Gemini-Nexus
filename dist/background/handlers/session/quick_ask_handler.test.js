import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuickAskHandler } from './quick_ask_handler.js';
import { getActiveTabContent } from './active_tab_content.js';
import { appendTurnToHistory, saveToHistory } from '../../managers/history_manager.js';

vi.mock('../../managers/history_manager.js', () => ({
    appendTurnToHistory: vi.fn(),
    saveToHistory: vi.fn(),
}));

vi.mock('./active_tab_content.js', () => ({
    getActiveTabContent: vi.fn(),
}));

describe('QuickAskHandler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getActiveTabContent.mockResolvedValue(null);
        globalThis.chrome = {
            tabs: {
                sendMessage: vi.fn(() => Promise.resolve()),
            },
        };
    });

    it('streams text updates and final session id for quick ask requests', async () => {
        saveToHistory.mockResolvedValue({ id: 'saved-session' });
        const sessionManager = {
            resetContext: vi.fn(),
            ensureInitialized: vi.fn(),
            handleSendPrompt: vi.fn(async (request, onUpdate) => {
                onUpdate('partial text', 'partial thoughts');
                return { status: 'success', text: 'final text', thoughts: 'done' };
            }),
        };
        const handler = new QuickAskHandler(sessionManager, {});

        await handler.handleQuickAsk({ text: 'hello', model: 'gemini-test' }, { tab: { id: 42 } });

        expect(sessionManager.resetContext).toHaveBeenCalled();
        expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(42, {
            action: 'GEMINI_STREAM_UPDATE',
            text: 'partial text',
            thoughts: 'partial thoughts',
        });
        expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(42, {
            action: 'GEMINI_STREAM_DONE',
            result: { status: 'success', text: 'final text', thoughts: 'done' },
            sessionId: 'saved-session',
        });
    });

    it('preserves request source metadata on routed quick ask stream messages', async () => {
        saveToHistory.mockResolvedValue({ id: 'saved-session' });
        const sessionManager = {
            resetContext: vi.fn(),
            ensureInitialized: vi.fn(),
            handleSendPrompt: vi.fn(async (request, onUpdate) => {
                onUpdate('partial routed text', null);
                return { status: 'success', text: 'final routed text' };
            }),
        };
        const handler = new QuickAskHandler(sessionManager, {});

        await handler.handleQuickAsk(
            {
                text: 'summarize video',
                model: 'gemini-test',
                source: 'youtube-summary',
                requestId: 'youtube-summary-123',
            },
            { tab: { id: 42 } }
        );

        expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(42, {
            action: 'GEMINI_STREAM_UPDATE',
            text: 'partial routed text',
            thoughts: null,
            source: 'youtube-summary',
            requestId: 'youtube-summary-123',
        });
        expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(42, {
            action: 'GEMINI_STREAM_DONE',
            result: { status: 'success', text: 'final routed text' },
            source: 'youtube-summary',
            requestId: 'youtube-summary-123',
            sessionId: 'saved-session',
        });
    });

    it('appends continuing quick ask turns to the existing session instead of creating a new one', async () => {
        appendTurnToHistory.mockResolvedValue({ id: 'existing-session' });
        const sessionManager = {
            resetContext: vi.fn(),
            ensureInitialized: vi.fn(),
            handleSendPrompt: vi.fn(async () => ({
                status: 'success',
                text: 'follow-up answer',
                thoughts: null,
            })),
        };
        const handler = new QuickAskHandler(sessionManager, {});

        await handler.handleQuickAsk(
            { text: 'follow-up question', model: 'gemini-test', sessionId: 'existing-session' },
            { tab: { id: 42 } }
        );

        expect(sessionManager.resetContext).not.toHaveBeenCalled();
        expect(sessionManager.ensureInitialized).toHaveBeenCalled();
        expect(saveToHistory).not.toHaveBeenCalled();
        expect(appendTurnToHistory).toHaveBeenCalledWith(
            'existing-session',
            'follow-up question',
            {
                status: 'success',
                text: 'follow-up answer',
                thoughts: null,
            },
            null
        );
        expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(42, {
            action: 'GEMINI_STREAM_DONE',
            result: { status: 'success', text: 'follow-up answer', thoughts: null },
            sessionId: 'existing-session',
        });
    });

    it('injects page context for quick ask requests that ask for it', async () => {
        getActiveTabContent.mockResolvedValue('Page headline\nPage body');
        saveToHistory.mockResolvedValue({ id: 'saved-session' });
        const sessionManager = {
            resetContext: vi.fn(),
            ensureInitialized: vi.fn(),
            handleSendPrompt: vi.fn(async () => ({
                status: 'success',
                text: 'answer with page context',
            })),
        };
        const handler = new QuickAskHandler(sessionManager, {});

        await handler.handleQuickAsk(
            {
                text: 'What is this page about?',
                model: 'gemini-test',
                includePageContext: true,
            },
            { tab: { id: 42 } }
        );

        expect(getActiveTabContent).toHaveBeenCalledWith(42);
        expect(sessionManager.handleSendPrompt).toHaveBeenCalledWith(
            expect.objectContaining({
                text: 'What is this page about?',
                includePageContext: true,
                systemInstruction: expect.stringContaining('reference only'),
            }),
            expect.any(Function)
        );
        expect(sessionManager.handleSendPrompt).toHaveBeenCalledWith(
            expect.objectContaining({
                systemInstruction: expect.stringContaining('Page headline\nPage body'),
            }),
            expect.any(Function)
        );
    });

    it('streams a done error when a quick ask request fails before completion', async () => {
        const error = new Error('Prompt failed');
        const sessionManager = {
            resetContext: vi.fn(async () => {}),
            ensureInitialized: vi.fn(),
            handleSendPrompt: vi.fn(async () => {
                throw error;
            }),
        };
        const handler = new QuickAskHandler(sessionManager, {});
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
            await handler.handleQuickAsk(
                {
                    text: 'hello',
                    model: 'gemini-test',
                    source: 'toolbar',
                    requestId: 'quick-ask-1',
                },
                { tab: { id: 42 } }
            );

            expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(42, {
                action: 'GEMINI_STREAM_DONE',
                result: { status: 'error', text: 'Prompt failed' },
                source: 'toolbar',
                requestId: 'quick-ask-1',
            });
            expect(errorSpy).toHaveBeenCalledWith('[Gemini Nexus] Quick ask failed:', error);
        } finally {
            errorSpy.mockRestore();
        }
    });

    it('streams image quick ask errors as done messages', async () => {
        const sessionManager = {
            resetContext: vi.fn(),
            handleSendPrompt: vi.fn(),
        };
        const imageHandler = {
            fetchImage: vi.fn(async () => ({ error: 'not found' })),
        };
        const handler = new QuickAskHandler(sessionManager, imageHandler);

        await handler.handleQuickAskImage(
            { text: 'describe', url: 'https://example.test/image.png' },
            { tab: { id: 7 } }
        );

        expect(sessionManager.handleSendPrompt).not.toHaveBeenCalled();
        expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(7, {
            action: 'GEMINI_STREAM_DONE',
            result: { status: 'error', text: 'Failed to load image: not found' },
        });
    });

    it('streams a done error when image quick ask setup fails before completion', async () => {
        const error = new Error('Image fetch crashed');
        const sessionManager = {
            resetContext: vi.fn(),
            handleSendPrompt: vi.fn(),
        };
        const imageHandler = {
            fetchImage: vi.fn(async () => {
                throw error;
            }),
        };
        const handler = new QuickAskHandler(sessionManager, imageHandler);
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
            await handler.handleQuickAskImage(
                {
                    text: 'describe',
                    url: 'https://example.test/image.png',
                    source: 'toolbar',
                    requestId: 'image-quick-ask-1',
                },
                { tab: { id: 7 } }
            );

            expect(sessionManager.handleSendPrompt).not.toHaveBeenCalled();
            expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(7, {
                action: 'GEMINI_STREAM_DONE',
                result: { status: 'error', text: 'Image fetch crashed' },
                source: 'toolbar',
                requestId: 'image-quick-ask-1',
            });
            expect(errorSpy).toHaveBeenCalledWith('[Gemini Nexus] Image quick ask failed:', error);
        } finally {
            errorSpy.mockRestore();
        }
    });

    it('preserves OpenAI-compatible provider and model metadata for image quick asks', async () => {
        saveToHistory.mockResolvedValue({ id: 'saved-openai-image-session' });
        const sessionManager = {
            resetContext: vi.fn(),
            ensureInitialized: vi.fn(),
            handleSendPrompt: vi.fn(async () => ({
                status: 'success',
                text: 'image description',
                images: [],
            })),
        };
        const imageHandler = {
            fetchImage: vi.fn(async () => ({
                base64: 'data:image/png;base64,AAAA',
                type: 'image/png',
                name: 'image.png',
            })),
        };
        const handler = new QuickAskHandler(sessionManager, imageHandler);

        await handler.handleQuickAskImage(
            {
                text: 'Describe this image',
                url: 'https://example.test/image.png',
                model: 'grok-4.3',
                provider: 'openai',
                imageMode: 'analyze',
            },
            { tab: { id: 7 } }
        );

        expect(sessionManager.handleSendPrompt).toHaveBeenCalledWith(
            expect.objectContaining({
                text: 'Describe this image',
                model: 'grok-4.3',
                provider: 'openai',
                imageMode: 'analyze',
                files: [
                    {
                        base64: 'data:image/png;base64,AAAA',
                        type: 'image/png',
                        name: 'image.png',
                    },
                ],
            }),
            expect.any(Function)
        );
    });

    it('keeps only the primary generated image for image editing quick asks', async () => {
        saveToHistory.mockResolvedValue({ id: 'saved-edit-session' });
        const sessionManager = {
            resetContext: vi.fn(),
            handleSendPrompt: vi.fn(async () => ({
                status: 'success',
                text: '',
                images: [
                    { url: 'https://lh3.googleusercontent.com/generated-primary' },
                    { url: 'https://lh3.googleusercontent.com/generated-duplicate' },
                    { url: 'https://lh3.googleusercontent.com/original-reference' },
                ],
            })),
        };
        const imageHandler = {
            fetchImage: vi.fn(async () => ({
                base64: 'data:image/png;base64,AAAA',
                type: 'image/png',
                name: 'image.png',
            })),
        };
        const handler = new QuickAskHandler(sessionManager, imageHandler);

        await handler.handleQuickAskImage(
            {
                text: 'remove background',
                url: 'data:image/png;base64,AAAA',
                model: 'gemini-3-pro',
                imageMode: 'remove_bg',
            },
            { tab: { id: 7 } }
        );

        const expectedResult = {
            status: 'success',
            text: '',
            images: [{ url: 'https://lh3.googleusercontent.com/generated-primary' }],
        };
        expect(saveToHistory).toHaveBeenCalledWith('remove background', expectedResult, [
            { base64: 'data:image/png;base64,AAAA' },
        ]);
        expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(7, {
            action: 'GEMINI_STREAM_DONE',
            result: expectedResult,
            sessionId: 'saved-edit-session',
        });
    });

    it('appends continuing image quick ask turns to the existing session', async () => {
        appendTurnToHistory.mockResolvedValue({ id: 'existing-image-session' });
        const sessionManager = {
            resetContext: vi.fn(),
            ensureInitialized: vi.fn(),
            handleSendPrompt: vi.fn(async () => ({
                status: 'success',
                text: 'image follow-up answer',
                images: [],
            })),
        };
        const imageHandler = {
            fetchImage: vi.fn(async () => ({
                base64: 'data:image/png;base64,AAAA',
                type: 'image/png',
                name: 'image.png',
            })),
        };
        const handler = new QuickAskHandler(sessionManager, imageHandler);

        await handler.handleQuickAskImage(
            {
                text: 'What changed?',
                url: 'data:image/png;base64,AAAA',
                model: 'gemini-3-flash',
                imageMode: 'chat',
                sessionId: 'existing-image-session',
            },
            { tab: { id: 7 } }
        );

        expect(sessionManager.resetContext).not.toHaveBeenCalled();
        expect(sessionManager.ensureInitialized).toHaveBeenCalled();
        expect(sessionManager.handleSendPrompt).toHaveBeenCalledWith(
            expect.objectContaining({
                text: 'What changed?',
                sessionId: 'existing-image-session',
                files: [
                    {
                        base64: 'data:image/png;base64,AAAA',
                        type: 'image/png',
                        name: 'image.png',
                    },
                ],
            }),
            expect.any(Function)
        );
        expect(saveToHistory).not.toHaveBeenCalled();
        expect(appendTurnToHistory).toHaveBeenCalledWith(
            'existing-image-session',
            'What changed?',
            { status: 'success', text: 'image follow-up answer', images: [] },
            [{ base64: 'data:image/png;base64,AAAA' }]
        );
        expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(7, {
            action: 'GEMINI_STREAM_DONE',
            result: { status: 'success', text: 'image follow-up answer', images: [] },
            sessionId: 'existing-image-session',
        });
    });

    it('removes parsed images from OCR quick ask results', async () => {
        saveToHistory.mockResolvedValue({ id: 'saved-ocr-session' });
        const sessionManager = {
            resetContext: vi.fn(),
            handleSendPrompt: vi.fn(async () => ({
                status: 'success',
                text: '音王到里雯\nAIHI MANGA',
                images: [{ url: 'https://lh3.googleusercontent.com/original-reference' }],
            })),
        };
        const imageHandler = {
            fetchImage: vi.fn(async () => ({
                base64: 'data:image/png;base64,AAAA',
                type: 'image/png',
                name: 'image.png',
            })),
        };
        const handler = new QuickAskHandler(sessionManager, imageHandler);

        await handler.handleQuickAskImage(
            {
                text: 'extract text',
                url: 'data:image/png;base64,AAAA',
                model: 'gemini-3-flash',
                imageMode: 'ocr',
            },
            { tab: { id: 7 } }
        );

        const expectedResult = {
            status: 'success',
            text: '音王到里雯\nAIHI MANGA',
            images: [],
        };
        expect(saveToHistory).toHaveBeenCalledWith('extract text', expectedResult, [
            { base64: 'data:image/png;base64,AAAA' },
        ]);
        expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(7, {
            action: 'GEMINI_STREAM_DONE',
            result: expectedResult,
            sessionId: 'saved-ocr-session',
        });
    });
});
