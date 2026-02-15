/**
 * Alert Danger Component
 * Creates a dismissible error alert banner.
 * Uses BEM naming: .alert-danger, .alert-danger__message, .alert-danger__close
 *
 * @param {Object} options
 * @param {string} options.message - Error message text
 * @param {boolean} [options.dismissible=true] - Whether the alert can be closed
 * @param {Function} [options.onDismiss] - Callback when alert is dismissed
 * @returns {HTMLElement}
 *
 * @example
 * const alert = createAlertDanger({
 *   message: 'Unable to connect to server',
 *   onDismiss: () => console.log('alert closed')
 * });
 * document.body.appendChild(alert);
 *
 * @example
 * const persistent = createAlertDanger({ message: 'Critical error', dismissible: false });
 */
// Implements REQ-MVP-028: Error alert display
function createAlertDanger({ message, dismissible = true, onDismiss }) {
    const wrapper = document.createElement('div');
    wrapper.className = 'alert-danger';
    wrapper.setAttribute('role', 'alert');

    // Message
    const messageEl = document.createElement('span');
    messageEl.className = 'alert-danger__message';
    messageEl.textContent = message;
    wrapper.appendChild(messageEl);

    // Dismiss button (optional)
    if (dismissible) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'alert-danger__close btn-close';
        closeBtn.setAttribute('type', 'button');
        closeBtn.setAttribute('aria-label', 'Dismiss');
        closeBtn.textContent = '\u00D7'; // × character

        /** @param {Event} e */
        function handleDismiss(e) {
            e.preventDefault();
            wrapper.remove();
            if (typeof onDismiss === 'function') {
                onDismiss();
            }
        }

        closeBtn.addEventListener('click', handleDismiss);

        // Keyboard: Enter and Space on close button trigger dismiss
        closeBtn.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleDismiss(e);
            }
        });

        wrapper.appendChild(closeBtn);
    }

    return wrapper;
}

export { createAlertDanger };
