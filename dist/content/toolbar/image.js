(function () {
    const CAPTCHA_KEYWORD_PATTERN =
        /captcha|kaptcha|recaptcha|verify|verification|validate|validation|checkcode|check-code|securitycode|security-code|authcode|auth-code|vcode|seccode|yzm|yanzheng|验证码|驗證碼|校验码|校驗碼|图形码|圖形碼|安全码|安全碼/i;
    const NON_CAPTCHA_SMALL_IMAGE_PATTERN =
        /avatar|badge|brand|button|emoji|favicon|icon|logo|pixel|sprite|thumb/i;

    function getImageTextSignals(imageElement) {
        const values = [
            imageElement.alt,
            imageElement.title,
            imageElement.getAttribute('aria-label'),
            imageElement.id,
            imageElement.className,
            imageElement.currentSrc,
            imageElement.src,
        ];

        if (imageElement.dataset) {
            values.push(...Object.values(imageElement.dataset));
        }

        let parent = imageElement.parentElement;
        for (let depth = 0; parent && depth < 3; depth++) {
            const text = String(parent.textContent || '').trim();
            if (text && text.length <= 200) values.push(text);
            values.push(parent.id, parent.className, parent.getAttribute('aria-label'));
            parent = parent.parentElement;
        }

        return values.filter(Boolean).join(' ');
    }

    function getDisplayedImageSize(imageElement) {
        const rect =
            typeof imageElement.getBoundingClientRect === 'function'
                ? imageElement.getBoundingClientRect()
                : null;

        return {
            width: imageElement.width || rect?.width || imageElement.naturalWidth || 0,
            height: imageElement.height || rect?.height || imageElement.naturalHeight || 0,
        };
    }

    function isSmallOcrCandidate(imageElement, width, height) {
        if (width < 40 || height < 18) return false;
        if (width > 260 || height > 100) return false;

        const aspectRatio = width / Math.max(height, 1);
        if (aspectRatio < 1.4 || aspectRatio > 8) return false;

        const signals = getImageTextSignals(imageElement);
        if (NON_CAPTCHA_SMALL_IMAGE_PATTERN.test(signals)) return false;

        return true;
    }

    function shouldShowImageTools(imageElement) {
        const { width, height } = getDisplayedImageSize(imageElement);
        if (width >= 100 && height >= 100) return true;

        const signals = getImageTextSignals(imageElement);
        if (CAPTCHA_KEYWORD_PATTERN.test(signals)) return true;

        return isSmallOcrCandidate(imageElement, width, height);
    }

    class GeminiImageDetector {
        constructor(callbacks) {
            this.callbacks = callbacks || {}; // { onShow, onHide }
            this.hoveredImage = null;
            this.imageButtonTimeout = null;
            this.isEnabled = false;

            this.onImageHover = this.onImageHover.bind(this);
        }

        setEnabled(enabled) {
            if (this.isEnabled === enabled) return;
            this.isEnabled = enabled;

            if (enabled) {
                document.addEventListener('mouseover', this.onImageHover, true);
                document.addEventListener('mouseout', this.onImageHover, true);
            } else {
                document.removeEventListener('mouseover', this.onImageHover, true);
                document.removeEventListener('mouseout', this.onImageHover, true);
                this.scheduleHide(0);
            }
        }

        onImageHover(mouseEvent) {
            if (!this.isEnabled) return;
            const isEnter = mouseEvent.type === 'mouseover';

            if (mouseEvent.target.tagName !== 'IMG') return;

            // Ignore small images (icons, spacers)
            const imageElement = mouseEvent.target;
            if (!shouldShowImageTools(imageElement)) return;

            if (isEnter) {
                if (this.imageButtonTimeout) clearTimeout(this.imageButtonTimeout);
                this.hoveredImage = imageElement;
                const imageRect = imageElement.getBoundingClientRect();

                if (this.callbacks.onShow) {
                    this.callbacks.onShow(imageRect);
                }
            } else {
                this.scheduleHide();
            }
        }

        scheduleHide(delay = 200) {
            if (this.imageButtonTimeout) clearTimeout(this.imageButtonTimeout);
            this.imageButtonTimeout = setTimeout(() => {
                if (this.callbacks.onHide) {
                    this.callbacks.onHide();
                }
                this.hoveredImage = null;
            }, delay);
        }

        cancelHide() {
            if (this.imageButtonTimeout) clearTimeout(this.imageButtonTimeout);
        }

        getCurrentImage() {
            return this.hoveredImage;
        }
    }

    window.GeminiImageDetector = GeminiImageDetector;
})();
