(function () {
    /**
     * Shared layout helpers for positioning toolbar elements.
     */
    window.GeminiViewLayout = {
        positionElement: function (element, rect, isLargerWindow, mousePoint) {
            const scrollX = window.scrollX || window.pageXOffset;
            const scrollY = window.scrollY || window.pageYOffset;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let width = element.offsetWidth;
            let height = element.offsetHeight;

            // Hidden elements report zero size, so estimate their rendered footprint.
            if (width === 0 || height === 0) {
                width = isLargerWindow ? 400 : 220;
                height = isLargerWindow ? 300 : 40;
            }

            const edgePadding = 10;
            const cursorOffset = 12;

            let anchorX, anchorY;

            if (mousePoint) {
                anchorX = mousePoint.x;
                anchorY = mousePoint.y;
            } else if (rect) {
                anchorX = rect.right;
                anchorY = rect.bottom;
            } else {
                anchorX = viewportWidth / 2;
                anchorY = viewportHeight / 2;
            }

            let visualLeft = anchorX + cursorOffset;
            let visualTop = anchorY + cursorOffset;

            if (visualLeft + width > viewportWidth - edgePadding) {
                visualLeft = anchorX - width - cursorOffset;

                if (visualLeft < edgePadding) {
                    visualLeft = viewportWidth - width - edgePadding;
                }
            }

            if (visualTop + height > viewportHeight - edgePadding) {
                visualTop = anchorY - height - cursorOffset;

                if (!isLargerWindow) {
                    element.classList.remove('placed-bottom');
                    element.classList.add('placed-top');
                }

                if (visualTop < edgePadding) {
                    visualTop = viewportHeight - height - edgePadding;
                }
            } else {
                if (!isLargerWindow) {
                    element.classList.remove('placed-top');
                    element.classList.add('placed-bottom');
                }
            }

            if (!isLargerWindow) {
                // Small Toolbar: CSS has transform: translateY(10px) (no horizontal transform)
                // So style.left is exact position.
                element.style.left = `${visualLeft + scrollX}px`;
                element.style.top = `${visualTop + scrollY}px`;
            } else {
                // Ask Window: Fixed positioning, no transform centering.
                element.style.left = `${visualLeft}px`;
                element.style.top = `${visualTop}px`;
            }
        },

        resizeSelect: function (select) {
            if (!select) return;
            const measurementSpan = document.createElement('span');
            measurementSpan.style.visibility = 'hidden';
            measurementSpan.style.position = 'absolute';
            measurementSpan.style.fontSize = '13px'; // Match CSS
            measurementSpan.style.fontWeight = '500'; // Match CSS
            measurementSpan.style.fontFamily = window.getComputedStyle(select).fontFamily;
            measurementSpan.style.whiteSpace = 'nowrap';
            measurementSpan.textContent = select.options[select.selectedIndex].text;

            if (select.parentNode) {
                select.parentNode.appendChild(measurementSpan);
                const measuredWidth = measurementSpan.getBoundingClientRect().width;
                select.parentNode.removeChild(measurementSpan);

                const horizontalPaddingAndBuffer = 34;
                select.style.width = `${measuredWidth + horizontalPaddingAndBuffer}px`;
            }
        },
    };
})();
