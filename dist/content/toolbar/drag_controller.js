(function () {
    class DragController {
        constructor(targetElement, handleElement, callbacks = {}) {
            this.target = targetElement;
            this.handle = handleElement;
            this.callbacks = callbacks;

            this.isDragging = false;
            this.isFixed = false;
            this.dragOffset = { x: 0, y: 0 };

            this.onDragMove = this.onDragMove.bind(this);
            this.onDragEnd = this.onDragEnd.bind(this);

            this.init();
        }

        init() {
            this.handle.addEventListener('mousedown', (event) => {
                if (
                    event.target.closest('button') ||
                    event.target.closest('select') ||
                    event.target.closest('input')
                )
                    return;

                if (window.matchMedia('(max-width: 600px)').matches) return;

                event.preventDefault();
                this.startDrag(event.clientX, event.clientY);
            });

            this.handle.addEventListener(
                'touchstart',
                (event) => {
                    if (
                        event.target.closest('button') ||
                        event.target.closest('select') ||
                        event.target.closest('input')
                    )
                        return;

                    if (window.matchMedia('(max-width: 600px)').matches) return;

                    const touch = event.touches[0];
                    this.startDrag(touch.clientX, touch.clientY);
                },
                { passive: true }
            );
        }

        startDrag(clientX, clientY) {
            if (this.callbacks.onUndock) {
                this.callbacks.onUndock();
            }

            this.isDragging = true;

            const style = window.getComputedStyle(this.target);
            this.isFixed = style.position === 'fixed';

            const rect = this.target.getBoundingClientRect();

            this.dragOffset.x = clientX - rect.left;
            this.dragOffset.y = clientY - rect.top;

            this.target.classList.add('dragging');

            let initialLeft = rect.left;
            let initialTop = rect.top;

            if (!this.isFixed) {
                const scrollX = window.scrollX || window.pageXOffset;
                const scrollY = window.scrollY || window.pageYOffset;
                initialLeft += scrollX;
                initialTop += scrollY;
            }

            this.target.style.left = `${initialLeft}px`;
            this.target.style.top = `${initialTop}px`;
            this.target.style.transform = 'none';
            this.target.style.right = 'auto';

            document.addEventListener('mousemove', this.onDragMove);
            document.addEventListener('mouseup', this.onDragEnd);
            document.addEventListener('touchmove', this.onDragMove, { passive: false });
            document.addEventListener('touchend', this.onDragEnd);
        }

        onDragMove(event) {
            if (!this.isDragging) return;

            let clientX, clientY;

            if (event.type === 'touchmove') {
                event.preventDefault();
                clientX = event.touches[0].clientX;
                clientY = event.touches[0].clientY;
            } else {
                event.preventDefault();
                clientX = event.clientX;
                clientY = event.clientY;
            }

            let newLeft = clientX - this.dragOffset.x;
            let newTop = clientY - this.dragOffset.y;

            if (!this.isFixed) {
                const scrollX = window.scrollX || window.pageXOffset;
                const scrollY = window.scrollY || window.pageYOffset;
                newLeft += scrollX;
                newTop += scrollY;
            }

            this.target.style.left = `${newLeft}px`;
            this.target.style.top = `${newTop}px`;
        }

        onDragEnd() {
            this.isDragging = false;
            this.target.classList.remove('dragging');

            document.removeEventListener('mousemove', this.onDragMove);
            document.removeEventListener('mouseup', this.onDragEnd);
            document.removeEventListener('touchmove', this.onDragMove);
            document.removeEventListener('touchend', this.onDragEnd);

            this._checkDocking();
        }

        _checkDocking() {
            if (!this.callbacks.onSnap) return;

            const rect = this.target.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const threshold = 30;

            if (rect.left < threshold) {
                this.callbacks.onSnap('left', rect.top);
            } else if (rect.right > viewportWidth - threshold) {
                this.callbacks.onSnap('right', rect.top);
            }
        }

        reset() {
            this.target.classList.remove('dragging');
            this.target.style.transform = '';
        }
    }

    window.GeminiDragController = DragController;
})();
