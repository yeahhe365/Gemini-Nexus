(function () {
    const FALLBACK_CHECK_ICON =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

    function getCheckIcon() {
        return globalThis.GeminiToolbarIcons?.CHECK || FALLBACK_CHECK_ICON;
    }

    function showCopied(button, label, delay = 2000) {
        if (!button) return;

        const originalHtml = button.innerHTML;
        button.replaceChildren();
        button.insertAdjacentHTML('afterbegin', getCheckIcon());

        const labelEl = document.createElement('span');
        labelEl.textContent = label;
        button.appendChild(labelEl);

        setTimeout(() => {
            button.innerHTML = originalHtml;
        }, delay);
    }

    globalThis.GeminiCopyFeedback = {
        CHECK_ICON: FALLBACK_CHECK_ICON,
        showCopied,
    };
})();
