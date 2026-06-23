import '../../vendor/gemini-watermark-remover/page_process_runtime.js';
import './watermark_remover_global.js';

export class WatermarkRemover {
    static async process(base64Image) {
        return globalThis.GeminiNexusWatermarkRemover.process(base64Image);
    }

    static async processBlob(blob) {
        return globalThis.GeminiNexusWatermarkRemover.processBlob(blob);
    }
}
