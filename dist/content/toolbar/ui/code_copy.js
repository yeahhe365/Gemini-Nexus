(function () {
    class CodeCopyHandler {
        handle(event) {
            const copyButton = event.target.closest('.copy-code-btn');
            if (!copyButton) return;

            const wrapper = copyButton.closest('.code-block-wrapper');
            const codeElement = wrapper.querySelector('code');
            if (!codeElement) return;

            const text = codeElement.textContent;
            navigator.clipboard
                .writeText(text)
                .then(() => {
                    const copied = window.GeminiToolbarStrings?.copied || 'Copied';
                    window.GeminiCopyFeedback.showCopied(copyButton, copied);
                })
                .catch((error) => console.error('Failed to copy text:', error));
        }
    }

    window.GeminiCodeCopyHandler = CodeCopyHandler;
})();
