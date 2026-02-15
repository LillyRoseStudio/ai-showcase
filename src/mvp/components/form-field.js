/**
 * Form Field Component
 * Creates a complete form group with label, optional help text,
 * input container, and validation message area.
 * Uses BEM naming: .form-field, .form-field__label, .form-field__help,
 * .form-field__input-slot, .form-field__error
 * Extends existing .form-group, .help-text, .error-message classes.
 *
 * @param {Object} options
 * @param {string} options.label - Label text
 * @param {string} options.inputId - ID for the input (used in label's `for` attribute)
 * @param {string} [options.helpText] - Optional help text below label
 * @param {string} [options.helpId] - ID for help text (for aria-describedby)
 * @param {string} [options.errorId] - ID for error message container
 * @returns {HTMLElement} The form group div (append your input element to .form-field__input-slot)
 *
 * @example
 * const field = createFormField({
 *   label: 'Annual Salary',
 *   inputId: 'salary',
 *   helpText: 'Enter gross salary',
 *   helpId: 'salary-help',
 *   errorId: 'salary-error'
 * });
 * const input = document.createElement('input');
 * input.type = 'text';
 * input.id = 'salary';
 * field.querySelector('.form-field__input-slot').appendChild(input);
 *
 * @example
 * const simple = createFormField({ label: 'Name', inputId: 'name' });
 */
// Implements REQ-MVP-001: Form field structure
function createFormField({ label, inputId, helpText, helpId, errorId }) {
    const group = document.createElement('div');
    group.className = 'form-field form-group';

    // Label
    const labelEl = document.createElement('label');
    labelEl.className = 'form-field__label';
    labelEl.setAttribute('for', inputId);
    labelEl.textContent = label;
    group.appendChild(labelEl);

    // Help text (optional)
    if (helpText) {
        const helpEl = document.createElement('span');
        helpEl.className = 'form-field__help help-text';
        helpEl.textContent = helpText;
        if (helpId) {
            helpEl.id = helpId;
        }
        group.appendChild(helpEl);
    }

    // Input slot — consumers append their input element here
    const slot = document.createElement('div');
    slot.className = 'form-field__input-slot';
    group.appendChild(slot);

    // Error message (optional)
    if (errorId) {
        const errorEl = document.createElement('div');
        errorEl.className = 'form-field__error error-message';
        errorEl.id = errorId;
        errorEl.setAttribute('role', 'alert');
        errorEl.hidden = true;
        group.appendChild(errorEl);
    }

    return group;
}

export { createFormField };
