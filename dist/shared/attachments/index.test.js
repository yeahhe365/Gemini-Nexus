import { describe, expect, it } from 'vitest';
import * as attachments from './index.js';

describe('message attachment helpers', () => {
    it('normalizes legacy message image fields', () => {
        expect(attachments.normalizeMessageImages).toBeTypeOf('function');

        expect(attachments.normalizeMessageImages(null)).toEqual([]);
        expect(attachments.normalizeMessageImages('data:image/png;base64,AAAA')).toEqual([
            'data:image/png;base64,AAAA',
        ]);
        expect(
            attachments.normalizeMessageImages([
                '',
                'data:image/png;base64,BBBB',
                null,
                'data:image/jpeg;base64,CCCC',
            ])
        ).toEqual(['data:image/png;base64,BBBB', 'data:image/jpeg;base64,CCCC']);
    });

    it('describes message attachment markers from structured metadata', () => {
        expect(attachments.describeMessageAttachmentMarkers).toBeTypeOf('function');

        expect(
            attachments.describeMessageAttachmentMarkers({
                attachments: [
                    {
                        base64: 'data:image/png;base64,AAAA',
                        type: 'image/png',
                        name: 'image.png',
                    },
                    {
                        base64: 'data:application/pdf;base64,BBBB',
                        type: 'application/pdf',
                        name: 'spec.pdf',
                    },
                ],
                generatedImages: [{ url: 'generated-1' }, { url: 'generated-2' }],
                sources: [{ url: 'https://example.test/source' }],
            })
        ).toEqual([
            '[1 image attachment(s)]',
            '[1 file attachment(s)]',
            '[2 generated image(s)]',
            '[1 source link(s)]',
        ]);
    });

    it('counts a single legacy image when no structured attachments exist', () => {
        expect(
            attachments.describeMessageAttachmentMarkers({
                image: 'data:image/png;base64,AAAA',
            })
        ).toEqual(['[1 image attachment(s)]']);
    });

    it('prefers structured attachments over duplicate legacy image fields', () => {
        expect(
            attachments.describeMessageAttachmentMarkers({
                image: 'data:image/png;base64,LEGACY',
                attachments: [
                    {
                        base64: 'data:image/png;base64,AAAA',
                        type: 'image/png',
                        name: 'image.png',
                    },
                ],
            })
        ).toEqual(['[1 image attachment(s)]']);
    });

    it('lists non-image attachments for provider capability checks', () => {
        expect(
            attachments.getNonImageAttachments([
                {
                    base64: 'data:image/png;base64,AAAA',
                    type: 'image/png',
                    name: 'image.png',
                },
                {
                    base64: 'data:application/pdf;base64,BBBB',
                    type: 'application/pdf',
                    name: 'brief.pdf',
                },
            ])
        ).toEqual([
            {
                base64: 'data:application/pdf;base64,BBBB',
                type: 'application/pdf',
                name: 'brief.pdf',
            },
        ]);
    });

    it('keeps octet-stream data URLs that are actually images', () => {
        const png = 'data:application/octet-stream;base64,iVBORw0KGgoAAA';
        const normalizedPng = 'data:image/png;base64,iVBORw0KGgoAAA';

        expect(
            attachments.normalizeUserAttachments([
                {
                    base64: png,
                    type: 'application/octet-stream',
                    name: 'capture.bin',
                },
            ])
        ).toEqual([
            {
                base64: normalizedPng,
                type: 'image/png',
                name: 'capture.bin',
            },
        ]);
        expect(attachments.getImageAttachmentDataUrls([png])).toEqual([normalizedPng]);
        expect(attachments.countUserAttachmentsByType([png])).toEqual({ images: 1, files: 0 });
    });
});
