(function () {
    const MAX_UTTERANCE_LENGTH = 180;
    const PAGE_TEXT_LIMIT = 20000;
    const GEMINI_TTS_TEXT_LIMIT = 5000;

    function getStrings() {
        return window.GeminiToolbarStrings || {};
    }

    function normalizeText(text) {
        return String(text || '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function splitText(text) {
        const normalized = normalizeText(text);
        if (!normalized) return [];

        const chunks = [];
        const sentences = normalized.match(/[^。！？.!?]+[。！？.!?]?/g) || [normalized];
        let current = '';

        for (const sentence of sentences) {
            const next = current ? `${current} ${sentence.trim()}` : sentence.trim();
            if (next.length <= MAX_UTTERANCE_LENGTH) {
                current = next;
                continue;
            }

            if (current) chunks.push(current);
            if (sentence.length <= MAX_UTTERANCE_LENGTH) {
                current = sentence.trim();
                continue;
            }

            for (let index = 0; index < sentence.length; index += MAX_UTTERANCE_LENGTH) {
                chunks.push(sentence.slice(index, index + MAX_UTTERANCE_LENGTH).trim());
            }
            current = '';
        }

        if (current) chunks.push(current);
        return chunks.filter(Boolean);
    }

    function getPageText() {
        const clone = document.body?.cloneNode(true);
        if (!clone) return '';

        clone
            .querySelectorAll('script, style, noscript, svg, canvas, iframe')
            .forEach((node) => node.remove());

        return normalizeText(clone.innerText || clone.textContent || '').slice(0, PAGE_TEXT_LIMIT);
    }

    class SpeechReader {
        constructor({
            speechSynthesis = window.speechSynthesis,
            runtime = window.chrome?.runtime,
            AudioCtor = window.Audio,
        } = {}) {
            this.speechSynthesis = speechSynthesis;
            this.runtime = runtime;
            this.AudioCtor = AudioCtor;
            this.queue = [];
            this.isReading = false;
            this.audio = null;
            this.objectUrl = null;
            this.readToken = 0;
        }

        get supported() {
            return (
                Boolean(this.runtime?.sendMessage && this.AudioCtor) ||
                Boolean(this.speechSynthesis && typeof SpeechSynthesisUtterance === 'function')
            );
        }

        stop() {
            this.readToken += 1;
            this.queue = [];
            this.isReading = false;
            if (this.audio) {
                this.audio.pause();
                this.audio.removeAttribute?.('src');
                this.audio = null;
            }
            if (this.objectUrl) {
                URL.revokeObjectURL(this.objectUrl);
                this.objectUrl = null;
            }
            this.speechSynthesis?.cancel?.();
        }

        readSelection(text) {
            return this.readText(text, getStrings().readSelection || 'Read selection');
        }

        readPage() {
            return this.readText(getPageText(), getStrings().readPage || 'Read page');
        }

        async readText(text, title = '') {
            if (!this.supported) {
                throw new Error(
                    getStrings().speechUnsupported ||
                        'Text-to-speech is not supported in this browser.'
                );
            }

            const normalizedText = normalizeText(text).slice(0, GEMINI_TTS_TEXT_LIMIT);
            if (!normalizedText) {
                throw new Error(getStrings().speechNoText || 'No readable text found.');
            }

            if (this.isReading || this.speechSynthesis?.speaking) {
                this.stop();
                return { status: 'stopped', title };
            }

            if (this.runtime?.sendMessage && this.AudioCtor) {
                return await this._readWithGeminiTts(normalizedText, title);
            }

            const chunks = splitText(normalizedText);
            this.queue = chunks;
            const chunkCount = chunks.length;
            this.isReading = true;
            this.speechSynthesis.cancel();
            this._speakNext();
            return { status: 'started', title, chunks: chunkCount };
        }

        _speakNext() {
            const text = this.queue.shift();
            if (!text) {
                this.isReading = false;
                return;
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = navigator.language || 'zh-CN';
            utterance.rate = 1;
            utterance.onend = () => this._speakNext();
            utterance.onerror = () => {
                this.queue = [];
                this.isReading = false;
            };
            this.speechSynthesis.speak(utterance);
        }

        async _readWithGeminiTts(text, title) {
            const token = (this.readToken += 1);
            this.isReading = true;
            let response;
            try {
                response = await this.runtime.sendMessage({
                    action: 'GEMINI_TTS',
                    text,
                    locale: navigator.language || 'zh-CN',
                    sourcePath: '/app',
                });
            } catch (error) {
                this.isReading = false;
                throw error;
            }

            if (token !== this.readToken) return { status: 'stopped', title };
            if (!response || response.status !== 'success' || !response.audioBase64) {
                this.isReading = false;
                throw new Error(
                    response?.error || getStrings().speechUnsupported || 'Gemini TTS failed.'
                );
            }

            const audioBytes = this._base64ToBytes(response.audioBase64);
            const blob = new Blob([audioBytes], {
                type: response.mimeType || 'audio/ogg',
            });
            this.objectUrl = URL.createObjectURL(blob);
            this.audio = new this.AudioCtor(this.objectUrl);
            this.audio.onended = () => this.stop();
            this.audio.onerror = () => this.stop();
            try {
                await this.audio.play();
            } catch (error) {
                this.stop();
                throw error;
            }
            return { status: 'started', title, chunks: 1, provider: 'gemini' };
        }

        _base64ToBytes(base64) {
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let index = 0; index < binary.length; index += 1) {
                bytes[index] = binary.charCodeAt(index);
            }
            return bytes;
        }
    }

    window.GeminiSpeechReader = SpeechReader;
    window.GeminiSpeechReaderUtils = {
        normalizeText,
        splitText,
        getPageText,
    };
})();
