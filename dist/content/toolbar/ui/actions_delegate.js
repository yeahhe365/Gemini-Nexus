(function () {
    function consumeEvent(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    class ToolbarUIActions {
        constructor(uiManager) {
            this.manager = uiManager;
        }

        get view() {
            return this.manager.view;
        }
        get renderer() {
            return this.manager.renderer;
        }

        triggerAction(event, action) {
            consumeEvent(event);
            this.manager.fireCallback('onAction', action);
        }

        cancelAsk(event) {
            consumeEvent(event);
            this.manager.fireCallback('onAction', 'cancel_ask');
        }

        stopAsk(event) {
            consumeEvent(event);
            this.manager.fireCallback('onAction', 'stop_ask');
        }

        retryAsk(event) {
            consumeEvent(event);
            this.manager.fireCallback('onAction', 'retry_ask');
        }

        continueChat(event) {
            consumeEvent(event);
            this.manager.fireCallback('onAction', 'continue_chat');
        }

        submitAsk() {
            const text = this.view.elements.askInput.value.trim();
            if (text) this.manager.fireCallback('onAction', 'submit_ask', text);
        }

        async copyResult(event) {
            consumeEvent(event);
            const text = this.renderer ? this.renderer.currentText : '';
            if (!text) return;

            try {
                await navigator.clipboard.writeText(text);
                this.view.toggleCopyIcon(true);
                setTimeout(() => this.view.toggleCopyIcon(false), 2000);
            } catch (error) {
                console.error('Failed to copy', error);
                this.view.showError('Copy failed.');
            }
        }

        insertResult(event) {
            consumeEvent(event);
            const text = this.renderer ? this.renderer.currentText : '';
            if (!text) return;
            this.manager.fireCallback('onAction', 'insert_result', text);
        }

        replaceResult(event) {
            consumeEvent(event);
            const text = this.renderer ? this.renderer.currentText : '';
            if (!text) return;
            this.manager.fireCallback('onAction', 'replace_result', text);
        }
    }

    window.GeminiToolbarUIActions = ToolbarUIActions;
})();
