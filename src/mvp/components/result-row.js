/**
 * Result Row Component
 * Creates a label-value pair row for calculation results.
 * Uses BEM naming: .result-row, .result-row__label, .result-row__value
 * Maps to existing .row / .deduction / .take-home-row classes for backward compat.
 *
 * @param {Object} options
 * @param {string} options.label - Display label text
 * @param {string} options.value - Formatted value text
 * @param {string} [options.variant='default'] - 'default' | 'deduction' | 'take-home'
 * @param {string} [options.id] - Optional ID for the dd element (for dynamic updates)
 * @param {string} [options.labelId] - Optional ID for the dt element
 * @param {boolean} [options.hidden=false] - Whether the row is initially hidden
 * @returns {HTMLElement}
 *
 * @example
 * const row = createResultRow({ label: 'PAYE Tax', value: '-$851.71', variant: 'deduction' });
 * container.appendChild(row);
 *
 * @example
 * const takeHome = createResultRow({
 *   label: 'Take-Home Pay',
 *   value: '$3,412.50',
 *   variant: 'take-home',
 *   id: 'monthly-take-home'
 * });
 */
// Implements REQ-MVP-012: Result display rows
function createResultRow({ label, value, variant = 'default', id, labelId, hidden = false }) {
    const wrapper = document.createElement('div');

    // BEM class + backward-compat class
    wrapper.className = 'result-row row';

    if (variant === 'take-home') {
        wrapper.classList.add('result-row--take-home', 'take-home-row');
    }

    if (hidden) {
        wrapper.hidden = true;
    }

    // Label (dt)
    const dt = document.createElement('dt');
    dt.className = 'result-row__label';
    dt.textContent = label;
    if (labelId) {
        dt.id = labelId;
    }

    // Value (dd)
    const dd = document.createElement('dd');
    dd.className = 'result-row__value';
    dd.textContent = value;
    if (id) {
        dd.id = id;
    }

    // Variant-specific styling
    if (variant === 'deduction') {
        dd.classList.add('result-row__value--deduction', 'deduction');
    }

    wrapper.appendChild(dt);
    wrapper.appendChild(dd);

    return wrapper;
}

export { createResultRow };
