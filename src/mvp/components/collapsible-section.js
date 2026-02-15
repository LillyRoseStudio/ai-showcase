/**
 * Collapsible Section Component
 * Creates a details/summary disclosure widget with animated indicator.
 * Uses BEM naming: .collapsible-section, .collapsible-section__summary,
 * .collapsible-section__content
 * Arrow animation is handled by existing CSS (details summary::before).
 *
 * @param {Object} options
 * @param {string} options.summaryText - Text for the summary/toggle label
 * @param {boolean} [options.open=false] - Whether initially expanded
 * @returns {HTMLElement} The details element (append content to .collapsible-section__content)
 *
 * @example
 * const section = createCollapsibleSection({ summaryText: 'View Annual Breakdown' });
 * const content = document.createElement('p');
 * content.textContent = 'Annual details here';
 * section.querySelector('.collapsible-section__content').appendChild(content);
 *
 * @example
 * const expanded = createCollapsibleSection({ summaryText: 'Options', open: true });
 */
// Implements REQ-MVP-014: Collapsible detail sections
function createCollapsibleSection({ summaryText, open = false }) {
    const details = document.createElement('details');
    details.className = 'collapsible-section';

    if (open) {
        details.open = true;
    }

    const summary = document.createElement('summary');
    summary.className = 'collapsible-section__summary';
    summary.textContent = summaryText;

    const content = document.createElement('div');
    content.className = 'collapsible-section__content';

    details.appendChild(summary);
    details.appendChild(content);

    return details;
}

export { createCollapsibleSection };
