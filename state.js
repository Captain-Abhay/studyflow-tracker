const STORAGE_KEY = 'studyflow_tracker_v4';

const DEFAULT_STATE = {
    version: 3,
    goals: {},
    progress: {}, 
    schedule: null,
    scheduleDate: null,
    lastCheckIn: null
};

let state;

// Safe load + migration
try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    const parsed = rawData ? JSON.parse(rawData) : null;

    if (!parsed) {
        state = DEFAULT_STATE;
    } else if (parsed.version !== DEFAULT_STATE.version) {
        state = {
            ...DEFAULT_STATE,
            ...parsed,
            version: DEFAULT_STATE.version
        };
    } else {
        state = parsed;
    }
} catch (e) {
    state = DEFAULT_STATE;
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error("Save failed:", e);
    }
}

let saveTimeout;

export function getState() {
    return { ...state }; // prevent mutation
}

export function updateState(updaterFn) {
    const newState = updaterFn(structuredClone(state));
    state = newState;

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveState, 300);
}

export function getToday() {
    return new Date().toISOString().slice(0, 10);
}

export function resetState() {
    state = DEFAULT_STATE;
    saveState();
}