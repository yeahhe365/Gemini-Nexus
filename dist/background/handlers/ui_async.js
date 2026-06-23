function createErrorResponse(error) {
    return { status: 'error', error: error?.message || String(error) };
}

export function runUiTask(task, errorLabel = 'UI task failed') {
    (async () => {
        try {
            await task();
        } catch (error) {
            console.error(errorLabel, error);
        }
    })();
}

export function respondWithUiTask(
    sendResponse,
    task,
    { successResponse = { status: 'completed' }, errorLabel, errorResponse, onError } = {}
) {
    (async () => {
        try {
            const response = await task();
            sendResponse(response || successResponse);
        } catch (error) {
            if (errorLabel) {
                console.error(errorLabel, error);
            }
            if (onError) {
                try {
                    onError(error);
                } catch (handlerError) {
                    console.error('UI task error handler failed', handlerError);
                }
            }
            const response =
                typeof errorResponse === 'function'
                    ? errorResponse(error)
                    : errorResponse || createErrorResponse(error);
            sendResponse(response);
        }
    })();
}
