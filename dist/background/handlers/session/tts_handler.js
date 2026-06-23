import { fetchGeminiTtsAudio } from '../../../services/providers/gemini_tts.js';

function isRefreshableTtsError(message = '') {
    return (
        message.includes('Missing Gemini Web auth token') ||
        message.includes('Gemini TTS network error: 400') ||
        message.includes('Gemini TTS network error: 401') ||
        message.includes('Gemini TTS network error: 403') ||
        message.includes('Sign in') ||
        message.includes('未登录')
    );
}

export class TtsHandler {
    constructor(sessionManager) {
        this.sessionManager = sessionManager;
    }

    handle(request, sendResponse) {
        if (request.action !== 'GEMINI_TTS') return false;

        this.handleTts(request).then(sendResponse);
        return true;
    }

    async handleTts(request) {
        try {
            const result = await this._fetchAudio(request);
            return {
                action: 'GEMINI_TTS_RESULT',
                status: 'success',
                ...result,
            };
        } catch (error) {
            return {
                action: 'GEMINI_TTS_RESULT',
                status: 'error',
                error: error.message || String(error),
            };
        }
    }

    async _fetchAudio(request) {
        await this.sessionManager.ensureInitialized();

        try {
            const context = await this.sessionManager.auth.getOrFetchContext();
            return await fetchGeminiTtsAudio(request.text, context, {
                locale: request.locale,
                sourcePath: request.sourcePath,
            });
        } catch (error) {
            if (!isRefreshableTtsError(error.message || '')) throw error;
            this.sessionManager.auth.forceContextRefresh();
            const context = await this.sessionManager.auth.getOrFetchContext();
            return await fetchGeminiTtsAudio(request.text, context, {
                locale: request.locale,
                sourcePath: request.sourcePath,
            });
        }
    }
}
