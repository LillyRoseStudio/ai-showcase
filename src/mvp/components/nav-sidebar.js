/**
 * Navigation Sidebar Component
 * Creates the sidebar navigation for the application.
 * Includes mobile hamburger toggle. Consistent across all pages.
 * Uses BEM naming: .nav-sidebar, .nav-sidebar__header, .nav-sidebar__toggle,
 * .nav-sidebar__brand, .nav-sidebar__list, .nav-sidebar__item,
 * .nav-sidebar__link, .nav-sidebar__link--active, .nav-sidebar__overlay
 *
 * @param {Object} options
 * @param {string} [options.activePage='dashboard'] - ID of the current page:
 *   'dashboard' | 'paye' | 'rental'
 * @param {string} [options.basePath=''] - Base path prefix for nav links.
 *   Set to '../../' when used from pages in IRD/PAYE_Calc/ or IRD/Individual/.
 *   Set to '' (default) when used from root-level pages.
 * @returns {HTMLElement}
 *
 * @example
 * // From root index.html
 * const nav = createNavSidebar({ activePage: 'dashboard' });
 * document.body.prepend(nav);
 *
 * @example
 * // From IRD/PAYE_Calc/index.html
 * const nav = createNavSidebar({ activePage: 'paye', basePath: '../../' });
 * document.body.prepend(nav);
 */
// Implements sidebar navigation across all pages
function createNavSidebar({ activePage = 'dashboard', basePath = '' } = {}) {
    /** @type {Array<{id: string, label: string, href: string, icon: string}>} */
    const navItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            href: basePath + 'index.html',
            icon: '\uD83C\uDFE0' // 🏠
        },
        {
            id: 'paye',
            label: 'PAYE Calculator',
            href: basePath + 'IRD/PAYE_Calc/index.html',
            icon: '\uD83D\uDCB0' // 💰
        },
        {
            id: 'rental',
            label: 'Rental Portfolio',
            href: basePath + 'IRD/Individual/rental-property.html',
            icon: '\uD83C\uDFE2' // 🏢
        }
    ];

    // Container
    const aside = document.createElement('aside');
    aside.className = 'nav-sidebar';
    aside.setAttribute('aria-label', 'Main navigation');

    // ── Header with brand + mobile toggle ──
    const header = document.createElement('div');
    header.className = 'nav-sidebar__header';

    const brand = document.createElement('a');
    brand.className = 'nav-sidebar__brand';
    brand.href = basePath + 'index.html';
    brand.textContent = 'NZ Tax Tools';

    const toggle = document.createElement('button');
    toggle.className = 'nav-sidebar__toggle';
    toggle.setAttribute('type', 'button');
    toggle.setAttribute('aria-label', 'Toggle navigation');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span class="nav-sidebar__toggle-icon"></span>';

    header.appendChild(brand);
    header.appendChild(toggle);
    aside.appendChild(header);

    // ── Navigation list ──
    const nav = document.createElement('nav');
    nav.className = 'nav-sidebar__nav';

    const ul = document.createElement('ul');
    ul.className = 'nav-sidebar__list';
    ul.setAttribute('role', 'list');

    navItems.forEach(function (item) {
        const li = document.createElement('li');
        li.className = 'nav-sidebar__item';

        const isActive = item.id === activePage;

        const a = document.createElement('a');
        a.className = 'nav-sidebar__link';
        if (isActive) {
            a.classList.add('nav-sidebar__link--active');
            a.setAttribute('aria-current', 'page');
        }
        // Active page links to '#' to avoid reload
        a.href = isActive ? '#' : item.href;

        const iconSpan = document.createElement('span');
        iconSpan.className = 'nav-sidebar__link-icon';
        iconSpan.setAttribute('aria-hidden', 'true');
        iconSpan.textContent = item.icon;

        const labelSpan = document.createElement('span');
        labelSpan.className = 'nav-sidebar__link-label';
        labelSpan.textContent = item.label;

        a.appendChild(iconSpan);
        a.appendChild(labelSpan);
        li.appendChild(a);
        ul.appendChild(li);
    });

    nav.appendChild(ul);
    aside.appendChild(nav);

    // ── Mobile overlay ──
    const overlay = document.createElement('div');
    overlay.className = 'nav-sidebar__overlay';
    overlay.setAttribute('aria-hidden', 'true');

    // ── Mobile toggle behaviour ──
    function openSidebar() {
        aside.classList.add('nav-sidebar--open');
        toggle.setAttribute('aria-expanded', 'true');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('nav-sidebar-body--open');
    }

    function closeSidebar() {
        aside.classList.remove('nav-sidebar--open');
        toggle.setAttribute('aria-expanded', 'false');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('nav-sidebar-body--open');
    }

    toggle.addEventListener('click', function () {
        var isOpen = aside.classList.contains('nav-sidebar--open');
        if (isOpen) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    overlay.addEventListener('click', closeSidebar);

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && aside.classList.contains('nav-sidebar--open')) {
            closeSidebar();
            toggle.focus();
        }
    });

    // Insert overlay as a sibling so it sits outside the sidebar
    // Consumer should append both: sidebar + overlay
    // We attach overlay as a property for easy access
    aside._overlay = overlay;

    return aside;
}

/**
 * Helper to mount the nav sidebar and its overlay into the document.
 * Adjusts body layout for the sidebar.
 *
 * @param {Object} options - Same options as createNavSidebar
 */
function mountNavSidebar(options) {
    var sidebar = createNavSidebar(options);
    document.body.prepend(sidebar._overlay);
    document.body.prepend(sidebar);
    document.body.classList.add('nav-sidebar-body');
}

export { createNavSidebar, mountNavSidebar };
