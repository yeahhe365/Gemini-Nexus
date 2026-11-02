/**
 * sandbox/theme_boot.js
 *
 * Applies the theme/lang from the frame URL before first render to avoid a
 * flash of unstyled content. Kept as an external file (instead of an inline
 * <script>) so the page also loads under strict extension_pages CSP
 * (Firefox MV3 forbids inline scripts there).
 */
(function () {
    try {
        const params = new URLSearchParams(window.location.search);
        const theme = params.get('theme');
        const lang = params.get('lang');

        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (theme === 'dark' || (theme === 'system' && systemDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }

        if (lang && lang !== 'system') {
            document.documentElement.lang = lang;
        } else if (!lang || lang === 'system') {
            if (navigator.language.startsWith('zh')) {
                document.documentElement.lang = 'zh';
            }
        }
    } catch {}
})();
