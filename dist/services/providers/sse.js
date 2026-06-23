export async function readSseJson(response, onEvent) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;

            const dataStr = trimmed.substring(6);
            if (dataStr === '[DONE]') continue;

            let eventPayload;
            try {
                eventPayload = JSON.parse(dataStr);
            } catch {
                // Ignore malformed or incomplete stream events.
                continue;
            }

            await onEvent(eventPayload);
        }
    }
}
