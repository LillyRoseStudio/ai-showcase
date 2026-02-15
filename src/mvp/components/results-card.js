/**
 * Results Card Component
 * Creates a card container for displaying calculation results.
 * Uses BEM naming: .results-card, .results-card__title
 * Extends the existing .card class for card styling.
 *
 * @param {Object} options
 * @param {string} options.heading - Card heading text
 * @param {string} [options.id] - Optional ID for the section element
 * @param {boolean} [options.hidden=false] - Whether initially hidden
 * @param {string} [options.ariaLabel] - Accessible label
 * @param {boolean} [options.ariaLive=false] - Whether to add aria-live="polite"
 * @returns {HTMLElement} The card section element (append children to it)
 *
 * @example
 * const card = createResultsCard({ heading: 'Monthly Breakdown', id: 'results', ariaLive: true });
 * card.appendChild(someContent);
 *
 * @example
 * const hidden = createResultsCard({ heading: 'Details', hidden: true, ariaLabel: 'Calculation details' });
 */
// Implements REQ-MVP-012: Results card container
function createResultsCard({ heading, id, hidden = false, ariaLabel, ariaLive = false }) {
    const section = document.createElement('section');
    section.className = 'results-card card results-section';

    if (id) {
        section.id = id;
    }

    if (hidden) {
        section.hidden = true;
    }

    if (ariaLabel) {
        section.setAttribute('aria-label', ariaLabel);
    }

    if (ariaLive) {
        section.setAttribute('aria-live', 'polite');
    }

    const title = document.createElement('h2');
    title.className = 'results-card__title results-title';
    title.textContent = heading;

    section.appendChild(title);

    return section;
}

export { createResultsCard };
