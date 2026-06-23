import { extractFromHTML } from '../shared/utils/index.js';

// Get 'at' (SNlM0e), 'bl' (cfb2h), and user index values
// Supports fetching from specific user index URL to get correct tokens for that account.
export async function fetchRequestParams(userIndex = '0') {
    let url = 'https://gemini.google.com/app';
    if (userIndex && userIndex !== '0') {
        url = `https://gemini.google.com/u/${userIndex}/app`;
    }
    const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
    });
    const html = await response.text();

    const atValue = extractFromHTML('SNlM0e', html);
    const blValue = extractFromHTML('cfb2h', html);
    const fSid = extractFromHTML('FdrFJe', html);
    const uploadPushId = extractFromHTML('qKIAYe', html);
    const uploadClientPctx = extractFromHTML('Ylro7b', html);
    const locale = html.match(/<html[^>]*\slang="([^"]+)"/)?.[1] || 'en-US';

    let authUserIndex = userIndex;

    const authMatch = html.match(/data-index="(\d+)"/);
    if (authMatch) {
        authUserIndex = authMatch[1];
    }

    const missingRequestTokens = [
        ['atValue', atValue],
        ['blValue', blValue],
        ['fSid', fSid],
    ]
        .filter(([, value]) => !value)
        .map(([name]) => name);

    if (missingRequestTokens.length > 0) {
        throw new Error(
            `Gemini Web request tokens unavailable for account ${userIndex}: ${missingRequestTokens.join(', ')}. Please log in to gemini.google.com or refresh Gemini.`
        );
    }

    return {
        atValue,
        blValue,
        fSid,
        locale,
        authUserIndex,
        uploadPushId: uploadPushId || null,
        uploadClientPctx: uploadClientPctx || null,
    };
}
