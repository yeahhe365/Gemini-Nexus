// @ts-check

/**
 * @param {unknown} content
 * @returns {string}
 */
function extractTextFromContent(content) {
    if (!Array.isArray(content)) return '';

    const blocks = [];
    let textBuffer = '';
    for (const part of content) {
        if (part && part.type === 'text' && typeof part.text === 'string') {
            textBuffer += part.text;
            continue;
        }

        if (textBuffer) {
            blocks.push(textBuffer);
            textBuffer = '';
        }

        const formatted = formatContentPartForText(part);
        if (formatted) blocks.push(formatted);
    }

    if (textBuffer) blocks.push(textBuffer);
    return blocks.join('\n\n');
}

/**
 * @param {any} part
 * @returns {string}
 */
function formatContentPartForText(part) {
    if (!part || typeof part !== 'object') return '';
    if (part.type === 'text' && typeof part.text === 'string') return part.text;
    if (part.type === 'resource_link') return formatResourceLink(part);
    if (part.type === 'resource') return formatEmbeddedResource(part.resource);
    return '';
}

/**
 * @param {any} part
 * @returns {string}
 */
function formatResourceLink(part) {
    const uri = typeof part.uri === 'string' ? part.uri : '';
    if (!uri) return '';

    const name = typeof part.name === 'string' && part.name ? part.name : uri;
    const mimeType =
        typeof part.mimeType === 'string' && part.mimeType ? ` (${part.mimeType})` : '';
    const description =
        typeof part.description === 'string' && part.description ? ` - ${part.description}` : '';
    return `Resource Link: ${name} <${uri}>${mimeType}${description}`;
}

/**
 * @param {any} resource
 * @returns {string}
 */
function formatEmbeddedResource(resource) {
    if (!resource || typeof resource !== 'object') return '';

    const uri = typeof resource.uri === 'string' ? resource.uri : 'embedded-resource';
    const mimeType =
        typeof resource.mimeType === 'string' && resource.mimeType ? ` (${resource.mimeType})` : '';
    if (typeof resource.text === 'string') {
        return `Embedded Resource: ${uri}${mimeType}\n\`\`\`text\n${resource.text}\n\`\`\``;
    }

    if (typeof resource.blob === 'string') {
        return `Embedded Resource: ${uri}${mimeType}\n[base64 blob omitted from text output]`;
    }

    return `Embedded Resource: ${uri}${mimeType}`;
}

/**
 * @param {unknown} mimeType
 * @param {string} [fallback]
 * @returns {string}
 */
function fileExtensionForMimeType(mimeType, fallback = 'bin') {
    const normalized = String(mimeType || '').toLowerCase();
    if (normalized.includes('png')) return 'png';
    if (normalized.includes('jpeg') || normalized.includes('jpg')) return 'jpg';
    if (normalized.includes('webp')) return 'webp';
    if (normalized.includes('gif')) return 'gif';
    if (normalized.includes('wav')) return 'wav';
    if (normalized.includes('mpeg') || normalized.includes('mp3')) return 'mp3';
    if (normalized.includes('ogg')) return 'ogg';
    return fallback;
}

/**
 * @param {unknown} content
 * @returns {Array<any>}
 */
function extractFilePartsFromContent(content) {
    if (!Array.isArray(content)) return [];
    return content.filter(
        (part) =>
            part &&
            (part.type === 'image' || part.type === 'audio') &&
            typeof part.data === 'string' &&
            part.data.length > 0
    );
}

/**
 * @param {any} part
 * @param {string} mimeType
 * @returns {string}
 */
function mediaFileName(part, mimeType) {
    const prefix = part.type === 'audio' ? 'mcp-audio' : 'mcp-image';
    const fallback = part.type === 'audio' ? 'audio' : 'img';
    return `${prefix}-${Date.now()}.${fileExtensionForMimeType(mimeType, fallback)}`;
}

/**
 * @param {any} part
 * @param {string} mimeType
 * @returns {string}
 */
function dataUrlForMedia(part, mimeType) {
    return part.data.startsWith('data:') ? part.data : `data:${mimeType};base64,${part.data}`;
}

/**
 * @param {unknown} content
 * @returns {Array<{ base64: string, type: string, name: string }>}
 */
function extractFilesFromContent(content) {
    const files = [];
    for (const part of extractFilePartsFromContent(content)) {
        const fallbackMimeType = part.type === 'audio' ? 'audio/mpeg' : 'image/png';
        const mimeType =
            typeof part.mimeType === 'string' && part.mimeType ? part.mimeType : fallbackMimeType;
        files.push({
            base64: dataUrlForMedia(part, mimeType),
            type: mimeType,
            name: mediaFileName(part, mimeType),
        });
    }
    return files;
}

/**
 * @param {string} text
 * @param {unknown} structuredContent
 * @returns {string}
 */
function appendStructuredContent(text, structuredContent) {
    if (structuredContent === undefined) return text;

    try {
        const json = JSON.stringify(structuredContent, null, 2);
        const prefix = text ? `${text}\n\n` : '';
        return `${prefix}Structured Content:\n\`\`\`json\n${json}\n\`\`\``;
    } catch {
        return text;
    }
}

/**
 * @param {unknown} result
 * @returns {{ text: string, files: Array<{ base64: string, type: string, name: string }>, isError?: boolean }}
 */
export function normalizeMcpToolResult(result) {
    if (typeof result === 'string') return { text: result, files: [] };

    if (result && typeof result === 'object') {
        /** @type {Record<string, any>} */
        const objectResult = result;
        if (Array.isArray(objectResult.content)) {
            const text = extractTextFromContent(objectResult.content);
            return {
                text: appendStructuredContent(text, objectResult.structuredContent),
                files: extractFilesFromContent(objectResult.content),
                ...(objectResult.isError === true ? { isError: true } : {}),
            };
        }

        if (typeof objectResult.text === 'string') {
            return {
                text: appendStructuredContent(objectResult.text, objectResult.structuredContent),
                files: [],
                ...(objectResult.isError === true ? { isError: true } : {}),
            };
        }
    }

    try {
        return { text: JSON.stringify(result, null, 2), files: [] };
    } catch {
        return { text: String(result), files: [] };
    }
}

/**
 * @param {unknown} schema
 * @returns {string}
 */
export function summarizeInputSchema(schema) {
    if (!schema || typeof schema !== 'object') return '';
    /** @type {Record<string, any>} */
    const objectSchema = schema;
    const props =
        objectSchema.properties && typeof objectSchema.properties === 'object'
            ? objectSchema.properties
            : {};
    const required = Array.isArray(objectSchema.required) ? objectSchema.required : [];

    const parts = [];
    for (const key of required) {
        const spec = props[key] && typeof props[key] === 'object' ? props[key] : {};
        const type = typeof spec.type === 'string' ? spec.type : 'any';
        parts.push(`${key}: ${type}`);
    }
    return parts.length ? `{ ${parts.join(', ')} }` : '{}';
}
