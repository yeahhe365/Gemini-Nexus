import { dataUrlToBlob } from '../shared/utils/index.js';
import { normalizeUserAttachments } from '../shared/attachments/index.js';

const CURRENT_UPLOAD_ENDPOINT = 'https://push.clients6.google.com/upload/';

function buildUploadRequest(uploadContext = {}) {
    if (uploadContext.uploadPushId && uploadContext.uploadClientPctx) {
        return {
            endpoint: CURRENT_UPLOAD_ENDPOINT,
            headers: {
                'Push-ID': uploadContext.uploadPushId,
                'X-Tenant-Id': 'bard-storage',
                'X-Client-Pctx': uploadContext.uploadClientPctx,
            },
            credentials: 'include',
        };
    }

    throw new Error('Missing Gemini Web upload tokens. Refresh Gemini Web authentication.');
}

function readHeader(response, headerName) {
    if (!response?.headers) return null;
    if (typeof response.headers.get === 'function') {
        return response.headers.get(headerName);
    }

    return response.headers[headerName] || response.headers[headerName.toLowerCase()] || null;
}

async function startResumableUpload(fileName, uploadRequest, signal) {
    const response = await fetch(uploadRequest.endpoint, {
        method: 'POST',
        signal,
        headers: {
            ...uploadRequest.headers,
            'X-Goog-Upload-Protocol': 'resumable',
            'X-Goog-Upload-Command': 'start',
        },
        ...(uploadRequest.credentials ? { credentials: uploadRequest.credentials } : {}),
        body: `File name: ${fileName}`,
    });

    if (!response.ok) {
        throw new Error(`Upload start failed: ${response.status}`);
    }

    const uploadUrl = readHeader(response, 'X-Goog-Upload-URL');
    if (!uploadUrl) {
        throw new Error('Upload start failed: missing X-Goog-Upload-URL');
    }

    return uploadUrl;
}

async function finalizeResumableUpload(uploadUrl, blob, uploadRequest, signal) {
    const response = await fetch(uploadUrl, {
        method: 'POST',
        signal,
        headers: {
            ...uploadRequest.headers,
            'X-Goog-Upload-Command': 'upload, finalize',
            'X-Goog-Upload-Offset': '0',
        },
        ...(uploadRequest.credentials ? { credentials: uploadRequest.credentials } : {}),
        body: blob,
    });

    if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
    }

    return response.text();
}

// Upload file to the endpoint used by the current Gemini Web client.
export async function uploadFile(fileObj, signal, uploadContext = {}) {
    const [file] = normalizeUserAttachments(fileObj);
    const uploadFileObj = file || fileObj;
    const blob = await dataUrlToBlob(uploadFileObj.base64);

    const request = buildUploadRequest(uploadContext);
    const uploadUrl = await startResumableUpload(uploadFileObj.name, request, signal);
    const responseText = await finalizeResumableUpload(uploadUrl, blob, request, signal);

    // Returns the identifier (e.g. /contrib_service/ttl_1d/...)
    return responseText;
}
