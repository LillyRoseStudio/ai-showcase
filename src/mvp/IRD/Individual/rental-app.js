/* ================================================
   Rental Property Module — Shared JavaScript
   REQ-001, REQ-002, REQ-003, REQ-006, REQ-007,
   REQ-008, REQ-009, REQ-012
   ================================================ */

'use strict';

/* ------------------------------------------------
   Constants & Defaults
   ------------------------------------------------ */

// REQ-006: Default user stub
var DEFAULT_USER = Object.freeze({
    userId: 'default-user',
    displayName: 'Current User'
});

// REQ-007: Default settings
var DEFAULT_SETTINGS = Object.freeze({
    taxYear: '2025/2026',
    interestDeductibilityRate: 0.80
});

// REQ-002: Expense category list
var EXPENSE_CATEGORIES = Object.freeze([
    'Interest',
    'Rates',
    'Insurance',
    'PropertyManagement',
    'BodyCorporate',
    'RepairsMaintenance',
    'Cleaning',
    'Advertising',
    'LegalFees',
    'AccountingFees',
    'Utilities',
    'Travel',
    'Other'
]);

// Status lifecycle labels and order
var STATUS_ORDER = Object.freeze([
    'NotStarted',
    'InProgress',
    'ReadyToReview',
    'Complete',
    'Locked'
]);

// REQ-015: Tax classification options
var TAX_CLASSIFICATIONS = Object.freeze(['Residential', 'Commercial', 'MixedUse']);

/* ------------------------------------------------
   LocalStorage Keys
   ------------------------------------------------ */
var STORAGE_KEYS = Object.freeze({
    properties:   'rental_properties',
    workpapers:   'rental_workpapers',
    activities:   'rental_activities',
    evidence:     'rental_evidence',
    settings:     'rental_settings',
    contributors: 'rental_contributors',
    taxreturns:   'rental_taxreturns'
});

/* ------------------------------------------------
   Utility: Format currency (NZD)
   ------------------------------------------------ */
function formatCurrency(value) {
    if (value == null || isNaN(value)) return '$0.00';
    var abs = Math.abs(value);
    var formatted = '$' + abs.toLocaleString('en-NZ', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    return value < 0 ? '-' + formatted : formatted;
}

/* ------------------------------------------------
   Utility: Format readable category names
   ------------------------------------------------ */
function formatCategory(cat) {
    if (!cat) return '';
    return cat.replace(/([A-Z])/g, ' $1').trim();
}

/* ------------------------------------------------
   Utility: Format date for display
   ------------------------------------------------ */
function formatDate(isoString) {
    if (!isoString) return '';
    var d = new Date(isoString);
    return d.toLocaleDateString('en-NZ', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

/* ------------------------------------------------
   Utility: Parse query string params
   ------------------------------------------------ */
function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
}

/* ================================================
   Data Layer — Generic localStorage CRUD
   ================================================ */

function _load(key) {
    try {
        var raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Failed to load ' + key, e);
        return [];
    }
}

function _save(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save ' + key, e);
    }
}

/* ------------------------------------------------
   Settings (REQ-007)
   ------------------------------------------------ */
function loadSettings() {
    try {
        var raw = localStorage.getItem(STORAGE_KEYS.settings);
        if (raw) {
            var parsed = JSON.parse(raw);
            return Object.assign({}, DEFAULT_SETTINGS, parsed);
        }
    } catch (e) { /* ignore */ }
    return Object.assign({}, DEFAULT_SETTINGS);
}

function saveSettings(settings) {
    _save(STORAGE_KEYS.settings, settings);
}

/* ------------------------------------------------
   Properties CRUD (REQ-001)
   ------------------------------------------------ */
function loadProperties() {
    return _load(STORAGE_KEYS.properties);
}

function saveProperties(properties) {
    _save(STORAGE_KEYS.properties, properties);
}

function getPropertyById(id) {
    var props = loadProperties();
    return props.find(function (p) { return p.propertyId === id; }) || null;
}

function createProperty(data) {
    var props = loadProperties();
    var property = {
        propertyId: crypto.randomUUID(),
        displayName: data.displayName || '',
        addressLine1: data.addressLine1 || '',
        city: data.city || '',
        propertyType: data.propertyType || 'House',
        // REQ-015: Tax classification
        taxClassification: data.taxClassification || 'Residential',
        ownershipPercentage: parseFloat(data.ownershipPercentage) || 1.0,
        acquisitionDate: data.acquisitionDate || null,
        disposalDate: data.disposalDate || null,
        isMainHome: !!data.isMainHome,
        isNewBuild: !!data.isNewBuild,
        isActive: data.isActive !== false
    };
    props.push(property);
    saveProperties(props);

    // REQ-001: Also create a workpaper for this property
    createWorkpaper(property.propertyId);

    return property;
}

function updateProperty(id, data) {
    var props = loadProperties();
    var idx = props.findIndex(function (p) { return p.propertyId === id; });
    if (idx === -1) return null;
    Object.assign(props[idx], data);
    saveProperties(props);
    return props[idx];
}

function deleteProperty(id) {
    var props = loadProperties().filter(function (p) { return p.propertyId !== id; });
    saveProperties(props);
    // Also remove associated workpapers, activities, evidence
    var wps = loadWorkpapers().filter(function (w) { return w.propertyId !== id; });
    saveWorkpapers(wps);
}

/* ------------------------------------------------
   Workpapers CRUD (REQ-002, REQ-003, REQ-007)
   ------------------------------------------------ */
function loadWorkpapers() {
    return _load(STORAGE_KEYS.workpapers);
}

function saveWorkpapers(workpapers) {
    _save(STORAGE_KEYS.workpapers, workpapers);
}

function getWorkpaperByPropertyId(propertyId) {
    var settings = loadSettings();
    var wps = loadWorkpapers();
    return wps.find(function (w) {
        return w.propertyId === propertyId && w.taxYear === settings.taxYear;
    }) || null;
}

function getWorkpaperById(id) {
    var wps = loadWorkpapers();
    return wps.find(function (w) { return w.workpaperId === id; }) || null;
}

function createWorkpaper(propertyId) {
    var settings = loadSettings();
    var wps = loadWorkpapers();
    // Don't duplicate
    var existing = wps.find(function (w) {
        return w.propertyId === propertyId && w.taxYear === settings.taxYear;
    });
    if (existing) return existing;

    var wp = {
        workpaperId: crypto.randomUUID(),
        propertyId: propertyId,
        taxYear: settings.taxYear,
        status: 'NotStarted',
        grossRentalIncome: 0,
        // REQ-014: Other income
        otherIncome: 0,
        totalIncome: 0,
        daysRented: 0,
        daysAvailable: 0,
        daysPrivate: 0,
        mixedUse: false,
        expenseLines: [],
        createdBy: DEFAULT_USER.userId,
        lastModifiedBy: DEFAULT_USER.userId,
        currentOwnerUserId: DEFAULT_USER.userId,
        // Calculated fields
        totalExpenses: 0,
        capitalExcludedTotal: 0,
        // REQ-013: Capital expenditure tracking
        hasCapitalExpenditure: false,
        capitalExpenditureTotal: 0,
        deductibleExpenseBase: 0,
        ownedExpenses: 0,
        apportionedExpenses: 0,
        interestTotal: 0,
        deductibleInterest: 0,
        adjustedDeductibleExpenses: 0,
        adjustedIncome: 0,
        netRentalIncome: 0,
        lossCarryForward: 0
    };
    wps.push(wp);
    saveWorkpapers(wps);
    // REQ-012: Auto-add default user as contributor with Preparer role
    var contributor = addContributor(wp.workpaperId, DEFAULT_USER.userId, 'Preparer');
    if (contributor) {
        assignOwner(wp.workpaperId, contributor.contributorId);
    }
    logActivity(wp.workpaperId, 'Created', 'status', null, 'NotStarted');
    return wp;
}

function updateWorkpaper(id, data) {
    var wps = loadWorkpapers();
    var idx = wps.findIndex(function (w) { return w.workpaperId === id; });
    if (idx === -1) return null;
    Object.assign(wps[idx], data);
    wps[idx].lastModifiedBy = DEFAULT_USER.userId;
    saveWorkpapers(wps);
    return wps[idx];
}

/* ------------------------------------------------
   Expense Lines CRUD (REQ-002)
   ------------------------------------------------ */
function addExpenseLine(workpaperId, lineData) {
    var wps = loadWorkpapers();
    var idx = wps.findIndex(function (w) { return w.workpaperId === workpaperId; });
    if (idx === -1) return null;

    var line = {
        lineId: crypto.randomUUID(),
        category: lineData.category || 'Other',
        description: lineData.description || '',
        amount: parseFloat(lineData.amount) || 0,
        isCapital: !!lineData.isCapital,
        isApportionable: lineData.isApportionable !== false,
        evidenceIds: [],
        notes: lineData.notes || ''
    };
    wps[idx].expenseLines.push(line);
    saveWorkpapers(wps);
    logActivity(workpaperId, 'AddedExpense', 'expenseLine', null,
        line.category + ': ' + formatCurrency(line.amount));
    return line;
}

function updateExpenseLine(workpaperId, lineId, lineData) {
    var wps = loadWorkpapers();
    var wpIdx = wps.findIndex(function (w) { return w.workpaperId === workpaperId; });
    if (wpIdx === -1) return null;
    var lineIdx = wps[wpIdx].expenseLines.findIndex(function (l) { return l.lineId === lineId; });
    if (lineIdx === -1) return null;
    var old = Object.assign({}, wps[wpIdx].expenseLines[lineIdx]);
    Object.assign(wps[wpIdx].expenseLines[lineIdx], lineData);
    saveWorkpapers(wps);
    logActivity(workpaperId, 'UpdatedExpense', 'expenseLine',
        old.category + ': ' + formatCurrency(old.amount),
        (lineData.category || old.category) + ': ' + formatCurrency(lineData.amount || old.amount));
    return wps[wpIdx].expenseLines[lineIdx];
}

function removeExpenseLine(workpaperId, lineId) {
    var wps = loadWorkpapers();
    var wpIdx = wps.findIndex(function (w) { return w.workpaperId === workpaperId; });
    if (wpIdx === -1) return;
    var line = wps[wpIdx].expenseLines.find(function (l) { return l.lineId === lineId; });
    wps[wpIdx].expenseLines = wps[wpIdx].expenseLines.filter(function (l) { return l.lineId !== lineId; });
    saveWorkpapers(wps);
    if (line) {
        logActivity(workpaperId, 'RemovedExpense', 'expenseLine',
            line.category + ': ' + formatCurrency(line.amount), null);
    }
}

/* ------------------------------------------------
   Evidence CRUD (REQ-009)
   ------------------------------------------------ */
function loadEvidence() {
    return _load(STORAGE_KEYS.evidence);
}

function saveEvidence(evidence) {
    _save(STORAGE_KEYS.evidence, evidence);
}

function getEvidenceForWorkpaper(workpaperId) {
    var wp = getWorkpaperById(workpaperId);
    if (!wp) return [];
    var allLineEvidenceIds = [];
    wp.expenseLines.forEach(function (line) {
        if (line.evidenceIds) {
            allLineEvidenceIds = allLineEvidenceIds.concat(line.evidenceIds);
        }
    });
    var allEvidence = loadEvidence();
    return allEvidence.filter(function (e) {
        return e.workpaperId === workpaperId || allLineEvidenceIds.indexOf(e.evidenceId) !== -1;
    });
}

function addEvidence(workpaperId, data) {
    var evidenceList = loadEvidence();
    var evidence = {
        evidenceId: crypto.randomUUID(),
        workpaperId: workpaperId,
        fileName: data.fileName || 'untitled',
        contentType: data.contentType || 'application/octet-stream',
        sizeBytes: parseInt(data.sizeBytes, 10) || 0,
        uploadedAt: new Date().toISOString(),
        uploadedBy: DEFAULT_USER.userId
    };
    evidenceList.push(evidence);
    saveEvidence(evidenceList);
    logActivity(workpaperId, 'AddedEvidence', 'evidence', null, evidence.fileName);
    return evidence;
}

function removeEvidence(evidenceId) {
    var evidenceList = loadEvidence();
    var item = evidenceList.find(function (e) { return e.evidenceId === evidenceId; });
    evidenceList = evidenceList.filter(function (e) { return e.evidenceId !== evidenceId; });
    saveEvidence(evidenceList);
    if (item) {
        logActivity(item.workpaperId, 'RemovedEvidence', 'evidence', item.fileName, null);
    }
}

/* ------------------------------------------------
   Contributors CRUD (REQ-012)
   ------------------------------------------------ */
function loadContributors() {
    return _load(STORAGE_KEYS.contributors);
}

function saveContributors(contributors) {
    _save(STORAGE_KEYS.contributors, contributors);
}

function getContributorsForWorkpaper(workpaperId) {
    return loadContributors().filter(function (c) {
        return c.workpaperId === workpaperId;
    });
}

// Implements REQ-012: Add a contributor to a workpaper
function addContributor(workpaperId, userId, role) {
    var contributors = loadContributors();
    // Don't duplicate active contributors
    var existing = contributors.find(function (c) {
        return c.workpaperId === workpaperId && c.userId === userId && c.isActive;
    });
    if (existing) return existing;

    var contributor = {
        contributorId: crypto.randomUUID(),
        workpaperId: workpaperId,
        userId: userId,
        role: role || 'Contributor',
        firstActivityAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        isCurrentOwner: false,
        isActive: true
    };
    contributors.push(contributor);
    saveContributors(contributors);
    return contributor;
}

// Implements REQ-012: Assign ownership of a workpaper to a contributor
function assignOwner(workpaperId, contributorId) {
    var contributors = loadContributors();
    contributors.forEach(function (c) {
        if (c.workpaperId === workpaperId) {
            c.isCurrentOwner = (c.contributorId === contributorId);
        }
    });
    saveContributors(contributors);
}

// Implements REQ-012: Update contributor role
function updateContributorRole(contributorId, newRole) {
    var contributors = loadContributors();
    var contributor = contributors.find(function (c) {
        return c.contributorId === contributorId;
    });
    if (!contributor) return null;
    contributor.role = newRole;
    saveContributors(contributors);
    return contributor;
}

// Implements REQ-012: Ensure contributor exists, update lastActivityAt
function ensureContributor(workpaperId, userId) {
    var contributors = loadContributors();
    var existing = contributors.find(function (c) {
        return c.workpaperId === workpaperId && c.userId === userId && c.isActive;
    });
    if (existing) {
        existing.lastActivityAt = new Date().toISOString();
        saveContributors(contributors);
        return existing;
    }
    return addContributor(workpaperId, userId, 'Contributor');
}

/* ------------------------------------------------
   Activity Logging (REQ-006)
   ------------------------------------------------ */
function loadActivities() {
    return _load(STORAGE_KEYS.activities);
}

function saveActivities(activities) {
    _save(STORAGE_KEYS.activities, activities);
}

function logActivity(workpaperId, actionType, fieldName, oldValue, newValue) {
    var activities = loadActivities();
    var entry = {
        activityId: crypto.randomUUID(),
        workpaperId: workpaperId,
        userId: DEFAULT_USER.userId,
        actionType: actionType,
        fieldName: fieldName || null,
        oldValue: oldValue != null ? String(oldValue) : null,
        newValue: newValue != null ? String(newValue) : null,
        timestamp: new Date().toISOString()
    };
    activities.push(entry);
    saveActivities(activities);
    // REQ-012: Ensure contributor exists and update activity timestamp
    ensureContributor(workpaperId, entry.userId);
    return entry;
}

function getActivitiesForWorkpaper(workpaperId) {
    return loadActivities().filter(function (a) {
        return a.workpaperId === workpaperId;
    }).sort(function (a, b) {
        return new Date(b.timestamp) - new Date(a.timestamp);
    });
}

/* ================================================
   Calculation Pipeline (REQ-007)
   ================================================ */
function calculateWorkpaper(workpaperId) {
    var wp = getWorkpaperById(workpaperId);
    if (!wp) return null;

    var property = getPropertyById(wp.propertyId);
    var settings = loadSettings();
    var ownershipPct = property ? property.ownershipPercentage : 1.0;

    var expenseLines = wp.expenseLines || [];

    // TotalExpenses = sum(expenseLines.amount)
    var totalExpenses = expenseLines.reduce(function (sum, l) {
        return sum + (parseFloat(l.amount) || 0);
    }, 0);

    // CapitalExcludedTotal = sum(amount where isCapital)
    var capitalExcludedTotal = expenseLines.reduce(function (sum, l) {
        return sum + (l.isCapital ? (parseFloat(l.amount) || 0) : 0);
    }, 0);

    // REQ-013: Capital expenditure tracking
    var hasCapitalExpenditure = capitalExcludedTotal > 0;
    var capitalExpenditureTotal = capitalExcludedTotal;

    // DeductibleExpenseBase = TotalExpenses - CapitalExcludedTotal
    var deductibleExpenseBase = totalExpenses - capitalExcludedTotal;

    // OwnedExpenses = DeductibleExpenseBase * ownershipPercentage
    var ownedExpenses = deductibleExpenseBase * ownershipPct;

    // Apportionment
    var apportionedExpenses = ownedExpenses;
    if (wp.mixedUse) {
        var daysRented = parseInt(wp.daysRented, 10) || 0;
        var daysPrivate = parseInt(wp.daysPrivate, 10) || 0;
        var totalDays = daysRented + daysPrivate;
        if (totalDays > 0) {
            var ratio = daysRented / totalDays;
            apportionedExpenses = ownedExpenses * ratio;
        }
    }

    // InterestTotal = sum(amount where category == 'Interest')
    var interestTotal = expenseLines.reduce(function (sum, l) {
        return sum + (l.category === 'Interest' && !l.isCapital ? (parseFloat(l.amount) || 0) : 0);
    }, 0);

    // DeductibleInterest = InterestTotal * interestDeductibilityRate
    var deductibleInterest = interestTotal * settings.interestDeductibilityRate;

    // AdjustedExpenses = (ApportionedExpenses - InterestTotal) + DeductibleInterest
    var adjustedDeductibleExpenses = (apportionedExpenses - interestTotal) + deductibleInterest;

    // REQ-014: Total income includes other income
    var totalIncome = (parseFloat(wp.grossRentalIncome) || 0) + (parseFloat(wp.otherIncome) || 0);

    // AdjustedIncome = totalIncome * ownershipPercentage
    var adjustedIncome = totalIncome * ownershipPct;

    // NetRentalIncome = AdjustedIncome - AdjustedExpenses
    var netRentalIncome = adjustedIncome - adjustedDeductibleExpenses;

    // LossCarryForward
    var lossCarryForward = netRentalIncome < 0 ? Math.abs(netRentalIncome) : 0;

    var calculated = {
        totalExpenses: totalExpenses,
        capitalExcludedTotal: capitalExcludedTotal,
        // REQ-013: Capital expenditure tracking
        hasCapitalExpenditure: hasCapitalExpenditure,
        capitalExpenditureTotal: capitalExpenditureTotal,
        deductibleExpenseBase: deductibleExpenseBase,
        ownedExpenses: ownedExpenses,
        apportionedExpenses: apportionedExpenses,
        interestTotal: interestTotal,
        deductibleInterest: deductibleInterest,
        adjustedDeductibleExpenses: adjustedDeductibleExpenses,
        // REQ-014: Total income
        totalIncome: totalIncome,
        adjustedIncome: adjustedIncome,
        netRentalIncome: netRentalIncome,
        lossCarryForward: lossCarryForward
    };

    updateWorkpaper(workpaperId, calculated);

    // Auto-transition to InProgress if still NotStarted
    var wpUpdated = getWorkpaperById(workpaperId);
    if (wpUpdated && wpUpdated.status === 'NotStarted') {
        updateWorkpaper(workpaperId, { status: 'InProgress' });
        logActivity(workpaperId, 'StatusChange', 'status', 'NotStarted', 'InProgress');
    }

    return Object.assign({}, wpUpdated, calculated);
}

/* ================================================
   Diagnostics (REQ-012)
   ================================================ */
function runDiagnostics(workpaperId) {
    var wp = getWorkpaperById(workpaperId);
    if (!wp) return [];

    var diagnostics = [];

    // Blocking diagnostics
    if (!wp.grossRentalIncome || parseFloat(wp.grossRentalIncome) <= 0) {
        diagnostics.push({
            level: 'blocking',
            message: 'Gross rental income is missing or zero.'
        });
    }

    var daysRented = parseInt(wp.daysRented, 10) || 0;
    if (daysRented <= 0) {
        diagnostics.push({
            level: 'blocking',
            message: 'Days rented is missing or zero.'
        });
    }

    if (daysRented > 365) {
        diagnostics.push({
            level: 'blocking',
            message: 'Days rented exceeds 365.'
        });
    }

    if (wp.mixedUse) {
        var daysPrivate = parseInt(wp.daysPrivate, 10) || 0;
        if (daysPrivate <= 0) {
            diagnostics.push({
                level: 'blocking',
                message: 'Mixed use is enabled but days private is missing or zero.'
            });
        }
        if (daysPrivate > 365) {
            diagnostics.push({
                level: 'blocking',
                message: 'Days private exceeds 365.'
            });
        }
        if (daysRented + daysPrivate > 365) {
            diagnostics.push({
                level: 'blocking',
                message: 'Total days (rented + private) exceeds 365.'
            });
        }
    }

    // Warning diagnostics
    if (wp.mixedUse) {
        diagnostics.push({
            level: 'warning',
            message: 'Mixed-use apportionment is active.'
        });
    }

    var hasCapital = (wp.expenseLines || []).some(function (l) { return l.isCapital; });
    if (hasCapital) {
        diagnostics.push({
            level: 'warning',
            message: 'Capital expenses are present and excluded from deductions.'
        });
    }

    var evidence = getEvidenceForWorkpaper(workpaperId);
    var evidenceIds = evidence.map(function (e) { return e.evidenceId; });
    var linesWithoutEvidence = (wp.expenseLines || []).filter(function (l) {
        return !l.evidenceIds || l.evidenceIds.length === 0 ||
            !l.evidenceIds.some(function (eid) { return evidenceIds.indexOf(eid) !== -1; });
    });
    if (linesWithoutEvidence.length > 0) {
        diagnostics.push({
            level: 'warning',
            message: linesWithoutEvidence.length + ' expense line(s) have no linked evidence.'
        });
    }

    // Info diagnostics
    if (wp.status === 'NotStarted') {
        diagnostics.push({
            level: 'info',
            message: 'Workpaper has not yet been calculated.'
        });
    }

    return diagnostics;
}

/* ================================================
   Portfolio Totals (REQ-008)
   ================================================ */
function calculatePortfolioTotals() {
    var settings = loadSettings();
    var properties = loadProperties().filter(function (p) { return p.isActive; });
    var workpapers = loadWorkpapers().filter(function (w) { return w.taxYear === settings.taxYear; });

    var totals = {
        totalIncome: 0,
        totalExpenses: 0,
        netPosition: 0,
        lossCarryForward: 0,
        completedCount: 0,
        warningCount: 0,
        propertyCount: properties.length
    };

    properties.forEach(function (prop) {
        var wp = workpapers.find(function (w) { return w.propertyId === prop.propertyId; });
        if (!wp) return;

        totals.totalIncome += (parseFloat(wp.adjustedIncome) || 0);
        totals.totalExpenses += (parseFloat(wp.adjustedDeductibleExpenses) || 0);
        totals.netPosition += (parseFloat(wp.netRentalIncome) || 0);
        totals.lossCarryForward += (parseFloat(wp.lossCarryForward) || 0);

        if (wp.status === 'Complete' || wp.status === 'Locked') {
            totals.completedCount++;
        }

        var diags = runDiagnostics(wp.workpaperId);
        var warnings = diags.filter(function (d) {
            return d.level === 'warning' || d.level === 'blocking';
        });
        if (warnings.length > 0) {
            totals.warningCount++;
        }
    });

    return totals;
}

/* ------------------------------------------------
   Status transition helpers
   ------------------------------------------------ */
function transitionStatus(workpaperId, newStatus) {
    var wp = getWorkpaperById(workpaperId);
    if (!wp) return null;

    var currentIdx = STATUS_ORDER.indexOf(wp.status);
    var newIdx = STATUS_ORDER.indexOf(newStatus);

    // Allow forward transitions and back to InProgress from ReadyToReview
    if (newIdx === -1) return null;
    if (newIdx <= currentIdx && !(newStatus === 'InProgress' && wp.status === 'ReadyToReview')) {
        return null;
    }

    var oldStatus = wp.status;
    updateWorkpaper(workpaperId, { status: newStatus });
    logActivity(workpaperId, 'StatusChange', 'status', oldStatus, newStatus);
    return getWorkpaperById(workpaperId);
}

/* ------------------------------------------------
   Portfolio summary per property (for list page)
   ------------------------------------------------ */
function getPropertySummary(propertyId) {
    var property = getPropertyById(propertyId);
    if (!property) return null;
    var wp = getWorkpaperByPropertyId(propertyId);
    var diags = wp ? runDiagnostics(wp.workpaperId) : [];
    return {
        property: property,
        workpaper: wp,
        diagnostics: diags,
        hasBlocking: diags.some(function (d) { return d.level === 'blocking'; }),
        hasWarning: diags.some(function (d) { return d.level === 'warning'; }),
        netRentalIncome: wp ? wp.netRentalIncome : 0,
        status: wp ? wp.status : 'NotStarted'
    };
}

/* ================================================
   Domain Output — RentalSummary (REQ-016)
   ================================================ */

// Implements REQ-016: Generate RentalSummary for a single workpaper
function generateRentalSummary(workpaperId) {
    var wp = getWorkpaperById(workpaperId);
    if (!wp) return null;
    var property = getPropertyById(wp.propertyId);
    if (!property) return null;

    // Ensure calculated
    calculateWorkpaper(workpaperId);
    wp = getWorkpaperById(workpaperId);

    var diags = runDiagnostics(workpaperId);

    return {
        propertyId: property.propertyId,
        taxYear: wp.taxYear,
        propertyType: property.taxClassification || 'Residential',
        ownershipPercentage: property.ownershipPercentage,
        grossIncome: wp.grossRentalIncome || 0,
        otherIncome: wp.otherIncome || 0,
        totalIncome: wp.totalIncome || 0,
        totalExpensesBeforeAdjustments: wp.deductibleExpenseBase || 0,
        capitalExcludedTotal: wp.capitalExcludedTotal || 0,
        interestIncurred: wp.interestTotal || 0,
        interestClaimed: wp.deductibleInterest || 0,
        deductibleExpenses: wp.adjustedDeductibleExpenses || 0,
        netIncome: wp.netRentalIncome || 0,
        lossCarryForward: wp.lossCarryForward || 0,
        diagnostics: diags.map(function (d) {
            return { level: d.level, message: d.message };
        })
    };
}

// Implements REQ-016: Generate summaries for all active properties in a tax year
function generateAllRentalSummaries(taxYear) {
    var settings = loadSettings();
    var year = taxYear || settings.taxYear;
    var properties = loadProperties().filter(function (p) { return p.isActive; });
    var summaries = [];

    properties.forEach(function (prop) {
        var wp = getWorkpaperByPropertyId(prop.propertyId);
        if (wp && wp.taxYear === year) {
            var summary = generateRentalSummary(wp.workpaperId);
            if (summary) summaries.push(summary);
        }
    });

    return summaries;
}

/* ================================================
   Milestone 4: Tax Return & Compliance Mapping
   ================================================ */

// Implements REQ-017: Tax Return status lifecycle
var TAX_RETURN_STATUS_ORDER = Object.freeze(['Draft', 'ReadyToReview', 'Complete', 'Locked']);

/* ------------------------------------------------
   Tax Return CRUD (REQ-017)
   ------------------------------------------------ */

// Implements REQ-017: Load tax returns from localStorage
function loadTaxReturns() {
    return _load(STORAGE_KEYS.taxreturns);
}

// Implements REQ-017: Save tax returns to localStorage
function saveTaxReturns(taxReturns) {
    _save(STORAGE_KEYS.taxreturns, taxReturns);
}

// Implements REQ-017: Get tax return by ID
function getTaxReturnById(id) {
    var returns = loadTaxReturns();
    return returns.find(function (r) { return r.taxReturnId === id; }) || null;
}

// Implements REQ-017: Create a new tax return
function createTaxReturn(data) {
    var returns = loadTaxReturns();
    var settings = loadSettings();
    var taxReturn = {
        taxReturnId: crypto.randomUUID(),
        taxpayerId: DEFAULT_USER.userId,
        taxYear: data.taxYear || settings.taxYear,
        jurisdiction: data.jurisdiction || 'NZ-IRD',
        status: 'Draft',
        sections: data.sections || {},
        validation: data.validation || { blocking: [], warnings: [] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    returns.push(taxReturn);
    saveTaxReturns(returns);
    return taxReturn;
}

// Implements REQ-017: Update an existing tax return
function updateTaxReturn(id, data) {
    var returns = loadTaxReturns();
    var idx = returns.findIndex(function (r) { return r.taxReturnId === id; });
    if (idx === -1) return null;
    Object.assign(returns[idx], data);
    returns[idx].updatedAt = new Date().toISOString();
    saveTaxReturns(returns);
    return returns[idx];
}

// Implements REQ-017: Enforce status lifecycle Draft → ReadyToReview → Complete → Locked
function transitionTaxReturnStatus(taxReturnId, newStatus) {
    var taxReturn = getTaxReturnById(taxReturnId);
    if (!taxReturn) return null;

    var currentIdx = TAX_RETURN_STATUS_ORDER.indexOf(taxReturn.status);
    var newIdx = TAX_RETURN_STATUS_ORDER.indexOf(newStatus);

    if (newIdx === -1) return null;

    // Allow forward transitions and back to Draft from ReadyToReview
    if (newIdx <= currentIdx && !(newStatus === 'Draft' && taxReturn.status === 'ReadyToReview')) {
        return null;
    }

    updateTaxReturn(taxReturnId, { status: newStatus });
    return getTaxReturnById(taxReturnId);
}

/* ------------------------------------------------
   Jurisdiction Mapping Service (REQ-018)
   ------------------------------------------------ */

// Implements REQ-018: Anti-Corruption Layer
function mapToJurisdiction(jurisdiction, taxYear, rentalSummaries, inputs) {
    if (jurisdiction === 'NZ-IRD') {
        return mapToNzIrd(taxYear, rentalSummaries, inputs);
    }
    return { error: 'Unsupported jurisdiction: ' + jurisdiction };
}

/* ------------------------------------------------
   NZ IR3 Mapping (REQ-019, REQ-020, REQ-021)
   ------------------------------------------------ */

// Implements REQ-019: IR3 Q22/Q23/Q24 field mapping
// Implements REQ-020: IR3R per-property schedule
// Implements REQ-021: Portfolio aggregation by residential/non-residential
function mapToNzIrd(taxYear, rentalSummaries, inputs) {
    inputs = inputs || {};

    // REQ-021: Filter summaries by tax classification
    var residential = rentalSummaries.filter(function (s) {
        return s.propertyType === 'Residential' || s.propertyType === 'MixedUse';
    });
    var nonResidential = rentalSummaries.filter(function (s) {
        return s.propertyType === 'Commercial';
    });

    // REQ-019: IR3 Q22 — Residential rental aggregation
    var q22A = residential.reduce(function (sum, s) { return sum + (s.totalIncome || 0); }, 0);
    var q22C = residential.reduce(function (sum, s) { return sum + (s.otherIncome || 0); }, 0);
    var q22D = residential.reduce(function (sum, s) { return sum + (s.totalIncome || 0); }, 0);
    var q22E = residential.reduce(function (sum, s) { return sum + (s.deductibleExpenses || 0); }, 0);
    var q22F = inputs.priorYearResidentialLossUsed || 0;
    var q22G = q22E + q22F;
    var q22H = q22D - q22G;
    var q22I = q22H < 0 ? Math.abs(q22H) : 0;

    // REQ-019: IR3 Q23 — Interest disclosure
    var q23A = residential.reduce(function (sum, s) { return sum + (s.interestIncurred || 0); }, 0);
    var q23B = residential.reduce(function (sum, s) { return sum + (s.interestClaimed || 0); }, 0);
    var q23C = inputs.interestReasonSelection || '';

    // REQ-019: IR3 Q24 — Non-residential rental
    var q24 = nonResidential.reduce(function (sum, s) { return sum + (s.netIncome || 0); }, 0);

    // REQ-020: IR3R per-property schedule
    var schedule = rentalSummaries.map(function (summary) {
        return {
            propertyId: summary.propertyId,
            fields: {
                'IR3R.B1': summary.grossIncome,
                'IR3R.B2': summary.otherIncome,
                'IR3R.B4': summary.totalIncome,
                'IR3R.B7A': summary.interestIncurred,
                'IR3R.B7B': summary.interestClaimed,
                'IR3R.B7C': inputs.interestReasonSelection || '',
                'IR3R.B14': summary.deductibleExpenses,
                'IR3R.B15': summary.netIncome
            }
        };
    });

    return {
        fields: {
            'IR3.Q22.A': q22A,
            'IR3.Q22.C': q22C,
            'IR3.Q22.D': q22D,
            'IR3.Q22.E': q22E,
            'IR3.Q22.F': q22F,
            'IR3.Q22.G': q22G,
            'IR3.Q22.H': q22H,
            'IR3.Q22.I': q22I,
            'IR3.Q23.A': q23A,
            'IR3.Q23.B': q23B,
            'IR3.Q23.C': q23C,
            'IR3.Q24': q24
        },
        schedule: schedule,
        validation: { blocking: [], warnings: [] }
    };
}

/* ================================================
   Milestone 5: Export & Validation
   ================================================ */

// Implements REQ-023: Compliance Validation
function validateTaxReturnCompliance(taxReturn) {
    var blocking = [];
    var warnings = [];

    if (!taxReturn.sections || !taxReturn.sections.rental) {
        blocking.push('Rental section is missing from tax return.');
        return { blocking: blocking, warnings: warnings };
    }

    var rental = taxReturn.sections.rental;
    var fields = rental.fields || {};
    var schedule = rental.schedule || [];

    // Check required fields present
    var requiredFields = ['IR3.Q22.A', 'IR3.Q22.D', 'IR3.Q22.E', 'IR3.Q22.G', 'IR3.Q22.H', 'IR3.Q22.I'];
    requiredFields.forEach(function (key) {
        if (fields[key] === undefined || fields[key] === null) {
            blocking.push('Required field ' + key + ' is missing.');
        }
    });

    // Consistency: check interest totals match schedule
    var scheduleInterestIncurred = 0;
    var scheduleInterestClaimed = 0;
    schedule.forEach(function (s) {
        scheduleInterestIncurred += (s.fields['IR3R.B7A'] || 0);
        scheduleInterestClaimed += (s.fields['IR3R.B7B'] || 0);
    });

    if (Math.abs((fields['IR3.Q23.A'] || 0) - scheduleInterestIncurred) > 0.01) {
        warnings.push('IR3.Q23.A does not match sum of IR3R.B7A across schedule.');
    }
    if (Math.abs((fields['IR3.Q23.B'] || 0) - scheduleInterestClaimed) > 0.01) {
        warnings.push('IR3.Q23.B does not match sum of IR3R.B7B across schedule.');
    }

    // Check for zero income with expenses
    if ((fields['IR3.Q22.D'] || 0) === 0 && (fields['IR3.Q22.E'] || 0) > 0) {
        warnings.push('Deductions claimed with zero residential income.');
    }

    return { blocking: blocking, warnings: warnings };
}

/* ================================================
   Milestone 6: Client-Side API Functions
   ================================================ */

// Implements REQ-024
function getRentalSummaries(taxYear) {
    return generateAllRentalSummaries(taxYear);
}

// Implements REQ-025
function generateTaxReturnApi(request) {
    var taxYear = request.taxYear;
    var jurisdiction = request.jurisdiction;
    var inputs = (request.inputs && request.inputs.rental) || {};

    // Generate summaries
    var summaries = generateAllRentalSummaries(taxYear);

    // Map to jurisdiction
    var rentalSection = mapToJurisdiction(jurisdiction, taxYear, summaries, inputs);
    if (rentalSection.error) {
        return { error: rentalSection.error };
    }

    // Run compliance validation
    var tempReturn = { sections: { rental: rentalSection } };
    var validation = validateTaxReturnCompliance(tempReturn);

    // Create TaxReturn
    var taxReturn = createTaxReturn({
        taxYear: taxYear,
        jurisdiction: jurisdiction,
        sections: { rental: rentalSection },
        validation: validation
    });

    return {
        taxReturnId: taxReturn.taxReturnId,
        status: taxReturn.status,
        jurisdiction: taxReturn.jurisdiction,
        sections: taxReturn.sections,
        validation: validation
    };
}

// Implements REQ-026
function validateTaxReturnApi(taxReturnId) {
    var taxReturn = getTaxReturnById(taxReturnId);
    if (!taxReturn) return { error: 'Tax return not found' };

    var validation = validateTaxReturnCompliance(taxReturn);

    // Update stored validation
    updateTaxReturn(taxReturnId, { validation: validation });

    return validation;
}

// Implements REQ-027
function lockTaxReturnApi(taxReturnId) {
    var taxReturn = getTaxReturnById(taxReturnId);
    if (!taxReturn) return { error: 'Tax return not found' };

    if (taxReturn.status !== 'Complete') {
        return { error: 'Tax return must be in Complete status to lock. Current: ' + taxReturn.status };
    }

    // Run validation first
    var validation = validateTaxReturnCompliance(taxReturn);
    if (validation.blocking.length > 0) {
        return { error: 'Cannot lock: blocking validation issues exist', validation: validation };
    }

    transitionTaxReturnStatus(taxReturnId, 'Locked');
    return { success: true, status: 'Locked' };
}
