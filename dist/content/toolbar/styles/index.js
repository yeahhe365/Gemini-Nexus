(function () {
    const styles = window.GeminiStyles || {};
    window.GeminiToolbarStyles =
        (styles.Core || '') +
        (styles.Widget || '') +
        (styles.Panel || '') +
        (styles.Markdown || '');
})();
