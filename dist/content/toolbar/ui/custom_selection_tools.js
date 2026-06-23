(function () {
    function getToolButtonLabel(name) {
        const normalized = String(name || '').trim();
        if (!normalized) return '+';
        return normalized.slice(0, 2).toUpperCase();
    }

    class CustomSelectionToolsUI {
        constructor({ elements = {}, tools = [], onAction = () => {} } = {}) {
            this.elements = elements;
            this.onAction = onAction;
            this.tools = Array.isArray(tools) ? tools : [];
        }

        setElements(elements = {}) {
            this.elements = elements;
            this.render();
        }

        setTools(tools) {
            this.tools = Array.isArray(tools) ? tools : [];
            this.render();
        }

        getTools() {
            return this.tools;
        }

        getEnabledTools() {
            return this.tools.filter(
                (tool) => tool?.enabled !== false && tool?.name && tool?.prompt
            );
        }

        render() {
            const { customSelectionTools, customSelectionMore, customSelectionMoreMenu } =
                this.elements || {};
            if (!customSelectionTools || !customSelectionMore || !customSelectionMoreMenu) return;

            customSelectionTools.replaceChildren();
            customSelectionMoreMenu.replaceChildren();

            const enabledTools = this.getEnabledTools();
            const directTools = enabledTools.slice(0, 2);
            const menuTools = enabledTools.slice(2);

            directTools.forEach((tool) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'btn custom-selection-tool-btn';
                button.title = tool.name;
                button.setAttribute('aria-label', tool.name);
                button.textContent = getToolButtonLabel(tool.name);
                button.addEventListener('mousedown', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    this.onAction('custom_selection_tool', tool);
                });
                customSelectionTools.appendChild(button);
            });

            menuTools.forEach((tool) => {
                const menuItemButton = document.createElement('button');
                menuItemButton.type = 'button';
                menuItemButton.className = 'custom-selection-more-item';
                menuItemButton.textContent = tool.name;
                menuItemButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    this.onAction('custom_selection_tool', tool);
                });
                customSelectionMoreMenu.appendChild(menuItemButton);
            });

            customSelectionMore.classList.toggle('hidden', menuTools.length === 0);
        }
    }

    window.GeminiCustomSelectionToolsUI = CustomSelectionToolsUI;
})();
