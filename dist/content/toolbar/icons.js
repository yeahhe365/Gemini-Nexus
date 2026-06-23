(function () {
    const logoUrl = chrome.runtime.getURL('logo.png');

    function markup(strings, ...values) {
        return strings
            .reduce((html, chunk, index) => `${html}${chunk}${values[index] ?? ''}`, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    window.GeminiToolbarIcons = {
        LOGO: markup`
            <img src="${logoUrl}" class="toolbar-logo" alt="Gemini">
        `,
        PLUS: markup`
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2.2" stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M12 5v14"/>
                <path d="M5 12h14"/>
            </svg>
        `,
        EXTERNAL_OPEN: markup`
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2.4" stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M15 3h6v6"/>
                <path d="M10 14 21 3"/>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            </svg>
        `,
        DRAG: markup`
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <circle cx="8" cy="4" r="2.5"/>
                <circle cx="8" cy="12" r="2.5"/>
                <circle cx="8" cy="20" r="2.5"/>
                <circle cx="16" cy="4" r="2.5"/>
                <circle cx="16" cy="12" r="2.5"/>
                <circle cx="16" cy="20" r="2.5"/>
            </svg>
        `,
        ASK: markup`
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
        `,
        TRANSLATE: markup`
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <path d="m5 8 6 6"></path>
                <path d="m4 14 6-6 2-3"></path>
                <path d="M2 5h12"></path>
                <path d="M7 2h1"></path>
                <path d="m22 22-5-10-5 10"></path>
                <path d="M14 18h6"></path>
            </svg>
        `,
        EXPLAIN: markup`
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
        `,
        SUMMARIZE: markup`
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <line x1="21" y1="6" x2="3" y2="6"></line>
                <line x1="21" y1="12" x2="9" y2="12"></line>
                <line x1="21" y1="18" x2="7" y2="18"></line>
            </svg>
        `,
        IMAGE_SPARKLE: markup`
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2"/>
                <circle cx="8.5" cy="10.5" r="1.5"/>
                <path d="m21 15-4-4-5 5-2-2-4 5"/>
                <path d="m17 2 .7 1.8L19.5 4.5l-1.8.7L17 7l-.7-1.8-1.8-.7 1.8-.7z"/>
            </svg>
        `,
        SPEAKER: markup`
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            </svg>
        `,
        CLOSE: markup`
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `,
        IMAGE_EYE: markup`
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        `,
        STOP: markup`
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
        `,
        CONTINUE: markup`
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7
                    8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8
                    8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5
                    a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
        `,
        COPY: markup`
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        `,
        CHECK: markup`
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="#188038" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `,
        RETRY: markup`
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M23 4v6h-6"></path>
                <path d="M1 20v-6h6"></path>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
        `,
        GRAMMAR: markup`
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
        `,
        INSERT: markup`
            <svg width="1em" height="1em" fill="none" viewBox="0 0 24 24">
                <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M12 21a1 1 0 0 0 1 1h8a1 1 0 1 0 0-2h-8a1 1 0 0 0-1 1m0-6a1 1 0 0 0 1 1h8a1 1 0 1 0 0-2h-8a1 1 0 0 0-1 1m-9-5a1 1 0 1 1 0-2h18a1 1 0 1 1 0 2zM2 3a1 1 0 0 0 1 1h18a1 1 0 1 0 0-2H3a1 1 0 0 0-1 1m1.5 10a1 1 0 0 1 1 1v2a1 1 0 0 0 1 1h.75v-1.633a.8.8 0 0 1 1.309-.618l3.193 2.634a.8.8 0 0 1 0 1.234L7.559 21.25a.8.8 0 0 1-1.309-.617V19H5.5a3 3 0 0 1-3-3v-2a1 1 0 0 1 1-1"></path>
            </svg>
        `,
        REPLACE: markup`
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none"
                viewBox="0 0 24 24">
                <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M16.793 21.207a1 1 0 0 0 1.414 0l4-4a1 1 0 0 0-1.414-1.414L18.5 18.086V3.5a1 1 0 1 0-2 0v14.586l-2.293-2.293a1 1 0 0 0-1.414 1.414zM7.207 2.793a1 1 0 0 0-1.414 0l-4 4a1 1 0 0 0 1.414 1.414L5.5 5.914V20.5a1 1 0 1 0 2 0V5.914l2.293 2.293a1 1 0 0 0 1.414-1.414z"></path>
            </svg>
        `,
        CHAT_BUBBLE: markup`
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
        `,
        SCAN_TEXT: markup`
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                <path d="M7 12h10"/>
                <path d="M7 8h10"/>
                <path d="M7 16h5"/>
            </svg>
        `,
        TOOLS: markup`
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94L14.7 6.3z"/>
            </svg>
        `,
        CHEVRON_RIGHT: markup`
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <path d="m9 18 6-6-6-6"/>
            </svg>
        `,
        BROWSER_CONTROL: markup`
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
                <path d="m13 13 6 6"/>
            </svg>
        `,
        REMOVE_BG: markup`
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <path d="M3 15h18"/>
                <path d="M9 3v18"/>
            </svg>
        `,
        REMOVE_TEXT: markup`
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M4 6h10"/>
                <path d="M4 10h12"/>
                <path d="M4 14h7"/>
                <path d="M4 18h6"/>
                <path d="m15 15 5 5"/>
                <path d="m20 15-5 5"/>
            </svg>
        `,
        REMOVE_WATERMARK: markup`
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                <path d="m15 15-1-3-2 3-2-3-1 3"/>
            </svg>
        `,
        UPSCALE: markup`
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813
                    1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1
                    1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                <path d="M5 3v4"/>
                <path d="M9 3v4"/>
                <path d="M3 5h4"/>
            </svg>
        `,
        EXPAND: markup`
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <path d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8"/>
                <path d="M3 16.2V21m0 0h4.8M3 21l6-6"/>
                <path d="M21 7.8V3m0 0h-4.8M21 3l-6 6"/>
                <path d="M3 7.8V3m0 0h4.8M3 3l6 6"/>
            </svg>
        `,
        ZAP: markup`
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
        `,
    };
})();
