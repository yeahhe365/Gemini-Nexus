import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    appendAiMessageIfDisplayable,
    appendTurnToHistory,
    replaceSessionSnapshot,
} from './history_manager.js';

describe('history_manager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('appends a complete quick-ask continuation turn to an existing session', async () => {
        const sessions = [
            {
                id: 'session-1',
                title: 'Hello',
                timestamp: 100,
                messages: [
                    { role: 'user', text: 'Hello' },
                    { role: 'ai', text: 'Hi' },
                ],
                context: null,
            },
        ];

        globalThis.chrome = {
            runtime: {
                sendMessage: vi.fn(() => Promise.resolve()),
            },
            storage: {
                local: {
                    get: vi.fn(async () => ({ geminiSessions: sessions })),
                    set: vi.fn(async () => {}),
                },
            },
        };

        const saved = await appendTurnToHistory(
            'session-1',
            'Follow up',
            {
                status: 'success',
                text: 'Follow-up answer',
                thoughts: 'thinking',
                images: [{ url: 'https://lh3.googleusercontent.com/generated' }],
                context: null,
            },
            [{ base64: 'data:image/png;base64,AAAA' }]
        );

        expect(saved.id).toBe('session-1');
        expect(saved.messages).toEqual([
            { role: 'user', text: 'Hello' },
            { role: 'ai', text: 'Hi' },
            {
                role: 'user',
                text: 'Follow up',
                image: ['data:image/png;base64,AAAA'],
                attachments: [
                    {
                        base64: 'data:image/png;base64,AAAA',
                        type: 'image/png',
                        name: 'attachment-1.png',
                    },
                ],
            },
            {
                role: 'ai',
                text: 'Follow-up answer',
                thoughts: 'thinking',
                thoughtsDurationSeconds: undefined,
                sources: null,
                generatedImages: [{ url: 'https://lh3.googleusercontent.com/generated' }],
                thoughtSignature: undefined,
                officialContent: null,
                suppressCopy: false,
            },
        ]);
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            geminiSessions: [saved],
        });
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
            action: 'SESSIONS_UPDATED',
            sessions: [saved],
        });
    });

    it('persists non-image quick-ask attachments with metadata', async () => {
        const sessions = [
            {
                id: 'session-1',
                title: 'Hello',
                timestamp: 100,
                messages: [],
                context: null,
            },
        ];

        globalThis.chrome = {
            runtime: {
                sendMessage: vi.fn(() => Promise.resolve()),
            },
            storage: {
                local: {
                    get: vi.fn(async () => ({ geminiSessions: sessions })),
                    set: vi.fn(async () => {}),
                },
            },
        };

        const saved = await appendTurnToHistory(
            'session-1',
            'Review spec',
            {
                status: 'success',
                text: 'Done',
                thoughts: null,
                images: [],
                context: null,
            },
            [
                {
                    base64: 'data:application/pdf;base64,BBBB',
                    type: 'application/pdf',
                    name: 'spec.pdf',
                },
            ]
        );

        expect(saved.messages[0]).toEqual({
            role: 'user',
            text: 'Review spec',
            image: null,
            attachments: [
                {
                    base64: 'data:application/pdf;base64,BBBB',
                    type: 'application/pdf',
                    name: 'spec.pdf',
                },
            ],
        });
    });

    it('persists generated-image-only AI messages when they are displayable', async () => {
        const sessions = [
            {
                id: 'session-1',
                title: 'Image',
                timestamp: 100,
                messages: [{ role: 'user', text: 'Generate image' }],
                context: null,
            },
        ];

        globalThis.chrome = {
            runtime: {
                sendMessage: vi.fn(() => Promise.resolve()),
            },
            storage: {
                local: {
                    get: vi.fn(async () => ({ geminiSessions: sessions })),
                    set: vi.fn(async () => {}),
                },
            },
        };

        await expect(
            appendAiMessageIfDisplayable('session-1', {
                status: 'success',
                text: '',
                images: [{ url: 'https://lh3.googleusercontent.com/generated' }],
                context: null,
            })
        ).resolves.toBe(true);

        expect(sessions[0].messages.at(-1)).toEqual({
            role: 'ai',
            text: '',
            thoughts: null,
            thoughtsDurationSeconds: undefined,
            sources: null,
            generatedImages: [{ url: 'https://lh3.googleusercontent.com/generated' }],
            thoughtSignature: undefined,
            officialContent: null,
            suppressCopy: false,
        });
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            geminiSessions: [sessions[0]],
        });
    });

    it('does not revive a tombstoned session when replacing an edited snapshot', async () => {
        globalThis.chrome = {
            runtime: {
                sendMessage: vi.fn(() => Promise.resolve()),
            },
            storage: {
                local: {
                    get: vi.fn(async () => ({
                        geminiSessions: [],
                        geminiDeletedSessionIds: { 'session-1': 123 },
                    })),
                    set: vi.fn(async () => {}),
                },
            },
        };

        await expect(
            replaceSessionSnapshot({
                id: 'session-1',
                title: 'Edited',
                messages: [{ role: 'user', text: 'Edited prompt' }],
                context: null,
            })
        ).resolves.toBe(false);

        expect(chrome.storage.local.get).toHaveBeenCalledWith([
            'geminiSessions',
            'geminiDeletedSessionIds',
        ]);
        expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });

    it('preserves current pin and group metadata when replacing an edited snapshot', async () => {
        const sessions = [
            {
                id: 'session-1',
                title: 'Current title',
                timestamp: 100,
                isPinned: true,
                groupId: 'group-1',
                messages: [
                    { role: 'user', text: 'Original prompt' },
                    { role: 'ai', text: 'Old answer' },
                ],
                context: ['old-context'],
                contextSummary: { sourceMessageCount: 2 },
            },
        ];
        globalThis.chrome = {
            runtime: {
                sendMessage: vi.fn(() => Promise.resolve()),
            },
            storage: {
                local: {
                    get: vi.fn(async () => ({
                        geminiSessions: sessions,
                        geminiDeletedSessionIds: {},
                    })),
                    set: vi.fn(async () => {}),
                },
            },
        };

        await expect(
            replaceSessionSnapshot({
                id: 'session-1',
                title: 'Edited title',
                timestamp: 200,
                messages: [{ role: 'user', text: 'Edited prompt' }],
                context: null,
                contextSummary: null,
            })
        ).resolves.toBe(true);

        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            geminiSessions: [
                expect.objectContaining({
                    id: 'session-1',
                    title: 'Edited title',
                    timestamp: 200,
                    isPinned: true,
                    groupId: 'group-1',
                    messages: [{ role: 'user', text: 'Edited prompt' }],
                    context: null,
                    contextSummary: null,
                }),
            ],
        });
    });
});
