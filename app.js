// Application State
const state = {
    theme: 'dark',
    currentModule: null,
    rawData: [],
    processedData: [],
    columns: [],
    fileName: '',
    config: {
        Incident: { start: "Created", end: "Resolved at" },
        Request: { start: "Created", end: "Closed" },
        Change: { start: "Actual start date", end: "Actual end date" },
        Feedback: { start: "Start", end: "End" },
        Survey: { start: "Taken on", end: "Action completed" }
    },
    chartInstance: null,
    histogramInstance: null,
    selectedPriorities: [],
    selectedTypes: [],
    selectedRisks: [],
    selectedGroups: [],
    selectedReqItems: [],
    selectedReqStates: [],
    selectedCloseCodes: [],
    selectedRatings: [],
    calcMode: 'mean' // 'mean' or 'median'
};

// DOM Elements
const els = {
    themeToggle: document.getElementById('theme-toggle'),
    sunIcon: document.querySelector('.sun-icon'),
    moonIcon: document.querySelector('.moon-icon'),
    viewSelection: document.getElementById('view-selection'),
    viewDashboard: document.getElementById('view-dashboard'),
    backBtn: document.getElementById('back-btn'),
    moduleCards: document.querySelectorAll('.module-card'),
    moduleTitle: document.getElementById('current-module-title'),

    // Upload
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    fileInfo: document.getElementById('file-info'),
    fileName: document.getElementById('file-name'),
    clearFileBtn: document.getElementById('clear-file'),

    // Settings
    settingsCard: document.getElementById('settings-card'),
    startCol: document.getElementById('start-col'),
    endCol: document.getElementById('end-col'),
    groupCol: document.getElementById('group-col'),
    idCol: document.getElementById('id-col'),
    timeframe: document.getElementById('timeframe'),
    customDateRange: document.getElementById('custom-date-range'),
    customStartDate: document.getElementById('custom-start-date'),
    customEndDate: document.getElementById('custom-end-date'),
    kpiTarget: document.getElementById('kpi-target'),
    kpiUnit: document.getElementById('kpi-unit'),
    calculateBtn: document.getElementById('calculate-btn'),

    // Config / Filters Sections
    configHeader: document.getElementById('config-header'),
    configBody: document.getElementById('config-body'),
    configToggleIcon: document.getElementById('config-toggle-icon'),
    filtersCard: document.getElementById('filters-card'),

    // Dynamic Filters
    dynamicFilters: document.getElementById('dynamic-filters-section'),
    incidentFilters: document.getElementById('incident-filters'),
    changeFilters: document.getElementById('change-filters'),
    requestFilters: document.getElementById('request-filters'),
    surveyFilters: document.getElementById('survey-filters'),
    
    // Select dropdowns for config
    priorityCol: document.getElementById('priority-col'),
    typeCol: document.getElementById('type-col'),
    riskCol: document.getElementById('risk-col'),
    reqItemCol: document.getElementById('req-item-col'),
    reqStateCol: document.getElementById('req-state-col'),
    closeCodeCol: document.getElementById('close-code-col'),
    ratingCol: document.getElementById('rating-col'),

    // Results
    resultsCol: document.getElementById('results-column'),
    emptyState: document.getElementById('empty-state'),
    downloadCsvBtn: document.getElementById('download-csv-btn'),
    downloadBtn: document.getElementById('download-report-btn'),
    trendGrouping: document.getElementById('trend-grouping'),

    // KPIs
    kpiCompliance: document.getElementById('kpi-compliance'),
    kpiAvgDays: document.getElementById('kpi-avg-days'),
    kpiVolume: document.getElementById('kpi-volume'),
    statusBadge: document.getElementById('status-badge'),

    // Tables
    slowTableBody: document.querySelector('#slow-table tbody'),
    fastTableBody: document.querySelector('#fast-table tbody'),
    outlierTableBody: document.querySelector('#outlier-table tbody'),
    unitThs: document.querySelectorAll('.unit-th'),

    kpiAvgTitle: document.getElementById('kpi-avg-title'),
    kpiUnitLabel: document.getElementById('kpi-unit-label'),

    // Buttons
    viewDataBtn: document.getElementById('view-data-btn'),
    modeMeanBtn: document.getElementById('mode-mean-btn'),
    modeMedianBtn: document.getElementById('mode-median-btn'),

    // Modal
    modalOverlay: document.getElementById('data-modal-overlay'),
    modalTitle: document.getElementById('modal-title'),
    modalSubheader: document.getElementById('modal-subheader'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    dataGridHead: document.getElementById('data-grid-head'),
    dataGridBody: document.getElementById('data-grid-body')
};

// --- Initialization ---
function init() {
    initTheme();
    attachEventListeners();
}

// --- Theme Management ---
function initTheme() {
    const savedTheme = localStorage.getItem('mttr-theme');
    if (savedTheme) {
        state.theme = savedTheme;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        state.theme = 'light';
    }
    applyTheme();
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('mttr-theme', state.theme);
    applyTheme();
    if (state.chartInstance) updateChartTheme();
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    if (state.theme === 'dark') {
        els.sunIcon.classList.remove('hidden');
        els.moonIcon.classList.add('hidden');
    } else {
        els.sunIcon.classList.add('hidden');
        els.moonIcon.classList.remove('hidden');
    }
}

// --- Navigation ---
function navigateToModule(moduleName) {
    state.currentModule = moduleName;
    els.moduleTitle.textContent = `${moduleName} Analysis`;

    els.viewSelection.classList.add('hidden');
    els.viewDashboard.classList.remove('hidden');
    els.backBtn.classList.remove('hidden');

    // Clear any previous results
    resetDashboard();

    // UI will be shown when file is uploaded or if already uploaded
    if (state.rawData.length > 0) {
        populateSettings();
        els.settingsCard.classList.remove('hidden');
        els.filtersCard.classList.remove('hidden');
    }
}

function navigateBack() {
    state.currentModule = null;
    els.viewDashboard.classList.add('hidden');
    els.backBtn.classList.add('hidden');
    els.viewSelection.classList.remove('hidden');

    resetDashboard();
}

function resetDashboard() {
    state.processedData = [];
    state.selectedPriorities = [];
    state.selectedTypes = [];
    state.selectedRisks = [];
    state.selectedGroups = [];

    // Reset UI parts
    els.resultsCol.classList.add('hidden');
    els.emptyState.classList.remove('hidden');
    els.downloadBtn.classList.add('hidden');
    els.viewDataBtn.classList.add('hidden');

    // Reset config collapse state
    if (els.configBody) {
        els.configBody.classList.remove('collapsed');
        els.configToggleIcon.classList.remove('rotate-180');
    }
}

// --- File Handling ---
function handleFileSelect(e) {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;

    if (!file.name.endsWith('.xlsx')) {
        alert('Please upload a valid .xlsx file.');
        return;
    }

    els.fileName.textContent = file.name;
    state.fileName = file.name;

    els.dropZone.classList.add('hidden');
    els.fileInfo.classList.remove('hidden');

    parseExcel(file);
}

function clearFile() {
    els.fileInput.value = '';
    state.rawData = [];
    state.columns = [];

    els.fileInfo.classList.add('hidden');
    els.dropZone.classList.remove('hidden');
    els.settingsCard.classList.add('hidden');
    els.resultsCol.classList.add('hidden');
    els.emptyState.classList.remove('hidden');
}

function parseExcel(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        // Use first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON (array of objects)
        state.rawData = XLSX.utils.sheet_to_json(worksheet, { defval: null });

        if (state.rawData.length > 0) {
            state.columns = Object.keys(state.rawData[0]);
            populateSettings();
            els.settingsCard.classList.remove('hidden');
            els.filtersCard.classList.remove('hidden');

            // Ensure config is expanded when new file loaded
            els.configBody.classList.remove('collapsed');
            els.configToggleIcon.classList.remove('rotate-180');
        } else {
            alert('The Excel file appears to be empty.');
            clearFile();
        }
    };
    reader.readAsArrayBuffer(file);
}

// --- Settings & Column Mapping ---
function populateSettings() {
    if (!state.currentModule || state.columns.length === 0) return;

    // Show/Hide specific filter groups
    els.dynamicFilters.classList.remove('hidden');
    els.incidentFilters.classList.add('hidden');
    els.changeFilters.classList.add('hidden');
    els.requestFilters.classList.add('hidden');
    els.surveyFilters.classList.add('hidden');

    if (state.currentModule === 'Incident') {
        els.incidentFilters.classList.remove('hidden');
    } else if (state.currentModule === 'Change') {
        els.changeFilters.classList.remove('hidden');
    } else if (state.currentModule === 'Request') {
        els.requestFilters.classList.remove('hidden');
    } else if (state.currentModule === 'Feedback' || state.currentModule === 'Survey') {
        els.surveyFilters.classList.remove('hidden');
    }

    const defaultStart = state.config[state.currentModule].start;
    const defaultEnd = state.config[state.currentModule].end;

    const optionsHtml = state.columns.map(col => `<option value="${col}">${col}</option>`).join('');

    [els.startCol, els.endCol, els.groupCol, els.idCol].forEach(sel => {
        sel.innerHTML = optionsHtml;
    });

    // Auto-select smart defaults
    if (state.columns.includes(defaultStart)) els.startCol.value = defaultStart;
    if (state.columns.includes(defaultEnd)) els.endCol.value = defaultEnd;

    // Find Group Column (assignment group, workgroup, etc)
    const grpKws = ['assignment group', 'workgroup', 'issue owner', 'group', 'definition', 'assigned to', 'department'];
    const foundGrp = state.columns.find(c => grpKws.some(kw => c.toLowerCase().includes(kw)));
    if (foundGrp) els.groupCol.value = foundGrp;

    // Find ID Column
    const idKws = ['id', 'number', 'incident id', 'task', 'inc #', 'sys_id'];
    const foundId = state.columns.find(c => idKws.some(kw => c.toLowerCase().includes(kw)));
    if (foundId) els.idCol.value = foundId;

    // Populate dynamic filter columns
    [els.priorityCol, els.typeCol, els.riskCol, els.reqItemCol, els.reqStateCol, els.closeCodeCol, els.ratingCol].forEach(sel => {
        sel.innerHTML = optionsHtml;
    });

    const findCol = (kws) => state.columns.find(c => kws.some(kw => c.toLowerCase().includes(kw)));

    const foundPriority = findCol(['priority']);
    if (foundPriority) els.priorityCol.value = foundPriority;

    const foundType = findCol(['type', 'category']);
    if (foundType) els.typeCol.value = foundType;

    const foundRisk = findCol(['risk']);
    if (foundRisk) els.riskCol.value = foundRisk;

    const foundItem = findCol(['item', 'catalog', 'request type', 'parent item']);
    if (foundItem) els.reqItemCol.value = foundItem;

    const foundState = findCol(['state', 'status']);
    if (foundState) els.reqStateCol.value = foundState;

    const foundCloseCode = findCol(['close code', 'completion code', 'status']);
    if (foundCloseCode) els.closeCodeCol.value = foundCloseCode;

    const foundRating = findCol(['rating', 'score', 'csat', 'satisfaction']);
    if (foundRating) els.ratingCol.value = foundRating;

    // Refresh the filter dropdown values
    updateFilterOptions();
}

function buildMultiselect(ddEl, btnEl, values, stateKey) {
    ddEl.innerHTML = '';
    state[stateKey] = [];
    btnEl.textContent = 'All';

    // Add Select All / Clear All buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'multiselect-actions';

    const selectAllBtn = document.createElement('button');
    selectAllBtn.className = 'btn-text';
    selectAllBtn.textContent = 'Select All';

    const clearAllBtn = document.createElement('button');
    clearAllBtn.className = 'btn-text';
    clearAllBtn.textContent = 'Clear All';

    actionsDiv.appendChild(selectAllBtn);
    actionsDiv.appendChild(clearAllBtn);
    ddEl.appendChild(actionsDiv);

    const checkboxes = [];

    values.forEach(val => {
        const label = document.createElement('label');
        label.className = 'multiselect-option';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = val;
        checkboxes.push(cb);

        cb.addEventListener('change', () => {
            if (cb.checked) {
                if (!state[stateKey].includes(val)) state[stateKey].push(val);
            } else {
                state[stateKey] = state[stateKey].filter(v => v !== val);
            }
            const count = state[stateKey].length;
            btnEl.textContent = count === 0 ? 'All' : `${count} Selected`;
        });
        label.appendChild(cb);
        label.appendChild(document.createTextNode(val));
        ddEl.appendChild(label);
    });

    selectAllBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        checkboxes.forEach(cb => cb.checked = true);
        state[stateKey] = [...values];
        btnEl.textContent = `${values.length} Selected`;
    });

    clearAllBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        checkboxes.forEach(cb => cb.checked = false);
        state[stateKey] = [];
        btnEl.textContent = 'All';
    });
}

function wireMultiselect(btnId, ddId) {
    const btn = document.getElementById(btnId);
    const dd = document.getElementById(ddId);
    if (!btn || !dd) return;
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = !dd.classList.contains('hidden');
        // Close all dropdowns first
        document.querySelectorAll('.multiselect-dropdown').forEach(d => d.classList.add('hidden'));
        document.querySelectorAll('.multiselect-btn').forEach(b => b.classList.remove('open'));
        if (!isOpen) {
            dd.classList.remove('hidden');
            btn.classList.add('open');
        }
    });
}

function updateFilterOptions() {
    function populate(colSelect, ddId, btnId, stateKey) {
        if (!colSelect || !colSelect.value) return;
        const dd = document.getElementById(ddId);
        const btn = document.getElementById(btnId);
        if (!dd || !btn) return;
        const uniqueVals = [...new Set(
            state.rawData.map(row => row[colSelect.value]).filter(v => v !== null && v !== undefined && v !== '')
        )].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
        buildMultiselect(dd, btn, uniqueVals, stateKey);
    }

    if (state.currentModule === 'Incident') {
        populate(els.priorityCol, 'priority-filter-dd', 'priority-filter-btn', 'selectedPriorities');
    } else if (state.currentModule === 'Change') {
        populate(els.typeCol, 'type-filter-dd', 'type-filter-btn', 'selectedTypes');
        populate(els.riskCol, 'risk-filter-dd', 'risk-filter-btn', 'selectedRisks');
        populate(els.closeCodeCol, 'close-code-filter-dd', 'close-code-filter-btn', 'selectedCloseCodes');
    } else if (state.currentModule === 'Request') {
        populate(els.reqItemCol, 'req-item-filter-dd', 'req-item-filter-btn', 'selectedReqItems');
        populate(els.reqStateCol, 'req-state-filter-dd', 'req-state-filter-btn', 'selectedReqStates');
    } else if (state.currentModule === 'Feedback' || state.currentModule === 'Survey') {
        populate(els.ratingCol, 'rating-filter-dd', 'rating-filter-btn', 'selectedRatings');
    }

    // Always populate Group Filter
    populate(els.groupCol, 'group-filter-dd', 'group-filter-btn', 'selectedGroups');
}

// --- Core Calculation Logic ---
function calculateMTTR() {
    const startCol = els.startCol.value;
    const endCol = els.endCol.value;
    const timeframe = els.timeframe.value;

    if (!startCol || !endCol) {
        alert('Please select both start and end columns.');
        return;
    }

    // 0. Apply Module Specific & Group Filters
    let filteredData = [...state.rawData];

    // Universal Group Filter
    const groupCol = els.groupCol.value;
    if (state.selectedGroups.length > 0) {
        filteredData = filteredData.filter(row => state.selectedGroups.includes(String(row[groupCol])));
    }

    if (state.currentModule === 'Incident') {
        const priorityCol = els.priorityCol.value;
        if (state.selectedPriorities.length > 0) {
            filteredData = filteredData.filter(row => state.selectedPriorities.includes(String(row[priorityCol])));
        }
    } else if (state.currentModule === 'Change') {
        const typeCol = els.typeCol.value;
        if (state.selectedTypes.length > 0) {
            filteredData = filteredData.filter(row => state.selectedTypes.includes(String(row[typeCol])));
        }
        const riskCol = els.riskCol.value;
        if (state.selectedRisks.length > 0) {
            filteredData = filteredData.filter(row => state.selectedRisks.includes(String(row[riskCol])));
        }
        const closeCodeCol = els.closeCodeCol.value;
        if (state.selectedCloseCodes.length > 0) {
            filteredData = filteredData.filter(row => state.selectedCloseCodes.includes(String(row[closeCodeCol])));
        }
    } else if (state.currentModule === 'Request') {
        const reqItemCol = els.reqItemCol.value;
        if (state.selectedReqItems.length > 0) {
            filteredData = filteredData.filter(row => state.selectedReqItems.includes(String(row[reqItemCol])));
        }
        const reqStateCol = els.reqStateCol.value;
        if (state.selectedReqStates.length > 0) {
            filteredData = filteredData.filter(row => state.selectedReqStates.includes(String(row[reqStateCol])));
        }
    } else if (state.currentModule === 'Feedback' || state.currentModule === 'Survey') {
        const ratingCol = els.ratingCol.value;
        if (state.selectedRatings.length > 0) {
            filteredData = filteredData.filter(row => state.selectedRatings.includes(String(row[ratingCol])));
        }
    }

    // 1. Filter by timeframe based on Start Date
    if (timeframe === 'Custom Range') {
        const customStartStr = els.customStartDate.value;
        const customEndStr = els.customEndDate.value;
        if (customStartStr && customEndStr) {
            const customStart = new Date(customStartStr);
            const customEnd = new Date(customEndStr);
            if (!isNaN(customStart) && !isNaN(customEnd)) {
                customStart.setHours(0, 0, 0, 0);
                customEnd.setHours(23, 59, 59, 999);
                filteredData = filteredData.filter(row => {
                    const dt = new Date(row[startCol]);
                    if (!dt || isNaN(dt.getTime())) return false;
                    return dt >= customStart && dt <= customEnd;
                });
            }
        }
    } else if (timeframe !== 'All Data') {
        // Find max date to act as "Today" for relative filtering (matches Python logic)
        let maxDate = 0;
        filteredData.forEach(row => {
            const dt = new Date(row[startCol]);
            if (dt && !isNaN(dt.getTime()) && dt.getTime() > maxDate) maxDate = dt.getTime();
        });

        const refDate = new Date(maxDate);

        const daysMap = { "Today": 0, "Yesterday": 1, "Last 7 Days": 7, "Last 30 Days": 30, "Last 90 Days": 90 };
        const daysToSubtract = daysMap[timeframe] || 0;

        const cutoff = new Date(refDate);
        cutoff.setDate(cutoff.getDate() - daysToSubtract);

        filteredData = filteredData.filter(row => {
            const dt = new Date(row[startCol]);
            if (!dt || isNaN(dt.getTime())) return false;

            if (timeframe === 'Yesterday') {
                return dt.toDateString() === cutoff.toDateString();
            }
            return dt >= cutoff;
        });
    }

    // 2. Apply 8-Hour Logic
    state.processedData = [];

    filteredData.forEach(row => {
        const start = new Date(row[startCol]);
        const end = new Date(row[endCol]);

        // Skip invalid dates
        if (!start || isNaN(start.getTime()) || !end || isNaN(end.getTime())) return;

        const durationMs = end.getTime() - start.getTime();
        if (durationMs < 0) return; // Ignore negative durations

        const totalHours = durationMs / (1000 * 60 * 60);
        let days = Math.floor(totalHours / 24);
        const remainderHours = totalHours % 24;

        if (remainderHours > 8) {
            days += 1;
        }

        // Create new object to prevent mutating raw
        state.processedData.push({
            ...row,
            _startObj: start,
            Calculated_Days: Math.max(0, days),
            Calculated_Hours: totalHours
        });
    });

    // Collapse configuration after running
    els.configBody.classList.add('collapsed');
    els.configToggleIcon.classList.add('rotate-180');

    renderDashboard();
}

// --- Median Helper ---
function calcMedian(arr) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function setCalcMode(mode) {
    state.calcMode = mode;
    els.modeMeanBtn.classList.toggle('pill-active', mode === 'mean');
    els.modeMedianBtn.classList.toggle('pill-active', mode === 'median');
    if (state.processedData.length > 0) renderDashboard();
}

// --- Rendering Dashboard ---
function renderDashboard() {
    if (state.processedData.length === 0) {
        alert("No valid data found in the selected timeframe.");
        return;
    }

    els.emptyState.classList.add('hidden');
    els.resultsCol.classList.remove('hidden');
    els.downloadBtn.classList.remove('hidden');
    els.downloadCsvBtn.classList.remove('hidden');
    els.viewDataBtn.classList.remove('hidden');

    const targetValue = parseFloat(els.kpiTarget.value);
    const kpiUnit = els.kpiUnit.value;
    const metricKey = kpiUnit === 'Days' ? 'Calculated_Days' : 'Calculated_Hours';
    const grpCol = els.groupCol.value;
    const useMedian = state.calcMode === 'median';

    // 1. Calculate KPIs
    const total = state.processedData.length;
    const allVals = state.processedData.map(r => r[metricKey]);
    let metTarget = 0;

    const groupValMap = {}; // group -> array of metricKey values
    const groupHoursMap = {}; // group -> array of raw hours

    state.processedData.forEach(row => {
        if (row[metricKey] <= targetValue) metTarget++;

        const grp = row[grpCol] || 'Unknown';
        if (!groupValMap[grp]) groupValMap[grp] = [];
        if (!groupHoursMap[grp]) groupHoursMap[grp] = [];

        groupValMap[grp].push(row[metricKey]);
        groupHoursMap[grp].push(row['Calculated_Hours']);
    });

    const allHours = state.processedData.map(r => r['Calculated_Hours']);
    const sumVals = allVals.reduce((a, b) => a + b, 0);
    const meanVal = total > 0 ? sumVals / total : 0;

    // Calculate median from hours for precision, then convert back to days if unit is Days
    const medianHours = calcMedian(allHours);
    const medianVal = kpiUnit === 'Days' ? (medianHours / 24) : medianHours;

    const displayVal = useMedian ? medianVal : meanVal;
    const compliance = total > 0 ? (metTarget / total) * 100 : 0;

    // Update KPI UI
    els.kpiVolume.textContent = total;
    // Show 1 decimal place for median even in Days mode to avoid showing "0"
    els.kpiAvgDays.textContent = kpiUnit === 'Days'
        ? (useMedian ? displayVal.toFixed(1) : Math.round(displayVal))
        : displayVal.toFixed(1);
    els.kpiCompliance.textContent = `${compliance.toFixed(1)}%`;
    els.kpiAvgTitle.textContent = useMedian ? 'Median MTTR' : 'Avg MTTR';
    els.kpiUnitLabel.textContent = kpiUnit;
    els.unitThs.forEach(th => th.textContent = `${useMedian ? 'Median' : 'Avg'} ${kpiUnit}`);

    if (displayVal <= targetValue) {
        els.statusBadge.textContent = "TARGET MET";
        els.statusBadge.className = "kpi-badge badge-success";
    } else {
        els.statusBadge.textContent = "TARGET MISSED";
        els.statusBadge.className = "kpi-badge badge-danger";
    }

    // 2. Process Group Stats for Tables
    const grpArr = Object.keys(groupValMap).map(grp => {
        const vals = groupValMap[grp];
        const hourVals = groupHoursMap[grp];

        let rawResult;
        if (useMedian) {
            const medHrs = calcMedian(hourVals);
            rawResult = kpiUnit === 'Days' ? (medHrs / 24) : medHrs;
        } else {
            rawResult = vals.reduce((a, b) => a + b, 0) / vals.length;
        }

        const impact = vals.reduce((a, b) => a + b, 0); // always sum for impact ranking
        return {
            name: grp,
            avg: kpiUnit === 'Days'
                ? (useMedian ? rawResult.toFixed(1) : Math.round(rawResult))
                : rawResult.toFixed(1),
            vol: vals.length,
            impact
        };
    });

    // Slowest Groups: above KPI target only, sorted by total impact (Avg × Volume)
    const slowGroups = [...grpArr]
        .filter(g => Number(g.avg) > targetValue)
        .sort((a, b) => b.impact - a.impact)
        .slice(0, 5);

    // Best Performers (Ascending average, secondary descending volume, min vol = 3)
    let fastGroups = [...grpArr].filter(g => g.vol >= 3).sort((a, b) => {
        const avgA = Number(a.avg);
        const avgB = Number(b.avg);
        if (avgA === avgB) return b.vol - a.vol;
        return avgA - avgB;
    }).slice(0, 5);
    if (fastGroups.length === 0) {
        // Fallback if no groups have volume >= 3
        fastGroups = [...grpArr].sort((a, b) => {
            const avgA = Number(a.avg);
            const avgB = Number(b.avg);
            if (avgA === avgB) return b.vol - a.vol;
            return avgA - avgB;
        }).slice(0, 5);
    }

    // Outliers: low volume (1-2 tickets) with high avg MTTR, sorted by avg descending
    const outlierGroups = [...grpArr]
        .filter(g => g.vol <= 2)
        .sort((a, b) => Number(b.avg) - Number(a.avg))
        .slice(0, 5);

    renderTable(els.slowTableBody, slowGroups);
    renderTable(els.fastTableBody, fastGroups);
    renderTable(els.outlierTableBody, outlierGroups);

    // 3. Render Charts
    renderTrendChart(targetValue, kpiUnit, metricKey);
    renderHistogramChart(kpiUnit, metricKey);
}

function renderTable(tbody, dataArr) {
    tbody.innerHTML = '';
    if (dataArr.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">No data available</td></tr>';
        return;
    }

    dataArr.forEach(item => {
        const tr = document.createElement('tr');
        const nameCell = document.createElement('td');
        const link = document.createElement('span');
        link.className = 'group-link';
        link.textContent = item.name;
        link.title = `Click to drill into ${item.name}`;
        link.addEventListener('click', () => openDataModal(item.name));
        nameCell.appendChild(link);

        const avgCell = document.createElement('td');
        avgCell.textContent = item.avg;
        const volCell = document.createElement('td');
        volCell.textContent = item.vol;

        tr.appendChild(nameCell);
        tr.appendChild(avgCell);
        tr.appendChild(volCell);
        tbody.appendChild(tr);
    });
}

// --- Toast Notification ---
function showToast(msg) {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#3b82f6; color:white; padding:12px 24px; border-radius:8px; box-shadow:0 4px 6px rgba(0,0,0,0.1); z-index:9999; opacity:0; transition:opacity 0.3s; font-weight:500; pointer-events:none;';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';

    if (window.toastTimeout) clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
        toast.style.opacity = '0';
    }, 2500);
}

// --- Charting ---
function renderTrendChart(targetLineValue, kpiUnit, metricKey) {
    const ctx = document.getElementById('mttr-chart').getContext('2d');

    if (state.chartInstance) {
        state.chartInstance.destroy();
    }

    // Sort by date ascending
    const sortedData = [...state.processedData].sort((a, b) => a._startObj - b._startObj);

    const chartData = sortedData.map(row => ({
        x: row._startObj,
        y: row[metricKey],
        _raw: row
    }));

    const textColor = state.theme === 'dark' ? '#94a3b8' : '#64748b';
    const gridColor = state.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    state.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: `Resolution Time (${kpiUnit})`,
                    data: chartData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#3b82f6',
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.2
                },
                {
                    label: `KPI Target (${targetLineValue} ${kpiUnit})`,
                    data: chartData.map(d => ({ x: d.x, y: targetLineValue })),
                    borderColor: '#ef4444',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (e, activeElements) => {
                if (activeElements.length > 0) {
                    const datasetIndex = activeElements[0].datasetIndex;
                    if (datasetIndex === 0) {
                        const dataIndex = activeElements[0].index;
                        const dataPoint = chartData[dataIndex];
                        const idCol = els.idCol.value;
                        const id = dataPoint._raw[idCol] || 'Unknown';

                        if (navigator.clipboard && window.isSecureContext) {
                            navigator.clipboard.writeText(id).then(() => showToast(`Copied ${id} to clipboard!`));
                        } else {
                            const textArea = document.createElement("textarea");
                            textArea.value = id;
                            textArea.style.position = "fixed";
                            document.body.appendChild(textArea);
                            textArea.focus();
                            textArea.select();
                            try { document.execCommand('copy'); showToast(`Copied ${id} to clipboard!`); } catch (err) { }
                            document.body.removeChild(textArea);
                        }
                    }
                }
            },
            onHover: (e, activeElements) => {
                e.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
            },
            plugins: {
                legend: {
                    labels: { color: textColor }
                },
                tooltip: {
                    callbacks: {
                        title: function (contexts) {
                            if (contexts[0].datasetIndex === 1) return 'KPI Target';
                            const row = contexts[0].raw._raw;
                            const idCol = els.idCol.value;
                            return row[idCol] || 'Ticket';
                        },
                        label: function (context) {
                            if (context.datasetIndex === 1) return `  Target: ${targetLineValue} ${kpiUnit}`;

                            const row = context.raw._raw;
                            const grpCol = els.groupCol.value;
                            const startColVal = els.startCol.value;
                            const endColVal = els.endCol.value;

                            const grp = row[grpCol] || 'N/A';
                            const val = kpiUnit === 'Days' ? Math.round(context.parsed.y) : context.parsed.y.toFixed(1);
                            const startDate = row[startColVal] ? new Date(row[startColVal]).toLocaleDateString() : 'N/A';
                            const endDate = row[endColVal] ? new Date(row[endColVal]).toLocaleDateString() : 'N/A';

                            return [
                                `  ${kpiUnit}: ${val}`,
                                `  Group: ${grp}`,
                                `  Opened: ${startDate}`,
                                `  Resolved: ${endDate}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: els.trendGrouping ? els.trendGrouping.value : 'day',
                        displayFormats: { day: 'MMM d', week: 'MMM d', month: 'MMM yyyy' }
                    },
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: kpiUnit, color: textColor },
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            }
        }
    });
}

function renderHistogramChart(kpiUnit, metricKey) {
    const canvasId = 'histogram-chart';
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (state.histogramInstance) {
        state.histogramInstance.destroy();
    }

    const textColor = state.theme === 'dark' ? '#94a3b8' : '#64748b';
    const gridColor = state.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    // Define buckets in hours always for precision
    const buckets = kpiUnit === 'Days'
        ? [
            { label: '< 4h', min: 0, max: 4 / 24 },
            { label: '4h–8h', min: 4 / 24, max: 8 / 24 },
            { label: '8h–1d', min: 8 / 24, max: 1 },
            { label: '1–3 days', min: 1, max: 3 },
            { label: '3–7 days', min: 3, max: 7 },
            { label: '> 7 days', min: 7, max: Infinity }
        ]
        : [
            { label: '< 4h', min: 0, max: 4 },
            { label: '4h–8h', min: 4, max: 8 },
            { label: '8h–24h', min: 8, max: 24 },
            { label: '1–3d', min: 24, max: 72 },
            { label: '3–7d', min: 72, max: 168 },
            { label: '> 7d', min: 168, max: Infinity }
        ];

    const counts = buckets.map(b => ({
        label: b.label,
        count: state.processedData.filter(r => {
            const v = r[metricKey];
            return v >= b.min && v < b.max;
        }).length
    }));

    const barColors = counts.map((_, i) => {
        const hues = [210, 200, 190, 35, 20, 0];
        return `hsla(${hues[i]}, 80%, 60%, 0.85)`;
    });

    state.histogramInstance = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: counts.map(c => c.label),
            datasets: [{
                label: 'Ticket Count',
                data: counts.map(c => c.count),
                backgroundColor: barColors,
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => `  ${ctx.parsed.y} ticket${ctx.parsed.y !== 1 ? 's' : ''}`
                    }
                }
            },
            scales: {
                x: { ticks: { color: textColor }, grid: { display: false } },
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor, stepSize: 1 },
                    grid: { color: gridColor },
                    title: { display: true, text: 'Tickets', color: textColor }
                }
            }
        }
    });
}


function updateChartTheme() {
    const textColor = state.theme === 'dark' ? '#94a3b8' : '#64748b';
    const gridColor = state.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    if (state.chartInstance) {
        state.chartInstance.options.plugins.legend.labels.color = textColor;
        state.chartInstance.options.scales.x.ticks.color = textColor;
        state.chartInstance.options.scales.y.ticks.color = textColor;
        state.chartInstance.options.scales.x.grid.color = gridColor;
        state.chartInstance.options.scales.y.grid.color = gridColor;
        state.chartInstance.options.scales.y.title.color = textColor;
        state.chartInstance.update();
    }

    if (state.histogramInstance) {
        state.histogramInstance.options.scales.x.ticks.color = textColor;
        state.histogramInstance.options.scales.y.ticks.color = textColor;
        state.histogramInstance.options.scales.x.grid.color = gridColor;
        state.histogramInstance.options.scales.y.grid.color = gridColor;
        state.histogramInstance.options.scales.y.title.color = textColor;
        state.histogramInstance.update();
    }
}

// --- Reporting ---
function generateExecutiveReport() {
    if (state.processedData.length === 0) return;

    try {
        if (typeof html2canvas === 'undefined') {
            alert("Export library is still loading or was blocked by your network. Please try again or check your connection.");
            return;
        }

        const originalText = els.downloadBtn.innerHTML;
        els.downloadBtn.innerHTML = "📸 Exporting...";
        els.downloadBtn.style.pointerEvents = 'none';

        // Hide UI elements that shouldn't be in the snapshot
        els.backBtn.style.visibility = 'hidden';
        els.themeToggle.style.visibility = 'hidden';

        // Slight delay to ensure DOM is updated and ready
        setTimeout(() => {
            html2canvas(document.getElementById('view-dashboard'), {
                backgroundColor: state.theme === 'dark' ? '#0f172a' : '#f8fafc',
                scale: 2, // High resolution
                useCORS: true
            }).then(canvas => {
                const url = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = url;
                a.download = `${state.currentModule}_MTTR_Report.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                // Restore UI elements
                els.backBtn.style.visibility = '';
                els.themeToggle.style.visibility = '';
                els.downloadBtn.innerHTML = originalText;
                els.downloadBtn.style.pointerEvents = 'auto';
            }).catch(err => {
                console.error("Error generating snapshot:", err);
                els.backBtn.style.visibility = '';
                els.themeToggle.style.visibility = '';
                els.downloadBtn.innerHTML = originalText;
                els.downloadBtn.style.pointerEvents = 'auto';
                alert("An error occurred while generating the report snapshot.");
            });
        }, 150);
    } catch (err) {
        alert("Error starting export: " + err.message);
    }
}

function exportCsv() {
    if (state.processedData.length === 0) return;
    
    // Export original row data for the filtered set, plus our calculated metrics
    const metricKey = els.kpiUnit.value === 'Days' ? 'Calculated_Days' : 'Calculated_Hours';
    const csvRows = [];
    
    // Header
    const keys = state.columns.concat([metricKey]);
    csvRows.push(keys.map(k => `"${String(k).replace(/"/g, '""')}"`).join(','));
    
    // Data
    state.processedData.forEach(row => {
        const rowData = keys.map(k => {
            const val = row[k] === null || row[k] === undefined ? '' : String(row[k]);
            return `"${val.replace(/"/g, '""')}"`;
        });
        csvRows.push(rowData.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.currentModule}_Filtered_Data.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// --- Data Grid Modal ---
// Track modal sort state
const modalSort = { col: 'Calculated_Days', dir: 'desc' };

function openDataModal(groupFilter) {
    if (state.processedData.length === 0) return;

    const kpiUnit = els.kpiUnit.value;
    const metricKey = kpiUnit === 'Days' ? 'Calculated_Days' : 'Calculated_Hours';
    const targetValue = parseFloat(els.kpiTarget.value);
    const idCol = els.idCol.value;
    const grpCol = els.groupCol.value;
    const startCol = els.startCol.value;
    const endCol = els.endCol.value;

    // Reset sort to default when opening
    modalSort.col = metricKey;
    modalSort.dir = 'desc';

    const dataSource = groupFilter
        ? state.processedData.filter(r => (r[grpCol] || 'Unknown') === groupFilter)
        : state.processedData;

    // Store on state so renderModalRows can access
    state._modalData = dataSource;
    state._modalMeta = { kpiUnit, metricKey, targetValue, idCol, grpCol, startCol, endCol };

    // Build sortable header
    const cols = [
        { key: idCol, label: 'Ticket ID' },
        { key: grpCol, label: 'Group' },
        { key: startCol, label: 'Opened' },
        { key: endCol, label: 'Resolved' },
        { key: metricKey, label: kpiUnit }
    ];
    els.dataGridHead.innerHTML = cols.map(c => `
        <th class="sortable-th" data-col="${c.key}" style="cursor:pointer; user-select:none; white-space:nowrap;">
            ${c.label} <span class="sort-icon" data-col="${c.key}">⇅</span>
        </th>`).join('');

    // Attach sort listeners
    els.dataGridHead.querySelectorAll('.sortable-th').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.dataset.col;
            if (modalSort.col === col) {
                modalSort.dir = modalSort.dir === 'asc' ? 'desc' : 'asc';
            } else {
                modalSort.col = col;
                modalSort.dir = 'asc';
            }
            renderModalRows();
            // Update icons
            els.dataGridHead.querySelectorAll('.sort-icon').forEach(ic => {
                ic.textContent = ic.dataset.col === col
                    ? (modalSort.dir === 'asc' ? '▲' : '▼')
                    : '⇅';
            });
        });
    });

    renderModalRows();

    const breachCount = dataSource.filter(r => r[metricKey] > targetValue).length;
    els.modalTitle.textContent = groupFilter ? `📋 ${groupFilter}` : `📋 Raw Ticket Data — ${state.currentModule}`;
    els.modalSubheader.textContent = `${dataSource.length} tickets | ${breachCount} breached KPI target (${targetValue} ${kpiUnit}) | Red rows = SLA breach`;
    els.modalOverlay.classList.remove('hidden');
}

function renderModalRows() {
    const { kpiUnit, metricKey, targetValue, idCol, grpCol, startCol, endCol } = state._modalMeta;
    const data = state._modalData;

    const sorted = [...data].sort((a, b) => {
        const aVal = a[modalSort.col];
        const bVal = b[modalSort.col];
        const aStr = aVal instanceof Date ? aVal.getTime() : (typeof aVal === 'number' ? aVal : String(aVal || '').toLowerCase());
        const bStr = bVal instanceof Date ? bVal.getTime() : (typeof bVal === 'number' ? bVal : String(bVal || '').toLowerCase());
        if (aStr < bStr) return modalSort.dir === 'asc' ? -1 : 1;
        if (aStr > bStr) return modalSort.dir === 'asc' ? 1 : -1;
        return 0;
    });

    els.dataGridBody.innerHTML = '';
    sorted.forEach(row => {
        const val = row[metricKey];
        const isBreach = val > targetValue;
        const displayVal = kpiUnit === 'Days' ? Math.round(val) : val.toFixed(1);
        const tr = document.createElement('tr');
        if (isBreach) tr.classList.add('sla-breach');
        tr.innerHTML = `
            <td>${row[idCol] || 'N/A'}</td>
            <td>${row[grpCol] || 'N/A'}</td>
            <td>${row[startCol] ? new Date(row[startCol]).toLocaleDateString() : 'N/A'}</td>
            <td>${row[endCol] ? new Date(row[endCol]).toLocaleDateString() : 'N/A'}</td>
            <td class="${isBreach ? 'breach-val' : ''}">${displayVal}</td>
        `;
        els.dataGridBody.appendChild(tr);
    });
}

function closeDataModal() {
    els.modalOverlay.classList.add('hidden');
}


// --- Events ---
function attachEventListeners() {
    els.themeToggle.addEventListener('click', toggleTheme);
    els.backBtn.addEventListener('click', navigateBack);

    els.moduleCards.forEach(card => {
        card.addEventListener('click', () => navigateToModule(card.dataset.module));
    });

    // Drag & Drop Upload
    els.dropZone.addEventListener('click', () => els.fileInput.click());

    els.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        els.dropZone.classList.add('dragover');
    });

    els.dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        els.dropZone.classList.remove('dragover');
    });

    els.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        els.dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            els.fileInput.files = e.dataTransfer.files;
            handleFileSelect({ target: els.fileInput });
        }
    });

    els.fileInput.addEventListener('change', handleFileSelect);
    els.clearFileBtn.addEventListener('click', clearFile);

    // Dynamic Filter updates
    els.priorityCol.addEventListener('change', updateFilterOptions);
    els.typeCol.addEventListener('change', updateFilterOptions);
    els.riskCol.addEventListener('change', updateFilterOptions);
    els.reqItemCol.addEventListener('change', updateFilterOptions);
    els.reqStateCol.addEventListener('change', updateFilterOptions);
    els.closeCodeCol.addEventListener('change', updateFilterOptions);
    els.ratingCol.addEventListener('change', updateFilterOptions);

    // Wire multi-select toggles
    wireMultiselect('priority-filter-btn', 'priority-filter-dd');
    wireMultiselect('type-filter-btn', 'type-filter-dd');
    wireMultiselect('risk-filter-btn', 'risk-filter-dd');
    wireMultiselect('req-item-filter-btn', 'req-item-filter-dd');
    wireMultiselect('req-state-filter-btn', 'req-state-filter-dd');
    wireMultiselect('close-code-filter-btn', 'close-code-filter-dd');
    wireMultiselect('rating-filter-btn', 'rating-filter-dd');
    wireMultiselect('group-filter-btn', 'group-filter-dd');

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.multiselect-dropdown').forEach(d => d.classList.add('hidden'));
        document.querySelectorAll('.multiselect-btn').forEach(b => b.classList.remove('open'));
    });

    els.calculateBtn.addEventListener('click', calculateMTTR);
    els.downloadBtn.addEventListener('click', generateExecutiveReport);
    els.downloadCsvBtn.addEventListener('click', exportCsv);
    els.viewDataBtn.addEventListener('click', () => openDataModal());
    if (els.trendGrouping) {
        els.trendGrouping.addEventListener('change', () => {
            if (state.processedData.length > 0) {
                renderTrendChart(parseFloat(els.kpiTarget.value), els.kpiUnit.value, els.kpiUnit.value === 'Days' ? 'Calculated_Days' : 'Calculated_Hours');
            }
        });
    }
    els.modalCloseBtn.addEventListener('click', closeDataModal);
    els.modalOverlay.addEventListener('click', (e) => {
        if (e.target === els.modalOverlay) closeDataModal();
    });

    // Section 2 Toggle
    els.configHeader.addEventListener('click', () => {
        els.configBody.classList.toggle('collapsed');
        els.configToggleIcon.classList.toggle('rotate-180');
    });

    els.timeframe.addEventListener('change', () => {
        if (els.timeframe.value === 'Custom Range') {
            els.customDateRange.classList.remove('hidden');
        } else {
            els.customDateRange.classList.add('hidden');
        }
    });

    // Mean / Median toggle
    els.modeMeanBtn.addEventListener('click', () => setCalcMode('mean'));
    els.modeMedianBtn.addEventListener('click', () => setCalcMode('median'));
}

// Start
document.addEventListener('DOMContentLoaded', init);

