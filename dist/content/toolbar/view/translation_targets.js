(function () {
    function normalizeTargets(targets) {
        const normalizer = window.GeminiToolbarI18n?.normalizeTranslationTargets;
        if (typeof normalizer === 'function') return normalizer(targets);
        return Array.isArray(targets) && targets.length > 0 ? targets : ['auto'];
    }

    class TranslationTargetView {
        constructor(elements) {
            this.elements = elements;
        }

        show() {
            this.elements.translationTargets?.classList.remove('hidden');
        }

        hide() {
            this.elements.translationTargets?.classList.add('hidden');
            this.closeDropdown();
        }

        getSelected() {
            const inputs = this._getInputs();
            return normalizeTargets(
                inputs.filter((input) => input.checked).map((input) => input.value)
            );
        }

        setSelected(targets) {
            const selected = normalizeTargets(targets);
            const selectedSet = new Set(selected);
            const inputs = this._getInputs();

            inputs.forEach((input) => {
                input.checked = selectedSet.has(input.value);
            });

            if (!inputs.some((input) => input.checked) && inputs[0]) {
                inputs[0].checked = true;
            }

            this.updateSummary();
        }

        toggleDropdown() {
            const menu = this.elements.translationTargetMenu;
            const isOpen = menu && !menu.classList.contains('hidden');
            this.setDropdownOpen(!isOpen);
        }

        closeDropdown() {
            this.setDropdownOpen(false);
        }

        setDropdownOpen(open) {
            const menu = this.elements.translationTargetMenu;
            const trigger = this.elements.translationTargetTrigger;
            if (menu) menu.classList.toggle('hidden', !open);
            if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        }

        updateSummary() {
            const summary = this.elements.translationTargetSummary;
            if (!summary) return;

            const selected = new Set(this.getSelected());
            const labels = this._getInputs()
                .filter((input) => selected.has(input.value))
                .map((input) => this._getInputLabel(input));

            summary.textContent = labels.join(', ');
        }

        _getInputs() {
            const root = this.elements.translationTargetOptions;
            if (!root || typeof root.querySelectorAll !== 'function') return [];
            return [...root.querySelectorAll('input[name="translation-target"]')];
        }

        _getInputLabel(input) {
            const label = input.closest?.('label');
            return label?.querySelector?.('span')?.textContent?.trim() || input.value;
        }
    }

    window.GeminiTranslationTargetView = TranslationTargetView;
})();
