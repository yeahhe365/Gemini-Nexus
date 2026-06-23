(function () {
    function isMhtmlArchiveUrl(url) {
        return typeof url === 'string' && /\.(?:mhtml|mht)(?:[?#].*)?$/i.test(url);
    }

    const href = window.location && window.location.href;
    const isDisabled = isMhtmlArchiveUrl(href);

    window.GeminiNexusPageGuard = {
        isDisabled,
        reason: isDisabled ? 'mhtml' : null,
        isMhtmlArchiveUrl,
    };
})();
