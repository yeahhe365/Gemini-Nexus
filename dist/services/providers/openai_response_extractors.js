function addSource(sources, seenSourceUrls, source) {
    const citation = source?.url_citation || source;
    const url = citation?.url || citation?.uri;
    if (!url || seenSourceUrls.has(url)) return;

    seenSourceUrls.add(url);
    sources.push({
        title: citation.title || url,
        url,
    });
}

export function extractSourcesFromAnnotation(annotation, sources, seenSourceUrls) {
    if (!annotation || annotation.type !== 'url_citation') return;
    addSource(sources, seenSourceUrls, annotation);
}

export function extractSourcesFromResponseItem(item, sources, seenSourceUrls) {
    if (!item || typeof item !== 'object') return;

    const actionSources = item.action?.sources;
    if (Array.isArray(actionSources)) {
        actionSources.forEach((source) => addSource(sources, seenSourceUrls, source));
    }

    if (!Array.isArray(item.content)) return;
    item.content.forEach((part) => {
        if (Array.isArray(part?.annotations)) {
            part.annotations.forEach((annotation) =>
                extractSourcesFromAnnotation(annotation, sources, seenSourceUrls)
            );
        }
    });
}

export function extractTextFromCompletedResponse(responseObject) {
    if (!responseObject || !Array.isArray(responseObject.output)) return '';

    return responseObject.output
        .filter((item) => item?.type === 'message' && Array.isArray(item.content))
        .flatMap((item) => item.content)
        .filter((part) => part?.type === 'output_text' && typeof part.text === 'string')
        .map((part) => part.text)
        .join('');
}

export function extractReasoningSummaryFromResponseItem(item) {
    if (item?.type !== 'reasoning' || !Array.isArray(item.summary)) return '';

    return item.summary
        .filter((part) => typeof part?.text === 'string')
        .map((part) => part.text)
        .join('');
}

export function extractReasoningSummaryFromCompletedResponse(responseObject) {
    if (!responseObject || !Array.isArray(responseObject.output)) return '';

    return responseObject.output
        .map((item) => extractReasoningSummaryFromResponseItem(item))
        .join('');
}

export async function readErrorMessage(response) {
    let errorText = await response.text();
    try {
        const errJson = JSON.parse(errorText);
        if (errJson.error && errJson.error.message) errorText = errJson.error.message;
    } catch {}
    return errorText;
}
