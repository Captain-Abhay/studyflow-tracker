const SLOT_SIZE_MIN = 30;
const SLOT_PER_HOUR = 60 / SLOT_SIZE_MIN;

export const WAKE = 6;
export const SLEEP = 23;

const WAKE_MIN = WAKE * 60;
const SLEEP_MIN = SLEEP * 60;

export const TOTAL_SLOTS = (SLEEP_MIN - WAKE_MIN) / SLOT_SIZE_MIN;

export const HOUSEHOLD = [
    { start: 7, end: 8, label: 'Bath & Breakfast', type: 'house' },
    { start: 13, end: 14, label: 'Lunch', type: 'house' },
    { start: 20, end: 21, label: 'Dinner & Wind Down', type: 'house' }
];

// 🔹 Precompute household slots (O(1) lookup later)
const HOUSEHOLD_SLOT_MAP = new Map();

HOUSEHOLD.forEach(h => {
    const startSlot = (h.start * 60 - WAKE_MIN) / SLOT_SIZE_MIN;
    const endSlot = (h.end * 60 - WAKE_MIN) / SLOT_SIZE_MIN;

    for (let i = startSlot; i < endSlot; i++) {
        HOUSEHOLD_SLOT_MAP.set(i, h);
    }
});

// --- TIME ---
export function slotToTime(slotIndex) {
    return (WAKE_MIN + slotIndex * SLOT_SIZE_MIN) / 60;
}

// --- CAPACITY ---
export function calculateCapacity() {
    let totalSlots = TOTAL_SLOTS;

    HOUSEHOLD.forEach(h => {
        totalSlots -= (h.end - h.start) * SLOT_PER_HOUR;
    });

    return totalSlots / SLOT_PER_HOUR * 7; // return hours
}

// --- SUBJECT POOLS ---
export function createSubjectPools(subjects) {
    const pools = { high: [], med: [], low: [] };

    subjects.forEach(sub => {
        const slots = Math.ceil(sub.hrs * SLOT_PER_HOUR);

        for (let i = 0; i < slots; i++) {
            if (sub.priority >= 4) pools.high.push(sub.name);
            else if (sub.priority >= 2) pools.med.push(sub.name);
            else pools.low.push(sub.name);
        }
    });

    return pools;
}

// --- RANDOM PICK (no mutation bug exposure) ---
function pickRandom(arr) {
    if (!arr.length) return null;
    const i = Math.floor(Math.random() * arr.length);
    return arr.splice(i, 1)[0]; // still mutates but safe usage context
}

// --- SMART PICK ---
function pickSmartSubject(hour, pools) {
    const pref =
        hour < 12 ? 'high' :
        hour >= 18 ? 'low' :
        'med';

    return (
        pickRandom(pools[pref]) ??
        pickRandom(pools.high) ??
        pickRandom(pools.med) ??
        pickRandom(pools.low) ??
        'Free Slot / Revision'
    );
}

// --- TIMELINE ---
export function generateTimeline(subjectsArray) {
    const timeline = [];
    const pools = createSubjectPools(subjectsArray);

    for (let slot = 0; slot < TOTAL_SLOTS; slot++) {
        const houseBlock = HOUSEHOLD_SLOT_MAP.get(slot);

        if (houseBlock) {
            // Only push once per block start
            const prev = timeline[timeline.length - 1];
            if (!prev || prev.label !== houseBlock.label) {
                timeline.push({
                    ...houseBlock,
                    id: crypto.randomUUID(),
                    completed: false
                });
            }
            continue;
        }

        const hour = slotToTime(slot);
        const subject = pickSmartSubject(hour, pools);

        timeline.push({
            id: crypto.randomUUID(),
            start: hour,
            end: hour + SLOT_SIZE_MIN / 60,
            label: subject,
            type: 'study',
            completed: false
        });
    }

    return timeline;
}