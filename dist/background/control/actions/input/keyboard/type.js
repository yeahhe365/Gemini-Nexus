export async function handleTypeText(handler, { text }) {
    const displayText = typeof text === 'string' ? text : '';

    try {
        if (typeof text !== 'string') {
            throw new Error("'text' must be a string.");
        }

        await handler.waitHelper.execute(async () => {
            if (text) {
                await handler.cmd('Input.insertText', { text });
            }
        });

        return `Typed text: ${text}`;
    } catch (error) {
        return `Error typing text ${displayText}: ${error.message}`;
    }
}
