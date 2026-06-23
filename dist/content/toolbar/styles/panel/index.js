(function () {
    window.GeminiStyles = window.GeminiStyles || {};
    const styles = window.GeminiStyles;

    styles.Panel =
        (styles.PanelLayout || '') +
        (styles.PanelHeader || '') +
        (styles.PanelBody || '') +
        (styles.PanelFooter || '');
})();
