const KEY = 'studyflow_v1';

let state = JSON.parse(localStorage.getItem(KEY)) || {
    progress: {},
    schedule: [],
    workHours: null
};

export function getState() {
    return state;
}

export function updateState(fn) {
    state = fn(state);
    localStorage.setItem(KEY, JSON.stringify(state));
}

export function getToday() {
    return new Date().toISOString().split('T')[0];
}