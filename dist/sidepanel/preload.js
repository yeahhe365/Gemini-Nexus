(function () {
    try {
        const cachedTheme = localStorage.getItem('geminiTheme') || 'system';
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (cachedTheme === 'dark' || (cachedTheme === 'system' && systemDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    } catch {}
})();
