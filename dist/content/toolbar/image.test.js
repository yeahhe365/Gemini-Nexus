// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

async function installImageDetector() {
    await import('./image.js');
}

function createImage({
    width,
    height,
    alt = '',
    className = '',
    src = 'https://example.test/i.png',
}) {
    const image = document.createElement('img');
    image.width = width;
    image.height = height;
    image.alt = alt;
    image.className = className;
    image.src = src;
    image.getBoundingClientRect = vi.fn(() => ({
        left: 10,
        top: 20,
        right: 10 + width,
        bottom: 20 + height,
        width,
        height,
    }));
    document.body.appendChild(image);
    return image;
}

describe('GeminiImageDetector', () => {
    beforeEach(async () => {
        vi.resetModules();
        document.body.innerHTML = '';
        await installImageDetector();
    });

    it('shows image tools on captcha-sized images with captcha metadata', () => {
        const onShow = vi.fn();
        const detector = new window.GeminiImageDetector({ onShow });
        const image = createImage({
            width: 82,
            height: 32,
            alt: 'captcha verification code',
            className: 'captcha-img',
        });

        detector.setEnabled(true);
        image.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

        expect(onShow).toHaveBeenCalledWith({
            left: 10,
            top: 20,
            right: 92,
            bottom: 52,
            width: 82,
            height: 32,
        });
        expect(detector.getCurrentImage()).toBe(image);
    });

    it('shows image tools on small verification-code images with nearby label text', () => {
        const onShow = vi.fn();
        const detector = new window.GeminiImageDetector({ onShow });
        const wrapper = document.createElement('label');
        wrapper.textContent = '验证码';
        document.body.appendChild(wrapper);
        const image = createImage({ width: 90, height: 34, alt: '' });
        wrapper.appendChild(image);

        detector.setEnabled(true);
        image.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

        expect(onShow).toHaveBeenCalledTimes(1);
    });

    it('keeps small icons hidden from image tools', () => {
        const onShow = vi.fn();
        const detector = new window.GeminiImageDetector({ onShow });
        const image = createImage({
            width: 32,
            height: 32,
            alt: 'site logo icon',
            className: 'logo-icon',
        });

        detector.setEnabled(true);
        image.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

        expect(onShow).not.toHaveBeenCalled();
        expect(detector.getCurrentImage()).toBeNull();
    });
});
