import { describe, expect, it, vi } from 'vitest';
import { handleFillElement, handleFillForm } from './fill.js';

describe('handleFillForm', () => {
    it('rejects elements without string values before interacting with the page', async () => {
        const handler = {
            getObjectIdFromUid: vi.fn(),
        };

        const result = await handleFillForm(handler, {
            elements: [{ uid: '1_2' }],
        });

        expect(result).toBe("Error: Each form element requires a string 'value'.");
        expect(handler.getObjectIdFromUid).not.toHaveBeenCalled();
    });

    it('fills checkboxes and switches with boolean values instead of text insertion', async () => {
        const handler = {
            getObjectIdFromUid: vi.fn(() => Promise.resolve('object-1')),
            waitHelper: {
                execute: vi.fn(async (fn) => fn()),
            },
            cmd: vi.fn((method, params) => {
                if (
                    method === 'Runtime.callFunctionOn' &&
                    params.functionDeclaration.includes('tagName')
                ) {
                    return Promise.resolve({
                        result: {
                            value: {
                                tagName: 'INPUT',
                                isContentEditable: false,
                            },
                        },
                    });
                }

                if (
                    method === 'Runtime.callFunctionOn' &&
                    params.functionDeclaration.includes("this.type === 'checkbox'")
                ) {
                    return Promise.resolve({ result: { value: true } });
                }

                return Promise.resolve({});
            }),
        };

        const result = await handleFillElement(handler, {
            uid: '1_2',
            value: 'true',
        });

        expect(result).toBe('Filled element 1_2');
        expect(handler.cmd).toHaveBeenCalledWith(
            'Runtime.callFunctionOn',
            expect.objectContaining({
                arguments: [{ value: true }],
                functionDeclaration: expect.stringContaining('this.click()'),
                userGesture: true,
            })
        );
        expect(handler.cmd).not.toHaveBeenCalledWith('Input.insertText', expect.anything());
    });

    it('reports which field failed during batch form fill', async () => {
        const handler = {
            getObjectIdFromUid: vi
                .fn()
                .mockResolvedValueOnce('object-1')
                .mockRejectedValueOnce(new Error('Element 1_3 is detached from the DOM.')),
            waitHelper: {
                execute: vi.fn(async (fn) => fn()),
            },
            cmd: vi.fn(() => Promise.resolve({ result: { value: {} } })),
        };

        const result = await handleFillForm(handler, {
            elements: [
                { uid: '1_2', value: 'alice' },
                { uid: '1_3', value: 'secret' },
            ],
        });

        expect(result).toContain('Error filling form element 2/2 (1_3)');
        expect(result).toContain('take_snapshot before retrying');
    });
});
