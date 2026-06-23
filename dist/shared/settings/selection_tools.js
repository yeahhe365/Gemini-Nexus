export const CUSTOM_SELECTION_TOOLS_STORAGE_KEY = 'geminiCustomSelectionTools';
export const MAX_CUSTOM_SELECTION_TOOLS = 12;

function normalizeToolId(id, index) {
    const cleaned = String(id || '')
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, '');
    return cleaned || `custom-tool-${index + 1}`;
}

export function normalizeCustomSelectionTools(tools) {
    if (!Array.isArray(tools)) return [];

    return tools
        .slice(0, MAX_CUSTOM_SELECTION_TOOLS)
        .map((tool, index) => ({
            id: normalizeToolId(tool?.id, index),
            name: String(tool?.name || '').trim(),
            prompt: String(tool?.prompt || '').trim(),
            enabled: tool?.enabled !== false,
        }))
        .filter((tool) => tool.name && tool.prompt);
}

export function buildSelectionToolPrompt(template, selectedText) {
    const prompt = String(template || '').trim();
    const text = String(selectedText || '');

    if (prompt.includes('{text}')) {
        return prompt.replaceAll('{text}', text);
    }

    return `${prompt}\n\n${text}`;
}
