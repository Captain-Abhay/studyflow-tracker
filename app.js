import { getState, updateState, getToday } from './state.js';
import { renderHeatmap, updateTodayHeatmap } from './heatmap.js';
import { calculateCapacity, generateTimeline, WAKE } from './scheduler.js';

const DOM = {
    appContainer: document.getElementById('app-container'),
    clock: document.getElementById('clock'),
    prompt: document.getElementById('morning-prompt'),
    goalsInput: document.getElementById('weekly-goals'),
    stats: document.getElementById('weekly-stats'),
    list: document.getElementById('schedule-list'),
    warningMsg: document.getElementById('warning-msg'),
    btnAsPlanned: document.getElementById('btn-as-planned'),
    btnNeedChanges: document.getElementById('btn-need-changes'),
    btnGenerate: document.getElementById('btn-generate')
};

let clockInterval;

// --- INIT ---
function init() {
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(tick, 1000);

    const state = getState();
    const today = getToday();

    renderHeatmap(state.progress);

    if (state.schedule && state.scheduleDate === today) {
        renderDOMSchedule(state.schedule);
    }

    checkMorning();
    attachListeners();
}

// --- LISTENERS ---
function attachListeners() {
    DOM.btnAsPlanned.addEventListener('click', () => resolveMorning(true));
    DOM.btnNeedChanges.addEventListener('click', () => resolveMorning(false));

    DOM.btnGenerate.addEventListener('click', () => {
        setLoading(true);
        handleGenerate();
        setLoading(false);
    });

    DOM.goalsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            DOM.btnGenerate.click();
        }
    });

    DOM.list.addEventListener('change', (e) => {
        if (e.target.matches('input[type="checkbox"]')) {
            handleTaskToggle(
                e.target.dataset.id,
                e.target.closest('.block'),
                e.target.checked
            );
        }
    });
}

// --- CLOCK ---
function tick() {
    DOM.clock.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
}

// --- MORNING CHECK ---
function checkMorning() {
    const today = getToday();
    const hour = new Date().getHours();

    if (hour >= WAKE && hour < 12 && getState().lastCheckIn !== today) {
        DOM.prompt.style.display = 'block';
    }
}

function resolveMorning(asPlanned) {
    const today = getToday();

    DOM.prompt.style.display = 'none';
    updateState(prev => ({ ...prev, lastCheckIn: today }));

    if (!asPlanned) {
        DOM.goalsInput.focus();
        showWarning("Update your weekly setup and hit Generate Schedule!");
    }
}

// --- UI HELPERS ---
function setLoading(isLoading) {
    DOM.appContainer.style.opacity = isLoading ? 0.6 : 1;
    DOM.appContainer.style.pointerEvents = isLoading ? 'none' : 'auto';
}

function showWarning(msg) {
    DOM.warningMsg.textContent = msg || '';
    DOM.warningMsg.style.display = msg ? 'block' : 'none';
}

// --- TIME FORMAT FIXED ---
function formatTime(decimalHour) {
    const totalMinutes = Math.round(decimalHour * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// --- INPUT PARSING (EXTRACTED) ---
function parseInput(input) {
    const subjects = [];
    let totalRequested = 0;
    let hasError = false;

    for (const line of input.split('\n')) {
        if (!line.trim()) continue;

        const parts = line.split(':');
        if (parts.length !== 2) {
            showWarning(`Invalid format on line: "${line}"`);
            hasError = true;
            break;
        }

        const hrs = Number(parts[1].match(/\d+(\.\d+)?/)?.[0]);
        if (!hrs || isNaN(hrs)) {
            showWarning(`Invalid hour input for: "${parts[0]}"`);
            hasError = true;
            break;
        }

        const priorityMatch = line.match(/Priority\s*(\d+)/i);
        const priority = priorityMatch ? Number(priorityMatch[1]) : 1;

        subjects.push({ name: parts[0].trim(), hrs, priority });
        totalRequested += hrs;
    }

    return { subjects, totalRequested, hasError };
}

// --- GENERATE ---
function handleGenerate() {
    showWarning(null);

    const input = DOM.goalsInput.value.trim();
    if (!input) {
        showWarning("Please enter your weekly goals.");
        return;
    }

    const { subjects, totalRequested, hasError } = parseInput(input);
    if (hasError) return;

    if (subjects.length === 0) {
        showWarning("Please enter at least one valid subject.");
        return;
    }

    const totalCapacity = calculateCapacity();

    if (totalRequested > totalCapacity) {
        showWarning(
            `Overload Warning: You planned ${totalRequested}h but only have ${totalCapacity}h available!`
        );
    }

    DOM.stats.innerHTML = `
        <span>Capacity: ${totalCapacity}h/wk</span>
        <span style="color: ${
            totalRequested > totalCapacity ? 'var(--danger)' : 'var(--accent)'
        }">Planned: ${totalRequested}h/wk</span>
    `;

    const newSchedule = generateTimeline(subjects);
    const today = getToday();

    updateState(prev => ({
        ...prev,
        schedule: newSchedule,
        scheduleDate: today
    }));

    renderDOMSchedule(newSchedule);
}

// --- RENDER ---
function renderDOMSchedule(timeline) {
    if (!timeline.length) {
        DOM.list.innerHTML = '<p class="help-text">No schedule generated.</p>';
        return;
    }

    DOM.list.innerHTML = '';
    const fragment = document.createDocumentFragment();

    timeline.forEach(b => {
        const div = document.createElement('div');
        div.className = `block ${b.type} ${b.completed ? 'done' : ''}`;
        div.setAttribute("role", "listitem");
        div.tabIndex = 0;

        div.innerHTML = `
            <div style="display: flex; align-items: center; width: 100%;">
                <div class="time-tag">${formatTime(b.start)} - ${formatTime(b.end)}</div>
                <div style="font-weight: 500; flex: 1;">${b.label}</div>
            </div>
        `;

        if (b.type === 'study') {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.dataset.id = b.id;
            checkbox.checked = b.completed;
            checkbox.setAttribute('aria-label', `Mark ${b.label} complete`);
            checkbox.style.cssText =
                "width: 20px; height: 20px; cursor: pointer; margin:0; flex-shrink: 0;";
            div.appendChild(checkbox);
        }

        fragment.appendChild(div);
    });

    DOM.list.appendChild(fragment);
}

// --- TASK TOGGLE ---
function handleTaskToggle(blockId, divElement, isChecked) {
    divElement.classList.toggle('done', isChecked);

    const today = getToday();
    let newProgressCount = 0;

    updateState(prev => {
        const schedule = prev.schedule.map(b =>
            b.id === blockId ? { ...b, completed: isChecked } : b
        );

        const currentCount = prev.progress[today] || 0;
        newProgressCount = isChecked
            ? currentCount + 1
            : Math.max(0, currentCount - 1);

        return {
            ...prev,
            schedule,
            progress: {
                ...prev.progress,
                [today]: newProgressCount
            }
        };
    });

    updateTodayHeatmap(newProgressCount);
}

// --- START ---
init();