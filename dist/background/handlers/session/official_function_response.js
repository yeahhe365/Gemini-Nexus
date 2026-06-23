export function hasNativeFunctionCalls(result) {
    return (
        Array.isArray(result?.functionCalls) &&
        result.functionCalls.some(
            (call) => call && typeof call.name === 'string' && call.name.trim()
        )
    );
}

function createOfficialFunctionResponsePart(toolResult) {
    const name = typeof toolResult?.toolName === 'string' ? toolResult.toolName : '';
    if (!name) return null;

    const functionResponse = {
        name,
        response: {
            output: toolResult?.output ?? '',
            status: toolResult?.status || 'completed',
        },
    };

    if (toolResult?.id) {
        functionResponse.id = toolResult.id;
    }

    return { functionResponse };
}

export function createOfficialFunctionResponseParts(toolResults) {
    if (!Array.isArray(toolResults)) return [];
    return toolResults.map(createOfficialFunctionResponsePart).filter(Boolean);
}

export function createOfficialFunctionResponseMessage(toolResults) {
    const parts = createOfficialFunctionResponseParts(toolResults);
    if (parts.length === 0) return null;

    return {
        role: 'user',
        text: '',
        officialContent: {
            role: 'user',
            parts,
        },
    };
}

export function createOfficialModelMessage(result) {
    if (!result?.officialContent || !Array.isArray(result.officialContent.parts)) {
        return null;
    }

    return {
        role: 'ai',
        text: result.text || '',
        thoughts: result.thoughts || null,
        thoughtsDurationSeconds: result.thoughtsDurationSeconds,
        sources: result.sources || null,
        generatedImages: result.images,
        thoughtSignature: result.thoughtSignature,
        officialContent: result.officialContent,
    };
}
