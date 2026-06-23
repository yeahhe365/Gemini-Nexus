import { beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadFile } from './upload.js';

describe('uploadFile', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('uses current Gemini Web upload endpoint and dynamic upload headers when available', async () => {
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: new Headers({
                    'X-Goog-Upload-URL': 'https://push.clients6.google.com/upload/session',
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: () => Promise.resolve('/contrib_service/ttl_1d/upload-id'),
            });

        const result = await uploadFile(
            {
                name: 'image.png',
                base64: 'data:image/png;base64,AAAA',
            },
            undefined,
            {
                uploadPushId: 'feeds/upload-dynamic',
                uploadClientPctx: 'client-pctx-token',
            }
        );

        expect(result).toBe('/contrib_service/ttl_1d/upload-id');
        const [url, init] = global.fetch.mock.calls[0];
        expect(url).toBe('https://push.clients6.google.com/upload/');
        expect(init.method).toBe('POST');
        expect(init.headers).toEqual({
            'Push-ID': 'feeds/upload-dynamic',
            'X-Tenant-Id': 'bard-storage',
            'X-Client-Pctx': 'client-pctx-token',
            'X-Goog-Upload-Protocol': 'resumable',
            'X-Goog-Upload-Command': 'start',
        });
        expect(init.credentials).toBe('include');
        expect(init.body).toBe('File name: image.png');

        const [uploadUrl, uploadInit] = global.fetch.mock.calls[1];
        expect(uploadUrl).toBe('https://push.clients6.google.com/upload/session');
        expect(uploadInit.method).toBe('POST');
        expect(uploadInit.headers).toEqual({
            'Push-ID': 'feeds/upload-dynamic',
            'X-Tenant-Id': 'bard-storage',
            'X-Client-Pctx': 'client-pctx-token',
            'X-Goog-Upload-Command': 'upload, finalize',
            'X-Goog-Upload-Offset': '0',
        });
        expect(uploadInit.credentials).toBe('include');
        expect(uploadInit.body).toBeInstanceOf(Blob);
    });

    it('normalizes generic image data URLs before creating the upload blob', async () => {
        global.fetch = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: new Headers({
                    'X-Goog-Upload-URL': 'https://push.clients6.google.com/upload/session',
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: () => Promise.resolve('/contrib_service/ttl_1d/upload-id'),
            });

        await uploadFile(
            {
                name: 'capture.bin',
                type: 'application/octet-stream',
                base64: 'data:application/octet-stream;base64,iVBORw0KGgoAAA',
            },
            undefined,
            {
                uploadPushId: 'feeds/upload-dynamic',
                uploadClientPctx: 'client-pctx-token',
            }
        );

        const [, uploadInit] = global.fetch.mock.calls[1];
        expect(uploadInit.body).toBeInstanceOf(Blob);
        expect(uploadInit.body.type).toBe('image/png');
    });

    it('rejects uploads without current Gemini Web upload tokens', async () => {
        global.fetch = vi.fn();

        await expect(
            uploadFile(
                {
                    name: 'image.png',
                    base64: 'data:image/png;base64,AAAA',
                },
                undefined,
                {}
            )
        ).rejects.toThrow('Missing Gemini Web upload tokens');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('rejects uploads with incomplete Gemini Web upload tokens', async () => {
        global.fetch = vi.fn();

        await expect(
            uploadFile(
                {
                    name: 'image.png',
                    base64: 'data:image/png;base64,AAAA',
                },
                undefined,
                { uploadPushId: 'feeds/upload-dynamic' }
            )
        ).rejects.toThrow('Missing Gemini Web upload tokens');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does not keep the obsolete content-push upload fallback', async () => {
        global.fetch = vi.fn();

        await expect(
            uploadFile(
                {
                    name: 'image.png',
                    base64: 'data:image/png;base64,AAAA',
                },
                undefined,
                {}
            )
        ).rejects.toThrow('Missing Gemini Web upload tokens');

        expect(global.fetch).not.toHaveBeenCalledWith(
            'https://content-push.googleapis.com/upload',
            expect.anything()
        );
    });
});
